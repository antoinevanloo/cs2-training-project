#!/usr/bin/env python3
"""
Parser de fichiers .dem CS2 utilisant demoparser2
Usage: python parser.py <chemin_fichier.dem> <chemin_sortie.json>
"""

import sys
import json
from pathlib import Path

try:
    from demoparser2 import DemoParser
except ImportError:
    print(json.dumps({"success": False, "error": "demoparser2 not installed"}), file=sys.stderr)
    sys.exit(1)


def parse_demo(demo_path: str) -> dict:
    """Parse un fichier .dem et extrait toutes les données pertinentes."""

    parser = DemoParser(demo_path)

    # Extraction des données
    result = {
        "metadata": extract_metadata(parser),
        "players": extract_players(parser),
        "rounds": extract_rounds(parser),
        "kills": extract_kills(parser),
        "damages": extract_damages(parser),
        "grenades": extract_grenades(parser),
        "positions": [],  # Désactivé par défaut pour réduire la taille
        "economy": extract_economy(parser),
    }

    return result


def extract_metadata(parser: DemoParser) -> dict:
    """Extrait les métadonnées de la partie."""
    try:
        header = parser.parse_header()
        return {
            "map": header.get("map_name", "unknown"),
            "duration": header.get("playback_time", 0),
            "tickrate": header.get("tickrate", 64),
            "date": None,
        }
    except Exception as e:
        return {
            "map": "unknown",
            "duration": 0,
            "tickrate": 64,
            "date": None,
            "error": str(e)
        }


def extract_players(parser: DemoParser) -> list:
    """Extrait les informations des joueurs."""
    players = []

    try:
        df = parser.parse_event("player_info")
        if df is not None and len(df) > 0:
            seen_steamids = set()
            for _, row in df.iterrows():
                steamid = str(row.get("steamid", ""))
                if steamid and steamid not in seen_steamids:
                    seen_steamids.add(steamid)
                    players.append({
                        "steamId": steamid,
                        "name": str(row.get("name", "Unknown")),
                        "team": int(row.get("team_num", 0)),
                    })
    except Exception:
        pass

    return players


def extract_kills(parser: DemoParser) -> list:
    """Extrait tous les kills."""
    kills = []

    try:
        df = parser.parse_event("player_death")
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                kills.append({
                    "tick": int(row.get("tick", 0)),
                    "round": int(row.get("round", 0)) if "round" in row else 0,
                    "attackerSteamId": str(row.get("attacker_steamid", "")),
                    "attackerName": str(row.get("attacker_name", "")),
                    "victimSteamId": str(row.get("user_steamid", "")),
                    "victimName": str(row.get("user_name", "")),
                    "weapon": str(row.get("weapon", "")),
                    "headshot": bool(row.get("headshot", False)),
                    "penetrated": bool(row.get("penetrated", False)),
                    "attackerBlind": bool(row.get("attackerblind", False)),
                    "noScope": bool(row.get("noscope", False)),
                    "throughSmoke": bool(row.get("thrusmoke", False)),
                    "attackerPosition": {
                        "x": float(row.get("attacker_X", 0) or 0),
                        "y": float(row.get("attacker_Y", 0) or 0),
                        "z": float(row.get("attacker_Z", 0) or 0),
                    },
                    "victimPosition": {
                        "x": float(row.get("user_X", 0) or 0),
                        "y": float(row.get("user_Y", 0) or 0),
                        "z": float(row.get("user_Z", 0) or 0),
                    },
                })
    except Exception:
        pass

    return kills


def extract_damages(parser: DemoParser) -> list:
    """Extrait tous les dégâts infligés."""
    damages = []

    try:
        df = parser.parse_event("player_hurt")
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                damages.append({
                    "tick": int(row.get("tick", 0)),
                    "round": int(row.get("round", 0)) if "round" in row else 0,
                    "attackerSteamId": str(row.get("attacker_steamid", "")),
                    "victimSteamId": str(row.get("user_steamid", "")),
                    "damage": int(row.get("dmg_health", 0) or 0),
                    "damageArmor": int(row.get("dmg_armor", 0) or 0),
                    "weapon": str(row.get("weapon", "")),
                    "hitgroup": int(row.get("hitgroup", 0) or 0),
                })
    except Exception:
        pass

    return damages


def extract_grenades(parser: DemoParser) -> list:
    """Extrait l'utilisation des grenades."""
    events = []

    grenade_events = [
        ("flashbang_detonate", "flash"),
        ("smokegrenade_detonate", "smoke"),
        ("hegrenade_detonate", "he"),
        ("inferno_startburn", "molotov"),
    ]

    for event_name, grenade_type in grenade_events:
        try:
            df = parser.parse_event(event_name)
            if df is not None and len(df) > 0:
                for _, row in df.iterrows():
                    events.append({
                        "type": grenade_type,
                        "tick": int(row.get("tick", 0)),
                        "round": int(row.get("round", 0)) if "round" in row else 0,
                        "throwerSteamId": str(row.get("user_steamid", "") or row.get("entityid", "")),
                        "position": {
                            "x": float(row.get("x", 0) or 0),
                            "y": float(row.get("y", 0) or 0),
                            "z": float(row.get("z", 0) or 0),
                        },
                    })
        except Exception:
            continue

    return events


def extract_rounds(parser: DemoParser) -> list:
    """Extrait les informations de chaque round."""
    rounds = []

    try:
        df = parser.parse_event("round_end")
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                rounds.append({
                    "roundNumber": int(row.get("round", 0)) if "round" in row else len(rounds) + 1,
                    "winner": int(row.get("winner", 0)),
                    "reason": int(row.get("reason", 0)),
                    "tick": int(row.get("tick", 0)),
                })
    except Exception:
        pass

    return rounds


def extract_economy(parser: DemoParser) -> list:
    """Extrait les données économiques par round."""
    economy = []

    try:
        df = parser.parse_event("round_freeze_end")
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                economy.append({
                    "round": int(row.get("round", 0)) if "round" in row else len(economy) + 1,
                    "tick": int(row.get("tick", 0)),
                })
    except Exception:
        pass

    return economy


def main():
    if len(sys.argv) != 3:
        print("Usage: python parser.py <demo_path> <output_path>", file=sys.stderr)
        sys.exit(1)

    demo_path = sys.argv[1]
    output_path = sys.argv[2]

    if not Path(demo_path).exists():
        print(json.dumps({"success": False, "error": f"File not found: {demo_path}"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = parse_demo(demo_path)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False)

        print(json.dumps({"success": True, "output": output_path}))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
