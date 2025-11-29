#!/usr/bin/env python3
"""Script de test pour explorer les convars d'un fichier .dem"""

import sys
import glob
from demoparser2 import DemoParser

def main():
    # Trouver un fichier .dem
    if len(sys.argv) > 1:
        demo_path = sys.argv[1]
    else:
        demos = glob.glob('storage/demos/**/*.dem', recursive=True)
        if not demos:
            print("Aucun fichier .dem trouvé")
            return
        demo_path = demos[0]

    print(f"Analyse de: {demo_path}\n")

    parser = DemoParser(demo_path)

    # Header
    print("=== HEADER ===")
    header = parser.parse_header()
    for k, v in header.items():
        print(f"  {k}: {v}")

    # Convars
    print("\n=== CONVARS ===")
    convars = parser.parse_convars()
    print(f"Nombre de convars: {len(convars)}")

    # Chercher des convars liés au temps/date
    print("\n=== CONVARS LIÉS AU TEMPS ===")
    time_related = []
    for k, v in convars.items():
        k_lower = k.lower()
        if any(word in k_lower for word in ['time', 'date', 'stamp', 'start', 'server']):
            time_related.append((k, v))
            print(f"  {k}: {v}")

    # Chercher des valeurs qui ressemblent à des timestamps Unix
    print("\n=== VALEURS POSSIBLES TIMESTAMP ===")
    for k, v in convars.items():
        try:
            ts = float(v)
            if 1500000000 < ts < 2000000000:  # Entre 2017 et 2033
                from datetime import datetime
                dt = datetime.fromtimestamp(ts)
                print(f"  {k}: {v} -> {dt}")
        except (ValueError, TypeError):
            pass

    # Afficher tous les convars pour debug
    print("\n=== TOUS LES CONVARS ===")
    for k, v in sorted(convars.items()):
        print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
