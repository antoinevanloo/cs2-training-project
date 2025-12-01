/**
 * Moment Detector - Détection automatique des moments clés
 *
 * Analyse une démo pour identifier :
 * - Highlights (clutchs, aces, multi-kills)
 * - Erreurs à apprendre
 * - Moments de coordination
 */

import type {
  Moment,
  MomentType,
  MomentTag,
  MomentImportance,
  MomentTiming,
  MomentPlayer,
  MomentContext,
  MomentDetails,
  MomentKill,
  ClipInfo,
  MomentCollection,
  MomentStats,
  MomentDetectionOptions,
  MomentFilter,
} from './types';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Timing thresholds (ticks, 64 tick = 1 second)
  MULTI_KILL_WINDOW: 256, // 4 seconds
  TRADE_WINDOW: 192,      // 3 seconds
  QUICK_TRADE: 128,       // 2 seconds
  CLUTCH_MIN_ENEMIES: 2,  // 1v2 minimum for clutch

  // Interest score weights
  WEIGHTS: {
    ace: 100,
    clutch_win: 90,
    multi_kill_5: 95,
    multi_kill_4: 80,
    multi_kill_3: 60,
    clutch_attempt: 50,
    eco_win: 55,
    entry_kill: 40,
    trade_kill: 35,
    utility_play: 45,
    noscope: 70,
    wallbang: 50,
    jumping_kill: 65,
    smoke_kill: 45,
    mistake: 40,
  },

  // Clip buffer (ticks)
  CLIP_BUFFER_BEFORE: 192, // 3 seconds
  CLIP_BUFFER_AFTER: 128,  // 2 seconds

  // Minimum interest for inclusion
  MIN_INTEREST_DEFAULT: 30,
};

// ============================================
// MOMENT DETECTOR CLASS
// ============================================

export class MomentDetector {
  private options: Required<MomentDetectionOptions>;

  constructor(options: MomentDetectionOptions = {}) {
    this.options = {
      minInterestScore: options.minInterestScore ?? CONFIG.MIN_INTEREST_DEFAULT,
      detectTypes: options.detectTypes ?? this.getAllTypes(),
      includeMistakes: options.includeMistakes ?? true,
      includeTeamMoments: options.includeTeamMoments ?? true,
      clipBuffer: options.clipBuffer ?? {
        before: CONFIG.CLIP_BUFFER_BEFORE,
        after: CONFIG.CLIP_BUFFER_AFTER,
      },
    };
  }

  /**
   * Détecte tous les moments dans une démo
   */
  detect(demoData: DemoMomentData): MomentCollection {
    const moments: Moment[] = [];

    // 1. Détecter les clutchs
    if (this.shouldDetect('clutch_win') || this.shouldDetect('clutch_attempt')) {
      moments.push(...this.detectClutches(demoData));
    }

    // 2. Détecter les multi-kills (incluant aces)
    if (this.shouldDetect('multi_kill') || this.shouldDetect('ace')) {
      moments.push(...this.detectMultiKills(demoData));
    }

    // 3. Détecter les entry kills/deaths
    if (this.shouldDetect('entry_kill') || this.shouldDetect('entry_death')) {
      moments.push(...this.detectEntries(demoData));
    }

    // 4. Détecter les trades
    if (this.shouldDetect('trade_kill') || this.shouldDetect('failed_trade')) {
      moments.push(...this.detectTrades(demoData));
    }

    // 5. Détecter les plays utility
    if (this.shouldDetect('utility_play') || this.shouldDetect('flash_assist')) {
      moments.push(...this.detectUtilityPlays(demoData));
    }

    // 6. Détecter les kills spéciaux
    moments.push(...this.detectSpecialKills(demoData));

    // 7. Détecter les erreurs
    if (this.options.includeMistakes) {
      moments.push(...this.detectMistakes(demoData));
    }

    // 8. Détecter les eco wins
    if (this.shouldDetect('eco_win')) {
      moments.push(...this.detectEcoWins(demoData));
    }

    // Filtrer par score minimum et dédupliquer
    const filteredMoments = this.filterAndDeduplicate(moments);

    // Construire la collection
    return this.buildCollection(demoData, filteredMoments);
  }

  // ============================================
  // DÉTECTION DES CLUTCHS
  // ============================================

  private detectClutches(data: DemoMomentData): Moment[] {
    const moments: Moment[] = [];
    const { kills, rounds, playerSteamId, playerTeam } = data;

    for (const round of rounds) {
      // Trouver les situations de clutch
      const clutchStart = this.findClutchStart(round, playerSteamId, playerTeam);
      if (!clutchStart) continue;

      const { startTick, enemiesAlive, allyAlive } = clutchStart;

      // Vérifier si c'est un clutch (seul contre plusieurs)
      if (allyAlive > 0 || enemiesAlive < CONFIG.CLUTCH_MIN_ENEMIES) continue;

      // Trouver la fin du clutch
      const clutchEnd = this.findClutchEnd(round, playerSteamId, startTick);
      const { endTick, won, killsInClutch, survived } = clutchEnd;

      // Créer le moment
      const clutchType: MomentType = won ? 'clutch_win' : 'clutch_attempt';
      const importance = this.calculateClutchImportance(enemiesAlive, won);
      const interestScore = this.calculateClutchInterest(enemiesAlive, won, killsInClutch);

      moments.push(this.createMoment({
        type: clutchType,
        round: round.number,
        startTick,
        endTick,
        player: this.getPlayerInfo(data, playerSteamId, startTick),
        context: this.getRoundContext(round, startTick),
        importance,
        interestScore,
        details: {
          clutchInfo: {
            startingPlayers: enemiesAlive,
            opponentsKilled: killsInClutch,
            survived,
            bombDefused: round.bombDefused,
            bombPlanted: round.bombPlanted,
            timeRemaining: round.endTime - (endTick / 64),
          },
        },
        title: this.generateClutchTitle(enemiesAlive, won, killsInClutch),
        description: this.generateClutchDescription(enemiesAlive, won, killsInClutch, survived),
        tags: this.getClutchTags(won, enemiesAlive),
      }));
    }

    return moments;
  }

  private findClutchStart(
    round: RoundData,
    playerSteamId: string,
    playerTeam: number
  ): { startTick: number; enemiesAlive: number; allyAlive: number } | null {
    // Parcourir les états du round pour trouver quand le joueur est seul
    for (const state of round.states || []) {
      const allies = state.players.filter(p => p.team === playerTeam && p.alive && p.steamId !== playerSteamId);
      const enemies = state.players.filter(p => p.team !== playerTeam && p.alive);
      const playerAlive = state.players.find(p => p.steamId === playerSteamId)?.alive;

      if (playerAlive && allies.length === 0 && enemies.length >= CONFIG.CLUTCH_MIN_ENEMIES) {
        return {
          startTick: state.tick,
          enemiesAlive: enemies.length,
          allyAlive: allies.length,
        };
      }
    }
    return null;
  }

  private findClutchEnd(
    round: RoundData,
    playerSteamId: string,
    startTick: number
  ): { endTick: number; won: boolean; killsInClutch: number; survived: boolean } {
    let killsInClutch = 0;
    let survived = true;
    let endTick = round.endTick;

    // Compter les kills après le début du clutch
    for (const kill of round.kills || []) {
      if (kill.tick < startTick) continue;

      if (kill.attackerSteamId === playerSteamId) {
        killsInClutch++;
      }
      if (kill.victimSteamId === playerSteamId) {
        survived = false;
        endTick = kill.tick;
        break;
      }
    }

    const won = survived || (round.winnerTeam === this.getPlayerTeamFromRound(round, playerSteamId));

    return { endTick, won, killsInClutch, survived };
  }

  private calculateClutchImportance(enemies: number, won: boolean): MomentImportance {
    if (won && enemies >= 4) return 'epic';
    if (won && enemies >= 3) return 'high';
    if (won && enemies >= 2) return 'medium';
    if (!won && enemies >= 3) return 'medium';
    return 'low';
  }

  private calculateClutchInterest(enemies: number, won: boolean, kills: number): number {
    let score = won ? CONFIG.WEIGHTS.clutch_win : CONFIG.WEIGHTS.clutch_attempt;
    score += enemies * 10;
    score += kills * 5;
    if (won && kills === enemies) score += 15; // Full kills
    return Math.min(100, score);
  }

  private generateClutchTitle(enemies: number, won: boolean, kills: number): string {
    const result = won ? 'Clutch gagné' : 'Tentative de clutch';
    return `${result} 1v${enemies} (${kills} kill${kills > 1 ? 's' : ''})`;
  }

  private generateClutchDescription(enemies: number, won: boolean, kills: number, survived: boolean): string {
    if (won) {
      if (survived) {
        return `Clutch incroyable en 1v${enemies} avec ${kills} kill${kills > 1 ? 's' : ''}, resté en vie.`;
      }
      return `Clutch gagné en 1v${enemies} après avoir éliminé ${kills} adversaire${kills > 1 ? 's' : ''}.`;
    }
    return `Tentative de clutch en 1v${enemies}, ${kills} kill${kills > 1 ? 's' : ''} avant de tomber.`;
  }

  private getClutchTags(won: boolean, enemies: number): MomentTag[] {
    const tags: MomentTag[] = [];
    if (won) {
      tags.push('highlight');
      if (enemies >= 3) tags.push('team');
    } else {
      tags.push('learning');
      if (enemies >= 3) tags.push('close_call');
    }
    return tags;
  }

  // ============================================
  // DÉTECTION DES MULTI-KILLS
  // ============================================

  private detectMultiKills(data: DemoMomentData): Moment[] {
    const moments: Moment[] = [];
    const { rounds, playerSteamId } = data;

    for (const round of rounds) {
      const playerKills = (round.kills || [])
        .filter(k => k.attackerSteamId === playerSteamId)
        .sort((a, b) => a.tick - b.tick);

      if (playerKills.length < 3) continue;

      // Rechercher des séquences de multi-kills
      let sequenceStart = 0;
      while (sequenceStart < playerKills.length) {
        const sequence: typeof playerKills = [playerKills[sequenceStart]];

        // Étendre la séquence
        for (let i = sequenceStart + 1; i < playerKills.length; i++) {
          const timeDiff = playerKills[i].tick - sequence[sequence.length - 1].tick;
          if (timeDiff <= CONFIG.MULTI_KILL_WINDOW) {
            sequence.push(playerKills[i]);
          } else {
            break;
          }
        }

        // Si 3+ kills dans la fenêtre
        if (sequence.length >= 3) {
          const isAce = sequence.length >= 5;
          const type: MomentType = isAce ? 'ace' : 'multi_kill';

          moments.push(this.createMoment({
            type,
            round: round.number,
            startTick: sequence[0].tick,
            endTick: sequence[sequence.length - 1].tick,
            player: this.getPlayerInfo(data, playerSteamId, sequence[0].tick),
            context: this.getRoundContext(round, sequence[0].tick),
            importance: this.getMultiKillImportance(sequence.length),
            interestScore: this.getMultiKillInterest(sequence),
            details: {
              multiKillInfo: {
                killCount: sequence.length,
                timeSpan: (sequence[sequence.length - 1].tick - sequence[0].tick) / 64,
                weapons: [...new Set(sequence.map(k => k.weapon))],
                headshots: sequence.filter(k => k.headshot).length,
                isAce,
              },
              kills: sequence.map(k => this.formatKill(k)),
            },
            title: this.getMultiKillTitle(sequence.length),
            description: this.getMultiKillDescription(sequence),
            tags: this.getMultiKillTags(sequence.length),
          }));

          sequenceStart += sequence.length;
        } else {
          sequenceStart++;
        }
      }
    }

    return moments;
  }

  private getMultiKillImportance(count: number): MomentImportance {
    if (count >= 5) return 'epic';
    if (count >= 4) return 'high';
    if (count >= 3) return 'medium';
    return 'low';
  }

  private getMultiKillInterest(kills: KillData[]): number {
    let score = 0;
    if (kills.length >= 5) score = CONFIG.WEIGHTS.multi_kill_5;
    else if (kills.length >= 4) score = CONFIG.WEIGHTS.multi_kill_4;
    else score = CONFIG.WEIGHTS.multi_kill_3;

    // Bonus pour headshots
    const hsRate = kills.filter(k => k.headshot).length / kills.length;
    score += hsRate * 10;

    // Bonus pour rapidité
    const timeSpan = (kills[kills.length - 1].tick - kills[0].tick) / 64;
    if (timeSpan < 3) score += 10;

    return Math.min(100, score);
  }

  private getMultiKillTitle(count: number): string {
    const names: Record<number, string> = {
      3: 'Triple kill',
      4: 'Quadra kill',
      5: 'ACE!',
    };
    return names[count] || `${count} kills`;
  }

  private getMultiKillDescription(kills: KillData[]): string {
    const count = kills.length;
    const timeSpan = ((kills[kills.length - 1].tick - kills[0].tick) / 64).toFixed(1);
    const weapons = [...new Set(kills.map(k => k.weapon))];

    if (count >= 5) {
      return `ACE incroyable ! 5 éliminations en ${timeSpan}s avec ${weapons.join(', ')}.`;
    }
    return `${count} éliminations rapides en ${timeSpan}s.`;
  }

  private getMultiKillTags(count: number): MomentTag[] {
    const tags: MomentTag[] = ['highlight'];
    if (count >= 5) tags.push('team');
    return tags;
  }

  // ============================================
  // DÉTECTION DES ENTRIES
  // ============================================

  private detectEntries(data: DemoMomentData): Moment[] {
    const moments: Moment[] = [];
    const { rounds, playerSteamId } = data;

    for (const round of rounds) {
      const firstKill = (round.kills || [])[0];
      if (!firstKill) continue;

      const isPlayerEntry = firstKill.attackerSteamId === playerSteamId;
      const isPlayerDeath = firstKill.victimSteamId === playerSteamId;

      if (!isPlayerEntry && !isPlayerDeath) continue;

      const type: MomentType = isPlayerEntry ? 'entry_kill' : 'entry_death';
      const wasTraded = this.wasKillTraded(round.kills || [], firstKill);

      moments.push(this.createMoment({
        type,
        round: round.number,
        startTick: firstKill.tick - 64,
        endTick: firstKill.tick + (wasTraded ? 192 : 64),
        player: this.getPlayerInfo(data, playerSteamId, firstKill.tick),
        context: this.getRoundContext(round, firstKill.tick),
        importance: isPlayerEntry ? 'medium' : 'low',
        interestScore: isPlayerEntry ? CONFIG.WEIGHTS.entry_kill : 35,
        details: {
          entryInfo: {
            won: isPlayerEntry,
            weapon: firstKill.weapon,
            traded: wasTraded,
            tradeTime: wasTraded ? this.getTradeTime(round.kills || [], firstKill) : undefined,
          },
        },
        title: isPlayerEntry ? 'Opening kill' : 'First death',
        description: this.getEntryDescription(isPlayerEntry, firstKill, wasTraded),
        tags: isPlayerEntry ? ['highlight'] : ['learning'],
      }));
    }

    return moments;
  }

  private wasKillTraded(kills: KillData[], targetKill: KillData): boolean {
    return kills.some(k =>
      k.victimSteamId === targetKill.attackerSteamId &&
      k.tick > targetKill.tick &&
      k.tick - targetKill.tick <= CONFIG.TRADE_WINDOW
    );
  }

  private getTradeTime(kills: KillData[], targetKill: KillData): number {
    const tradeKill = kills.find(k =>
      k.victimSteamId === targetKill.attackerSteamId &&
      k.tick > targetKill.tick &&
      k.tick - targetKill.tick <= CONFIG.TRADE_WINDOW
    );
    return tradeKill ? (tradeKill.tick - targetKill.tick) / 64 : 0;
  }

  private getEntryDescription(won: boolean, kill: KillData, traded: boolean): string {
    if (won) {
      return `Opening kill avec ${kill.weapon}${kill.headshot ? ' (headshot)' : ''}.`;
    }
    return `First death contre ${kill.weapon}${traded ? ', mais tradé rapidement' : ', non tradé'}.`;
  }

  // ============================================
  // DÉTECTION DES TRADES
  // ============================================

  private detectTrades(data: DemoMomentData): Moment[] {
    const moments: Moment[] = [];
    const { rounds, playerSteamId, playerTeam } = data;

    for (const round of rounds) {
      const kills = round.kills || [];

      for (let i = 0; i < kills.length - 1; i++) {
        const allyDeath = kills[i];

        // Vérifier si c'est la mort d'un allié
        const victimTeam = this.getKillVictimTeam(allyDeath);
        if (victimTeam !== playerTeam) continue;

        // Chercher si le joueur a tradé
        for (let j = i + 1; j < kills.length; j++) {
          const tradeKill = kills[j];
          const timeDiff = tradeKill.tick - allyDeath.tick;

          if (timeDiff > CONFIG.TRADE_WINDOW) break;

          if (tradeKill.attackerSteamId === playerSteamId &&
              tradeKill.victimSteamId === allyDeath.attackerSteamId) {
            // Trade réussi
            const isQuick = timeDiff <= CONFIG.QUICK_TRADE;

            moments.push(this.createMoment({
              type: 'trade_kill',
              round: round.number,
              startTick: allyDeath.tick,
              endTick: tradeKill.tick + 32,
              player: this.getPlayerInfo(data, playerSteamId, tradeKill.tick),
              context: this.getRoundContext(round, allyDeath.tick),
              importance: isQuick ? 'medium' : 'low',
              interestScore: CONFIG.WEIGHTS.trade_kill + (isQuick ? 15 : 0),
              details: {
                kills: [this.formatKill(tradeKill)],
              },
              title: isQuick ? 'Trade rapide' : 'Trade kill',
              description: `Trade en ${(timeDiff / 64).toFixed(1)}s avec ${tradeKill.weapon}.`,
              tags: isQuick ? ['highlight'] : ['learning'],
            }));
            break;
          }
        }
      }
    }

    return moments;
  }

  // ============================================
  // DÉTECTION UTILITY PLAYS
  // ============================================

  private detectUtilityPlays(data: DemoMomentData): Moment[] {
    const moments: Moment[] = [];
    const { rounds, playerSteamId } = data;

    for (const round of rounds) {
      // Flash assists
      const flashAssists = (round.flashAssists || [])
        .filter(f => f.flasherSteamId === playerSteamId);

      for (const assist of flashAssists) {
        moments.push(this.createMoment({
          type: 'flash_assist',
          round: round.number,
          startTick: assist.flashTick,
          endTick: assist.killTick + 32,
          player: this.getPlayerInfo(data, playerSteamId, assist.flashTick),
          context: this.getRoundContext(round, assist.flashTick),
          importance: 'low',
          interestScore: 40,
          details: {
            utilityInfo: {
              utilityType: 'flash',
              playersAffected: 1,
              assistedKill: true,
            },
          },
          title: 'Flash assist',
          description: `Flash qui mène au kill de ${assist.victimName}.`,
          tags: ['highlight', 'team'],
        }));
      }
    }

    return moments;
  }

  // ============================================
  // DÉTECTION KILLS SPÉCIAUX
  // ============================================

  private detectSpecialKills(data: DemoMomentData): Moment[] {
    const moments: Moment[] = [];
    const { rounds, playerSteamId } = data;

    for (const round of rounds) {
      for (const kill of round.kills || []) {
        if (kill.attackerSteamId !== playerSteamId) continue;

        // Noscope
        if (kill.noscope && (kill.weapon.includes('awp') || kill.weapon.includes('scout'))) {
          moments.push(this.createMoment({
            type: 'noscope',
            round: round.number,
            startTick: kill.tick - 32,
            endTick: kill.tick + 32,
            player: this.getPlayerInfo(data, playerSteamId, kill.tick),
            context: this.getRoundContext(round, kill.tick),
            importance: 'high',
            interestScore: CONFIG.WEIGHTS.noscope,
            details: { kills: [this.formatKill(kill)] },
            title: 'Noscope!',
            description: `Kill noscope avec ${kill.weapon}.`,
            tags: ['highlight', 'funny'],
          }));
        }

        // Wallbang
        if (kill.wallbang) {
          moments.push(this.createMoment({
            type: 'wallbang',
            round: round.number,
            startTick: kill.tick - 32,
            endTick: kill.tick + 32,
            player: this.getPlayerInfo(data, playerSteamId, kill.tick),
            context: this.getRoundContext(round, kill.tick),
            importance: 'medium',
            interestScore: CONFIG.WEIGHTS.wallbang,
            details: { kills: [this.formatKill(kill)] },
            title: 'Wallbang',
            description: `Kill à travers le mur avec ${kill.weapon}.`,
            tags: ['highlight'],
          }));
        }

        // Smoke kill
        if (kill.throughSmoke) {
          moments.push(this.createMoment({
            type: 'smoke_kill',
            round: round.number,
            startTick: kill.tick - 32,
            endTick: kill.tick + 32,
            player: this.getPlayerInfo(data, playerSteamId, kill.tick),
            context: this.getRoundContext(round, kill.tick),
            importance: 'medium',
            interestScore: CONFIG.WEIGHTS.smoke_kill,
            details: { kills: [this.formatKill(kill)] },
            title: 'Smoke kill',
            description: `Kill à travers la smoke avec ${kill.weapon}.`,
            tags: ['highlight'],
          }));
        }

        // Jumping kill
        if (kill.airborne) {
          moments.push(this.createMoment({
            type: 'jumping_kill',
            round: round.number,
            startTick: kill.tick - 32,
            endTick: kill.tick + 32,
            player: this.getPlayerInfo(data, playerSteamId, kill.tick),
            context: this.getRoundContext(round, kill.tick),
            importance: 'medium',
            interestScore: CONFIG.WEIGHTS.jumping_kill,
            details: { kills: [this.formatKill(kill)] },
            title: 'Jump shot!',
            description: `Kill en l'air avec ${kill.weapon}.`,
            tags: ['highlight', 'funny'],
          }));
        }
      }
    }

    return moments;
  }

  // ============================================
  // DÉTECTION DES ERREURS
  // ============================================

  private detectMistakes(data: DemoMomentData): Moment[] {
    const moments: Moment[] = [];
    const { rounds, playerSteamId } = data;

    for (const round of rounds) {
      for (const kill of round.kills || []) {
        if (kill.victimSteamId !== playerSteamId) continue;

        // Mort alors que flashé
        if (kill.victimFlashed) {
          moments.push(this.createMoment({
            type: 'mistake_peek',
            round: round.number,
            startTick: kill.tick - 64,
            endTick: kill.tick + 32,
            player: this.getPlayerInfo(data, playerSteamId, kill.tick),
            context: this.getRoundContext(round, kill.tick),
            importance: 'low',
            interestScore: CONFIG.WEIGHTS.mistake,
            details: {
              mistakeInfo: {
                mistakeType: 'blind_death',
                whatWentWrong: 'Mort alors que flashé',
                whatShouldHaveDone: 'Attendre que le flash passe ou se repositionner',
                impactLevel: 'minor',
              },
            },
            title: 'Mort en aveugle',
            description: 'Éliminé alors que flashé, repositionnement conseillé.',
            tags: ['mistake', 'learning'],
            lessons: [
              'Tourner la tête ou se couvrir lors des flashs',
              'Ne pas peek quand on entend un flash',
            ],
          }));
        }

        // Mort non tradée (si pas le dernier)
        const wasTraded = this.wasKillTraded(round.kills || [], kill);
        if (!wasTraded && round.kills && round.kills.indexOf(kill) < round.kills.length - 1) {
          // Not last death and not traded
          moments.push(this.createMoment({
            type: 'mistake_position',
            round: round.number,
            startTick: kill.tick - 64,
            endTick: kill.tick + 64,
            player: this.getPlayerInfo(data, playerSteamId, kill.tick),
            context: this.getRoundContext(round, kill.tick),
            importance: 'medium',
            interestScore: CONFIG.WEIGHTS.mistake + 10,
            details: {
              mistakeInfo: {
                mistakeType: 'untraded_death',
                whatWentWrong: 'Mort non tradée par l\'équipe',
                whatShouldHaveDone: 'Jouer plus proche d\'un coéquipier ou communiquer sa position',
                impactLevel: 'moderate',
              },
            },
            title: 'Mort isolée',
            description: 'Position trop isolée, impossible à trader.',
            tags: ['mistake', 'learning'],
            lessons: [
              'Jouer plus proche des coéquipiers',
              'Communiquer avant de prendre une position risquée',
              'S\'assurer qu\'un allié peut trader',
            ],
          }));
        }
      }
    }

    return moments;
  }

  // ============================================
  // DÉTECTION ECO WINS
  // ============================================

  private detectEcoWins(data: DemoMomentData): Moment[] {
    const moments: Moment[] = [];
    const { rounds, playerSteamId } = data;

    for (const round of rounds) {
      if (round.buyType !== 'eco' && round.buyType !== 'force') continue;

      const playerKills = (round.kills || []).filter(k => k.attackerSteamId === playerSteamId);
      if (playerKills.length === 0) continue;

      // Si le joueur a eu des kills importants en eco
      if (playerKills.length >= 2 || playerKills.some(k => k.weapon.includes('awp') || k.weapon.includes('rifle'))) {
        moments.push(this.createMoment({
          type: 'eco_win',
          round: round.number,
          startTick: playerKills[0].tick - 64,
          endTick: playerKills[playerKills.length - 1].tick + 64,
          player: this.getPlayerInfo(data, playerSteamId, playerKills[0].tick),
          context: this.getRoundContext(round, playerKills[0].tick),
          importance: playerKills.length >= 3 ? 'high' : 'medium',
          interestScore: CONFIG.WEIGHTS.eco_win + playerKills.length * 10,
          details: {
            kills: playerKills.map(k => this.formatKill(k)),
          },
          title: `Eco hero (${playerKills.length} kills)`,
          description: `${playerKills.length} kills en eco round.`,
          tags: ['highlight'],
        }));
      }
    }

    return moments;
  }

  // ============================================
  // HELPERS
  // ============================================

  private shouldDetect(type: MomentType): boolean {
    return this.options.detectTypes.includes(type);
  }

  private getAllTypes(): MomentType[] {
    return [
      'ace', 'clutch_win', 'clutch_attempt', 'multi_kill', 'eco_win',
      'entry_kill', 'entry_death', 'trade_kill', 'failed_trade',
      'utility_play', 'flash_assist', 'smoke_kill', 'wallbang',
      'noscope', 'jumping_kill', 'mistake_peek', 'mistake_position',
      'mistake_utility', 'team_execute', 'round_mvp',
    ];
  }

  private createMoment(params: {
    type: MomentType;
    round: number;
    startTick: number;
    endTick: number;
    player: MomentPlayer;
    context: MomentContext;
    importance: MomentImportance;
    interestScore: number;
    details: MomentDetails;
    title: string;
    description: string;
    tags: MomentTag[];
    lessons?: string[];
  }): Moment {
    const timing: MomentTiming = {
      round: params.round,
      startTick: params.startTick,
      endTick: params.endTick,
      roundTime: params.startTick / 64, // Simplified
      matchTime: params.startTick / 64,
      duration: (params.endTick - params.startTick) / 64,
    };

    const clipInfo: ClipInfo = {
      startTick: params.startTick - this.options.clipBuffer.before,
      endTick: params.endTick + this.options.clipBuffer.after,
      suggestedDuration: timing.duration + 5,
      recommendedPov: params.player.steamId,
      demoCommands: {
        gotoTick: `demo_gototick ${params.startTick - this.options.clipBuffer.before}`,
        specPlayer: `spec_player ${params.player.steamId}`,
        startRecording: 'startmovie clip',
        stopRecording: 'endmovie',
      },
    };

    return {
      id: `moment-${params.type}-${params.round}-${params.startTick}`,
      type: params.type,
      tags: params.tags,
      importance: params.importance,
      interestScore: params.interestScore,
      timing,
      player: params.player,
      involvedPlayers: [],
      context: params.context,
      details: params.details,
      title: params.title,
      description: params.description,
      lessons: params.lessons,
      clipInfo,
    };
  }

  private getPlayerInfo(_data: DemoMomentData, steamId: string, _tick: number): MomentPlayer {
    return {
      steamId,
      name: 'Player', // Would be resolved from data
      team: 'CT', // Would be resolved
    };
  }

  private getRoundContext(round: RoundData, _tick: number): MomentContext {
    return {
      score: { ct: round.scoreCT, t: round.scoreT },
      aliveCT: 5, // Would be calculated
      aliveT: 5,
      bombState: round.bombPlanted ? 'planted' : 'carried',
      site: round.site as 'A' | 'B' | null,
      buyType: round.buyType as 'full' | 'half' | 'eco' | 'force' | 'pistol',
      roundType: round.roundType as 'pistol' | 'force' | 'eco' | 'full_buy' | 'bonus',
    };
  }

  private formatKill(kill: KillData): MomentKill {
    return {
      tick: kill.tick,
      killer: kill.attackerSteamId,
      victim: kill.victimSteamId,
      weapon: kill.weapon,
      headshot: kill.headshot,
      throughSmoke: kill.throughSmoke || false,
      wallbang: kill.wallbang || false,
      noscope: kill.noscope || false,
      flashed: kill.victimFlashed || false,
      airborne: kill.airborne || false,
    };
  }

  private getPlayerTeamFromRound(_round: RoundData, _steamId: string): number {
    return 2; // Simplified
  }

  private getKillVictimTeam(_kill: KillData): number {
    return 2; // Simplified
  }

  private filterAndDeduplicate(moments: Moment[]): Moment[] {
    // Filter by minimum interest
    let filtered = moments.filter(m => m.interestScore >= this.options.minInterestScore);

    // Sort by round and tick
    filtered.sort((a, b) => {
      if (a.timing.round !== b.timing.round) return a.timing.round - b.timing.round;
      return a.timing.startTick - b.timing.startTick;
    });

    // Deduplicate overlapping moments (keep highest interest)
    const deduplicated: Moment[] = [];
    for (const moment of filtered) {
      const overlapping = deduplicated.find(m =>
        m.timing.round === moment.timing.round &&
        Math.abs(m.timing.startTick - moment.timing.startTick) < 128
      );

      if (overlapping) {
        if (moment.interestScore > overlapping.interestScore) {
          const idx = deduplicated.indexOf(overlapping);
          deduplicated[idx] = moment;
        }
      } else {
        deduplicated.push(moment);
      }
    }

    return deduplicated;
  }

  private buildCollection(data: DemoMomentData, moments: Moment[]): MomentCollection {
    const byType = {} as Record<MomentType, Moment[]>;
    const byTag = {} as Record<MomentTag, Moment[]>;

    for (const moment of moments) {
      // Group by type
      if (!byType[moment.type]) byType[moment.type] = [];
      byType[moment.type].push(moment);

      // Group by tag
      for (const tag of moment.tags) {
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push(moment);
      }
    }

    const stats: MomentStats = {
      totalMoments: moments.length,
      highlights: (byTag.highlight || []).length,
      mistakes: (byTag.mistake || []).length,
      learningOpportunities: (byTag.learning || []).length,
      clutchAttempts: (byType.clutch_attempt || []).length + (byType.clutch_win || []).length,
      clutchWins: (byType.clutch_win || []).length,
      multiKills: (byType.multi_kill || []).length,
      aces: (byType.ace || []).length,
    };

    return {
      demoId: data.demoId,
      playerSteamId: data.playerSteamId,
      playerName: data.playerName,
      stats,
      moments,
      byType,
      byTag,
      topMoments: [...moments].sort((a, b) => b.interestScore - a.interestScore).slice(0, 10),
      learningMoments: moments.filter(m => m.tags.includes('learning')),
      mistakes: moments.filter(m => m.tags.includes('mistake')),
    };
  }

  /**
   * Filtre les moments selon des critères
   */
  filterMoments(collection: MomentCollection, filter: MomentFilter): Moment[] {
    return collection.moments.filter(m => {
      if (filter.types && !filter.types.includes(m.type)) return false;
      if (filter.tags && !filter.tags.some(t => m.tags.includes(t))) return false;
      if (filter.minInterestScore && m.interestScore < filter.minInterestScore) return false;
      if (filter.player && m.player.steamId !== filter.player) return false;

      if (filter.round) {
        if (typeof filter.round === 'number') {
          if (m.timing.round !== filter.round) return false;
        } else {
          if (m.timing.round < filter.round.min || m.timing.round > filter.round.max) return false;
        }
      }

      if (filter.minImportance) {
        const importanceOrder = { low: 0, medium: 1, high: 2, epic: 3 };
        if (importanceOrder[m.importance] < importanceOrder[filter.minImportance]) return false;
      }

      return true;
    });
  }
}

// ============================================
// TYPES INTERNES
// ============================================

interface DemoMomentData {
  demoId: string;
  playerSteamId: string;
  playerName: string;
  playerTeam: number;
  rounds: RoundData[];
  kills: KillData[];
}

interface RoundData {
  number: number;
  startTick: number;
  endTick: number;
  scoreCT: number;
  scoreT: number;
  winnerTeam: number;
  bombPlanted: boolean;
  bombDefused: boolean;
  site?: string;
  buyType: string;
  roundType: string;
  endTime: number;
  kills?: KillData[];
  flashAssists?: FlashAssistData[];
  states?: RoundStateData[];
}

interface KillData {
  tick: number;
  attackerSteamId: string;
  attackerName: string;
  victimSteamId: string;
  victimName: string;
  weapon: string;
  headshot: boolean;
  throughSmoke?: boolean;
  wallbang?: boolean;
  noscope?: boolean;
  victimFlashed?: boolean;
  airborne?: boolean;
}

interface FlashAssistData {
  flashTick: number;
  killTick: number;
  flasherSteamId: string;
  killerSteamId: string;
  victimSteamId: string;
  victimName: string;
}

interface RoundStateData {
  tick: number;
  players: Array<{
    steamId: string;
    team: number;
    alive: boolean;
  }>;
}

// Export singleton
export const momentDetector = new MomentDetector();
