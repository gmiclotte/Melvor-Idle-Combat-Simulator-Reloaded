/*  Melvor Idle Combat Simulator

    Copyright (C) <2020>  <Coolrox95>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/// <reference path="../typedefs.js" />

/** @type {CombatSimulator} */
let combatSimulator;

onmessage = (event) => {
  switch (event.data.action) {
    case 'RECEIVE_GAMEDATA':
      combatSimulator = new CombatSimulator(event.data);
      break;
    case 'START_SIMULATION':
      const startTime = performance.now();
      combatSimulator.simulateMonster(event.data.monsterStats, event.data.playerStats, event.data.simOptions.trials, event.data.simOptions.maxActions).then((simResult) => {
        const timeTaken = performance.now() - startTime;
        postMessage({ action: 'FINISHED_SIM', monsterID: event.data.monsterID, simResult: simResult, selfTime: timeTaken });
      });
      break;
    case 'CANCEL_SIMULATION':
      combatSimulator.cancelSimulation();
      break;
  }
};

class CombatSimulator {
  constructor(data) {
    /**
   * [playerType][enemyType]
   * 0:Melee 1:Ranged 2:Magic
   */
    this.combatTriangle = {
      normal: {
        damageModifier: [
          [1, 1.1, 0.9],
          [0.9, 1, 1.1],
          [1.1, 0.9, 1],
        ],
        reductionModifier: [
          [1, 1.25, 0.5],
          [0.95, 1, 1.25],
          [1.25, 0.85, 1],
        ],
      },
      hardcore: {
        damageModifier: [
          [1, 1.1, 0.8],
          [0.8, 1, 1.1],
          [1.1, 0.8, 1],
        ],
        reductionModifier: [
          [1, 1.25, 0.25],
          [0.75, 1, 1.25],
          [1.25, 0.75, 1],
        ],
      },
    };
    this.cancelStatus = false;
    this.protectFromValue = data.protectFromValue;
    this.numberMultiplier = data.numberMultiplier;
    this.enemySpecialAttacks = data.enemySpecialAttacks;
    this.enemySpawnTimer = data.enemySpawnTimer;
    this.hitpointRegenInterval = data.hitpointRegenInterval;
    this.deadeyeAmulet = data.deadeyeAmulet;
    this.confettiCrossbow = data.confettiCrossbow;
    this.warlockAmulet = data.warlockAmulet;
    this.CURSEIDS = data.CURSEIDS;
  }

  /**
   * Simulation Method for a single monster
   * @param {EnemyStats} enemyStats
   * @param {PlayerStats} playerStats
   * @param {number} trials
   * @param {number} maxActions
   * @return {Promise<Object>}
   */
  async simulateMonster(enemyStats, playerStats, trials, maxActions) {
    // Calculate Accuracy
    let playerAccuracy = this.calculateAccuracy(playerStats, enemyStats);
    let enemyAccuracy;
    // Set accuracy if using protection prayer
    if (playerStats.isProtected) {
      enemyAccuracy = 100 - this.protectFromValue;
    } else {
      enemyAccuracy = this.calculateAccuracy(enemyStats, playerStats);
    }
    let reductionModifier;
    let damageModifier;
    // Set Combat Triangle
    if (playerStats.hardcore) {
      reductionModifier = this.combatTriangle.hardcore.reductionModifier[playerStats.attackType][enemyStats.attackType];
      damageModifier = this.combatTriangle.hardcore.damageModifier[playerStats.attackType][enemyStats.attackType];
    } else {
      reductionModifier = this.combatTriangle.normal.reductionModifier[playerStats.attackType][enemyStats.attackType];
      damageModifier = this.combatTriangle.normal.damageModifier[playerStats.attackType][enemyStats.attackType];
    }
    // Multiply player special setDamage
    if (playerStats.specialData.setDamage) playerStats.specialData.setDamage *= this.numberMultiplier;
    // Multiply player max hit
    playerStats.maxHit = Math.floor(playerStats.maxHit * damageModifier);
    // Determine if player always hits for maxHit
    const alwaysMaxHit = playerStats.minHit + 1 >= playerStats.maxHit;
    // Start Monte Carlo simulation
    let enemyKills = 0;
    let xpToAdd = 0;

    let simSuccess = true;
    let damageToEnemy = 0;
    let damageToPlayer = 0;
    // Stats from the simulation
    const stats = {
      totalTime: 0,
      playerAttackCalls: 0,
      enemyAttackCalls: 0,
      damageTaken: 0,
      damageHealed: 0,
      totalCombatXP: 0,
      totalHpXP: 0,
      totalPrayerXP: 0,
      gpGainedFromDamage: 0,
      playerActions: 0,
      enemyActions: 0,
      /** @type {PetRolls} */
      petRolls: { Prayer: {}, other: {} },
      runesUsed: 0,
    };
    // Final Result from simulation
    /** @type {MonsterSimResult} */
    const simResult = {
      simSuccess: false,
      attacksMade: 0,
      avgHitDmg: 0,
      avgKillTime: 0,
      hpPerEnemy: 0,
      hpPerSecond: 0,
      dmgPerSecond: 0,
      xpPerEnemy: 0,
      xpPerHit: 0,
      xpPerSecond: 0,
      hpxpPerEnemy: 0,
      hpxpPerSecond: 0,
      killTimeS: 0,
      killsPerSecond: 0,
      prayerXpPerEnemy: 0,
      prayerXpPerSecond: 0,
      ppConsumedPerSecond: 0,
      gpFromDamage: 0,
      attacksTaken: 0,
      attacksTakenPerSecond: 0,
      attacksMadePerSecond: 0,
      petRolls: {},
    };

    // Variables for player and enemy to track status
    const player = {
      hitpoints: playerStats.levels.Hitpoints * this.numberMultiplier,
      isStunned: false,
      stunTurns: 0,
      doingSpecial: false,
      actionTimer: 0,
      isActing: false,
      attackTimer: 0,
      isAttacking: false,
      burnTimer: 0,
      isBurning: false,
      burnMaxCount: 10,
      burnCount: 0,
      burnDamage: 0,
      burnInterval: 500,
      currentSpeed: 0,
      reductionBuff: 0,
      damageReduction: Math.floor(playerStats.damageReduction * reductionModifier),
      attackCount: 0,
      countMax: 0,
      isSlowed: false,
      slowTurns: 0,
      actionsTaken: 0,
      canRecoil: true,
      isRecoiling: false,
      recoilTimer: 0,
    };
    const enemy = {
      hitpoints: enemyStats.hitpoints,
      isStunned: false,
      stunTurns: 0,
      doingSpecial: false,
      actionTimer: 0,
      isActing: false,
      attackTimer: 0,
      isAttacking: false,
      bleedTimer: 0,
      isBleeding: false,
      bleedMaxCount: 0,
      bleedInterval: 0,
      bleedCount: 0,
      bleedDamage: 0,
      isSlowed: false,
      slowTurns: 0,
      currentSpeed: 0,
      damageReduction: 0,
      reflectMelee: 0,
      specialID: null,
      attackCount: 0,
      countMax: 0,
      attackInterval: 0,
      isBuffed: false,
      buffTurns: 0,
      isCursed: false,
      curseTurns: 0,
      maxAttackRoll: enemyStats.maxAttackRoll,
      maxHit: enemyStats.maxHit,
      maxDefRoll: enemyStats.maxDefRoll,
      maxMagDefRoll: enemyStats.maxMagDefRoll,
      maxRngDefRoll: enemyStats.maxRngDefRoll,
      rangedEvasionDebuff: 1,
      meleeEvasionBuff: 1,
      magicEvasionBuff: 1,
      rangedEvasionBuff: 1,
      attackType: enemyStats.attackType,
      curse: {
        type: '',
        accuracyDebuff: 1,
        maxHitDebuff: 1,
        damageMult: 1,
        magicEvasionDebuff: 1,
        meleeEvasionDebuff: 1,
        rangedEvasionDebuff: 1,
        confusionMult: 0,
        decayDamage: 0,
      },
    };
    if (playerStats.canCurse) {
      this.setEnemyCurseValues(enemy, playerStats.curseID, playerStats.curseData.effectValue);
    }
    // Adjust ancient magick forcehit
    if (playerStats.usingAncient && playerStats.specialData.forceHit) {
      playerStats.specialData.forceHit = playerStats.maxAttackRoll > 20000;
    }
    // var enemyReflectDamage = 0; //Damage caused by reflect
    // Start simulation for each trial
    this.cancelStatus = false;
    while (enemyKills < trials && simSuccess) {
      // Check Cancellation every 250th trial
      if (enemyKills % 250 === 0 && await this.isCanceled()) {
        return simResult;
      }
      // Reset Timers and statuses
      player.hitpoints = 0;
      player.isStunned = false;
      player.stunTurns = 0;
      player.doingSpecial = false;
      player.actionTimer = playerStats.attackSpeed;
      player.isActing = true;
      player.isAttacking = false;
      player.isBurning = false;
      player.burnCount = 0;
      player.burnDamage = 0;
      player.currentSpeed = playerStats.attackSpeed - playerStats.attackSpeedDecrease;
      player.reductionBuff = 0;
      player.attackCount = 0;
      player.countMax = 0;
      player.isSlowed = false;
      player.slowTurns = 0;
      player.actionsTaken = 0;
      player.canRecoil = true;
      player.isRecoiling = false;
      player.recoilTimer = 0;

      enemy.hitpoints = enemyStats.hitpoints;
      enemy.isStunned = false;
      enemy.stunTurns = 0;
      enemy.doingSpecial = false;
      enemy.actionTimer = enemyStats.attackSpeed;
      enemy.isActing = true;
      enemy.isAttacking = false;
      enemy.isBleeding = false;
      enemy.bleedMaxCount = 0;
      enemy.bleedInterval = 0;
      enemy.bleedDamage = 0;
      enemy.bleedCount = 0;
      enemy.currentSpeed = enemyStats.attackSpeed;
      enemy.damageReduction = 0;
      enemy.reflectMelee = 0;
      enemy.attackCount = 0;
      enemy.countMax = 0;
      enemy.isBuffed = false;
      enemy.buffTurns = 0;
      enemy.attackInterval = 0;
      enemy.isSlowed = false;
      enemy.slowTurns = 0;
      enemy.isCursed = false;
      enemy.curseTurns = 0;
      enemy.maxAttackRoll = enemyStats.maxAttackRoll;
      enemy.maxHit = enemyStats.maxHit;
      enemy.maxDefRoll = enemyStats.maxDefRoll;
      enemy.maxMagDefRoll = enemyStats.maxMagDefRoll;
      enemy.maxRngDefRoll = enemyStats.maxRngDefRoll;
      enemy.rangedEvasionDebuff = 1;
      enemy.meleeEvasionBuff = 1;
      enemy.magicEvasionBuff = 1;
      enemy.rangedEvasionBuff = 1;

      // Simulate combat until enemy is dead or max actions has been reached
      let enemyAlive = true;
      while (enemyAlive) {
        if (player.actionsTaken > maxActions) {
          simSuccess = false;
          break;
        }
        // Determine the smallest timer:
        let timeStep = Infinity;
        if (player.isActing) timeStep = Math.min(timeStep, player.actionTimer);
        if (player.isAttacking) timeStep = Math.min(timeStep, player.attackTimer);
        if (player.isBurning) timeStep = Math.min(timeStep, player.burnTimer);
        if (player.isRecoiling) timeStep = Math.min(timeStep, player.recoilTimer);
        if (enemy.isActing) timeStep = Math.min(timeStep, enemy.actionTimer);
        if (enemy.isAttacking) timeStep = Math.min(timeStep, enemy.attackTimer);
        if (enemy.isBleeding) timeStep = Math.min(timeStep, enemy.bleedTimer);
        if (timeStep === 0) {
          throw Error('Error: Timestep zero.');
        }
        // Subtract from timers and perform their actions if necessary
        if (player.isActing) player.actionTimer -= timeStep;
        if (player.isAttacking) player.attackTimer -= timeStep;
        if (player.isBurning) player.burnTimer -= timeStep;
        if (player.isRecoiling) player.recoilTimer -= timeStep;
        if (enemy.isActing) enemy.actionTimer -= timeStep;
        if (enemy.isAttacking) enemy.attackTimer -= timeStep;
        if (enemy.isBleeding) enemy.bleedTimer -= timeStep;
        stats.totalTime += timeStep;
        // Perform actions for timers that have run out if applicable
        // Perform attack or special
        if (player.isActing && player.actionTimer <= 0 && enemyAlive) {
          stats.playerActions++;
          // Do player action
          if (player.isStunned) {
            damageToEnemy = 0;
            player.stunTurns--;
            if (player.stunTurns <= 0) {
              player.isStunned = false;
            }
            player.actionTimer = player.currentSpeed;
          } else {
            player.actionsTaken++;
            stats.playerAttackCalls++;
            if (playerStats.usingMagic) {
              stats.runesUsed += playerStats.runeCosts.spell * (1 - playerStats.runePreservation) + playerStats.runeCosts.aurora;
            }
            let specialAttack = false;
            if (playerStats.usingAncient) {
              specialAttack = true;
            } else if (playerStats.hasSpecialAttack) {
              // Roll for player special
              const specialRoll = Math.floor(Math.random() * 100);
              if (specialRoll <= playerStats.specialData.chance) {
                specialAttack = true;
              }
            }
            // Apply pre-attack special effects
            if (specialAttack && playerStats.specialData.decreasedRangedEvasion !== undefined) {
              enemy.rangedEvasionDebuff = 1 - playerStats.specialData.decreasedRangedEvasion / 100;
              this.setEvasionDebuffs(enemyStats, enemy);
              playerAccuracy = this.calculateAccuracy(playerStats, enemy);
            }
            // Apply curse
            if (playerStats.canCurse && !enemy.isCursed) {
              stats.runesUsed += playerStats.runeCosts.curse;
              const curseRoll = Math.random() * 100;
              if (playerStats.curseData.chance > curseRoll) {
                enemy.isCursed = true;
                enemy.curseTurns = 3;
                // Update the curses that change stats
                switch (enemy.curse.type) {
                  case 'Blinding':
                    enemy.maxAttackRoll = Math.floor(enemy.maxAttackRoll * enemy.curse.accuracyDebuff);
                    if (!playerStats.isProtected) {
                      enemyAccuracy = this.calculateAccuracy(enemy, playerStats);
                    }
                    break;
                  case 'Soul Split':
                  case 'Decay':
                    this.setEvasionDebuffs(enemyStats, enemy);
                    playerAccuracy = this.calculateAccuracy(playerStats, enemy);
                    break;
                  case 'Weakening':
                    enemy.maxHit = Math.floor(enemy.maxHit * enemy.curse.maxHitDebuff);
                    break;
                }
              }
            }
            // Attack parameters
            let canStun = false;
            let stunTurns = 0;
            damageToEnemy = 0;
            if (specialAttack) {
              // Does the attack hit?
              let attackHits = false;
              if (enemy.isStunned || playerStats.specialData.forceHit) {
                attackHits = true;
              } else {
                // Roll for hit
                let hitChance = Math.floor(Math.random() * 100);
                if (playerStats.diamondLuck) {
                  const hitChance2 = Math.floor(Math.random() * 100);
                  if (hitChance > hitChance2) hitChance = hitChance2;
                }
                if (playerAccuracy > hitChance) attackHits = true;
              }
              if (attackHits) {
                stats.petRolls.other[player.currentSpeed] = (stats.petRolls.other[player.currentSpeed] || 0) + 1;
                if (playerStats.specialData.setDamage) damageToEnemy = playerStats.specialData.setDamage * playerStats.specialData.damageMultiplier * damageModifier;
                else if (playerStats.specialData.maxHit) damageToEnemy = playerStats.maxHit * playerStats.specialData.damageMultiplier;
                else if (playerStats.specialData.stormsnap) damageToEnemy = (6 + 6 * playerStats.levels.Magic) * damageModifier;
                else {
                  if (alwaysMaxHit) {
                    damageToEnemy = playerStats.maxHit;
                  } else {
                    damageToEnemy = this.rollForDamage(playerStats);
                  }
                  damageToEnemy *= playerStats.specialData.damageMultiplier;
                }
                if (enemy.isCursed && enemy.curse.type === 'Anguish') damageToEnemy *= enemy.curse.damageMult;
                if (enemy.isStunned) {
                  damageToEnemy *= playerStats.specialData.stunDamageMultiplier;
                }
                if (playerStats.activeItems.deadeyeAmulet) {
                  damageToEnemy = this.rollForDeadeyeAmulet(damageToEnemy);
                }
                if (enemy.damageReduction > 0) damageToEnemy = Math.floor(damageToEnemy * (1 - (enemy.damageReduction / 100)));
                if (enemy.hitpoints < damageToEnemy) damageToEnemy = enemy.hitpoints;
                enemy.hitpoints -= Math.floor(damageToEnemy);
                if (playerStats.specialData.canBleed && !enemy.isBleeding) {
                  let applyBleed = false;
                  if (playerStats.specialData.bleedChance !== undefined) {
                    const bleedRoll = Math.random() * 100;
                    if (playerStats.specialData.bleedChance > bleedRoll) applyBleed = true;
                  } else {
                    applyBleed = true;
                  }
                  if (applyBleed) {
                    // Start bleed effect
                    enemy.isBleeding = true;
                    enemy.bleedMaxCount = playerStats.specialData.bleedCount;
                    enemy.bleedInterval = playerStats.specialData.bleedInterval;
                    enemy.bleedCount = 0;
                    enemy.bleedDamage = Math.floor(damageToEnemy * playerStats.specialData.totalBleedHP / enemy.bleedMaxCount);
                    enemy.bleedTimer = enemy.bleedInterval;
                  }
                }
                if (enemy.reflectMelee > 0) stats.damageTaken += enemy.reflectMelee * this.numberMultiplier;
                // Enemy Stun
                if (playerStats.specialData.stunChance !== undefined) {
                  const stunRoll = Math.random() * 100;
                  if (playerStats.specialData.stunChance > stunRoll) canStun = true;
                } else {
                  canStun = playerStats.specialData.canStun;
                }
                if (canStun) stunTurns = playerStats.specialData.stunTurns;
                if (playerStats.activeItems.fighterAmulet && damageToEnemy >= playerStats.maxHit * 0.70) {
                  canStun = true;
                  stunTurns = 1;
                }
                if (playerStats.activeItems.confettiCrossbow) {
                  // Add gp from this weapon
                  let gpMultiplier = playerStats.startingGP / 25000000;
                  if (gpMultiplier > this.confettiCrossbow.gpMultiplierCap) gpMultiplier = this.confettiCrossbow.gpMultiplierCap;
                  else if (gpMultiplier < this.confettiCrossbow.gpMultiplierMin) gpMultiplier = this.confettiCrossbow.gpMultiplierMin;
                  stats.gpGainedFromDamage += Math.floor(damageToEnemy * gpMultiplier);
                }
                if (playerStats.activeItems.warlockAmulet) stats.damageHealed += Math.floor(damageToEnemy * this.warlockAmulet.spellHeal);
                if (playerStats.lifesteal !== 0) stats.damageHealed += Math.floor(damageToEnemy * playerStats.lifesteal / 100);
                if (playerStats.specialData.healsFor > 0) stats.damageHealed += Math.floor(damageToEnemy * playerStats.specialData.healsFor);
                // Enemy Slow
                if (playerStats.specialData.attackSpeedDebuff && !enemy.isSlowed) {
                  enemy.isSlowed = true;
                  enemy.slowTurns = playerStats.specialData.attackSpeedDebuffTurns;
                  enemy.currentSpeed = Math.floor(enemyStats.attackSpeed * (1 + playerStats.specialData.attackSpeedDebuff / 100));
                }
              }
              // Multiple hit determination
              if (playerStats.specialData.attackCount > 1) {
                player.attackCount = 1;
                player.countMax = playerStats.specialData.attackCount;
                player.isActing = false;
                player.isAttacking = true;
                player.attackTimer = playerStats.specialData.attackInterval;
              } else {
                player.actionTimer = player.currentSpeed;
              }
            } else {
              // Perform a normal attack
              // Does the Attack Hit?
              let attackHits = false;
              if (enemy.isStunned) {
                attackHits = true;
              } else {
                // Roll for hit
                let hitChance = Math.floor(Math.random() * 100);
                if (playerStats.diamondLuck) {
                  const hitChance2 = Math.floor(Math.random() * 100);
                  if (hitChance > hitChance2) hitChance = hitChance2;
                }
                if (playerAccuracy > hitChance) attackHits = true;
              }
              if (attackHits) {
                stats.petRolls.other[player.currentSpeed] = (stats.petRolls.other[player.currentSpeed] || 0) + 1;
                // Calculate attack Damage
                if (alwaysMaxHit) {
                  damageToEnemy = playerStats.maxHit;
                } else {
                  damageToEnemy = this.rollForDamage(playerStats);
                }
                if (enemy.isCursed && enemy.curse.type === 'Anguish') damageToEnemy *= enemy.curse.damageMult;
                if (playerStats.activeItems.deadeyeAmulet) {
                  damageToEnemy = this.rollForDeadeyeAmulet(damageToEnemy);
                }
                if (enemy.damageReduction > 0) damageToEnemy = Math.floor(damageToEnemy * (1 - (enemy.damageReduction / 100)));
                if (enemy.hitpoints < damageToEnemy) damageToEnemy = enemy.hitpoints;
                enemy.hitpoints -= Math.floor(damageToEnemy);
                if (enemy.reflectMelee > 0) stats.damageTaken += enemy.reflectMelee * this.numberMultiplier;
                if (playerStats.activeItems.fighterAmulet && damageToEnemy >= playerStats.maxHit * 0.70) {
                  canStun = true;
                  stunTurns = 1;
                }
                if (playerStats.activeItems.confettiCrossbow) {
                  // Add gp from this weapon
                  let gpMultiplier = playerStats.startingGP / 25000000;
                  if (gpMultiplier > this.confettiCrossbow.gpMultiplierCap) gpMultiplier = this.confettiCrossbow.gpMultiplierCap;
                  else if (gpMultiplier < this.confettiCrossbow.gpMultiplierMin) gpMultiplier = this.confettiCrossbow.gpMultiplierMin;
                  stats.gpGainedFromDamage += Math.floor(damageToEnemy * gpMultiplier);
                }
                if (playerStats.activeItems.warlockAmulet) stats.damageHealed += Math.floor(damageToEnemy * this.warlockAmulet.spellHeal);
                if (playerStats.lifesteal !== 0) stats.damageHealed += Math.floor(damageToEnemy * playerStats.lifesteal / 100);
              }
              player.actionTimer = player.currentSpeed;
            }
            // XP Tracking
            if (damageToEnemy > 0) {
              xpToAdd = damageToEnemy / this.numberMultiplier * 4;
              if (xpToAdd < 4) xpToAdd = 4;
              stats.totalHpXP += damageToEnemy / this.numberMultiplier * 1.33;
              stats.totalPrayerXP += damageToEnemy * playerStats.prayerXpPerDamage;
              stats.totalCombatXP += xpToAdd;
              if (playerStats.prayerXpPerDamage > 0) {
                stats.petRolls.Prayer[player.currentSpeed] = (stats.petRolls.Prayer[player.currentSpeed] || 0) + 1;
              }
            }
            // Apply Stun
            if (canStun && !enemy.isStunned) {
              enemy.isStunned = true;
              enemy.stunTurns = stunTurns;
              enemy.isAttacking = false;
              enemy.actionTimer = enemy.currentSpeed;
              enemy.isActing = true;
            }
            // Player Slow Tracking
            if (player.isSlowed) {
              player.slowTurns--;
              if (player.slowTurns <= 0) {
                player.isSlowed = false;
                player.currentSpeed = playerStats.attackSpeed - playerStats.attackSpeedDecrease;
              }
            }
            if (!player.isAttacking && enemy.hitpoints <= 0) enemyAlive = false;
          }
        }
        // Perform next attack of a multi attack special
        if (player.isAttacking && player.attackTimer <= 0 && enemyAlive) {
          // Do player multi attacks
          stats.playerAttackCalls++;
          // Apply pre-attack special effects
          if (playerStats.specialData.decreasedRangedEvasion !== undefined) {
            enemy.rangedEvasionDebuff = 1 - playerStats.specialData.decreasedRangedEvasion / 100;
            this.setEvasionDebuffs(enemyStats, enemy);
            playerAccuracy = this.calculateAccuracy(playerStats, enemy);
          }
          // Apply curse
          if (playerStats.canCurse && !enemy.isCursed) {
            stats.runesUsed += playerStats.runeCosts.curse;
            const curseRoll = Math.random() * 100;
            if (playerStats.curseData.chance > curseRoll) {
              enemy.isCursed = true;
              enemy.curseTurns = 3;
              // Update the curses that change stats
              switch (enemy.curse.type) {
                case 'Blinding':
                  enemy.maxAttackRoll = Math.floor(enemy.maxAttackRoll * enemy.curse.accuracyDebuff);
                  if (!playerStats.isProtected) {
                    enemyAccuracy = this.calculateAccuracy(enemy, playerStats);
                  }
                  break;
                case 'Soul Split':
                case 'Decay':
                  this.setEvasionDebuffs(enemyStats, enemy);
                  playerAccuracy = this.calculateAccuracy(playerStats, enemy);
                  break;
                case 'Weakening':
                  enemy.maxHit = Math.floor(enemy.maxHit * enemy.curse.maxHitDebuff);
                  break;
              }
            }
          }
          // Attack parameters
          let canStun = false;
          let stunTurns = 0;
          damageToEnemy = 0;
          // Does the attack hit?
          let attackHits = false;
          if (enemy.isStunned || playerStats.specialData.forceHit) {
            attackHits = true;
          } else {
            // Roll for hit
            let hitChance = Math.floor(Math.random() * 100);
            if (playerStats.diamondLuck) {
              const hitChance2 = Math.floor(Math.random() * 100);
              if (hitChance > hitChance2) hitChance = hitChance2;
            }
            if (playerAccuracy > hitChance) attackHits = true;
          }
          if (attackHits) {
            stats.petRolls.other[player.currentSpeed] = (stats.petRolls.other[player.currentSpeed] || 0) + 1;
            if (playerStats.specialData.setDamage) damageToEnemy = playerStats.specialData.setDamage * playerStats.specialData.damageMultiplier * damageModifier;
            else if (playerStats.specialData.maxHit) damageToEnemy = playerStats.maxHit * playerStats.specialData.damageMultiplier;
            else if (playerStats.specialData.stormsnap) damageToEnemy = (6 + 6 * playerStats.levels.Magic) * damageModifier;
            else {
              if (alwaysMaxHit) {
                damageToEnemy = playerStats.maxHit;
              } else {
                damageToEnemy = this.rollForDamage(playerStats);
              }
              damageToEnemy *= playerStats.specialData.damageMultiplier;
            }
            if (enemy.isCursed && enemy.curse.type === 'Anguish') damageToEnemy *= enemy.curse.damageMult;
            if (playerStats.activeItems.deadeyeAmulet) {
              damageToEnemy = this.rollForDeadeyeAmulet(damageToEnemy);
            }
            if (enemy.damageReduction > 0) damageToEnemy = Math.floor(damageToEnemy * (1 - (enemy.damageReduction / 100)));
            if (enemy.hitpoints < damageToEnemy) damageToEnemy = enemy.hitpoints;
            enemy.hitpoints -= Math.floor(damageToEnemy);

            if (playerStats.specialData.canBleed && !enemy.isBleeding) {
              let applyBleed = false;
              if (playerStats.specialData.bleedChance !== undefined) {
                const bleedRoll = Math.random() * 100;
                if (playerStats.specialData.bleedChance > bleedRoll) applyBleed = true;
              } else {
                applyBleed = true;
              }
              if (applyBleed) {
                // Start bleed effect
                enemy.isBleeding = true;
                enemy.bleedMaxCount = playerStats.specialData.bleedCount;
                enemy.bleedInterval = playerStats.specialData.bleedInterval;
                enemy.bleedCount = 0;
                enemy.bleedDamage = Math.floor(damageToEnemy * playerStats.specialData.totalBleedHP / enemy.bleedMaxCount);
                enemy.bleedTimer = enemy.bleedInterval;
              }
            }
            if (enemy.reflectMelee > 0) stats.damageTaken += enemy.reflectMelee * this.numberMultiplier;
            // Enemy Stun
            if (playerStats.specialData.stunChance !== undefined) {
              const stunRoll = Math.random() * 100;
              if (playerStats.specialData.stunChance > stunRoll) canStun = true;
            } else {
              canStun = playerStats.specialData.canStun;
            }
            if (canStun) stunTurns = playerStats.specialData.stunTurns;
            if (playerStats.activeItems.fighterAmulet && damageToEnemy >= playerStats.maxHit * 0.70) {
              canStun = true;
              stunTurns = 1;
            }
            if (playerStats.activeItems.confettiCrossbow) {
              // Add gp from this weapon
              let gpMultiplier = playerStats.startingGP / 25000000;
              if (gpMultiplier > this.confettiCrossbow.gpMultiplierCap) gpMultiplier = this.confettiCrossbow.gpMultiplierCap;
              else if (gpMultiplier < this.confettiCrossbow.gpMultiplierMin) gpMultiplier = this.confettiCrossbow.gpMultiplierMin;
              stats.gpGainedFromDamage += Math.floor(damageToEnemy * gpMultiplier);
            }
            if (playerStats.activeItems.warlockAmulet) stats.damageHealed += Math.floor(damageToEnemy * this.warlockAmulet.spellHeal);
            if (playerStats.lifesteal !== 0) stats.damageHealed += Math.floor(damageToEnemy * playerStats.lifesteal / 100);
            if (playerStats.specialData.healsFor > 0) stats.damageHealed += Math.floor(damageToEnemy * playerStats.specialData.healsFor);
            // Enemy Slow
            if (playerStats.specialData.attackSpeedDebuff && !enemy.isSlowed) {
              enemy.isSlowed = true;
              enemy.slowTurns = playerStats.specialData.attackSpeedDebuffTurns;
              enemy.currentSpeed = Math.floor(enemyStats.attackSpeed * (1 + playerStats.specialData.attackSpeedDebuff / 100));
            }
          }
          // XP Tracking
          if (damageToEnemy > 0) {
            xpToAdd = damageToEnemy / this.numberMultiplier * 4;
            if (xpToAdd < 4) xpToAdd = 4;
            stats.totalHpXP += damageToEnemy / this.numberMultiplier * 1.33;
            stats.totalPrayerXP += damageToEnemy * playerStats.prayerXpPerDamage;
            stats.totalCombatXP += xpToAdd;
            if (playerStats.prayerXpPerDamage > 0) {
              stats.petRolls.Prayer[player.currentSpeed] = (stats.petRolls.Prayer[player.currentSpeed] || 0) + 1;
            }
          }
          // Apply Stun
          if (canStun && !enemy.isStunned) {
            enemy.isStunned = true;
            enemy.stunTurns = stunTurns;
            enemy.isAttacking = false;
            enemy.actionTimer = enemy.currentSpeed;
            enemy.isActing = true;
          }
          // Player Slow Tracking
          if (player.isSlowed) {
            player.slowTurns--;
            if (player.slowTurns <= 0) {
              player.isSlowed = false;
              player.currentSpeed = playerStats.attackSpeed - playerStats.attackSpeedDecrease;
            }
          }
          // Track attacks and determine next action
          player.attackCount++;
          if (player.attackCount >= player.countMax) {
            player.isAttacking = false;
            player.isActing = true;
            player.actionTimer = player.currentSpeed;
          } else {
            player.attackTimer = playerStats.specialData.attackInterval;
          }
          if (enemy.hitpoints <= 0) enemyAlive = false;
        }
        if (player.isBurning && player.burnTimer <= 0 && enemyAlive) {
          // Do player burn damage
          if (player.burnCount >= player.burnMaxCount) {
            player.isBurning = false;
          } else {
            stats.damageTaken += player.burnDamage;
            player.burnCount++;
          }
          player.burnTimer = player.burnInterval;
        }
        if (player.isRecoiling && player.recoilTimer <= 0 && enemyAlive) {
          player.canRecoil = true;
          player.isRecoiling = false;
        }
        // Perform enemy attack or special
        if (enemy.isActing && enemy.actionTimer <= 0 && enemyAlive) {
          stats.enemyActions++;
          // Do enemy action
          if (enemy.isStunned) {
            enemy.stunTurns--;
            if (enemy.stunTurns <= 0) {
              enemy.isStunned = false;
            }
            enemy.actionTimer = enemy.currentSpeed;
          } else {
            stats.enemyAttackCalls++;
            // Check if doing special
            let specialAttack = false;
            if (enemyStats.hasSpecialAttack) {
              const chanceForSpec = Math.floor(Math.random() * 100);
              let specCount = 0;
              for (let i = 0; i < enemyStats.specialLength; i++) {
                if (chanceForSpec <= enemyStats.specialAttackChances[i] + specCount) {
                  enemy.specialID = enemyStats.specialIDs[i];
                  enemy.doingSpecial = true;
                  specialAttack = true;
                  break;
                }
                specCount += enemyStats.specialAttackChances[i];
              }
            }
            // Attack Parameters
            if (specialAttack) {
              // Do Enemy Special
              const currentSpecial = this.enemySpecialAttacks[enemy.specialID];
              // Activate Buffs
              if (currentSpecial.activeBuffs && !enemy.isBuffed) {
                enemy.isBuffed = true;
                if (currentSpecial.activeBuffTurns !== null && currentSpecial.activeBuffTurns !== undefined) enemy.buffTurns = currentSpecial.activeBuffTurns;
                else enemy.buffTurns = currentSpecial.attackCount;
                // Set evasion buffs
                enemy.meleeEvasionBuff = 1 + currentSpecial.increasedMeleeEvasion / 100;
                enemy.rangedEvasionBuff = 1 + currentSpecial.increasedRangedEvasion / 100;
                enemy.magicEvasionBuff = 1 + currentSpecial.increasedMagicEvasion / 100;
                enemy.reflectMelee = currentSpecial.reflectMelee;
                enemy.damageReduction = currentSpecial.increasedDamageReduction;
                // Modify Player Accuracy according to buff
                this.setEvasionDebuffs(enemyStats, enemy);
                playerAccuracy = this.calculateAccuracy(playerStats, enemy);
              }
              // Apply Player Slow
              if (currentSpecial.attackSpeedDebuff && !player.isSlowed) {
                // Modify current player speed
                player.isSlowed = true;
                player.currentSpeed = Math.floor(playerStats.attackSpeed * (1 + currentSpecial.attackSpeedDebuff / 100)) - playerStats.attackSpeedDecrease;
                player.slowTurns = currentSpecial.attackSpeedDebuffTurns;
              }
              // Do the first hit
              let attackHits = false;
              if (player.isStunned || currentSpecial.forceHit) {
                attackHits = true;
              } else {
                // Roll for hit
                const hitChance = Math.floor(Math.random() * 100);
                if (enemyAccuracy > hitChance) attackHits = true;
              }
              if (attackHits) {
                if (currentSpecial.setDamage !== null) {
                  damageToPlayer = currentSpecial.setDamage * this.numberMultiplier;
                } else {
                  damageToPlayer = Math.floor(Math.random() * enemy.maxHit) + 1;
                }
                if (player.isStunned) damageToPlayer *= currentSpecial.stunDamageMultiplier;
                damageToPlayer -= Math.floor(player.damageReduction / 100 * damageToPlayer);
                stats.damageTaken += damageToPlayer;
                if (playerStats.activeItems.goldSapphireRing && player.canRecoil) {
                  const reflectDamage = Math.floor(Math.random() * 3 * this.numberMultiplier);
                  if (enemy.hitpoints > reflectDamage) {
                    enemy.hitpoints -= reflectDamage;
                    player.canRecoil = false;
                    player.isRecoiling = true;
                    player.recoilTimer = 2000;
                  }
                }
                if (enemy.isCursed && enemy.curse.type === 'Confusion') {
                  enemy.hitpoints -= Math.floor(enemy.hitpoints * enemy.curse.confusionMult);
                }
                if (playerStats.activeItems.guardianAmulet && player.reductionBuff < 12) { };
                // Apply Stun
                if (currentSpecial.canStun && !player.isStunned) {
                  player.isStunned = true;
                  player.stunTurns = currentSpecial.stunTurns;
                  player.isAttacking = false;
                  player.isActing = true;
                  player.actionTimer = player.currentSpeed;
                }
                // Apply Burning
                if (currentSpecial.burnDebuff > 0 && !player.isBurning) {
                  player.isBurning = true;
                  player.burnCount = 0;
                  player.burnDamage = Math.floor((playerStats.levels.Hitpoints * this.numberMultiplier * (currentSpecial.burnDebuff / 100)) / player.burnMaxCount);
                  player.burnTimer = player.burnInterval;
                }
              }
              // Set up subsequent hits if required
              const isDOT = currentSpecial.setDOTDamage !== null;
              const maxCount = isDOT ? currentSpecial.DOTMaxProcs : currentSpecial.attackCount;
              if (maxCount > 1) {
                enemy.attackCount = 1;
                enemy.countMax = maxCount;
                enemy.isActing = false;
                enemy.isAttacking = true;
                enemy.attackInterval = isDOT ? currentSpecial.DOTInterval : currentSpecial.attackInterval;
                enemy.attackTimer = enemy.attackInterval;
              } else {
                enemy.actionTimer = enemy.currentSpeed;
              }
            } else {
              // Do Enemy Normal Attack
              let attackHits = false;
              if (player.isStunned) {
                attackHits = true;
              } else {
                // Roll for hit
                const hitChance = Math.floor(Math.random() * 100);
                if (enemyAccuracy > hitChance) attackHits = true;
              }
              if (attackHits) {
                let damageToPlayer = Math.floor(Math.random() * enemy.maxHit) + 1;
                damageToPlayer -= Math.floor(player.damageReduction / 100 * damageToPlayer);
                stats.damageTaken += damageToPlayer;
                if (playerStats.activeItems.goldSapphireRing && player.canRecoil) {
                  const reflectDamage = Math.floor(Math.random() * 3 * this.numberMultiplier);
                  if (enemy.hitpoints > reflectDamage) {
                    enemy.hitpoints -= reflectDamage;
                    player.canRecoil = false;
                    player.isRecoiling = true;
                    player.recoilTimer = 2000;
                  }
                }
                if (enemy.isCursed && enemy.curse.type === 'Confusion') {
                  enemy.hitpoints -= Math.floor(enemy.hitpoints * enemy.curse.confusionMult);
                }
                if (playerStats.activeItems.guardianAmulet && player.reductionBuff < 12) {
                  player.reductionBuff += 2;
                  player.damageReduction = Math.floor((playerStats.damageReduction + player.reductionBuff) * reductionModifier);
                }
              }
              enemy.actionTimer = enemy.currentSpeed;
            }
            // Buff tracking
            if (enemy.isBuffed) {
              enemy.buffTurns--;
              if (enemy.buffTurns <= 0) {
                enemy.isBuffed = false;
                // Undo buffs
                this.setEvasionDebuffs(enemyStats, enemy);
                playerAccuracy = this.calculateAccuracy(playerStats, enemy);
                enemy.reflectMelee = 0;
                enemy.damageReduction = 0;
              }
            }
            // Slow Tracking
            if (enemy.isSlowed) {
              enemy.slowTurns--;
              if (enemy.slowTurns <= 0) {
                enemy.isSlowed = false;
                enemy.currentSpeed = enemyStats.attackSpeed;
              }
            }
            // Curse Tracking
            if (enemy.isCursed) {
              // Apply decay
              if (enemy.curse.type === 'Decay') enemy.hitpoints -= enemy.curse.decayDamage;
              enemy.curseTurns--;
              if (enemy.curseTurns <= 0) {
                enemy.isCursed = false;
                // Undo curse stat changes
                switch (enemy.curse.type) {
                  case 'Blinding':
                    enemy.maxAttackRoll = enemyStats.maxAttackRoll;
                    if (!playerStats.isProtected) {
                      enemyAccuracy = this.calculateAccuracy(enemy, playerStats);
                    }
                    break;
                  case 'Soul Split':
                  case 'Decay':
                    this.setEvasionDebuffs(enemyStats, enemy);
                    playerAccuracy = this.calculateAccuracy(playerStats, enemy);
                    break;
                  case 'Weakening':
                    enemy.maxHit = enemyStats.maxHit;
                    break;
                }
              }
            }
          }
        }
        // Perform next enemy attack of a multi attack special
        if (enemy.isAttacking && enemy.attackTimer <= 0 && enemyAlive) {
          // Do enemy multi attacks
          stats.enemyAttackCalls++;
          // Do Enemy Special
          // Activate Buffs
          const currentSpecial = this.enemySpecialAttacks[enemy.specialID];
          if (currentSpecial.activeBuffs && !enemy.isBuffed) {
            enemy.isBuffed = true;
            if (currentSpecial.activeBuffTurns !== null && currentSpecial.activeBuffTurns !== undefined) enemy.buffTurns = currentSpecial.activeBuffTurns;
            else enemy.buffTurns = currentSpecial.attackCount;
            // Set evasion buffs
            enemy.meleeEvasionBuff = 1 + currentSpecial.increasedMeleeEvasion / 100;
            enemy.rangedEvasionBuff = 1 + currentSpecial.increasedRangedEvasion / 100;
            enemy.magicEvasionBuff = 1 + currentSpecial.increasedMagicEvasion / 100;
            enemy.reflectMelee = currentSpecial.reflectMelee;
            enemy.damageReduction = currentSpecial.increasedDamageReduction;
            // Modify Player Accuracy according to buff
            this.setEvasionDebuffs(enemyStats, enemy);
            playerAccuracy = this.calculateAccuracy(playerStats, enemy);
          }
          // Apply Player Slow
          if (currentSpecial.attackSpeedDebuff && !player.isSlowed) {
            // Modify current player speed
            player.isSlowed = true;
            player.currentSpeed = Math.floor(playerStats.attackSpeed * (1 + currentSpecial.attackSpeedDebuff / 100)) - playerStats.attackSpeedDecrease;
            player.slowTurns = currentSpecial.attackSpeedDebuffTurns;
          }
          // Do the first hit
          let attackHits = false;
          if (player.isStunned || currentSpecial.forceHit) {
            attackHits = true;
          } else {
            // Roll for hit
            const hitChance = Math.floor(Math.random() * 100);
            if (enemyAccuracy > hitChance) attackHits = true;
          }
          if (attackHits) {
            if (currentSpecial.setDamage !== null) {
              damageToPlayer = currentSpecial.setDamage * this.numberMultiplier;
            } else {
              damageToPlayer = Math.floor(Math.random() * enemy.maxHit) + 1;
            }
            if (player.isStunned) damageToPlayer *= currentSpecial.stunDamageMultiplier;
            damageToPlayer -= Math.floor(player.damageReduction / 100 * damageToPlayer);
            stats.damageTaken += damageToPlayer;
            if (playerStats.activeItems.goldSapphireRing && player.canRecoil) {
              const reflectDamage = Math.floor(Math.random() * 3 * this.numberMultiplier);
              if (enemy.hitpoints > reflectDamage) {
                enemy.hitpoints -= reflectDamage;
                player.canRecoil = false;
                player.isRecoiling = true;
                player.recoilTimer = 2000;
              }
            }
            if (enemy.isCursed && enemy.curse.type === 'Confusion') {
              enemy.hitpoints -= Math.floor(enemy.hitpoints * enemy.curse.confusionMult);
            }
            if (playerStats.activeItems.guardianAmulet && player.reductionBuff < 12) {
              player.reductionBuff += 2;
              player.damageReduction = Math.floor((playerStats.damageReduction + player.reductionBuff) * reductionModifier);
            }
            // Apply Stun
            if (currentSpecial.canStun && !player.isStunned) {
              player.isStunned = true;
              player.stunTurns = currentSpecial.stunTurns;
              player.isAttacking = false;
              player.isActing = true;
              player.actionTimer = player.currentSpeed;
            }
            // Apply Burning
            if (currentSpecial.burnDebuff > 0 && !player.isBurning) {
              player.isBurning = true;
              player.burnCount = 0;
              player.burnDamage = Math.floor((playerStats.maxHitpoints * (currentSpecial.burnDebuff / 100)) / player.burnMaxCount);
              player.burnTimer = player.burnInterval;
            }
          }
          // Buff tracking
          if (enemy.isBuffed) {
            enemy.buffTurns--;
            if (enemy.buffTurns <= 0) {
              enemy.isBuffed = false;
              // Undo buffs
              this.setEvasionDebuffs(enemyStats, enemy);
              playerAccuracy = this.calculateAccuracy(playerStats, enemy);
              enemy.reflectMelee = 0;
              enemy.damageReduction = 0;
            }
          }
          // Slow Tracking
          if (enemy.isSlowed) {
            enemy.slowTurns--;
            if (enemy.slowTurns <= 0) {
              enemy.isSlowed = false;
              enemy.currentSpeed = enemyStats.attackSpeed;
            }
          }
          // Curse Tracking
          if (enemy.isCursed) {
            // Apply decay
            if (enemy.curse.type === 'Decay') enemy.hitpoints -= enemy.curse.decayDamage;
            enemy.curseTurns--;
            if (enemy.curseTurns <= 0) {
              enemy.isCursed = false;
              // Undo curse stat changes
              switch (enemy.curse.type) {
                case 'Blinding':
                  enemy.maxAttackRoll = enemyStats.maxAttackRoll;
                  if (!playerStats.isProtected) {
                    enemyAccuracy = this.calculateAccuracy(enemy, playerStats);
                  }
                  break;
                case 'Soul Split':
                case 'Decay':
                  this.setEvasionDebuffs(enemyStats, enemy);
                  playerAccuracy = this.calculateAccuracy(playerStats, enemy);
                  break;
                case 'Weakening':
                  enemy.maxHit = enemyStats.maxHit;
                  break;
              }
            }
          }
          // Track attacks and determine next action
          enemy.attackCount++;
          if (enemy.attackCount >= enemy.countMax) {
            enemy.isAttacking = false;
            enemy.isActing = true;
            enemy.actionTimer = enemy.currentSpeed;
          } else {
            enemy.attackTimer = enemy.attackInterval;
          }
        }
        if (enemy.isBleeding && enemy.bleedTimer <= 0 && enemyAlive) {
          // Do enemy bleed damage
          if (enemy.bleedCount >= enemy.bleedMaxCount) {
            enemy.isBleeding = false;
          } else if (enemy.hitpoints > 0) {
            enemy.hitpoints -= enemy.bleedDamage;
            enemy.bleedCount++;
          }
          enemy.bleedTimer = enemy.bleedInterval;
          if (enemy.hitpoints <= 0) enemyAlive = false;
        }
      }
      if (isNaN(enemy.hitpoints)) {
        simSuccess = false;
      } else {
        enemyKills++;
      }
    }
    // Compute stats from simulation
    // Need to package this inside an object and send the result back to main script
    simResult.simSuccess = simSuccess;
    if (simSuccess) {
      // Apply XP Bonuses
      // Ring bonus
      stats.totalCombatXP += stats.totalCombatXP * playerStats.xpBonus;
      stats.totalHpXP += stats.totalHpXP * playerStats.xpBonus;
      stats.totalPrayerXP += stats.totalPrayerXP * playerStats.xpBonus;
      // Global XP Bonus
      stats.totalCombatXP *= playerStats.globalXPMult;
      stats.totalHpXP *= playerStats.globalXPMult;
      stats.totalPrayerXP *= playerStats.globalXPMult;
      // Tabulate Simulation results
      simResult.attacksMade = stats.playerAttackCalls / trials;
      simResult.avgHitDmg = enemyStats.hitpoints * trials / stats.playerAttackCalls;
      simResult.avgKillTime = this.enemySpawnTimer + stats.totalTime / trials;
      simResult.hpPerEnemy = (stats.damageTaken - stats.damageHealed) / trials - simResult.avgKillTime / this.hitpointRegenInterval * playerStats.avgHPRegen;
      if (simResult.hpPerEnemy < 0) simResult.hpPerEnemy = 0;
      simResult.hpPerSecond = simResult.hpPerEnemy / simResult.avgKillTime * 1000;
      simResult.dmgPerSecond = enemyStats.hitpoints / simResult.avgKillTime * 1000;
      simResult.xpPerEnemy = stats.totalCombatXP / trials;
      simResult.xpPerHit = stats.totalCombatXP / stats.playerAttackCalls;
      simResult.xpPerSecond = stats.totalCombatXP / trials / simResult.avgKillTime * 1000;
      simResult.hpxpPerEnemy = stats.totalHpXP / trials;
      simResult.hpxpPerSecond = stats.totalHpXP / trials / simResult.avgKillTime * 1000;
      simResult.killTimeS = simResult.avgKillTime / 1000;
      simResult.killsPerSecond = 1 / simResult.killTimeS;
      simResult.prayerXpPerEnemy = stats.totalPrayerXP / trials;
      simResult.prayerXpPerSecond = stats.totalPrayerXP / trials / simResult.avgKillTime * 1000;
      simResult.ppConsumedPerSecond = (stats.playerAttackCalls * playerStats.prayerPointsPerAttack + stats.enemyAttackCalls * playerStats.prayerPointsPerEnemy) / trials / simResult.killTimeS + playerStats.prayerPointsPerHeal / this.hitpointRegenInterval * 1000;
      simResult.gpFromDamage = stats.gpGainedFromDamage / trials;
      simResult.attacksTaken = stats.enemyAttackCalls / trials;
      simResult.attacksTakenPerSecond = stats.enemyAttackCalls / trials / simResult.killTimeS;
      simResult.attacksMadePerSecond = stats.playerAttackCalls / trials / simResult.killTimeS;
      simResult.runesUsedPerSecond = stats.runesUsed / trials / simResult.killTimeS;

      // Throw pet rolls in here to be further processed later
      Object.keys(stats.petRolls).forEach((petType) =>
        simResult.petRolls[petType] = Object.keys(stats.petRolls[petType]).map((attackSpeed) => ({
          speed: parseInt(attackSpeed),
          rollsPerSecond: stats.petRolls[petType][attackSpeed] / trials / simResult.killTimeS,
        })));
    }
    return simResult;
  };

  /**
    * Computes the accuracy of attacker vs target
    * @param {Object} attacker
    * @param {number} attacker.attackType Attack Type Melee:0, Ranged:1, Magic:2
    * @param {number} attacker.maxAttackRoll Accuracy Rating
    * @param {Object} target
    * @param {number} target.maxDefRoll Melee Evasion Rating
    * @param {number} target.maxRngDefRoll Ranged Evasion Rating
    * @param {number} target.maxMagDefRoll Magic Evasion Rating
    * @return {number}
    */
  calculateAccuracy(attacker, target) {
    let targetDefRoll = 0;
    if (attacker.attackType === 0) {
      targetDefRoll = target.maxDefRoll;
    } else if (attacker.attackType === 1) {
      targetDefRoll = target.maxRngDefRoll;
    } else {
      targetDefRoll = target.maxMagDefRoll;
    }
    let accuracy = 0;
    if (attacker.maxAttackRoll < targetDefRoll) {
      accuracy = (0.5 * attacker.maxAttackRoll / targetDefRoll) * 100;
    } else {
      accuracy = (1 - 0.5 * targetDefRoll / attacker.maxAttackRoll) * 100;
    }
    return accuracy;
  }

  /**
   * Modifies the stats of the enemy by the curse
   * @param {Object} enemy
   * @param {number} curseID
   * @param {number|number[]} effectValue
   */
  setEnemyCurseValues(enemy, curseID, effectValue) {
    switch (curseID) {
      case this.CURSEIDS.Blinding_I:
      case this.CURSEIDS.Blinding_II:
      case this.CURSEIDS.Blinding_III:
        enemy.curse.accuracyDebuff = 1 - effectValue / 100;
        enemy.curse.type = 'Blinding';
        break;
      case this.CURSEIDS.Soul_Split_I:
      case this.CURSEIDS.Soul_Split_II:
      case this.CURSEIDS.Soul_Split_III:
        enemy.curse.magicEvasionDebuff = 1 - effectValue / 100;
        enemy.curse.type = 'Soul Split';
        break;
      case this.CURSEIDS.Weakening_I:
      case this.CURSEIDS.Weakening_II:
      case this.CURSEIDS.Weakening_III:
        enemy.curse.maxHitDebuff = 1 - effectValue / 100;
        enemy.curse.type = 'Weakening';
        break;
      case this.CURSEIDS.Anguish_I:
      case this.CURSEIDS.Anguish_II:
      case this.CURSEIDS.Anguish_III:
        enemy.curse.damageMult = 1 + effectValue / 100;
        enemy.curse.type = 'Anguish';
        break;
      case this.CURSEIDS.Decay:
        enemy.curse.meleeEvasionDebuff = 1 - effectValue[1] / 100;
        enemy.curse.magicEvasionDebuff = 1 - effectValue[1] / 100;
        enemy.curse.rangedEvasionDebuff = 1 - effectValue[1] / 100;
        enemy.curse.decayDamage = Math.floor(enemy.hitpoints * effectValue[0] / 100);
        enemy.curse.type = 'Decay';
        break;
      case this.CURSEIDS.Confusion:
        enemy.curse.confusionMult = effectValue / 100;
        enemy.curse.type = 'Confusion';
        break;
    }
  }

  /**
   * Rolls for damage for a regular attack
   * @param {playerStats} playerStats
   * @returns {number} damage
   */
  rollForDamage(playerStats) {
    return Math.ceil(Math.random() * (playerStats.maxHit - playerStats.minHit)) + playerStats.minHit;
  }

  /**
   * Rolls for a chance of Deadeye Amulet's crit damage
   * @param {damageToEnemy} damageToEnemy
   * @returns {number} `damageToEnemy`, possibly multiplied by Deadeye Amulet's crit bonus
   */
  rollForDeadeyeAmulet(damageToEnemy) {
    const chance = Math.random() * 100;
    if (chance < this.deadeyeAmulet.chanceToCrit) {
      damageToEnemy = Math.floor(damageToEnemy * this.deadeyeAmulet.critDamage);
    }
    return damageToEnemy;
  }

  /**
   * Modifies the stats of the enemy by the curse
   * @param {enemyStats} enemyStats
   * @param {Object} enemy
   */
  setEvasionDebuffs(enemyStats, enemy) {
    enemy.maxDefRoll = enemyStats.maxDefRoll;
    enemy.maxMagDefRoll = enemyStats.maxMagDefRoll;
    enemy.maxRngDefRoll = enemyStats.maxRngDefRoll;
    if (enemy.rangedEvasionDebuff !== 1) {
      enemy.maxRngDefRoll = Math.floor(enemy.maxRngDefRoll * enemy.rangedEvasionDebuff);
    }
    if (enemy.isBuffed) {
      enemy.maxDefRoll = Math.floor(enemy.maxDefRoll * enemy.meleeEvasionBuff);
      enemy.maxMagDefRoll = Math.floor(enemy.maxMagDefRoll * enemy.magicEvasionBuff);
      enemy.maxRngDefRoll = Math.floor(enemy.maxRngDefRoll * enemy.rangedEvasionBuff);
    }
    if (enemy.isCursed && (enemy.curse.type === 'Decay' || enemy.curse.type === 'Soul Split')) {
      enemy.maxDefRoll = Math.floor(enemy.maxDefRoll * enemy.curse.meleeEvasionDebuff);
      enemy.maxMagDefRoll = Math.floor(enemy.maxMagDefRoll * enemy.curse.magicEvasionDebuff);
      enemy.maxRngDefRoll = Math.floor(enemy.maxRngDefRoll * enemy.curse.rangedEvasionDebuff);
    }
  }

  /**
   * Checks if the simulation has been messaged to be cancelled
   * @return {Promise<boolean>}
   */
  async isCanceled() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.cancelStatus);
      });
    });
  }

  cancelSimulation() {
    this.cancelStatus = true;
  }
}
