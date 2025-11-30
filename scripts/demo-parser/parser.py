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

    # Extract rounds first to determine round numbers for other events
    rounds = extract_rounds(parser)
    round_ticks = [(r["tick"], r["roundNumber"]) for r in rounds]

    # Extraction des données
    result = {
        "metadata": extract_metadata(parser),
        "players": extract_players(parser),
        "rounds": rounds,
        "kills": extract_kills(parser, round_ticks),
        "damages": extract_damages(parser, round_ticks),
        "grenades": extract_grenades(parser, round_ticks),
        "positions": [],  # Désactivé par défaut pour réduire la taille
        "economy": extract_economy(parser),
    }

    return result


def get_round_for_tick(tick: int, round_ticks: list) -> int:
    """Determine which round a tick belongs to based on round_end ticks."""
    if not round_ticks:
        return 1

    current_round = 1
    for round_end_tick, round_num in round_ticks:
        if tick <= round_end_tick:
            return round_num
        current_round = round_num + 1

    return current_round


def extract_metadata(parser: DemoParser) -> dict:
    """Extrait les métadonnées de la partie, incluant la date du match si disponible."""
    try:
        header = parser.parse_header()

        # Chercher la date du match dans les convars
        match_date = None
        try:
            convars = parser.parse_convars()
            # Debug: afficher les convars disponibles pour trouver la date
            # print("Convars disponibles:", list(convars.keys()))

            # Chercher des convars qui pourraient contenir un timestamp
            date_convars = [
                'sv_server_start_time',
                'server_start_time',
                'match_start_time',
                'game_start_time',
                'sv_steamdatagramtransport_port',  # parfois contient un timestamp
            ]

            for cvar in date_convars:
                if cvar in convars and convars[cvar]:
                    try:
                        ts = float(convars[cvar])
                        if ts > 1000000000:  # Timestamp Unix valide (après 2001)
                            from datetime import datetime
                            match_date = datetime.fromtimestamp(ts).isoformat()
                            break
                    except (ValueError, TypeError):
                        pass

            # Si pas trouvé, chercher n'importe quel convar avec un timestamp valide
            if not match_date:
                for key, value in convars.items():
                    if 'time' in key.lower() or 'date' in key.lower() or 'stamp' in key.lower():
                        try:
                            ts = float(value)
                            if 1500000000 < ts < 2000000000:  # Entre 2017 et 2033
                                from datetime import datetime
                                match_date = datetime.fromtimestamp(ts).isoformat()
                                break
                        except (ValueError, TypeError):
                            pass

        except Exception:
            pass

        return {
            "map": header.get("map_name", "unknown"),
            "duration": header.get("playback_time", 0),
            "tickrate": header.get("tickrate", 64),
            "matchDate": match_date,
        }
    except Exception as e:
        return {
            "map": "unknown",
            "duration": 0,
            "tickrate": 64,
            "matchDate": None,
            "error": str(e)
        }


def extract_players(parser: DemoParser) -> list:
    """Extrait les informations des joueurs."""
    players = []
    seen_steamids = set()

    # Method 1: Try parse_ticks for player data (most reliable for CS2)
    try:
        df = parser.parse_ticks(["steamid", "name", "team_num"])
        if df is not None and len(df) > 0:
            for _, row in df.drop_duplicates(subset=["steamid"]).iterrows():
                steamid = str(row.get("steamid", ""))
                if steamid and steamid != "0" and steamid not in seen_steamids:
                    seen_steamids.add(steamid)
                    players.append({
                        "steamId": steamid,
                        "name": str(row.get("name", "Unknown")),
                        "team": int(row.get("team_num", 0)),
                    })
    except Exception:
        pass

    # Method 2: Fallback - extract from kills/deaths
    if not players:
        try:
            df = parser.parse_event("player_death")
            if df is not None and len(df) > 0:
                # Get attackers
                for _, row in df.iterrows():
                    steamid = str(row.get("attacker_steamid", ""))
                    if steamid and steamid != "0" and steamid not in seen_steamids:
                        seen_steamids.add(steamid)
                        players.append({
                            "steamId": steamid,
                            "name": str(row.get("attacker_name", "Unknown")),
                            "team": 0,  # Unknown from kills
                        })
                    # Get victims
                    steamid = str(row.get("user_steamid", ""))
                    if steamid and steamid != "0" and steamid not in seen_steamids:
                        seen_steamids.add(steamid)
                        players.append({
                            "steamId": steamid,
                            "name": str(row.get("user_name", "Unknown")),
                            "team": 0,
                        })
        except Exception:
            pass

    return players


def get_position_from_row(row, prefix: str) -> dict:
    """
    Extrait les coordonnées de position depuis une ligne avec différents formats possibles.
    CS2/demoparser2 peut utiliser différents noms de colonnes selon la version.
    """
    # Formats possibles pour les coordonnées
    x_cols = [f"{prefix}_X", f"{prefix}_x", f"{prefix}X", f"{prefix}x",
              f"{prefix}_position_x", f"{prefix}_pos_x", f"{prefix}PositionX"]
    y_cols = [f"{prefix}_Y", f"{prefix}_y", f"{prefix}Y", f"{prefix}y",
              f"{prefix}_position_y", f"{prefix}_pos_y", f"{prefix}PositionY"]
    z_cols = [f"{prefix}_Z", f"{prefix}_z", f"{prefix}Z", f"{prefix}z",
              f"{prefix}_position_z", f"{prefix}_pos_z", f"{prefix}PositionZ"]

    x, y, z = 0.0, 0.0, 0.0

    for col in x_cols:
        val = row.get(col)
        if val is not None and val != "" and not (isinstance(val, float) and val != val):  # Check for NaN
            try:
                x = float(val)
                break
            except (ValueError, TypeError):
                pass

    for col in y_cols:
        val = row.get(col)
        if val is not None and val != "" and not (isinstance(val, float) and val != val):
            try:
                y = float(val)
                break
            except (ValueError, TypeError):
                pass

    for col in z_cols:
        val = row.get(col)
        if val is not None and val != "" and not (isinstance(val, float) and val != val):
            try:
                z = float(val)
                break
            except (ValueError, TypeError):
                pass

    return {"x": x, "y": y, "z": z}


def extract_kills(parser: DemoParser, round_ticks: list) -> list:
    """Extrait tous les kills avec positions."""
    kills = []

    try:
        # D'abord récupérer les événements de mort pour obtenir les ticks
        df = parser.parse_event("player_death")
        if df is None or len(df) == 0:
            return kills

        # Récupérer les ticks uniques des morts pour limiter le parsing des positions
        kill_ticks = list(df["tick"].unique())

        # Parser les positions seulement pour les ticks de mort
        player_positions = {}
        try:
            # Parser les positions aux ticks de mort (X, Y, Z majuscules pour demoparser2)
            pos_df = parser.parse_ticks(["X", "Y", "Z", "steamid"], ticks=kill_ticks)
            if pos_df is not None and len(pos_df) > 0:
                for _, row in pos_df.iterrows():
                    tick = int(row.get("tick", 0))
                    steamid = str(row.get("steamid", ""))
                    x = row.get("X")
                    y = row.get("Y")
                    z = row.get("Z")

                    # Vérifier que les coordonnées sont valides
                    if steamid and tick and x is not None:
                        key = f"{tick}_{steamid}"
                        player_positions[key] = {
                            "x": float(x) if x == x else 0.0,  # Check for NaN
                            "y": float(y) if y == y else 0.0,
                            "z": float(z) if z == z else 0.0,
                        }
        except Exception as e:
            print(f"Warning: Could not extract positions: {e}", file=sys.stderr)

        # Maintenant traiter chaque kill
        for _, row in df.iterrows():
            tick = int(row.get("tick", 0))
            round_num = get_round_for_tick(tick, round_ticks)

            attacker_steamid = str(row.get("attacker_steamid", ""))
            victim_steamid = str(row.get("user_steamid", ""))

            # Récupérer les positions depuis les données de tick
            attacker_key = f"{tick}_{attacker_steamid}"
            victim_key = f"{tick}_{victim_steamid}"

            attacker_pos = player_positions.get(attacker_key, {"x": 0.0, "y": 0.0, "z": 0.0})
            victim_pos = player_positions.get(victim_key, {"x": 0.0, "y": 0.0, "z": 0.0})

            kills.append({
                "tick": tick,
                "round": round_num,
                "attackerSteamId": attacker_steamid,
                "attackerName": str(row.get("attacker_name", "")),
                "victimSteamId": victim_steamid,
                "victimName": str(row.get("user_name", "")),
                "weapon": str(row.get("weapon", "")),
                "headshot": bool(row.get("headshot", False)),
                "penetrated": bool(row.get("penetrated", False)),
                "attackerBlind": bool(row.get("attackerblind", False)),
                "noScope": bool(row.get("noscope", False)),
                "throughSmoke": bool(row.get("thrusmoke", False)),
                "attackerPosition": attacker_pos,
                "victimPosition": victim_pos,
            })
    except Exception as e:
        print(f"Error extracting kills: {e}", file=sys.stderr)

    return kills


def extract_damages(parser: DemoParser, round_ticks: list) -> list:
    """Extrait tous les dégâts infligés."""
    damages = []

    # CS2 hitgroup string to int mapping
    hitgroup_map = {
        "generic": 0,
        "head": 1,
        "chest": 2,
        "stomach": 3,
        "leftarm": 4,
        "rightarm": 5,
        "leftleg": 6,
        "rightleg": 7,
        "neck": 1,  # Treat neck as head
        "gear": 10,
    }

    try:
        df = parser.parse_event("player_hurt")
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                try:
                    tick = int(row.get("tick", 0))
                    round_num = get_round_for_tick(tick, round_ticks)

                    # Handle hitgroup - can be string or int in CS2
                    hitgroup = row.get("hitgroup", 0)
                    if isinstance(hitgroup, str):
                        hitgroup = hitgroup_map.get(hitgroup.lower(), 0)
                    else:
                        hitgroup = int(hitgroup) if hitgroup else 0

                    damages.append({
                        "tick": tick,
                        "round": round_num,
                        "attackerSteamId": str(row.get("attacker_steamid", "")),
                        "victimSteamId": str(row.get("user_steamid", "")),
                        "damage": int(row.get("dmg_health", 0) or 0),
                        "damageArmor": int(row.get("dmg_armor", 0) or 0),
                        "weapon": str(row.get("weapon", "")),
                        "hitgroup": hitgroup,
                    })
                except Exception:
                    # Skip individual rows that fail, continue with others
                    continue
    except Exception:
        pass

    return damages


def extract_grenades(parser: DemoParser, round_ticks: list) -> list:
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
                    tick = int(row.get("tick", 0))
                    round_num = get_round_for_tick(tick, round_ticks)

                    events.append({
                        "type": grenade_type,
                        "tick": tick,
                        "round": round_num,
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

    # Map winner string to team number (CS2 uses "CT"/"T" strings)
    winner_map = {"CT": 2, "ct": 2, "T": 3, "t": 3}

    # Map reason string to reason code
    reason_map = {
        "t_killed": 9,      # T elimination
        "ct_killed": 8,     # CT elimination
        "bomb_exploded": 1, # Bomb exploded
        "bomb_defused": 7,  # Bomb defused
        "time_expired": 12, # Time ran out
        "target_saved": 12, # Target saved (time)
    }

    try:
        df = parser.parse_event("round_end")
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                # Handle winner - can be string ("CT"/"T") or int
                winner = row.get("winner", 0)
                if isinstance(winner, str):
                    winner = winner_map.get(winner, 0)
                else:
                    winner = int(winner) if winner else 0

                # Handle reason - can be string or int
                reason = row.get("reason", 0)
                if isinstance(reason, str):
                    reason = reason_map.get(reason, 0)
                else:
                    reason = int(reason) if reason else 0

                rounds.append({
                    "roundNumber": int(row.get("round", 0)) if "round" in row else len(rounds) + 1,
                    "winner": winner,
                    "reason": reason,
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
