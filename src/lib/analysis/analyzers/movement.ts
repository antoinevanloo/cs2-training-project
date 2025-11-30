/**
 * Movement Analyzer - Analyse des mécaniques de mouvement
 *
 * Analyse les aspects fondamentaux du mouvement en CS2:
 * - Counter-strafing (arrêt avant tir)
 * - Crouch usage (spray control)
 * - Scope discipline (AWP/Scout)
 * - Jump usage
 * - Walk discipline (audio)
 * - Strafe patterns
 *
 * Ces mécaniques sont cruciales pour la précision et le game sense.
 */

import {
  WeaponFireEvent,
  KillEventV2,
  DamageEventV2,
  PositionSnapshotV2,
  MOVEMENT_THRESHOLDS,
  getWeaponCategory,
} from '@/lib/demo-parser/types-v2';
import { MovementAnalysis } from '../types-v2';

// Configuration des seuils
const CONFIG = {
  // Counter-strafe thresholds
  COUNTER_STRAFE_PERFECT: 0,
  COUNTER_STRAFE_GOOD: 34,
  COUNTER_STRAFE_ACCEPTABLE: 80,
  COUNTER_STRAFE_POOR: 150,

  // Scope timing (en ms)
  QUICK_SCOPE_MAX: 200,
  HARD_SCOPE_MIN: 500,

  // Jump detection
  AIRBORNE_THRESHOLD: 50, // Z velocity

  // Walk speed
  WALK_SPEED: 130,
  RUN_SPEED: 250,
};

/**
 * Interface pour les tirs analysés
 */
interface AnalyzedShot {
  tick: number;
  round: number;
  weapon: string;
  speed: number;
  isScoped: boolean;
  isCrouching: boolean;
  isAirborne: boolean;
  isMoving: boolean;
  isCounterStrafed: boolean;
  hit: boolean;
  headshot: boolean;
}

/**
 * Classe principale d'analyse du mouvement
 */
export class MovementAnalyzer {
  /**
   * Analyse complète du mouvement d'un joueur
   */
  analyze(
    weaponFires: WeaponFireEvent[],
    kills: KillEventV2[],
    damages: DamageEventV2[],
    positions: PositionSnapshotV2[],
    playerSteamId: string
  ): MovementAnalysis {
    // Filtrer les tirs du joueur
    const playerFires = weaponFires.filter((f) => f.steamId === playerSteamId);
    const playerKills = kills.filter((k) => k.attackerSteamId === playerSteamId);
    const playerDamages = damages.filter((d) => d.attackerSteamId === playerSteamId);

    // Analyser chaque tir
    const analyzedShots = this.analyzeShots(playerFires, playerDamages, playerKills);

    // Analyses spécifiques
    const counterStrafing = this.analyzeCounterStrafing(analyzedShots, playerFires);
    const crouchUsage = this.analyzeCrouchUsage(analyzedShots, playerKills, playerDamages);
    const scopeDiscipline = this.analyzeScopeDiscipline(analyzedShots, playerKills, playerFires);
    const jumpUsage = this.analyzeJumpUsage(analyzedShots, playerKills);
    const walkDiscipline = this.analyzeWalkDiscipline(positions, playerKills, playerSteamId);
    const strafePatterns = this.analyzeStrafePatterns(playerFires);

    // Score global
    const overallScore = this.calculateOverallScore(
      counterStrafing,
      crouchUsage,
      scopeDiscipline,
      jumpUsage,
      walkDiscipline
    );

    // Métriques agrégées
    const metrics = this.buildMetrics(
      counterStrafing,
      crouchUsage,
      scopeDiscipline,
      jumpUsage,
      walkDiscipline,
      strafePatterns
    );

    return {
      counterStrafing,
      crouchUsage,
      scopeDiscipline,
      jumpUsage,
      walkDiscipline,
      strafePatterns,
      overallScore,
      metrics,
    };
  }

  /**
   * Analyse chaque tir pour corréler avec les hits/kills
   */
  private analyzeShots(
    fires: WeaponFireEvent[],
    damages: DamageEventV2[],
    kills: KillEventV2[]
  ): AnalyzedShot[] {
    const shots: AnalyzedShot[] = [];

    // Créer un index des damages et kills par tick
    const damagesByTick = new Map<number, DamageEventV2[]>();
    const killsByTick = new Map<number, KillEventV2[]>();

    for (const damage of damages) {
      const existing = damagesByTick.get(damage.tick) || [];
      existing.push(damage);
      damagesByTick.set(damage.tick, existing);
    }

    for (const kill of kills) {
      const existing = killsByTick.get(kill.tick) || [];
      existing.push(kill);
      killsByTick.set(kill.tick, existing);
    }

    for (const fire of fires) {
      // Chercher si ce tir a touché (dans une fenêtre de ~10 ticks)
      let hit = false;
      let headshot = false;

      for (let t = fire.tick; t <= fire.tick + 10; t++) {
        const tickDamages = damagesByTick.get(t) || [];
        const tickKills = killsByTick.get(t) || [];

        if (tickDamages.length > 0 || tickKills.length > 0) {
          hit = true;
          if (tickDamages.some((d) => d.hitgroup === 1) || tickKills.some((k) => k.headshot)) {
            headshot = true;
          }
          break;
        }
      }

      shots.push({
        tick: fire.tick,
        round: fire.round,
        weapon: fire.weapon,
        speed: fire.speed,
        isScoped: fire.isScoped,
        isCrouching: fire.isCrouching,
        isAirborne: fire.isAirborne,
        isMoving: fire.isMoving,
        isCounterStrafed: fire.isCounterStrafed,
        hit,
        headshot,
      });
    }

    return shots;
  }

  /**
   * Analyse du counter-strafing
   */
  private analyzeCounterStrafing(
    shots: AnalyzedShot[],
    fires: WeaponFireEvent[]
  ): MovementAnalysis['counterStrafing'] {
    // Filtrer les armes qui nécessitent le counter-strafe (pas les snipers scope, pas les shotguns)
    const relevantShots = shots.filter((s) => {
      const category = getWeaponCategory(s.weapon);
      // Counter-strafe important pour rifles, smgs, pistols
      return ['rifles', 'smgs', 'pistols'].includes(category);
    });

    if (relevantShots.length === 0) {
      return {
        attempts: 0,
        perfect: 0,
        good: 0,
        poor: 0,
        score: 50,
        avgSpeedAtShot: 0,
      };
    }

    let perfect = 0;
    let good = 0;
    let poor = 0;
    let totalSpeed = 0;

    for (const shot of relevantShots) {
      totalSpeed += shot.speed;

      if (shot.speed <= CONFIG.COUNTER_STRAFE_PERFECT) {
        perfect++;
      } else if (shot.speed <= CONFIG.COUNTER_STRAFE_GOOD) {
        good++;
      } else if (shot.speed > CONFIG.COUNTER_STRAFE_POOR) {
        poor++;
      }
    }

    const total = relevantShots.length;
    const perfectRate = total > 0 ? perfect / total : 0;
    const goodRate = total > 0 ? (perfect + good) / total : 0;
    const poorRate = total > 0 ? poor / total : 0;

    // Calculer le score
    // Score basé sur: perfect = 100pts, good = 70pts, moving = 0pts
    let score = 50; // Base
    score += perfectRate * 30;
    score += goodRate * 15;
    score -= poorRate * 20;

    // Bonus pour accuracy en counter-strafe
    const counterStrafedHits = relevantShots.filter((s) => s.isCounterStrafed && s.hit).length;
    const counterStrafedTotal = relevantShots.filter((s) => s.isCounterStrafed).length;
    if (counterStrafedTotal > 0) {
      const csAccuracy = counterStrafedHits / counterStrafedTotal;
      score += csAccuracy * 10;
    }

    return {
      attempts: total,
      perfect,
      good,
      poor,
      score: Math.max(0, Math.min(100, Math.round(score))),
      avgSpeedAtShot: total > 0 ? totalSpeed / total : 0,
    };
  }

  /**
   * Analyse de l'usage du crouch
   */
  private analyzeCrouchUsage(
    shots: AnalyzedShot[],
    kills: KillEventV2[],
    damages: DamageEventV2[]
  ): MovementAnalysis['crouchUsage'] {
    // Compter les kills en crouch vs debout
    const crouchShots = shots.filter((s) => s.isCrouching);
    const crouchHits = crouchShots.filter((s) => s.hit);
    const standingShots = shots.filter((s) => !s.isCrouching && !s.isAirborne);
    const standingHits = standingShots.filter((s) => s.hit);

    // Accuracy comparison
    const crouchAccuracy = crouchShots.length > 0 ? crouchHits.length / crouchShots.length : 0;
    const standingAccuracy =
      standingShots.length > 0 ? standingHits.length / standingShots.length : 0;

    // Kills en crouch (approximation basée sur les tirs)
    const crouchKills = kills.filter((k) => {
      // Chercher si le joueur était en crouch près du moment du kill
      const nearShots = shots.filter(
        (s) => Math.abs(s.tick - k.tick) < 10 && s.round === k.round
      );
      return nearShots.some((s) => s.isCrouching);
    }).length;

    // Crouch spray rate (tirs consécutifs en crouch)
    let crouchSpraySequences = 0;
    let consecutiveCrouchShots = 0;

    for (const shot of shots) {
      if (shot.isCrouching) {
        consecutiveCrouchShots++;
      } else {
        if (consecutiveCrouchShots >= 3) {
          crouchSpraySequences++;
        }
        consecutiveCrouchShots = 0;
      }
    }

    // Évaluer l'usage approprié du crouch
    // Bon: crouch pour spray control avec bonne accuracy
    // Mauvais: crouch dans des situations où ça réduit la mobilité
    const totalCrouchShots = crouchShots.length;
    const appropriateCrouch = crouchHits.length;
    const inappropriateCrouch = Math.max(
      0,
      totalCrouchShots - appropriateCrouch - Math.floor(totalCrouchShots * 0.3)
    );

    // Score
    let score = 50;
    if (crouchAccuracy > standingAccuracy * 1.1) {
      score += 20; // Bonus si le crouch améliore l'accuracy
    }
    if (totalCrouchShots > 0) {
      const appropriateRate = appropriateCrouch / totalCrouchShots;
      score += appropriateRate * 20;
    }
    score += crouchSpraySequences * 2; // Bonus pour spray control
    score -= inappropriateCrouch * 0.5; // Penalty pour crouch inapproprié

    return {
      crouchKills,
      crouchDeaths: 0, // Calculé ailleurs
      crouchSprayRate: shots.length > 0 ? crouchShots.length / shots.length : 0,
      appropriateCrouch,
      inappropriateCrouch,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse de la discipline au scope
   */
  private analyzeScopeDiscipline(
    shots: AnalyzedShot[],
    kills: KillEventV2[],
    fires: WeaponFireEvent[]
  ): MovementAnalysis['scopeDiscipline'] {
    // Filtrer les armes avec scope
    const scopeWeapons = ['awp', 'ssg08', 'scar20', 'g3sg1', 'aug', 'sg556'];
    const scopedShots = shots.filter((s) =>
      scopeWeapons.some((w) => s.weapon.includes(w))
    );

    if (scopedShots.length === 0) {
      return {
        scopedKills: 0,
        unscopedKills: 0,
        quickScopeRate: 0,
        hardScopeRate: 0,
        noScopeSuccess: 0,
        score: 50,
      };
    }

    const scopedFires = scopedShots.filter((s) => s.isScoped);
    const unscopedFires = scopedShots.filter((s) => !s.isScoped);

    // Kills scoped vs unscoped
    const sniperKills = kills.filter((k) =>
      scopeWeapons.some((w) => k.weapon.includes(w))
    );
    const scopedKillsCount = sniperKills.filter((k) => {
      const nearShots = scopedFires.filter(
        (s) => Math.abs(s.tick - k.tick) < 10 && s.round === k.round
      );
      return nearShots.length > 0;
    }).length;

    const unscopedKillsCount = sniperKills.length - scopedKillsCount;

    // Calculer les noscope success (kills sans scope)
    const noScopeHits = unscopedFires.filter((s) => s.hit);
    const noScopeSuccess = unscopedFires.length > 0 ? noScopeHits.length / unscopedFires.length : 0;

    // Estimer quick scope vs hard scope basé sur les patterns de tir
    // Quick scope: tir peu après le scope
    // Hard scope: tir après un long temps scoped
    let quickScopes = 0;
    let hardScopes = 0;

    // Analyser les séquences de tirs scopés
    for (let i = 0; i < scopedFires.length; i++) {
      const current = scopedFires[i];

      // Chercher le tir précédent pour estimer le temps scopé
      const prevShot = scopedFires[i - 1];
      if (prevShot && current.round === prevShot.round) {
        const timeSinceLast = (current.tick - prevShot.tick) / 128 * 1000; // ms

        if (timeSinceLast < CONFIG.QUICK_SCOPE_MAX) {
          quickScopes++;
        } else if (timeSinceLast > CONFIG.HARD_SCOPE_MIN) {
          hardScopes++;
        }
      } else {
        // Premier tir du round, considéré comme quick scope
        quickScopes++;
      }
    }

    const quickScopeRate =
      scopedFires.length > 0 ? quickScopes / scopedFires.length : 0;
    const hardScopeRate =
      scopedFires.length > 0 ? hardScopes / scopedFires.length : 0;

    // Score
    let score = 50;

    // Bonus pour quick scope accuracy
    const quickScopeHits = scopedFires.filter((s) => s.hit).length;
    const quickScopeAccuracy =
      scopedFires.length > 0 ? quickScopeHits / scopedFires.length : 0;
    score += quickScopeAccuracy * 25;

    // Bonus modéré pour noscope success
    score += noScopeSuccess * 15;

    // Balance entre quick et hard scope
    if (quickScopeRate > 0.5 && quickScopeAccuracy > 0.4) {
      score += 10;
    }

    return {
      scopedKills: scopedKillsCount,
      unscopedKills: unscopedKillsCount,
      quickScopeRate,
      hardScopeRate,
      noScopeSuccess,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse de l'usage des sauts
   */
  private analyzeJumpUsage(
    shots: AnalyzedShot[],
    kills: KillEventV2[]
  ): MovementAnalysis['jumpUsage'] {
    const jumpShots = shots.filter((s) => s.isAirborne);
    const jumpShotHits = jumpShots.filter((s) => s.hit);

    // Identifier les jump shots avec des armes appropriées (scout, noscope awp)
    const legitJumpWeapons = ['ssg08', 'deagle', 'r8revolver'];
    const legitJumpShots = jumpShots.filter((s) =>
      legitJumpWeapons.some((w) => s.weapon.includes(w))
    );

    // Jump peeks (approximation)
    // Un jump peek est quand le joueur saute pour voir au-dessus d'un obstacle
    // Difficile à détecter précisément, on approxime avec les kills en l'air
    const jumpPeeks = kills.filter((k) => {
      const nearShots = shots.filter(
        (s) => Math.abs(s.tick - k.tick) < 20 && s.round === k.round && s.isAirborne
      );
      return nearShots.length > 0;
    }).length;

    // Score
    let score = 50;

    // Jump shot accuracy
    const jumpShotAccuracy = jumpShots.length > 0 ? jumpShotHits.length / jumpShots.length : 0;

    // Bonus pour accuracy avec armes légitimes
    const legitHits = legitJumpShots.filter((s) => s.hit);
    const legitAccuracy = legitJumpShots.length > 0 ? legitHits.length / legitJumpShots.length : 0;
    score += legitAccuracy * 20;

    // Penalty pour trop de jump shots avec des armes inappropriées
    const badJumpShots = jumpShots.filter(
      (s) => !legitJumpWeapons.some((w) => s.weapon.includes(w))
    );
    const badJumpShotRate = shots.length > 0 ? badJumpShots.length / shots.length : 0;
    score -= badJumpShotRate * 30;

    // Bonus pour jump peeks efficaces
    score += Math.min(15, jumpPeeks * 3);

    return {
      jumpShots: jumpShots.length,
      jumpShotHits: jumpShotHits.length,
      jumpPeeks,
      bunnyHops: 0, // Difficile à détecter sans données de vélocité continues
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse de la discipline de marche (shift walk)
   */
  private analyzeWalkDiscipline(
    positions: PositionSnapshotV2[],
    kills: KillEventV2[],
    playerSteamId: string
  ): MovementAnalysis['walkDiscipline'] {
    if (positions.length === 0) {
      return {
        walkKills: 0,
        runningExposed: 0,
        silentApproaches: 0,
        noiseGiveaways: 0,
        score: 50,
      };
    }

    let walkingSnapshots = 0;
    let runningSnapshots = 0;

    for (const snapshot of positions) {
      const playerState = snapshot.players.find((p) => p.steamId === playerSteamId);
      if (!playerState) continue;

      if (playerState.isWalking) {
        walkingSnapshots++;
      } else if (playerState.speed > CONFIG.RUN_SPEED) {
        runningSnapshots++;
      }
    }

    // Estimer les kills en walk
    const walkKills = kills.filter((k) => {
      const nearSnapshot = positions.find(
        (p) =>
          Math.abs(p.tick - k.tick) < 64 &&
          p.players.some((pl) => pl.steamId === playerSteamId && pl.isWalking)
      );
      return nearSnapshot !== undefined;
    }).length;

    // Estimer les situations où le joueur a couru et s'est fait repérer
    // Approximation: mort peu après avoir couru
    const runningExposed = 0; // Difficile à calculer sans plus de contexte

    // Silent approaches: kills après avoir marché
    const silentApproaches = walkKills;

    // Score
    let score = 50;

    // Bonus pour walk kills (approches silencieuses réussies)
    score += Math.min(20, walkKills * 4);

    // Ratio walk/run (plus de walk = mieux pour la discipline)
    const totalMovement = walkingSnapshots + runningSnapshots;
    if (totalMovement > 0) {
      const walkRate = walkingSnapshots / totalMovement;
      score += walkRate * 15;
    }

    return {
      walkKills,
      runningExposed,
      silentApproaches,
      noiseGiveaways: 0,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  }

  /**
   * Analyse des patterns de strafe
   */
  private analyzeStrafePatterns(
    fires: WeaponFireEvent[]
  ): MovementAnalysis['strafePatterns'] {
    // Analyser les directions de mouvement entre les tirs
    let wideSwings = 0;
    let tightPeeks = 0;
    let jigglePeeks = 0;
    let adPattern = 0;

    for (let i = 1; i < fires.length; i++) {
      const prev = fires[i - 1];
      const current = fires[i];

      if (current.round !== prev.round) continue;

      const timeDiff = current.tick - prev.tick;
      if (timeDiff > 64) continue; // Ignorer les gaps trop longs

      const dx = current.position.x - prev.position.x;
      const dy = current.position.y - prev.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Classifier le type de mouvement
      if (distance > 200) {
        wideSwings++;
      } else if (distance < 50) {
        tightPeeks++;
      }

      // Détecter les jiggles (petits mouvements rapides)
      if (distance < 30 && timeDiff < 16) {
        jigglePeeks++;
      }

      // Détecter le pattern A-D
      const velocityChange = Math.abs(current.velocity.x - prev.velocity.x);
      if (velocityChange > 400) {
        adPattern++;
      }
    }

    return {
      adPattern,
      wideSwings,
      tightPeeks,
      jigglePeeks,
    };
  }

  /**
   * Calcule le score global de mouvement
   */
  private calculateOverallScore(
    counterStrafing: MovementAnalysis['counterStrafing'],
    crouchUsage: MovementAnalysis['crouchUsage'],
    scopeDiscipline: MovementAnalysis['scopeDiscipline'],
    jumpUsage: MovementAnalysis['jumpUsage'],
    walkDiscipline: MovementAnalysis['walkDiscipline']
  ): number {
    // Pondération des différents aspects
    const weights = {
      counterStrafing: 0.35, // Le plus important
      crouchUsage: 0.20,
      scopeDiscipline: 0.15,
      jumpUsage: 0.10,
      walkDiscipline: 0.20,
    };

    const score =
      counterStrafing.score * weights.counterStrafing +
      crouchUsage.score * weights.crouchUsage +
      scopeDiscipline.score * weights.scopeDiscipline +
      jumpUsage.score * weights.jumpUsage +
      walkDiscipline.score * weights.walkDiscipline;

    return Math.round(score);
  }

  /**
   * Construit les métriques agrégées
   */
  private buildMetrics(
    counterStrafing: MovementAnalysis['counterStrafing'],
    crouchUsage: MovementAnalysis['crouchUsage'],
    scopeDiscipline: MovementAnalysis['scopeDiscipline'],
    jumpUsage: MovementAnalysis['jumpUsage'],
    walkDiscipline: MovementAnalysis['walkDiscipline'],
    strafePatterns: MovementAnalysis['strafePatterns']
  ): Record<string, number> {
    return {
      // Counter-strafe
      counterStrafeScore: counterStrafing.score,
      counterStrafePerfectRate:
        counterStrafing.attempts > 0
          ? (counterStrafing.perfect / counterStrafing.attempts) * 100
          : 0,
      avgSpeedAtShot: counterStrafing.avgSpeedAtShot,

      // Crouch
      crouchScore: crouchUsage.score,
      crouchSprayRate: crouchUsage.crouchSprayRate * 100,

      // Scope
      scopeScore: scopeDiscipline.score,
      quickScopeRate: scopeDiscipline.quickScopeRate * 100,
      noScopeSuccess: scopeDiscipline.noScopeSuccess * 100,

      // Jump
      jumpScore: jumpUsage.score,
      jumpShotAccuracy:
        jumpUsage.jumpShots > 0
          ? (jumpUsage.jumpShotHits / jumpUsage.jumpShots) * 100
          : 0,

      // Walk
      walkScore: walkDiscipline.score,
      silentApproaches: walkDiscipline.silentApproaches,

      // Strafe patterns
      wideSwings: strafePatterns.wideSwings,
      jigglePeeks: strafePatterns.jigglePeeks,
    };
  }
}