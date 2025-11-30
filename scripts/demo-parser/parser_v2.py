#!/usr/bin/env python3
"""
Parser de fichiers .dem CS2 v2.0 - Extraction complète et exhaustive

Ce parser utilise demoparser2 pour extraire TOUTES les données disponibles
nécessaires pour une analyse de coaching complète.

Fonctionnalités:
- Événements de combat complets (kills, damages, weapon_fire)
- Événements de grenades avec player_blind
- Événements bombe (plant, defuse, drop, pickup)
- Économie réelle par joueur par round
- Positions continues échantillonnées
- États joueurs détaillés (velocity, scope, crouch, etc.)
- Achats détaillés

Usage: python parser_v2.py <chemin_fichier.dem> <chemin_sortie.json> [--full-positions]
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

try:
    from demoparser2 import DemoParser
    import pandas as pd
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {e}"}), file=sys.stderr)
    sys.exit(1)


# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class ParserConfig:
    """Configuration du parser - paramétrable"""
    # Échantillonnage positions (en ticks, 128 tick = 1 seconde)
    position_sample_rate: int = 64  # Toutes les 0.5 secondes

    # Activer/désactiver les extractions coûteuses
    extract_positions: bool = True
    extract_weapon_fires: bool = True
    extract_player_states: bool = True

    # Limite de ticks pour les positions (éviter fichiers trop gros)
    max_position_ticks: int = 50000  # ~6.5 minutes de jeu

    # Props joueur à extraire
    player_props: List[str] = None

    def __post_init__(self):
        if self.player_props is None:
            self.player_props = [
                # Position et mouvement
                "X", "Y", "Z",
                "velocity_X", "velocity_Y", "velocity_Z",
                "yaw", "pitch",

                # État du joueur
                "health", "armor_value",
                "has_helmet", "has_defuser",
                "is_alive", "team_num",

                # Économie
                "balance", "equipment_value",
                "cash_spent_this_round",

                # Combat
                "active_weapon",
                "is_scoped", "is_walking",
                "in_crouch", "is_airborne",
                "shots_fired",

                # Identité
                "steamid", "name",
            ]


# =============================================================================
# CONSTANTES
# =============================================================================

# Mapping hitgroup CS2 string → int
HITGROUP_MAP = {
    "generic": 0, "head": 1, "chest": 2, "stomach": 3,
    "leftarm": 4, "rightarm": 5, "leftleg": 6, "rightleg": 7,
    "neck": 1, "gear": 10,
}

# Mapping winner CS2
WINNER_MAP = {"CT": 2, "ct": 2, "T": 3, "t": 3}

# Mapping raison fin round
REASON_MAP = {
    "t_killed": 9, "ct_killed": 8, "bomb_exploded": 1,
    "bomb_defused": 7, "time_expired": 12, "target_saved": 12,
}

# Catégories d'armes
WEAPON_CATEGORIES = {
    "rifles": ["ak47", "m4a1", "m4a1_silencer", "sg556", "aug", "galilar", "famas"],
    "smgs": ["mp9", "mac10", "mp7", "ump45", "p90", "mp5sd", "bizon"],
    "pistols": ["glock", "usp_silencer", "hkp2000", "p250", "fiveseven", "tec9", "deagle", "elite", "cz75a", "revolver"],
    "snipers": ["awp", "ssg08", "scar20", "g3sg1"],
    "shotguns": ["nova", "xm1014", "mag7", "sawedoff"],
    "heavy": ["m249", "negev"],
    "grenades": ["hegrenade", "flashbang", "smokegrenade", "molotov", "incgrenade", "decoy"],
}


# =============================================================================
# FONCTIONS UTILITAIRES
# =============================================================================

def safe_int(value: Any, default: int = 0) -> int:
    """Convertit en int de manière sûre."""
    if value is None or (isinstance(value, float) and value != value):
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_float(value: Any, default: float = 0.0) -> float:
    """Convertit en float de manière sûre."""
    if value is None or (isinstance(value, float) and value != value):
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_str(value: Any, default: str = "") -> str:
    """Convertit en string de manière sûre."""
    if value is None:
        return default
    return str(value)


def safe_bool(value: Any, default: bool = False) -> bool:
    """Convertit en bool de manière sûre."""
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    return default


def get_round_for_tick(tick: int, round_ticks: List[Tuple[int, int]]) -> int:
    """Détermine le round pour un tick donné."""
    if not round_ticks:
        return 1

    current_round = 1
    for round_end_tick, round_num in round_ticks:
        if tick <= round_end_tick:
            return round_num
        current_round = round_num + 1

    return current_round


def normalize_weapon(weapon: str) -> str:
    """Normalise le nom d'une arme."""
    weapon = safe_str(weapon).lower()
    weapon = weapon.replace("weapon_", "")
    return weapon


def get_weapon_category(weapon: str) -> str:
    """Retourne la catégorie d'une arme."""
    weapon = normalize_weapon(weapon)
    for category, weapons in WEAPON_CATEGORIES.items():
        if weapon in weapons:
            return category
    return "other"


# =============================================================================
# EXTRACTEURS
# =============================================================================

def extract_metadata(parser: DemoParser) -> Dict:
    """Extrait les métadonnées complètes de la démo."""
    try:
        header = parser.parse_header()

        metadata = {
            "map": header.get("map_name", "unknown"),
            "duration": safe_float(header.get("playback_time", 0)),
            "tickrate": safe_int(header.get("tickrate", 64)),
            "matchDate": None,
            "serverName": header.get("server_name", ""),
            "demoVersion": header.get("demo_version", ""),
        }

        # Recherche de la date dans les convars
        try:
            convars = parser.parse_convars()
            date_convars = [
                'sv_server_start_time', 'server_start_time',
                'match_start_time', 'game_start_time',
            ]

            for cvar in date_convars:
                if cvar in convars and convars[cvar]:
                    try:
                        ts = float(convars[cvar])
                        if 1500000000 < ts < 2100000000:
                            metadata["matchDate"] = datetime.fromtimestamp(ts).isoformat()
                            break
                    except (ValueError, TypeError):
                        pass
        except Exception:
            pass

        return metadata

    except Exception as e:
        return {
            "map": "unknown",
            "duration": 0,
            "tickrate": 64,
            "matchDate": None,
            "error": str(e),
        }


def extract_players(parser: DemoParser) -> List[Dict]:
    """Extrait les informations complètes des joueurs."""
    players = []
    seen_steamids = set()

    try:
        # Méthode 1: parse_ticks pour données joueur
        df = parser.parse_ticks(["steamid", "name", "team_num"])
        if df is not None and len(df) > 0:
            for _, row in df.drop_duplicates(subset=["steamid"]).iterrows():
                steamid = safe_str(row.get("steamid", ""))
                if steamid and steamid != "0" and steamid not in seen_steamids:
                    seen_steamids.add(steamid)
                    players.append({
                        "steamId": steamid,
                        "name": safe_str(row.get("name", "Unknown")),
                        "team": safe_int(row.get("team_num", 0)),
                    })
    except Exception:
        pass

    # Méthode 2: Fallback depuis les kills
    if not players:
        try:
            df = parser.parse_event("player_death")
            if df is not None and len(df) > 0:
                for _, row in df.iterrows():
                    for prefix in ["attacker", "user"]:
                        steamid = safe_str(row.get(f"{prefix}_steamid", ""))
                        if steamid and steamid != "0" and steamid not in seen_steamids:
                            seen_steamids.add(steamid)
                            players.append({
                                "steamId": steamid,
                                "name": safe_str(row.get(f"{prefix}_name", "Unknown")),
                                "team": 0,
                            })
        except Exception:
            pass

    return players


def extract_rounds(parser: DemoParser) -> List[Dict]:
    """Extrait les informations détaillées de chaque round."""
    rounds = []

    try:
        df = parser.parse_event("round_end")
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                winner = row.get("winner", 0)
                if isinstance(winner, str):
                    winner = WINNER_MAP.get(winner, 0)
                else:
                    winner = safe_int(winner)

                reason = row.get("reason", 0)
                if isinstance(reason, str):
                    reason = REASON_MAP.get(reason, 0)
                else:
                    reason = safe_int(reason)

                rounds.append({
                    "roundNumber": safe_int(row.get("round", len(rounds) + 1)),
                    "winner": winner,
                    "reason": reason,
                    "tick": safe_int(row.get("tick", 0)),
                })
    except Exception:
        pass

    return rounds


def extract_kills(parser: DemoParser, round_ticks: List[Tuple[int, int]]) -> List[Dict]:
    """Extrait tous les kills avec positions et contexte complet."""
    kills = []

    try:
        df = parser.parse_event("player_death")
        if df is None or len(df) == 0:
            return kills

        # Récupérer les positions aux ticks de mort
        kill_ticks = list(df["tick"].unique())
        player_positions = {}

        try:
            pos_df = parser.parse_ticks(["X", "Y", "Z", "steamid"], ticks=kill_ticks)
            if pos_df is not None and len(pos_df) > 0:
                for _, row in pos_df.iterrows():
                    tick = safe_int(row.get("tick", 0))
                    steamid = safe_str(row.get("steamid", ""))
                    if steamid and tick:
                        key = f"{tick}_{steamid}"
                        player_positions[key] = {
                            "x": safe_float(row.get("X")),
                            "y": safe_float(row.get("Y")),
                            "z": safe_float(row.get("Z")),
                        }
        except Exception:
            pass

        for _, row in df.iterrows():
            tick = safe_int(row.get("tick", 0))
            round_num = get_round_for_tick(tick, round_ticks)

            attacker_steamid = safe_str(row.get("attacker_steamid", ""))
            victim_steamid = safe_str(row.get("user_steamid", ""))

            attacker_pos = player_positions.get(
                f"{tick}_{attacker_steamid}",
                {"x": 0.0, "y": 0.0, "z": 0.0}
            )
            victim_pos = player_positions.get(
                f"{tick}_{victim_steamid}",
                {"x": 0.0, "y": 0.0, "z": 0.0}
            )

            weapon = normalize_weapon(row.get("weapon", ""))

            kills.append({
                "tick": tick,
                "round": round_num,
                "attackerSteamId": attacker_steamid,
                "attackerName": safe_str(row.get("attacker_name", "")),
                "victimSteamId": victim_steamid,
                "victimName": safe_str(row.get("user_name", "")),
                "weapon": weapon,
                "weaponCategory": get_weapon_category(weapon),
                "headshot": safe_bool(row.get("headshot", False)),
                "penetrated": safe_bool(row.get("penetrated", False)),
                "attackerBlind": safe_bool(row.get("attackerblind", False)),
                "noScope": safe_bool(row.get("noscope", False)),
                "throughSmoke": safe_bool(row.get("thrusmoke", False)),
                "assistedFlash": safe_bool(row.get("assistedflash", False)),
                "attackerPosition": attacker_pos,
                "victimPosition": victim_pos,
                "distance": calculate_distance(attacker_pos, victim_pos),
            })
    except Exception as e:
        print(f"Error extracting kills: {e}", file=sys.stderr)

    return kills


def calculate_distance(pos1: Dict, pos2: Dict) -> float:
    """Calcule la distance entre deux positions."""
    dx = pos1.get("x", 0) - pos2.get("x", 0)
    dy = pos1.get("y", 0) - pos2.get("y", 0)
    dz = pos1.get("z", 0) - pos2.get("z", 0)
    return (dx**2 + dy**2 + dz**2) ** 0.5


def extract_damages(parser: DemoParser, round_ticks: List[Tuple[int, int]]) -> List[Dict]:
    """Extrait tous les dégâts infligés avec détails."""
    damages = []

    try:
        df = parser.parse_event("player_hurt")
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                tick = safe_int(row.get("tick", 0))
                round_num = get_round_for_tick(tick, round_ticks)

                hitgroup = row.get("hitgroup", 0)
                if isinstance(hitgroup, str):
                    hitgroup = HITGROUP_MAP.get(hitgroup.lower(), 0)
                else:
                    hitgroup = safe_int(hitgroup)

                weapon = normalize_weapon(row.get("weapon", ""))

                damages.append({
                    "tick": tick,
                    "round": round_num,
                    "attackerSteamId": safe_str(row.get("attacker_steamid", "")),
                    "victimSteamId": safe_str(row.get("user_steamid", "")),
                    "damage": safe_int(row.get("dmg_health", 0)),
                    "damageArmor": safe_int(row.get("dmg_armor", 0)),
                    "healthRemaining": safe_int(row.get("health", 0)),
                    "armorRemaining": safe_int(row.get("armor", 0)),
                    "weapon": weapon,
                    "weaponCategory": get_weapon_category(weapon),
                    "hitgroup": hitgroup,
                })
    except Exception:
        pass

    return damages


def extract_weapon_fires(parser: DemoParser, round_ticks: List[Tuple[int, int]]) -> List[Dict]:
    """Extrait tous les tirs d'armes pour calcul d'accuracy."""
    fires = []

    try:
        df = parser.parse_event("weapon_fire")
        if df is not None and len(df) > 0:
            # Récupérer les positions et velocités aux ticks de tir
            fire_ticks = list(df["tick"].unique())

            # Échantillonner si trop de ticks
            if len(fire_ticks) > 10000:
                fire_ticks = fire_ticks[::2]  # Un sur deux

            player_states = {}
            try:
                state_df = parser.parse_ticks(
                    ["steamid", "X", "Y", "Z", "velocity_X", "velocity_Y", "velocity_Z",
                     "yaw", "pitch", "is_scoped", "in_crouch", "is_airborne"],
                    ticks=fire_ticks
                )
                if state_df is not None and len(state_df) > 0:
                    for _, row in state_df.iterrows():
                        tick = safe_int(row.get("tick", 0))
                        steamid = safe_str(row.get("steamid", ""))
                        if steamid and tick:
                            key = f"{tick}_{steamid}"
                            player_states[key] = {
                                "position": {
                                    "x": safe_float(row.get("X")),
                                    "y": safe_float(row.get("Y")),
                                    "z": safe_float(row.get("Z")),
                                },
                                "velocity": {
                                    "x": safe_float(row.get("velocity_X")),
                                    "y": safe_float(row.get("velocity_Y")),
                                    "z": safe_float(row.get("velocity_Z")),
                                },
                                "viewAngles": {
                                    "yaw": safe_float(row.get("yaw")),
                                    "pitch": safe_float(row.get("pitch")),
                                },
                                "isScoped": safe_bool(row.get("is_scoped")),
                                "isCrouching": safe_bool(row.get("in_crouch")),
                                "isAirborne": safe_bool(row.get("is_airborne")),
                            }
            except Exception:
                pass

            for _, row in df.iterrows():
                tick = safe_int(row.get("tick", 0))
                round_num = get_round_for_tick(tick, round_ticks)
                steamid = safe_str(row.get("user_steamid", ""))
                weapon = normalize_weapon(row.get("weapon", ""))

                state = player_states.get(f"{tick}_{steamid}", {})
                velocity = state.get("velocity", {"x": 0, "y": 0, "z": 0})
                speed = (velocity["x"]**2 + velocity["y"]**2) ** 0.5

                fires.append({
                    "tick": tick,
                    "round": round_num,
                    "steamId": steamid,
                    "weapon": weapon,
                    "weaponCategory": get_weapon_category(weapon),
                    "silencer": safe_bool(row.get("silenced", False)),
                    "position": state.get("position", {"x": 0, "y": 0, "z": 0}),
                    "velocity": velocity,
                    "speed": speed,
                    "viewAngles": state.get("viewAngles", {"yaw": 0, "pitch": 0}),
                    "isScoped": state.get("isScoped", False),
                    "isCrouching": state.get("isCrouching", False),
                    "isAirborne": state.get("isAirborne", False),
                    "isMoving": speed > 10,
                    "isCounterStrafed": speed < 34,  # Threshold pour counter-strafe
                })
    except Exception as e:
        print(f"Warning: Could not extract weapon fires: {e}", file=sys.stderr)

    return fires


def extract_grenades(parser: DemoParser, round_ticks: List[Tuple[int, int]]) -> List[Dict]:
    """Extrait l'utilisation complète des grenades."""
    events = []

    grenade_events = [
        ("flashbang_detonate", "flash"),
        ("smokegrenade_detonate", "smoke"),
        ("hegrenade_detonate", "he"),
        ("inferno_startburn", "molotov"),
        ("decoy_started", "decoy"),
    ]

    for event_name, grenade_type in grenade_events:
        try:
            df = parser.parse_event(event_name)
            if df is not None and len(df) > 0:
                for _, row in df.iterrows():
                    tick = safe_int(row.get("tick", 0))
                    round_num = get_round_for_tick(tick, round_ticks)

                    events.append({
                        "type": grenade_type,
                        "tick": tick,
                        "round": round_num,
                        "throwerSteamId": safe_str(
                            row.get("user_steamid", "") or row.get("entityid", "")
                        ),
                        "position": {
                            "x": safe_float(row.get("x", 0)),
                            "y": safe_float(row.get("y", 0)),
                            "z": safe_float(row.get("z", 0)),
                        },
                    })
        except Exception:
            continue

    return events


def extract_player_blinds(parser: DemoParser, round_ticks: List[Tuple[int, int]]) -> List[Dict]:
    """Extrait les événements player_blind pour les flashs reçues."""
    blinds = []

    try:
        df = parser.parse_event("player_blind")
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                tick = safe_int(row.get("tick", 0))
                round_num = get_round_for_tick(tick, round_ticks)

                blinds.append({
                    "tick": tick,
                    "round": round_num,
                    "victimSteamId": safe_str(row.get("user_steamid", "")),
                    "attackerSteamId": safe_str(row.get("attacker_steamid", "")),
                    "duration": safe_float(row.get("blind_duration", 0)),
                    "entityId": safe_int(row.get("entityid", 0)),
                })
    except Exception as e:
        print(f"Warning: Could not extract player blinds: {e}", file=sys.stderr)

    return blinds


def extract_bomb_events(parser: DemoParser, round_ticks: List[Tuple[int, int]]) -> List[Dict]:
    """Extrait tous les événements liés à la bombe."""
    events = []

    bomb_event_types = [
        ("bomb_planted", "planted"),
        ("bomb_defused", "defused"),
        ("bomb_exploded", "exploded"),
        ("bomb_dropped", "dropped"),
        ("bomb_pickup", "pickup"),
        ("bomb_beginplant", "beginplant"),
        ("bomb_abortplant", "abortplant"),
        ("bomb_begindefuse", "begindefuse"),
        ("bomb_abortdefuse", "abortdefuse"),
    ]

    for event_name, event_type in bomb_event_types:
        try:
            df = parser.parse_event(event_name)
            if df is not None and len(df) > 0:
                for _, row in df.iterrows():
                    tick = safe_int(row.get("tick", 0))
                    round_num = get_round_for_tick(tick, round_ticks)

                    event = {
                        "type": event_type,
                        "tick": tick,
                        "round": round_num,
                        "steamId": safe_str(row.get("user_steamid", "")),
                    }

                    # Ajouter site si disponible
                    site = row.get("site", None)
                    if site is not None:
                        event["site"] = safe_int(site)

                    # Ajouter haskit pour defuse
                    if event_type in ["begindefuse", "defused"]:
                        event["hasKit"] = safe_bool(row.get("haskit", False))

                    # Ajouter position si disponible
                    x = row.get("x")
                    if x is not None:
                        event["position"] = {
                            "x": safe_float(x),
                            "y": safe_float(row.get("y", 0)),
                            "z": safe_float(row.get("z", 0)),
                        }

                    events.append(event)
        except Exception:
            continue

    return events


def extract_economy_by_round(parser: DemoParser, rounds: List[Dict]) -> List[Dict]:
    """Extrait l'économie détaillée par joueur par round."""
    economy = []

    try:
        # Récupérer les ticks de début de round (freeze_end)
        freeze_df = parser.parse_event("round_freeze_end")
        if freeze_df is None or len(freeze_df) == 0:
            return economy

        freeze_ticks = list(freeze_df["tick"].values)

        # Parser les données économiques aux ticks de freeze_end
        econ_df = parser.parse_ticks(
            ["steamid", "balance", "equipment_value", "cash_spent_this_round",
             "has_helmet", "has_defuser", "armor_value", "team_num", "active_weapon"],
            ticks=freeze_ticks
        )

        if econ_df is None or len(econ_df) == 0:
            return economy

        # Grouper par tick
        for i, freeze_tick in enumerate(freeze_ticks):
            round_num = i + 1
            tick_data = econ_df[econ_df["tick"] == freeze_tick]

            round_economy = {
                "round": round_num,
                "tick": int(freeze_tick),
                "players": [],
            }

            for _, row in tick_data.iterrows():
                steamid = safe_str(row.get("steamid", ""))
                if not steamid or steamid == "0":
                    continue

                round_economy["players"].append({
                    "steamId": steamid,
                    "balance": safe_int(row.get("balance", 0)),
                    "equipmentValue": safe_int(row.get("equipment_value", 0)),
                    "spentThisRound": safe_int(row.get("cash_spent_this_round", 0)),
                    "hasHelmet": safe_bool(row.get("has_helmet", False)),
                    "hasDefuser": safe_bool(row.get("has_defuser", False)),
                    "armorValue": safe_int(row.get("armor_value", 0)),
                    "team": safe_int(row.get("team_num", 0)),
                    "weapon": normalize_weapon(row.get("active_weapon", "")),
                })

            economy.append(round_economy)
    except Exception as e:
        print(f"Warning: Could not extract economy: {e}", file=sys.stderr)

    return economy


def extract_item_purchases(parser: DemoParser, round_ticks: List[Tuple[int, int]]) -> List[Dict]:
    """Extrait les achats d'items."""
    purchases = []

    try:
        df = parser.parse_event("item_purchase")
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                tick = safe_int(row.get("tick", 0))
                round_num = get_round_for_tick(tick, round_ticks)

                item = normalize_weapon(row.get("weapon", ""))

                purchases.append({
                    "tick": tick,
                    "round": round_num,
                    "steamId": safe_str(row.get("user_steamid", "")),
                    "item": item,
                    "itemCategory": get_weapon_category(item),
                    "team": safe_int(row.get("team", 0)),
                })
    except Exception as e:
        print(f"Warning: Could not extract purchases: {e}", file=sys.stderr)

    return purchases


def extract_player_positions(
    parser: DemoParser,
    config: ParserConfig
) -> List[Dict]:
    """Extrait les positions continues échantillonnées."""
    if not config.extract_positions:
        return []

    positions = []

    try:
        # Obtenir tous les ticks disponibles
        header = parser.parse_header()
        total_ticks = int(header.get("playback_ticks", 0))

        if total_ticks == 0:
            return []

        # Générer les ticks à échantillonner
        sample_ticks = list(range(0, min(total_ticks, config.max_position_ticks), config.position_sample_rate))

        if not sample_ticks:
            return []

        # Parser les positions
        pos_df = parser.parse_ticks(
            ["steamid", "X", "Y", "Z", "velocity_X", "velocity_Y", "velocity_Z",
             "health", "armor_value", "is_alive", "team_num",
             "is_scoped", "is_walking", "in_crouch", "is_airborne",
             "active_weapon", "balance"],
            ticks=sample_ticks
        )

        if pos_df is None or len(pos_df) == 0:
            return []

        # Grouper par tick
        for tick in sample_ticks:
            tick_data = pos_df[pos_df["tick"] == tick]

            snapshot = {
                "tick": tick,
                "players": [],
            }

            for _, row in tick_data.iterrows():
                steamid = safe_str(row.get("steamid", ""))
                if not steamid or steamid == "0":
                    continue

                if not safe_bool(row.get("is_alive", True)):
                    continue

                velocity_x = safe_float(row.get("velocity_X", 0))
                velocity_y = safe_float(row.get("velocity_Y", 0))
                speed = (velocity_x**2 + velocity_y**2) ** 0.5

                snapshot["players"].append({
                    "steamId": steamid,
                    "x": safe_float(row.get("X")),
                    "y": safe_float(row.get("Y")),
                    "z": safe_float(row.get("Z")),
                    "velocityX": velocity_x,
                    "velocityY": velocity_y,
                    "velocityZ": safe_float(row.get("velocity_Z", 0)),
                    "speed": speed,
                    "health": safe_int(row.get("health", 100)),
                    "armor": safe_int(row.get("armor_value", 0)),
                    "team": safe_int(row.get("team_num", 0)),
                    "isScoped": safe_bool(row.get("is_scoped", False)),
                    "isWalking": safe_bool(row.get("is_walking", False)),
                    "isCrouching": safe_bool(row.get("in_crouch", False)),
                    "isAirborne": safe_bool(row.get("is_airborne", False)),
                    "weapon": normalize_weapon(row.get("active_weapon", "")),
                    "balance": safe_int(row.get("balance", 0)),
                })

            if snapshot["players"]:
                positions.append(snapshot)

    except Exception as e:
        print(f"Warning: Could not extract positions: {e}", file=sys.stderr)

    return positions


def extract_clutch_situations(kills: List[Dict], rounds: List[Dict]) -> List[Dict]:
    """Identifie les situations de clutch (1vX)."""
    clutches = []

    # Grouper les kills par round
    kills_by_round = {}
    for kill in kills:
        r = kill["round"]
        if r not in kills_by_round:
            kills_by_round[r] = []
        kills_by_round[r].append(kill)

    for round_info in rounds:
        round_num = round_info["roundNumber"]
        round_kills = kills_by_round.get(round_num, [])

        if len(round_kills) < 2:
            continue

        # Trier par tick
        round_kills.sort(key=lambda k: k["tick"])

        # Tracker les joueurs morts par équipe
        team_deaths = {2: set(), 3: set()}  # CT=2, T=3

        for i, kill in enumerate(round_kills):
            victim_id = kill["victimSteamId"]

            # Determiner l'équipe de la victime (approximation basée sur le tueur)
            # En pratique, il faudrait le team de la victime
            attacker_id = kill["attackerSteamId"]

            # Compter les joueurs restants après ce kill
            remaining_after_kill = len(round_kills) - i - 1

            # Détecter un clutch potentiel (simplifié)
            if remaining_after_kill >= 2:
                # Le tueur de ce kill pourrait être en clutch
                later_kills_by_same = [
                    k for k in round_kills[i+1:]
                    if k["attackerSteamId"] == attacker_id
                ]

                if len(later_kills_by_same) >= 2:
                    clutches.append({
                        "round": round_num,
                        "steamId": attacker_id,
                        "killsInClutch": len(later_kills_by_same) + 1,
                        "startTick": kill["tick"],
                        "won": True,  # Simplifié
                    })
                    break  # Un seul clutch par round

    return clutches


def extract_entry_duels(kills: List[Dict]) -> List[Dict]:
    """Identifie les entry duels (premiers duels de chaque round)."""
    entries = []

    # Grouper par round
    kills_by_round = {}
    for kill in kills:
        r = kill["round"]
        if r not in kills_by_round:
            kills_by_round[r] = []
        kills_by_round[r].append(kill)

    for round_num, round_kills in kills_by_round.items():
        if not round_kills:
            continue

        # Premier kill du round
        round_kills.sort(key=lambda k: k["tick"])
        first_kill = round_kills[0]

        entries.append({
            "round": round_num,
            "tick": first_kill["tick"],
            "winnerId": first_kill["attackerSteamId"],
            "loserId": first_kill["victimSteamId"],
            "weapon": first_kill["weapon"],
            "headshot": first_kill["headshot"],
            "distance": first_kill.get("distance", 0),
        })

    return entries


def extract_trades(kills: List[Dict]) -> List[Dict]:
    """Identifie les trades (morts vengées rapidement)."""
    trades = []
    trade_window = 3.0  # 3 secondes
    ticks_per_second = 128  # Approximation

    # Trier par round et tick
    sorted_kills = sorted(kills, key=lambda k: (k["round"], k["tick"]))

    for i, kill in enumerate(sorted_kills):
        # Chercher si ce kill a été trade
        for j in range(i + 1, len(sorted_kills)):
            trade_kill = sorted_kills[j]

            # Même round
            if trade_kill["round"] != kill["round"]:
                break

            # Dans la fenêtre de temps
            tick_diff = trade_kill["tick"] - kill["tick"]
            time_diff = tick_diff / ticks_per_second

            if time_diff > trade_window:
                break

            # Le tueur original est mort
            if trade_kill["victimSteamId"] == kill["attackerSteamId"]:
                trades.append({
                    "round": kill["round"],
                    "originalKillTick": kill["tick"],
                    "tradeTick": trade_kill["tick"],
                    "timeToTrade": time_diff,
                    "originalVictimId": kill["victimSteamId"],
                    "originalKillerId": kill["attackerSteamId"],
                    "traderId": trade_kill["attackerSteamId"],
                })
                break

    return trades


# =============================================================================
# FONCTION PRINCIPALE
# =============================================================================

def parse_demo(demo_path: str, config: ParserConfig = None) -> Dict:
    """Parse un fichier .dem et extrait toutes les données."""

    if config is None:
        config = ParserConfig()

    parser = DemoParser(demo_path)

    # Extraire rounds d'abord pour calculer les rounds des autres événements
    rounds = extract_rounds(parser)
    round_ticks = [(r["tick"], r["roundNumber"]) for r in rounds]

    # Extractions principales
    result = {
        "version": "2.0",
        "metadata": extract_metadata(parser),
        "players": extract_players(parser),
        "rounds": rounds,
        "kills": extract_kills(parser, round_ticks),
        "damages": extract_damages(parser, round_ticks),
        "grenades": extract_grenades(parser, round_ticks),
        "playerBlinds": extract_player_blinds(parser, round_ticks),
        "bombEvents": extract_bomb_events(parser, round_ticks),
        "economyByRound": extract_economy_by_round(parser, rounds),
        "purchases": extract_item_purchases(parser, round_ticks),
    }

    # Extractions conditionnelles (coûteuses)
    if config.extract_weapon_fires:
        result["weaponFires"] = extract_weapon_fires(parser, round_ticks)

    if config.extract_positions:
        result["positions"] = extract_player_positions(parser, config)

    # Données dérivées
    result["clutches"] = extract_clutch_situations(result["kills"], rounds)
    result["entryDuels"] = extract_entry_duels(result["kills"])
    result["trades"] = extract_trades(result["kills"])

    # Statistiques de parsing
    result["parsingStats"] = {
        "totalKills": len(result["kills"]),
        "totalDamages": len(result["damages"]),
        "totalGrenades": len(result["grenades"]),
        "totalBlinds": len(result.get("playerBlinds", [])),
        "totalBombEvents": len(result.get("bombEvents", [])),
        "totalWeaponFires": len(result.get("weaponFires", [])),
        "totalPositionSnapshots": len(result.get("positions", [])),
        "totalPurchases": len(result.get("purchases", [])),
    }

    return result


def main():
    parser = argparse.ArgumentParser(
        description="CS2 Demo Parser v2.0 - Extraction exhaustive"
    )
    parser.add_argument("demo_path", help="Chemin vers le fichier .dem")
    parser.add_argument("output_path", help="Chemin de sortie JSON")
    parser.add_argument(
        "--full-positions",
        action="store_true",
        help="Extraire toutes les positions (fichier plus gros)"
    )
    parser.add_argument(
        "--no-weapon-fires",
        action="store_true",
        help="Désactiver l'extraction des tirs d'armes"
    )
    parser.add_argument(
        "--no-positions",
        action="store_true",
        help="Désactiver l'extraction des positions"
    )
    parser.add_argument(
        "--sample-rate",
        type=int,
        default=64,
        help="Taux d'échantillonnage des positions (en ticks, défaut: 64)"
    )

    args = parser.parse_args()

    if not Path(args.demo_path).exists():
        print(json.dumps({
            "success": False,
            "error": f"File not found: {args.demo_path}"
        }), file=sys.stderr)
        sys.exit(1)

    # Configuration
    config = ParserConfig(
        extract_positions=not args.no_positions,
        extract_weapon_fires=not args.no_weapon_fires,
        position_sample_rate=args.sample_rate,
        max_position_ticks=200000 if args.full_positions else 50000,
    )

    try:
        result = parse_demo(args.demo_path, config)

        with open(args.output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False)

        print(json.dumps({
            "success": True,
            "output": args.output_path,
            "stats": result.get("parsingStats", {}),
        }))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
