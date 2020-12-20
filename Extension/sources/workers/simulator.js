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

(() => {

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
                    postMessage({
                        action: 'FINISHED_SIM',
                        monsterID: event.data.monsterID,
                        simResult: simResult,
                        selfTime: timeTaken
                    });
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

        log = console.log;

        /**
         * Simulation Method for a single monster
         * @param {EnemyStats} enemyStats
         * @param {PlayerStats} playerStats
         * @param {number} trials
         * @param {number} maxActions
         * @return {Promise<Object>}
         */
        async simulateMonster(enemyStats, playerStats, trials, maxActions) {
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

            // Start Monte Carlo simulation
            let enemyKills = 0;

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
                petRolls: {Prayer: {}, other: {}},
                runesUsed: 0,
            };

            // Adjust ancient magick forcehit
            if (playerStats.usingAncient && playerStats.specialData.forceHit) {
                playerStats.specialData.forceHit = playerStats.maxAttackRoll > 20000;
            }
            // var enemyReflectDamage = 0; //Damage caused by reflect
            // Start simulation for each trial
            this.cancelStatus = false;
            // list of possible timed actions
            const timedActions = [
                {
                    is: 'isActing',
                    timer: 'actionTimer',
                    player: this.playerAction,
                    enemy: this.enemyAction,
                },
                {
                    is: 'isAttacking',
                    timer: 'attackTimer',
                    player: this.playerContinueAction,
                    enemy: this.enemyContinueAction,
                },
                {
                    is: 'isBurning',
                    timer: 'burnTimer',
                    both: this.actorBurn,
                },
                {
                    is: 'isRecoiling',
                    timer: 'recoilTimer',
                    both: this.actorRecoil,
                },
                {
                    is: 'isBleeding',
                    timer: 'bleedTimer',
                    both: this.actorBleed,
                },
            ];
            while (enemyKills < trials) {
                // Check Cancellation every 250th trial
                if (enemyKills % 250 === 0 && await this.isCanceled()) {
                    return {simSuccess: false};
                }
                // Reset Timers and statuses
                const player = this.resetPlayer(playerStats, enemyStats, reductionModifier, damageModifier);
                const enemy = this.resetEnemy(playerStats, enemyStats);
                if (playerStats.canCurse) {
                    this.setEnemyCurseValues(enemy, playerStats.curseID, playerStats.curseData.effectValue);
                }

                // Simulate combat until enemy is dead or max actions has been reached
                let enemyAlive = true;
                while (enemyAlive) {
                    // check player action limit
                    if (player.actionsTaken > maxActions) {
                        return {simSuccess: false};
                    }

                    // Determine the time step
                    let timeStep = Infinity;
                    [player, enemy].forEach(actor => {
                        timedActions.forEach(action => {
                            if (actor[action.is]) {
                                timeStep = Math.min(timeStep, actor[action.timer]);
                            }
                        });
                    });
                    // throw error on invalid time step
                    if (timeStep <= 0) {
                        throw Error('Error: Timestep ' + timeStep);
                    }
                    // combat time tracker
                    stats.totalTime += timeStep;

                    // Process time step
                    [player, enemy].forEach(actor => {
                        timedActions.forEach(action => {
                            if (actor[action.is]) {
                                actor[action.timer] -= timeStep;
                            }
                        });
                    });

                    // process actions
                    [player, enemy].forEach(actor => {
                        timedActions.forEach(action => {
                            const initialHP = enemy.hitpoints;
                            if (!actor[action.is] || actor[action.timer] > 0 || !enemyAlive) {
                                // do not perform this action
                                return;
                            }
                            // get the method to apply
                            let method = action.both;
                            if (method === undefined) {
                                method = actor.isPlayer ? action.player : action.enemy;
                            }
                            // apply the method
                            // TODO: why are these methods part of this class anyway
                            if (action.both === undefined) {
                                method.call(this, stats, player, playerStats, enemy, enemyStats);
                            } else {
                                method.call(this, actor);
                            }
                            // update enemy status
                            // TODO: we need this check to ensure the player.isActing hack works
                            if (initialHP !== enemy.hitpoints) {
                                enemyAlive = enemy.hitpoints > 0;
                            }
                            // TODO: do we really need this hack, i.e. do we keep multi-attacking for one hit, even though the enemy is dead
                            if (actor.isPlayer && action.is === 'isActing' && player.isAttacking) {
                                enemyAlive = true;
                            }
                        });
                    });

                    // update damage taken
                    stats.damageTaken -= player.hitpoints;
                    player.hitpoints = 0;
                }
                if (isNaN(enemy.hitpoints)) {
                    this.log('Failed enemy simulation: ', enemyStats, enemy);
                    return {simSuccess: false};
                } else {
                    enemyKills++;
                }
            }


            // Apply XP Bonuses
            // Ring bonus
            stats.totalCombatXP += stats.totalCombatXP * playerStats.xpBonus;
            stats.totalHpXP += stats.totalHpXP * playerStats.xpBonus;
            stats.totalPrayerXP += stats.totalPrayerXP * playerStats.xpBonus;
            // Global XP Bonus
            stats.totalCombatXP *= playerStats.globalXPMult;
            stats.totalHpXP *= playerStats.globalXPMult;
            stats.totalPrayerXP *= playerStats.globalXPMult;

            // Final Result from simulation
            return this.simulationResult(stats, playerStats, enemyStats, trials);
        };

        actorRecoil(actor) {
            actor.canRecoil = true;
            actor.isRecoiling = false;
        }

        actorBurn(actor) {
            // reset timer
            actor.burnTimer = actor.burnInterval;
            // Check if stopped burning
            if (actor.burnCount >= actor.burnMaxCount) {
                actor.isBurning = false;
                return;
            }
            // Apply burn damage
            actor.hitPoints -= actor.burnDamage;
            actor.burnCount++;
        }

        actorBleed(actor) {
            // reset timer
            actor.bleedTimer = actor.bleedInterval;
            // Check if stopped bleeding
            if (actor.bleedCount >= actor.bleedMaxCount) {
                actor.isBleeding = false;
                return;
            }
            // Apply bleed damage
            actor.hitpoints -= actor.bleedDamage;
            actor.bleedCount++;
        }

        enemyAction(stats, player, playerStats, enemy, enemyStats) {
            stats.enemyActions++;
            // Do enemy action
            if (this.skipsTurn(enemy)) {
                return;
            }
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
            this.enemyDoAttack(player, playerStats, enemy, enemyStats, specialAttack);
            this.enemyPostAttack(player, playerStats, enemy, enemyStats);
        }

        enemyContinueAction(stats, player, playerStats, enemy, enemyStats) {
            // Do enemy multi attacks
            stats.enemyAttackCalls++;
            this.enemyDoAttack(player, playerStats, enemy, enemyStats, true);
            this.enemyPostAttack(player, playerStats, enemy, enemyStats);
        }

        canNotDodge(target) {
            return target.isStunned || target.sleep;
        }

        applyStatus(statusEffect, damage, target, targetStats) {
            ////////////
            // turned //
            ////////////
            // Apply Stun
            if (statusEffect.canStun && !target.isStunned) {
                target.isStunned = true;
                target.stunTurns = statusEffect.stunTurns;
                target.isAttacking = false;
                target.isActing = true;
                target.actionTimer = target.currentSpeed;
            }
            // Apply Sleep
            if (statusEffect.canSleep && !target.sleep) {
                target.sleep = true;
                target.sleepTurns = statusEffect.sleepTurns;
            }
            // Apply Slow
            if (statusEffect.isSlowed) {
                target.isSlowed = true;
                target.slowTurns = statusEffect.attackSpeedDebuffTurns;
                target.currentSpeed = Math.floor(targetStats.attackSpeed * (1 + statusEffect.attackSpeedDebuff / 100));
            }
            ///////////
            // timed //
            ///////////
            // Apply Burning
            if (statusEffect.burnDebuff > 0 && !target.isBurning) {
                target.isBurning = true;
                target.burnCount = 0;
                target.burnDamage = Math.floor((targetStats.levels.Hitpoints * this.numberMultiplier * (statusEffect.burnDebuff / 100)) / target.burnMaxCount);
                target.burnTimer = target.burnInterval;
            }
            // Apply Bleeding
            if (statusEffect.canBleed && !target.isBleeding) {
                target.isBleeding = true;
                target.bleedMaxCount = playerStats.specialData.bleedCount;
                target.bleedInterval = playerStats.specialData.bleedInterval;
                target.bleedCount = 0;
                target.bleedDamage = Math.floor(damage * statusEffect.totalBleedHP / target.bleedMaxCount);
                target.bleedTimer = target.bleedInterval;
            }
        }

        enemyDoAttack(player, playerStats, enemy, enemyStats, isSpecial) {
            let forceHit = false;
            let currentSpecial;
            if (isSpecial) {
                // Do Enemy Special
                currentSpecial = this.enemySpecialAttacks[enemy.specialID];
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
                    player.accuracy = this.calculateAccuracy(playerStats, enemy);
                }
                // Apply Player Slow
                if (currentSpecial.attackSpeedDebuff && !player.isSlowed) {
                    // Modify current player speed
                    player.isSlowed = true;
                    player.currentSpeed = Math.floor(playerStats.attackSpeed * (1 + currentSpecial.attackSpeedDebuff / 100)) - playerStats.attackSpeedDecrease;
                    player.slowTurns = currentSpecial.attackSpeedDebuffTurns;
                }
                forceHit = currentSpecial.forceHit;
            }
            // Do the first hit
            let attackHits;
            if (this.canNotDodge(player) || forceHit) {
                attackHits = true;
            } else {
                // Roll for hit
                const hitChance = Math.floor(Math.random() * 100);
                attackHits = enemy.accuracy > hitChance;
            }

            if (attackHits) {
                //////////////////
                // apply damage //
                //////////////////
                const damage = this.enemyCalculateDamage(enemy, player, isSpecial, currentSpecial);
                player.hitpoints -= damage;
                //////////////////
                // side effects //
                //////////////////
                // player recoil
                if (playerStats.activeItems.goldSapphireRing && player.canRecoil) {
                    const reflectDamage = Math.floor(Math.random() * 3 * this.numberMultiplier);
                    if (enemy.hitpoints > reflectDamage) {
                        enemy.hitpoints -= reflectDamage;
                        player.canRecoil = false;
                        player.isRecoiling = true;
                        player.recoilTimer = 2000;
                    }
                }
                // confusion curse
                if (enemy.isCursed && enemy.curse.type === 'Confusion') {
                    enemy.hitpoints -= Math.floor(enemy.hitpoints * enemy.curse.confusionMult);
                }
                // guardian amulet
                if (playerStats.activeItems.guardianAmulet && player.reductionBuff < 12) {
                    player.reductionBuff += 2;
                    player.damageReduction = Math.floor((playerStats.damageReduction + player.reductionBuff) * reductionModifier);
                }
                // status effects
                if(isSpecial) {
                    this.applyStatus(currentSpecial, damage, player, playerStats)
                }
            }
            // set up timer for next attack
            if (isSpecial && enemy.isAttacking) {
                // handle multi-attack
                // Track attacks and determine next action
                enemy.attackCount++;
                if (enemy.attackCount >= enemy.countMax) {
                    enemy.isAttacking = false;
                    enemy.isActing = true;
                    enemy.actionTimer = enemy.currentSpeed;
                } else {
                    enemy.attackTimer = enemy.attackInterval;
                }
            } else if (isSpecial) {
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
                enemy.actionTimer = enemy.currentSpeed;
            }
        }

        enemyPostAttack(player, playerStats, enemy, enemyStats) {
            // Buff tracking
            if (enemy.isBuffed) {
                enemy.buffTurns--;
                if (enemy.buffTurns <= 0) {
                    enemy.isBuffed = false;
                    // Undo buffs
                    this.setEvasionDebuffs(enemyStats, enemy);
                    player.accuracy= this.calculateAccuracy(playerStats, enemy);
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
                this.enemyCurseUpdate(player, enemy, enemyStats);
            }
        }

        enemyCurseUpdate(player, enemy, enemyStats) {
            // Apply decay
            if (enemy.curse.type === 'Decay') {
                enemy.hitpoints -= enemy.curse.decayDamage;
            }
            // reduce remaining curse turns
            enemy.curseTurns--;
            if (enemy.curseTurns > 0) {
                return;
            }
            // no curse turns remaining, revert stat changes
            enemy.isCursed = false;
            switch (enemy.curse.type) {
                case 'Blinding':
                    enemy.maxAttackRoll = enemyStats.maxAttackRoll;
                    if (!playerStats.isProtected) {
                        enemy.accuracy = this.calculateAccuracy(enemy, playerStats);
                    }
                    break;
                case 'Soul Split':
                case 'Decay':
                    this.setEvasionDebuffs(enemyStats, enemy);
                    player.accuracy = this.calculateAccuracy(playerStats, enemy);
                    break;
                case 'Weakening':
                    enemy.maxHit = enemyStats.maxHit;
                    break;
            }
        }

        skipsTurn(actor) {
            // reduce stun
            if (actor.isStunned) {
                actor.stunTurns--;
                if (actor.stunTurns <= 0) {
                    actor.isStunned = false;
                }
                actor.actionTimer = actor.currentSpeed;
                return true
            }
            // reduce sleep
            if (actor.sleep) {
                actor.sleepTurns--;
                if (actor.sleepTurns <= 0) {
                    actor.sleep = false;
                    actor.sleepTurns = 0;
                }
                actor.actionTimer = actor.currentSpeed;
                return true
            }
        }

        playerAction(stats, player, playerStats, enemy, enemyStats) {
            // player action: reduce stun count or attack
            stats.playerActions++;
            if (this.skipsTurn(player)) {
                return;
            }
            // attack
            player.actionsTaken++;
            // track rune usage
            if (playerStats.usingMagic) {
                stats.runesUsed += playerStats.runeCosts.spell * (1 - playerStats.runePreservation) + playerStats.runeCosts.aurora;
            }
            // determine special or normal attack
            let specialAttack = playerStats.usingAncient;
            if (!specialAttack && playerStats.hasSpecialAttack) {
                // Roll for player special
                const specialRoll = Math.floor(Math.random() * 100);
                if (specialRoll <= playerStats.specialData.chance) {
                    specialAttack = true;
                }
            }
            // do normal or special attack
            const attackResult = this.playerDoAttack(stats, player, playerStats, enemy, enemyStats, specialAttack)
            this.processPlayerAttackResult(attackResult, stats, player, playerStats, enemy, enemyStats);
            this.playerUpdateActionTimer(player, playerStats, specialAttack);
        }

        playerContinueAction(stats, player, playerStats, enemy, enemyStats) {
            // perform continued attack
            const attackResult = this.playerDoAttack(stats, player, playerStats, enemy, enemyStats,true);
            this.processPlayerAttackResult(attackResult, stats, player, playerStats, enemy, enemyStats);
            this.playerUpdateActionTimer(player, playerStats, false);
        }

        processPlayerAttackResult(attackResult, stats, player, playerStats, enemy, enemyStats) {
            if (!attackResult.attackHits) {
                // attack missed, nothing to do
                return;
            }
            // damage
            enemy.hitpoints -= Math.floor(attackResult.damageToEnemy);
            // XP Tracking
            if (attackResult.damageToEnemy > 0) {
                let xpToAdd = attackResult.damageToEnemy / this.numberMultiplier * 4;
                if (xpToAdd < 4) {
                    xpToAdd = 4;
                }
                stats.totalHpXP += attackResult.damageToEnemy / this.numberMultiplier * 1.33;
                stats.totalPrayerXP += attackResult.damageToEnemy * playerStats.prayerXpPerDamage;
                stats.totalCombatXP += xpToAdd;
                if (playerStats.prayerXpPerDamage > 0) {
                    stats.petRolls.Prayer[player.currentSpeed] = (stats.petRolls.Prayer[player.currentSpeed] || 0) + 1;
                }
            }
            if (attackResult.isSpecial) {
                this.applyStatus(attackResult.statusEffect, attackResult.damageToEnemy, enemy, enemyStats)
            }
        }

        playerUsePreAttackSpecial(player, playerStats, enemy, enemyStats) {
            if (playerStats.specialData.decreasedRangedEvasion !== undefined) {
                enemy.rangedEvasionDebuff = 1 - playerStats.specialData.decreasedRangedEvasion / 100;
                this.setEvasionDebuffs(enemyStats, enemy);
                player.accuracy= this.calculateAccuracy(playerStats, enemy);
            }
        }

        playerUpdateActionTimer(player, playerStats, specialAttack) {
            // Player Slow Tracking
            if (player.isSlowed) {
                player.slowTurns--;
                if (player.slowTurns <= 0) {
                    player.isSlowed = false;
                    player.currentSpeed = playerStats.attackSpeed - playerStats.attackSpeedDecrease;
                }
            }
            player.actionTimer = player.currentSpeed;
            // process ongoing multi-attack
            if (player.isAttacking) {
                // Track attacks and determine next action
                player.attackCount++;
                if (player.attackCount >= player.countMax) {
                    player.isAttacking = false;
                    player.isActing = true;
                } else {
                    player.attackTimer = playerStats.specialData.attackInterval;
                }
                return;
            }
            // trigger multi attack
            if (specialAttack && playerStats.specialData.attackCount > 1) {
                player.attackCount = 1;
                player.countMax = playerStats.specialData.attackCount;
                player.isActing = false;
                player.isAttacking = true;
                player.attackTimer = playerStats.specialData.attackInterval;
            }
        }

        playerUseCurse(stats, player, playerStats, enemy, enemyStats) {
            if (!playerStats.canCurse || enemy.isCursed) {
                return;
            }
            stats.runesUsed += playerStats.runeCosts.curse;
            const curseRoll = Math.random() * 100;
            if (playerStats.curseData.chance <= curseRoll) {
                return;
            }
            enemy.isCursed = true;
            enemy.curseTurns = 3;
            // Update the curses that change stats
            switch (enemy.curse.type) {
                case 'Blinding':
                    enemy.maxAttackRoll = Math.floor(enemy.maxAttackRoll * enemy.curse.accuracyDebuff);
                    if (!playerStats.isProtected) {
                        enemy.accuracy = this.calculateAccuracy(enemy, playerStats);
                    }
                    break;
                case 'Soul Split':
                case 'Decay':
                    this.setEvasionDebuffs(enemyStats, enemy);
                    player.accuracy = this.calculateAccuracy(playerStats, enemy);
                    break;
                case 'Weakening':
                    enemy.maxHit = Math.floor(enemy.maxHit * enemy.curse.maxHitDebuff);
                    break;
            }
        }

        playerDoAttack(stats, player, playerStats, enemy, enemyStats, isSpecial) {
            stats.playerAttackCalls++;
            // Apply pre-attack special effects
            this.playerUsePreAttackSpecial(player, playerStats, enemy, enemyStats);
            // Apply curse
            this.playerUseCurse(stats, player, playerStats, enemy, enemyStats);
            // default return values
            const attackResult = {
                attackHits: false,
                isSpecial: isSpecial,
                statusEffect: {},
            };
            // Check for guaranteed hit
            let attackHits = enemy.isStunned || (isSpecial && playerStats.specialData.forceHit);
            if (!attackHits) {
                // Roll for hit
                let hitChance = Math.floor(Math.random() * 100);
                if (playerStats.diamondLuck) {
                    const hitChance2 = Math.floor(Math.random() * 100);
                    if (hitChance > hitChance2) hitChance = hitChance2;
                }
                if (player.accuracy> hitChance) attackHits = true;
            }
            if (!attackHits) {
                // exit early
                return attackResult;
            }
            // roll for pets
            stats.petRolls.other[player.currentSpeed] = (stats.petRolls.other[player.currentSpeed] || 0) + 1;
            // calculate damage
            attackResult.damageToEnemy = this.playerCalculateDamage(player, playerStats, enemy, isSpecial);

            // healing special
            if (isSpecial && playerStats.specialData.healsFor > 0) {
                stats.damageHealed += Math.floor(attackResult.damageToEnemy * playerStats.specialData.healsFor);
            }
            // reflect melee damage
            if (enemy.reflectMelee > 0) {
                player.hitpoints -= enemy.reflectMelee * this.numberMultiplier;
            }

            ////////////////////
            // status effects //
            ////////////////////
            let statusEffect = {}
            // Bleed
            if (isSpecial && playerStats.specialData.canBleed && !enemy.isBleeding) {
                statusEffect.canBleed = true;
                if (playerStats.specialData.bleedChance !== undefined) {
                    const bleedRoll = Math.random() * 100;
                    statusEffect.canBleed = playerStats.specialData.bleedChance > bleedRoll;
                }
            }
            // Stun
            if (isSpecial) {
                statusEffect.canStun = playerStats.specialData.canStun;
                if (playerStats.specialData.stunChance !== undefined) {
                    const stunRoll = Math.random() * 100;
                    statusEffect.canStun = playerStats.specialData.stunChance > stunRoll;
                }
                if (statusEffect.canStun) {
                    statusEffect.stunTurns = playerStats.specialData.stunTurns;
                }
            }
            if (playerStats.activeItems.fighterAmulet && attackResult.damageToEnemy >= playerStats.maxHit * 0.70) {
                statusEffect.canStun = true;
                statusEffect.stunTurns = 1;
            }
            // Sleep
            if (isSpecial && playerStats.specialData.canSleep) {
                statusEffect.canSleep = true;
                statusEffect.sleepTurns = playerStats.specialData.sleepTurns;
            }
            // lifesteal
            if (playerStats.activeItems.warlockAmulet) {
                stats.damageHealed += Math.floor(attackResult.damageToEnemy * this.warlockAmulet.spellHeal);
            }
            if (playerStats.lifesteal !== 0) {
                stats.damageHealed += Math.floor(attackResult.damageToEnemy * playerStats.lifesteal / 100);
            }
            // slow
            if (isSpecial && playerStats.specialData.attackSpeedDebuff && !enemy.isSlowed) {
                statusEffect.isSlowed = true;
                statusEffect.slowTurns = playerStats.specialData.attackSpeedDebuffTurns;
            }

            // confetti crossbow
            if (playerStats.activeItems.confettiCrossbow) {
                // Add gp from this weapon
                let gpMultiplier = playerStats.startingGP / 25000000;
                if (gpMultiplier > this.confettiCrossbow.gpMultiplierCap) {
                    gpMultiplier = this.confettiCrossbow.gpMultiplierCap;
                } else if (gpMultiplier < this.confettiCrossbow.gpMultiplierMin) {
                    gpMultiplier = this.confettiCrossbow.gpMultiplierMin;
                }
                stats.gpGainedFromDamage += Math.floor(damageToEnemy * gpMultiplier);
            }

            // return the result of the attack
            attackResult.attackHits = true;
            attackResult.statusEffect = statusEffect;
            return attackResult;
        }

        enemyCalculateDamage(actor, target, isSpecial, special) {
            let damage;
            if (isSpecial && special.setDamage !== null) {
                damage = special.setDamage * this.numberMultiplier;
            } else {
                damage = Math.floor(Math.random() * actor.maxHit) + 1;
            }
            return damage * this.damageModifiers(actor, target, isSpecial, special);
        }

        damageModifiers(actor, target, isSpecial, special) {
            let modifier = 1;
            if (isSpecial && !actor.isAttacking && target.isStunned) {
                modifier *= special.stunDamageMultiplier;
            }
            if (isSpecial && !actor.isAttacking && target.sleep) {
                modifier *= special.sleepDamageMultiplier;
            }
            modifier *= (1 - (target.damageReduction / 100))
            return modifier;
        }

        playerCalculateDamage(player, playerStats, enemy, isSpecial) {
            let damageToEnemy;
            // Calculate attack Damage
            if (isSpecial && playerStats.specialData.setDamage) {
                damageToEnemy = playerStats.specialData.setDamage * playerStats.specialData.damageMultiplier * player.damageModifier;
            } else if (isSpecial && playerStats.specialData.maxHit) {
                damageToEnemy = playerStats.maxHit * playerStats.specialData.damageMultiplier;
            } else if (isSpecial && playerStats.specialData.stormsnap) {
                damageToEnemy = (6 + 6 * playerStats.levels.Magic) * player.damageModifier;
            } else {
                if (player.alwaysMaxHit) {
                    damageToEnemy = playerStats.maxHit;
                } else {
                    damageToEnemy = this.rollForDamage(playerStats);
                }
                if (isSpecial) {
                    damageToEnemy *= playerStats.specialData.damageMultiplier;
                }
            }
            // player specific modifiers
            if (enemy.isCursed && enemy.curse.type === 'Anguish') {
                damageToEnemy *= enemy.curse.damageMult;
            }
            if (playerStats.activeItems.deadeyeAmulet) {
                damageToEnemy *= this.critDamageModifier(damageToEnemy);
            }
            // common modifiers
            damageToEnemy *= this.damageModifiers(player, enemy, isSpecial, playerStats.specialData)
            // cap damage, no overkill
            if (enemy.hitpoints < damageToEnemy) {
                damageToEnemy = enemy.hitpoints;
            }
            return damageToEnemy;
        }

        commonStats(attackSpeed) {
            return {
                // action
                doingSpecial: false,
                isActing: true,
                attackTimer: 0,
                isAttacking: false,
                // action speed
                actionTimer: attackSpeed,
                currentSpeed: attackSpeed,
                // stun
                isStunned: false,
                stunTurns: 0,
                // sleep
                sleep: false,
                sleepTurns: 0,
                // bleed
                bleedTimer: 0,
                isBleeding: false,
                bleedMaxCount: 0,
                bleedInterval: 0,
                bleedCount: 0,
                bleedDamage: 0,
                // burn
                burnTimer: 0,
                isBurning: false,
                burnMaxCount: 10,
                burnCount: 0,
                burnDamage: 0,
                burnInterval: 500,
                // slow
                isSlowed: false,
                slowTurns: 0,
                // buff
                isBuffed: false,
                buffTurns: 0,
                // curse
                isCursed: false,
                curseTurns: 0,
                //recoil
                canRecoil: true,
                isRecoiling: false,
                recoilTimer: 0,
                // multi attack
                attackCount: 0,
                countMax: 0,
            }
        }

        resetPlayer(playerStats, enemyStats, reductionModifier, damageModifier) {
            const player = {
                ...this.commonStats(playerStats.attackSpeed - playerStats.attackSpeedDecrease),
                isPlayer: true,
                reductionBuff: 0,
                damageReduction: Math.floor(playerStats.damageReduction * reductionModifier),
                actionsTaken: 0,
                accuracy: this.calculateAccuracy(playerStats, enemyStats),
                damageModifier: damageModifier,
                alwaysMaxHit: playerStats.minHit + 1 >= playerStats.maxHit, // Determine if player always hits for maxHit
            };
            return player;
        }

        resetEnemy(playerStats, enemyStats) {
            const enemy = {
                ...this.commonStats(enemyStats.attackSpeed),
                isPlayer: false,
                hitpoints: enemyStats.hitpoints,
                damageReduction: 0,
                reflectMelee: 0,
                specialID: null,
                attackInterval: 0,
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
            // Set accuracy based on protection prayers or stats
            if (playerStats.isProtected) {
                enemy.accuracy = 100 - this.protectFromValue;
            } else {
                enemy.accuracy = this.calculateAccuracy(enemyStats, playerStats);
            }
            return enemy
        }

        simulationResult(stats, playerStats, enemyStats, trials) {
            /** @type {MonsterSimResult} */
            const simResult = {
                simSuccess: true,
                petRolls: {},
            };
            simResult.attacksMade = stats.playerAttackCalls / trials;
            simResult.avgHitDmg = enemyStats.hitpoints * trials / stats.playerAttackCalls;
            simResult.avgKillTime = this.enemySpawnTimer + stats.totalTime / trials;
            simResult.hpPerEnemy = (stats.damageTaken - stats.damageHealed) / trials - simResult.avgKillTime / this.hitpointRegenInterval * playerStats.avgHPRegen;
            if (simResult.hpPerEnemy < 0) {
                simResult.hpPerEnemy = 0;
            }
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
                simResult.petRolls[petType] = Object.keys(stats.petRolls[petType]).map(attackSpeed => ({
                    speed: parseInt(attackSpeed),
                    rollsPerSecond: stats.petRolls[petType][attackSpeed] / trials / simResult.killTimeS,
                }))
            );
            // return successful results
            return simResult;
        }

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
            let targetDefRoll;
            if (attacker.attackType === 0) {
                targetDefRoll = target.maxDefRoll;
            } else if (attacker.attackType === 1) {
                targetDefRoll = target.maxRngDefRoll;
            } else {
                targetDefRoll = target.maxMagDefRoll;
            }
            let accuracy;
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
         * @returns {damageToEnemy} `damageToEnemy`, possibly multiplied by Deadeye Amulet's crit bonus
         */
        critDamageModifier(damageToEnemy) {
            const chance = Math.random() * 100;
            if (chance < this.deadeyeAmulet.chanceToCrit) {
                return this.deadeyeAmulet.critDamage;
            }
            return 1;
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

})();