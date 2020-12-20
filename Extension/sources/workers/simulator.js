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
    // TODO move these globals
    let combatTriangle;
    let protectFromValue;
    let numberMultiplier;
    let enemySpecialAttacks;
    let enemySpawnTimer;
    let hitpointRegenInterval;
    let deadeyeAmulet;
    let confettiCrossbow;
    let warlockAmulet;
    let CURSEIDS;

    class CombatSimulator {
        constructor(data) {
            /**
             * [playerType][enemyType]
             * 0:Melee 1:Ranged 2:Magic
             */
            combatTriangle = {
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
            protectFromValue = data.protectFromValue;
            numberMultiplier = data.numberMultiplier;
            enemySpecialAttacks = data.enemySpecialAttacks;
            enemySpawnTimer = data.enemySpawnTimer;
            hitpointRegenInterval = data.hitpointRegenInterval;
            deadeyeAmulet = data.deadeyeAmulet;
            confettiCrossbow = data.confettiCrossbow;
            warlockAmulet = data.warlockAmulet;
            CURSEIDS = data.CURSEIDS;
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
            let reductionModifier;
            let damageModifier;
            // Set Combat Triangle
            if (playerStats.hardcore) {
                reductionModifier = combatTriangle.hardcore.reductionModifier[playerStats.attackType][enemyStats.attackType];
                damageModifier = combatTriangle.hardcore.damageModifier[playerStats.attackType][enemyStats.attackType];
            } else {
                reductionModifier = combatTriangle.normal.reductionModifier[playerStats.attackType][enemyStats.attackType];
                damageModifier = combatTriangle.normal.damageModifier[playerStats.attackType][enemyStats.attackType];
            }
            // Multiply player special setDamage
            if (playerStats.specialData.setDamage) playerStats.specialData.setDamage *= numberMultiplier;
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
                    player: playerAction,
                    enemy: enemyAction,
                },
                {
                    is: 'isAttacking',
                    timer: 'attackTimer',
                    player: playerContinueAction,
                    enemy: enemyContinueAction,
                },
                {
                    is: 'isBurning',
                    timer: 'burnTimer',
                    both: actorBurn,
                },
                {
                    is: 'isRecoiling',
                    timer: 'recoilTimer',
                    both: actorRecoil,
                },
                {
                    is: 'isBleeding',
                    timer: 'bleedTimer',
                    both: actorBleed,
                },
            ];
            const player = {};
            const enemy = {};
            const actors = [player, enemy];
            while (enemyKills < trials) {
                // Check Cancellation every 250th trial
                if (enemyKills % 250 === 0 && await this.isCanceled()) {
                    return {simSuccess: false};
                }
                // Reset Timers and statuses
                resetPlayer(player, playerStats, enemyStats, reductionModifier, damageModifier);
                resetEnemy(enemy, playerStats, enemyStats);
                if (playerStats.canCurse) {
                    setEnemyCurseValues(enemy, playerStats.curseID, playerStats.curseData.effectValue);
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
                    actors.forEach(actor => {
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

                    // process actions
                    actors.forEach(actor => {
                        timedActions.forEach(action => {
                            if (!enemyAlive || !actor[action.is]) {
                                return;
                            }
                            // Process time step
                            actor[action.timer] -= timeStep;
                            const initialHP = enemy.hitpoints;
                            if (actor[action.timer] > 0) {
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
                                method(stats, player, playerStats, enemy, enemyStats);
                            } else {
                                method(actor);
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
                    console.log('Failed enemy simulation: ', enemyStats, enemy);
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
            return simulationResult(stats, playerStats, enemyStats, trials);
        };

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

    function actorRecoil(actor) {
        actor.canRecoil = true;
        actor.isRecoiling = false;
    }

    function actorBurn(actor) {
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

    function actorBleed(actor) {
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

    function enemyAction(stats, player, playerStats, enemy, enemyStats) {
        stats.enemyActions++;
        // Do enemy action
        if (skipsTurn(enemy)) {
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
        enemyDoAttack(player, playerStats, enemy, enemyStats, specialAttack);
        enemyPostAttack(player, playerStats, enemy, enemyStats);
    }

    function enemyContinueAction(stats, player, playerStats, enemy, enemyStats) {
        // Do enemy multi attacks
        stats.enemyAttackCalls++;
        enemyDoAttack(player, playerStats, enemy, enemyStats, true);
        enemyPostAttack(player, playerStats, enemy, enemyStats);
    }

    function canNotDodge(target) {
        return target.isStunned || target.sleep;
    }

    function applyStatus(statusEffect, damage, target, targetStats) {
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
            target.burnDamage = Math.floor((targetStats.levels.Hitpoints * numberMultiplier * (statusEffect.burnDebuff / 100)) / target.burnMaxCount);
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

    function enemyDoAttack(player, playerStats, enemy, enemyStats, isSpecial) {
        let forceHit = false;
        let currentSpecial;
        if (isSpecial) {
            // Do Enemy Special
            currentSpecial = enemySpecialAttacks[enemy.specialID];
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
                setEvasionDebuffs(enemyStats, enemy);
                player.accuracy = calculateAccuracy(playerStats, enemy);
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
        if (canNotDodge(player) || forceHit) {
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
            const damage = enemyCalculateDamage(enemy, player, isSpecial, currentSpecial);
            player.hitpoints -= damage;
            //////////////////
            // side effects //
            //////////////////
            // player recoil
            if (playerStats.activeItems.goldSapphireRing && player.canRecoil) {
                const reflectDamage = Math.floor(Math.random() * 3 * numberMultiplier);
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
                applyStatus(currentSpecial, damage, player, playerStats)
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

    function enemyPostAttack(player, playerStats, enemy, enemyStats) {
        // Buff tracking
        if (enemy.isBuffed) {
            enemy.buffTurns--;
            if (enemy.buffTurns <= 0) {
                enemy.isBuffed = false;
                // Undo buffs
                setEvasionDebuffs(enemyStats, enemy);
                player.accuracy= calculateAccuracy(playerStats, enemy);
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
            enemyCurseUpdate(player, enemy, enemyStats);
        }
    }

    function enemyCurseUpdate(player, enemy, enemyStats) {
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
                    enemy.accuracy = calculateAccuracy(enemy, playerStats);
                }
                break;
            case 'Soul Split':
            case 'Decay':
                setEvasionDebuffs(enemyStats, enemy);
                player.accuracy = calculateAccuracy(playerStats, enemy);
                break;
            case 'Weakening':
                enemy.maxHit = enemyStats.maxHit;
                break;
        }
    }

    function skipsTurn(actor) {
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

    function playerAction(stats, player, playerStats, enemy, enemyStats) {
        // player action: reduce stun count or attack
        stats.playerActions++;
        if (skipsTurn(player)) {
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
        const attackResult = playerDoAttack(stats, player, playerStats, enemy, enemyStats, specialAttack)
        processPlayerAttackResult(attackResult, stats, player, playerStats, enemy, enemyStats);
        playerUpdateActionTimer(player, playerStats, specialAttack);
    }

    function playerContinueAction(stats, player, playerStats, enemy, enemyStats) {
        // perform continued attack
        const attackResult = playerDoAttack(stats, player, playerStats, enemy, enemyStats,true);
        processPlayerAttackResult(attackResult, stats, player, playerStats, enemy, enemyStats);
        playerUpdateActionTimer(player, playerStats, false);
    }

    function processPlayerAttackResult(attackResult, stats, player, playerStats, enemy, enemyStats) {
        if (!attackResult.attackHits) {
            // attack missed, nothing to do
            return;
        }
        // damage
        enemy.hitpoints -= Math.floor(attackResult.damageToEnemy);
        // XP Tracking
        if (attackResult.damageToEnemy > 0) {
            let xpToAdd = attackResult.damageToEnemy / numberMultiplier * 4;
            if (xpToAdd < 4) {
                xpToAdd = 4;
            }
            stats.totalHpXP += attackResult.damageToEnemy / numberMultiplier * 1.33;
            stats.totalPrayerXP += attackResult.damageToEnemy * playerStats.prayerXpPerDamage;
            stats.totalCombatXP += xpToAdd;
            if (playerStats.prayerXpPerDamage > 0) {
                stats.petRolls.Prayer[player.currentSpeed] = (stats.petRolls.Prayer[player.currentSpeed] || 0) + 1;
            }
        }
        if (attackResult.isSpecial) {
            applyStatus(attackResult.statusEffect, attackResult.damageToEnemy, enemy, enemyStats)
        }
    }

    function  playerUsePreAttackSpecial(player, playerStats, enemy, enemyStats) {
        if (playerStats.specialData.decreasedRangedEvasion !== undefined) {
            enemy.rangedEvasionDebuff = 1 - playerStats.specialData.decreasedRangedEvasion / 100;
            setEvasionDebuffs(enemyStats, enemy);
            player.accuracy= calculateAccuracy(playerStats, enemy);
        }
    }

    function playerUpdateActionTimer(player, playerStats, specialAttack) {
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

    function playerUseCurse(stats, player, playerStats, enemy, enemyStats) {
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
                    enemy.accuracy = calculateAccuracy(enemy, playerStats);
                }
                break;
            case 'Soul Split':
            case 'Decay':
                setEvasionDebuffs(enemyStats, enemy);
                player.accuracy = calculateAccuracy(playerStats, enemy);
                break;
            case 'Weakening':
                enemy.maxHit = Math.floor(enemy.maxHit * enemy.curse.maxHitDebuff);
                break;
        }
    }

    function playerDoAttack(stats, player, playerStats, enemy, enemyStats, isSpecial) {
        stats.playerAttackCalls++;
        // Apply pre-attack special effects
        playerUsePreAttackSpecial(player, playerStats, enemy, enemyStats);
        // Apply curse
        playerUseCurse(stats, player, playerStats, enemy, enemyStats);
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
        attackResult.damageToEnemy = playerCalculateDamage(player, playerStats, enemy, isSpecial);

        // healing special
        if (isSpecial && playerStats.specialData.healsFor > 0) {
            stats.damageHealed += Math.floor(attackResult.damageToEnemy * playerStats.specialData.healsFor);
        }
        // reflect melee damage
        if (enemy.reflectMelee > 0) {
            player.hitpoints -= enemy.reflectMelee * numberMultiplier;
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
            stats.damageHealed += Math.floor(attackResult.damageToEnemy * warlockAmulet.spellHeal);
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
            if (gpMultiplier > confettiCrossbow.gpMultiplierCap) {
                gpMultiplier = confettiCrossbow.gpMultiplierCap;
            } else if (gpMultiplier < confettiCrossbow.gpMultiplierMin) {
                gpMultiplier = confettiCrossbow.gpMultiplierMin;
            }
            stats.gpGainedFromDamage += Math.floor(damageToEnemy * gpMultiplier);
        }

        // return the result of the attack
        attackResult.attackHits = true;
        attackResult.statusEffect = statusEffect;
        return attackResult;
    }

    function enemyCalculateDamage(actor, target, isSpecial, special) {
        let damage;
        if (isSpecial && special.setDamage !== null) {
            damage = special.setDamage * numberMultiplier;
        } else {
            damage = Math.floor(Math.random() * actor.maxHit) + 1;
        }
        return damage * damageModifiers(actor, target, isSpecial, special);
    }

    function damageModifiers(actor, target, isSpecial, special) {
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

    function playerCalculateDamage(player, playerStats, enemy, isSpecial) {
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
                damageToEnemy = rollForDamage(playerStats);
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
            damageToEnemy *= critDamageModifier(damageToEnemy);
        }
        // common modifiers
        damageToEnemy *= damageModifiers(player, enemy, isSpecial, playerStats.specialData)
        // cap damage, no overkill
        if (enemy.hitpoints < damageToEnemy) {
            damageToEnemy = enemy.hitpoints;
        }
        return damageToEnemy;
    }

    function resetCommonStats(common, attackSpeed) {
        // action
        common.doingSpecial = false;
        common.isActing = true;
        common.attackTimer = 0;
        common.isAttacking = false;
        // action speed
        common.actionTimer = attackSpeed;
        common.currentSpeed = attackSpeed;
        // stun
        common.isStunned = false;
        common.stunTurns = 0;
        // sleep
        common.sleep = false;
        common.sleepTurns = 0;
        // bleed
        common.bleedTimer = 0;
        common.isBleeding = false;
        common.bleedMaxCount = 0;
        common.bleedInterval = 0;
        common.bleedCount = 0;
        common.bleedDamage = 0;
        // burn
        common.burnTimer = 0;
        common.isBurning = false;
        common.burnMaxCount = 10;
        common.burnCount = 0;
        common.burnDamage = 0;
        common.burnInterval = 500;
        // slow
        common.isSlowed = false;
        common.slowTurns = 0;
        // buff
        common.isBuffed = false;
        common.buffTurns = 0;
        // curse
        common.isCursed = false;
        common.curseTurns = 0;
        //recoil
        common.canRecoil = true;
        common.isRecoiling = false;
        common.recoilTimer = 0;
        // multi attack
        common.attackCount = 0;
        common.countMax = 0;
    }

    function resetPlayer(player, playerStats, enemyStats, reductionModifier, damageModifier) {
        resetCommonStats(player, playerStats.attackSpeed - playerStats.attackSpeedDecrease);
        player.isPlayer = true;
        player.reductionBuff = 0;
        player.damageReduction = Math.floor(playerStats.damageReduction * reductionModifier);
        player.actionsTaken = 0;
        player.accuracy = calculateAccuracy(playerStats, enemyStats);
        player.damageModifier = damageModifier;
        player.alwaysMaxHit = playerStats.minHit + 1 >= playerStats.maxHit; // Determine if player always hits for maxHit
    }


    function resetEnemy(enemy, playerStats, enemyStats) {
        resetCommonStats(enemy, enemyStats.attackSpeed);
        enemy.isPlayer = false;
        enemy.hitpoints = enemyStats.hitpoints;
        enemy.damageReduction = 0;
        enemy.reflectMelee = 0;
        enemy.specialID = null;
        enemy.attackInterval = 0;
        enemy.maxAttackRoll = enemyStats.maxAttackRoll;
        enemy.maxHit = enemyStats.maxHit;
        enemy.maxDefRoll = enemyStats.maxDefRoll;
        enemy.maxMagDefRoll = enemyStats.maxMagDefRoll;
        enemy.maxRngDefRoll = enemyStats.maxRngDefRoll;
        enemy.rangedEvasionDebuff = 1;
        enemy.meleeEvasionBuff = 1;
        enemy.magicEvasionBuff = 1;
        enemy.rangedEvasionBuff = 1;
        enemy.attackType = enemyStats.attackType;
        if (enemy.curse === undefined) {
            enemy.curse = {};
        }
        enemy.curse.type = '';
        enemy.curse.accuracyDebuff = 1;
        enemy.curse.maxHitDebuff = 1;
        enemy.curse.damageMult = 1;
        enemy.curse.magicEvasionDebuff = 1;
        enemy.curse.meleeEvasionDebuff = 1;
        enemy.curse.rangedEvasionDebuff = 1;
        enemy.curse.confusionMult = 0;
        enemy.curse.decayDamage = 0;
        // Set accuracy based on protection prayers or stats
        if (playerStats.isProtected) {
            enemy.accuracy = 100 - protectFromValue;
        } else {
            enemy.accuracy = calculateAccuracy(enemyStats, playerStats);
        }
    }

    function simulationResult(stats, playerStats, enemyStats, trials) {
        /** @type {MonsterSimResult} */
        const simResult = {
            simSuccess: true,
            petRolls: {},
        };
        simResult.attacksMade = stats.playerAttackCalls / trials;
        simResult.avgHitDmg = enemyStats.hitpoints * trials / stats.playerAttackCalls;
        simResult.avgKillTime = enemySpawnTimer + stats.totalTime / trials;
        simResult.hpPerEnemy = (stats.damageTaken - stats.damageHealed) / trials - simResult.avgKillTime / hitpointRegenInterval * playerStats.avgHPRegen;
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
        simResult.ppConsumedPerSecond = (stats.playerAttackCalls * playerStats.prayerPointsPerAttack + stats.enemyAttackCalls * playerStats.prayerPointsPerEnemy) / trials / simResult.killTimeS + playerStats.prayerPointsPerHeal / hitpointRegenInterval * 1000;
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
    function calculateAccuracy(attacker, target) {
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
    function setEnemyCurseValues(enemy, curseID, effectValue) {
        switch (curseID) {
            case CURSEIDS.Blinding_I:
            case CURSEIDS.Blinding_II:
            case CURSEIDS.Blinding_III:
                enemy.curse.accuracyDebuff = 1 - effectValue / 100;
                enemy.curse.type = 'Blinding';
                break;
            case CURSEIDS.Soul_Split_I:
            case CURSEIDS.Soul_Split_II:
            case CURSEIDS.Soul_Split_III:
                enemy.curse.magicEvasionDebuff = 1 - effectValue / 100;
                enemy.curse.type = 'Soul Split';
                break;
            case CURSEIDS.Weakening_I:
            case CURSEIDS.Weakening_II:
            case CURSEIDS.Weakening_III:
                enemy.curse.maxHitDebuff = 1 - effectValue / 100;
                enemy.curse.type = 'Weakening';
                break;
            case CURSEIDS.Anguish_I:
            case CURSEIDS.Anguish_II:
            case CURSEIDS.Anguish_III:
                enemy.curse.damageMult = 1 + effectValue / 100;
                enemy.curse.type = 'Anguish';
                break;
            case CURSEIDS.Decay:
                enemy.curse.meleeEvasionDebuff = 1 - effectValue[1] / 100;
                enemy.curse.magicEvasionDebuff = 1 - effectValue[1] / 100;
                enemy.curse.rangedEvasionDebuff = 1 - effectValue[1] / 100;
                enemy.curse.decayDamage = Math.floor(enemy.hitpoints * effectValue[0] / 100);
                enemy.curse.type = 'Decay';
                break;
            case CURSEIDS.Confusion:
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
    function rollForDamage(playerStats) {
        return Math.ceil(Math.random() * (playerStats.maxHit - playerStats.minHit)) + playerStats.minHit;
    }

    /**
     * Rolls for a chance of Deadeye Amulet's crit damage
     * @param {damageToEnemy} damageToEnemy
     * @returns {damageToEnemy} `damageToEnemy`, possibly multiplied by Deadeye Amulet's crit bonus
     */
    function critDamageModifier(damageToEnemy) {
        const chance = Math.random() * 100;
        if (chance < deadeyeAmulet.chanceToCrit) {
            return deadeyeAmulet.critDamage;
        }
        return 1;
    }

    /**
     * Modifies the stats of the enemy by the curse
     * @param {enemyStats} enemyStats
     * @param {Object} enemy
     */
    function setEvasionDebuffs(enemyStats, enemy) {
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

})();