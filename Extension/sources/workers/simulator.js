/*  Melvor Idle Combat Simulator

    Copyright (C) <2020>  <Coolrox95>
    Modified Copyright (C) <2020> <Visua0>
    Modified Copyright (C) <2020, 2021> <G. Miclotte>

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

    // set true to enable logging of additional accuracy and damage statistics
    let verbose = false;
    // set true to enable very verbose logging of combat
    let veryVerbose = false;

    /** @type {CombatSimulator} */
    let combatSimulator;

    onmessage = (event) => {
        switch (event.data.action) {
            case 'RECEIVE_GAMEDATA':
                combatSimulator = new CombatSimulator(event.data);
                break;
            case 'START_SIMULATION':
                const startTime = performance.now();
                numberMultiplier = event.data.combatData.numberMultiplier;
                applyEnemyStunSleepDamage = event.data.combatData.applyEnemyStunSleepDamage;
                enemySpawnTimer = event.data.combatData.enemySpawnTimer;
                verbose = event.data.verbose;
                veryVerbose = event.data.veryVerbose;
                combatSimulator.simulateMonster(event.data.combatData, event.data.enemyStats, event.data.playerStats, event.data.simOptions.trials, event.data.simOptions.maxActions, event.data.simOptions.forceFullSim).then((simResult) => {
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

    onerror = (error) => {
        postMessage({
            action: 'ERR_SIM',
            error: error,
        });
    }

    // TODO move these globals?
    let combatTriangle;
    let protectFromValue;
    let numberMultiplier;
    let enemySpecialAttacks;
    let enemySpawnTimer;
    let hitpointRegenInterval;
    let CURSEIDS;
    let applyEnemyStunSleepDamage;
    let constantModifiers;

    const attackSources = {
        regular: 0,
        special: 1,
        summon: 2,
        bleed: 3,
        burn: 4,
        reflect: 5,
        curse: 6,
    }

    class CombatSimulator {
        constructor(data) {
            /**
             * [playerType][enemyType]
             * 0:Melee 1:Ranged 2:Magic
             */
            combatTriangle = {
                normal: {
                    damageModifier: [
                        [1, 1.1, 0.85],
                        [0.85, 1, 1.1],
                        [1.1, 0.85, 1],
                    ],
                    reductionModifier: [
                        [1, 1.25, 0.5],
                        [0.95, 1, 1.25],
                        [1.25, 0.85, 1],
                    ],
                },
                hardcore: {
                    damageModifier: [
                        [1, 1.1, 0.75],
                        [0.75, 1, 1.1],
                        [1.1, 0.75, 1],
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
            enemySpecialAttacks = data.enemySpecialAttacks;
            hitpointRegenInterval = data.hitpointRegenInterval;
            CURSEIDS = data.CURSEIDS;
            constantModifiers = data.constantModifiers;
        }

        /**
         * Simulation Method for a single monster
         * @param {EnemyStats} enemyStats
         * @param {PlayerStats} playerStats
         * @param {number} trials
         * @param {number} maxActions
         * @return {Promise<Object>}
         */

        async simulateMonster(combatData, enemyStats, playerStats, trials, maxActions, forceFullSim) {
            // Stats from the simulation
            const stats = {
                totalTime: 0,
                killTimes: [],
                playerAttackCalls: 0,
                enemyAttackCalls: 0,
                totalCombatXP: 0,
                totalHpXP: 0,
                totalPrayerXP: 0,
                gpGained: 0,
                playerActions: 0,
                enemyActions: 0,
                /** @type {PetRolls} */
                petRolls: {Prayer: {}, other: {}},
                spellCasts: 0,
                curseCasts: 0,
                player: playerStats,
                combatData: combatData,
                enemy: enemyStats,
                burningEnemyKilled: 0,
            };

            // configure some additional default values for the `stats.player` and `stats.enemy` objects
            const setupCommonStats = (stats) => {
                stats.damageTaken = 0;
                stats.damageHealed = 0;
                stats.inflictedDamage = 0;
                stats.inflictedHits = 0;
                stats.tracking = {};
                Object.getOwnPropertyNames(attackSources).forEach((prop, i) => {
                    stats.tracking[i] = {
                        name: prop,
                        attacks: 0,
                        hits: 0,
                        damage: 0,
                    };
                });
            }
            setupCommonStats(stats.player);
            stats.player.isPlayer = true;
            stats.player.deaths = 0;
            stats.player.ate = 0;
            stats.player.highestDamageTaken = 0;
            stats.player.lowestHitpoints = stats.player.maxHitpoints;
            stats.player.numberOfRegens = 0; // TODO: hook this up to rapid heal prayer and prayer potion usage
            setupCommonStats(stats.enemy);
            stats.enemy.isPlayer = false;

            // copy slayer area values to player stats
            stats.player.slayerArea = stats.enemy.slayerArea;
            stats.player.slayerAreaEffectValue = stats.enemy.slayerAreaEffectValue;

            // Start Monte Carlo simulation
            let enemyFights = 0;

            if (!stats.player.isMelee && stats.enemy.passiveID.includes(2)) {
                return {simSuccess: false, reason: 'wrong style'};
            }
            if (!stats.player.isRanged && stats.enemy.passiveID.includes(3)) {
                return {simSuccess: false, reason: 'wrong style'};
            }
            if (!stats.player.isMagic && stats.enemy.passiveID.includes(4)) {
                return {simSuccess: false, reason: 'wrong style'};
            }
            if (stats.enemy.passiveID.includes(2) || stats.enemy.passiveID.includes(3)) {
                // can't curse these monsters
                stats.player.canCurse = false;
            }

            // Start simulation for each trial
            this.cancelStatus = false;
            const player = {};
            // set initial regen interval
            player.regenTimer = Math.floor(Math.random() * hitpointRegenInterval);
            // Set Combat Triangle
            if (stats.player.hardcore) {
                player.reductionModifier = combatTriangle.hardcore.reductionModifier[stats.player.attackType][stats.enemy.attackType];
                player.damageModifier = combatTriangle.hardcore.damageModifier[stats.player.attackType][stats.enemy.attackType];
            } else {
                player.reductionModifier = combatTriangle.normal.reductionModifier[stats.player.attackType][stats.enemy.attackType];
                player.damageModifier = combatTriangle.normal.damageModifier[stats.player.attackType][stats.enemy.attackType];
            }
            // Multiply player max hit
            stats.player.maxHit = Math.floor(stats.player.maxHit * player.damageModifier);
            stats.player.summoningMaxHit = Math.floor(stats.player.summoningMaxHit * player.damageModifier);
            const enemy = {};
            let innerCount = 0;
            let tooManyActions = 0;
            resetPlayer(stats, combatData, player, enemy);
            // set slayer area effects
            setAreaEffects(stats, combatData, player, enemy);
            // track stats.totalTime of previous kill
            let timeStamp = 0;
            while (enemyFights < trials) {
                // Reset Timers and statuses
                resetPlayer(stats, combatData, player, enemy);
                // regen timer is not reset ! add respawn time to regen, and regen if required
                player.regenTimer -= enemySpawnTimer;
                if (player.regenTimer <= 0) {
                    regen(stats, player, enemy);
                }
                resetEnemy(stats, enemy);
                if (stats.player.canCurse) {
                    setEnemyCurseValues(enemy, stats.player.curseID, stats.player.curseData.effectValue);
                }
                // set action speed
                player.recompute.speed = true;
                player.actionTimer = getSpeed(stats, player);
                enemy.recompute.speed = true;
                enemy.actionTimer = getSpeed(stats, enemy);

                // Simulate combat until enemy is dead or max actions has been reached
                enemy.alive = true;
                player.alive = true;
                while (enemy.alive && player.alive) {
                    innerCount++
                    // Check Cancellation every 100000th loop
                    if (innerCount % 100000 === 0 && await this.isCanceled()) {
                        return {simSuccess: false, reason: 'cancelled'};
                    }
                    // check player action limit
                    if (player.actionsTaken > maxActions) {
                        break;
                    }

                    // Determine the time step
                    let timeStep = Infinity;
                    timeStep = determineTimeStep(player, timeStep);
                    timeStep = determineTimeStep(enemy, timeStep);

                    // exit on invalid time step
                    if (timeStep <= 0) {
                        return {
                            simSuccess: false,
                            reason: 'invalid time step: ' + timeStep,
                            playerActing: player.isActing,
                            playerActionTimer: player.actionTimer,
                            playerAttacking: player.isAttacking,
                            playerAttackTimer: player.attackTimer,
                            enemyActing: enemy.isActing,
                            enemyActionTimer: enemy.actionTimer,
                            enemyAttacking: enemy.isAttacking,
                            enemyAttackTimer: enemy.attackTimer,
                            player: player,
                            enemy: enemy,
                            monsterID: stats.enemy.monsterID,
                        };
                    }
                    // combat time tracker
                    stats.totalTime += timeStep;

                    // set verboseLog
                    let verboseLog = () => {
                    };
                    if (veryVerbose) {
                        verboseLog = (...args) => console.log(stats.totalTime, timeStep, ...args);
                        // store hp before action
                        player.startHP = player.hitpoints;
                        enemy.startHP = enemy.hitpoints;
                        // set trials to 1 if doing detailed logging
                        trials = 1;
                    }

                    processTimeStep(player, timeStep);
                    processTimeStep(enemy, timeStep);

                    if (player.regenTimer <= 0) {
                        verboseLog('player regen');
                        regen(stats, player, enemy);
                    }

                    if (enemy.alive && player.isActing) {
                        if (player.actionTimer <= 0) {
                            verboseLog('player action');
                            playerAction(stats, player, enemy);
                            // Multi attack once more when the monster died on the first hit
                            if (!enemy.alive && player.isAttacking && player.attackCount < player.countMax) {
                                stats.totalTime += player.attackInterval;
                            }
                        }
                    }
                    if (enemy.alive && player.isAttacking) {
                        if (player.attackTimer <= 0) {
                            verboseLog('player continue');
                            playerContinueAction(stats, player, enemy);
                        }
                    }
                    if (enemy.alive && player.isBurning) {
                        if (player.burnTimer <= 0) {
                            verboseLog('player burning');
                            burnTarget(stats, enemy, player);
                        }
                    }
                    if (enemy.alive && player.isRecoiling) {
                        if (player.recoilTimer <= 0) {
                            verboseLog('player recoil CD reset');
                            actorRecoilCD(player);
                        }
                    }
                    if (enemy.alive && player.isBleeding) {
                        if (player.bleedTimer <= 0) {
                            verboseLog('player bleeding');
                            bleedTarget(stats, enemy, player);
                        }
                    }
                    if (enemy.alive && stats.player.summoningMaxHit > 0) {
                        if (player.summonTimer <= 0) {
                            verboseLog('summon attacks');
                            summonAttack(stats, player, enemy);
                        }
                    }
                    //enemy
                    if (enemy.alive && enemy.isActing) {
                        if (enemy.actionTimer <= 0) {
                            verboseLog('enemy action');
                            enemyAction(stats, player, enemy);
                        }
                    }
                    if (enemy.alive && enemy.isAttacking) {
                        if (enemy.attackTimer <= 0) {
                            verboseLog('enemy continue');
                            enemyContinueAction(stats, player, enemy);
                        }
                    }
                    if (enemy.alive && enemy.isBurning) {
                        if (enemy.burnTimer <= 0) {
                            verboseLog('enemy burning');
                            burnTarget(stats, player, enemy);
                        }
                    }
                    if (enemy.alive && enemy.isRecoiling) {
                        if (enemy.recoilTimer <= 0) {
                            verboseLog('enemy recoil CD reset');
                            actorRecoilCD(enemy);
                        }
                    }
                    if (enemy.alive && enemy.isBleeding) {
                        if (enemy.bleedTimer <= 0) {
                            verboseLog('enemy bleeding');
                            bleedTarget(stats, player, enemy);
                        }
                    }

                    // log status and hp changes
                    if (veryVerbose) {
                        [player, enemy].forEach(actor => {
                            const name = actor.isPlayer ? 'player' : 'enemy';
                            if (actor.startHP !== actor.hitpoints) {
                                console.log(`${name} hp change: ${actor.hitpoints - actor.startHP}`);
                            }
                            if (actor.isStunned) console.log(`${name} status: stunned`);
                            if (actor.isSleeping) console.log(`${name} status: sleeping`);
                        });
                    }
                }
                if (isNaN(player.hitpoints) || isNaN(enemy.hitpoints)) {
                    return {
                        simSuccess: false,
                        reason: 'bogus player or enemy hp',
                        monsterID: stats.enemy.monsterID,
                        playerStats: {...stats.player},
                        player: {...player},
                        enemyStats: {...stats.enemy},
                        enemy: {...enemy},
                    };
                }
                if (player.hitpoints <= 0) {
                    stats.player.deaths++;
                } else if (enemy.hitpoints > 0) {
                    tooManyActions++;
                    if (!forceFullSim) {
                        return {
                            simSuccess: false,
                            reason: 'too many actions',
                            monsterID: stats.enemy.monsterID,
                            innerCount: innerCount,
                            actionsTaken: player.actionsTaken,
                            maxActions: maxActions,
                        }
                    }
                } else {
                    // enemy killed
                    if (enemy.isBurning) {
                        stats.burningEnemyKilled++;
                    }
                }
                if (verbose) {
                    const killTime = stats.totalTime - timeStamp;
                    stats.killTimes.push(killTime);
                    timeStamp = stats.totalTime;
                }
                enemyFights++;
            }

            // Apply XP Bonuses
            stats.totalCombatXP *= 1 + stats.player.combatXpBonus / 100;
            stats.totalHpXP *= 1 + stats.player.hitpointsXpBonus / 100;
            stats.totalPrayerXP *= 1 + stats.player.prayerXpBonus / 100;

            // Final Result from simulation
            return simulationResult(stats, trials, tooManyActions, player);
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

    function determineTimeStep(actor, timeStep) {
        if (actor.isActing) {
            timeStep = Math.min(timeStep, actor.actionTimer);
        }
        if (actor.isAttacking) {
            timeStep = Math.min(timeStep, actor.attackTimer);
        }
        if (actor.isBurning) {
            timeStep = Math.min(timeStep, actor.burnTimer);
        }
        if (actor.isRecoiling) {
            timeStep = Math.min(timeStep, actor.recoilTimer);
        }
        if (actor.isBleeding) {
            timeStep = Math.min(timeStep, actor.bleedTimer);
        }
        // only the player has regen
        if (actor.isPlayer) {
            timeStep = Math.min(timeStep, actor.regenTimer);
            timeStep = Math.min(timeStep, actor.summonTimer);
        }
        return timeStep;
    }

    function processTimeStep(actor, timeStep) {
        if (actor.isActing) {
            actor.actionTimer -= timeStep;
        }
        if (actor.isAttacking) {
            actor.attackTimer -= timeStep;
        }
        if (actor.isBurning) {
            actor.burnTimer -= timeStep;
        }
        if (actor.isRecoiling) {
            actor.recoilTimer -= timeStep;
        }
        if (actor.isBleeding) {
            actor.bleedTimer -= timeStep;
        }
        if (actor.isPlayer) {
            actor.regenTimer -= timeStep;
            actor.summonTimer -= timeStep;
        }
        return timeStep;
    }

    function regen(stats, player, enemy) {
        // TODO synergy 6, 14
        // TODO synergy 7, 14
        // TODO synergy 8, 14
        // TODO synergy 1, 14
        // TODO synergy 13, 14
        if (player.isHardcore) {
            return;
        }
        if (player.hitpoints === player.maxHitPoints) {
            return;
        }
        // base amount
        let amt = Math.floor(player.maxHitpoints / 10);
        amt = Math.floor(amt / numberMultiplier);
        // modifiers
        amt += numberMultiplier * mergePlayerModifiers(player, 'HPRegenFlat');
        // flat synergies
        if (stats.combatData.modifiers.summoningSynergy_6_14 && player.isMelee) {
            amt += stats.player.maxHit * (stats.combatData.modifiers.summoningSynergy_6_14 / 100);
        } else if (stats.combatData.modifiers.summoningSynergy_7_14 && player.isRanged) {
            amt += stats.player.maxHit * (stats.combatData.modifiers.summoningSynergy_7_14 / 100);
        } else if (stats.combatData.modifiers.summoningSynergy_8_14 && player.isMagic) {
            amt += stats.player.maxHit * (stats.combatData.modifiers.summoningSynergy_8_14 / 100);
        }
        // rapid heal prayer
        if (player.prayerBonus.vars.prayerBonusHitpoints) {
            amt *= player.prayerBonus.vars.prayerBonusHitpoints;
        }
        // Regeneration modifiers
        amt = applyModifier(amt, mergePlayerModifiers(player, 'HitpointRegeneration'));
        healDamage(stats, enemy, player, amt);
        // synergy 0 14
        if (stats.combatData.modifiers.summoningSynergy_0_14) {
            stats.gpGained += 1000 / numberMultiplier * amt
                * mergePlayerModifiers(player, 'GPGlobal');
        }
        // reset timer
        player.regenTimer += hitpointRegenInterval;
        stats.player.numberOfRegens += 1;
    }

    function actorRecoilCD(actor) {
        actor.canRecoil = true;
        actor.isRecoiling = false;
    }

    function burnTarget(stats, actor, target) {
        // TODO synergy 13, 15
        // TODO synergy 14, 15
        // reset timer
        target.burnTimer = target.burnInterval;
        // Check if stopped burning
        if (target.burnCount >= target.burnMaxCount) {
            target.isBurning = false;
            return;
        }
        // Apply burn damage
        dealDamage(stats, actor, target, target.burnDamage, attackSources.burn);
        target.burnCount++;
    }

    function bleedTarget(stats, actor, target) {
        // TODO synergy 2, 14
        // reset timer
        target.bleedTimer = target.bleedInterval;
        // Check if stopped bleeding
        if (target.bleedCount >= target.bleedMaxCount) {
            target.isBleeding = false;
            return;
        }
        // Apply bleed damage
        dealDamage(stats, actor, target, target.bleedDamage, attackSources.bleed);
        target.bleedCount++;
        // Elder Crown life steals bleed damage
        if (actor.isPlayer && stats.player.activeItems.elderCrown) {
            healDamage(stats, target, actor, target.bleedDamage);
        }
    }

    function summonAttack(stats, player, enemy) {
        // TODO synergy 2, 15
        // TODO if synergy active: use 2 tablets per summon per attack, else use 1 tablet per summon per attack
        let damage = 0;
        if (rollPlayerHit(stats, player, enemy, 1)) {
            damage = stats.player.summoningMaxHit;
            damage = Math.floor(Math.random() * damage);
        }
        dealDamageToEnemy(stats, enemy, damage, attackSources.summon);
        player.summonTimer = 3000;
    }

    function enemyAction(stats, player, enemy) {
        stats.enemyActions++;
        // Do enemy action
        if (skipsTurn(stats, enemy)) {
            return;
        }
        stats.enemyAttackCalls++;
        // Check if doing special
        let isSpecial = false;
        enemy.specialID = -1;
        enemy.currentSpecial = {};
        if (stats.enemy.hasSpecialAttack) {
            const specialRoll = Math.floor(Math.random() * 100);
            let specialChance = 0;
            for (let i = 0; i < stats.enemy.specialLength; i++) {
                specialChance += stats.enemy.specialAttackChances[i];
                if (specialRoll < specialChance) {
                    enemy.specialID = stats.enemy.specialIDs[i];
                    enemy.currentSpecial = enemySpecialAttacks[enemy.specialID];
                    isSpecial = true;
                    break;
                }
            }
            // if selected special has active buff without turns, disable any active buffs
            if (enemy.currentSpecial.activeBuffs && enemy.currentSpecial.activeBuffTurns === undefined) {
                enemy.buffTurns = 0;
                postAttack(stats, enemy, player, stats.player, stats.enemy);
            }
            // don't stack active buffs
            if (enemy.activeBuffs && enemy.currentSpecial.activeBuffs) {
                enemy.specialID = -1;
                enemy.currentSpecial = {};
                isSpecial = false;
            }
            // stop Ahrenia Phase 3 from using a normal attack
            if (!isSpecial && stats.enemy.monsterID === 149) {
                enemy.specialID = 50;
                enemy.currentSpecial = enemySpecialAttacks[50];
                isSpecial = true;
            }
        }
        if (isSpecial) {
            setupMultiAttack(enemy, player);
        }
        enemyDoAttack(stats, player, enemy, isSpecial, true);
        computeTempModifiers(stats, player, enemy, -1);
        multiAttackTimer(stats, enemy);
        postAttack(stats, enemy, player, stats.player, stats.enemy);
    }

    function setupMultiAttack(actor, target) {
        let special = actor.currentSpecial;
        let attackCount = special.attackCount;
        let attackInterval;
        // Set up subsequent hits if required
        if (target.isPlayer && (actor.specialID === 47 || actor.specialID === 48)) {
            attackCount += target.markOfDeathStacks;
            target.removeMarkOfDeath = true;
        }
        attackInterval = special.attackInterval;
        if (special.setDOTDamage || special.setDOTHeal) {
            attackCount = special.DOTMaxProcs;
            attackInterval = special.DOTInterval;
        }
        if (attackCount === 1) {
            return;
        }
        // setup multi attack
        actor.attackCount = 0;
        actor.countMax = attackCount;
        actor.isAttacking = true;
        actor.isActing = false;
        actor.attackInterval = attackInterval;
        actor.attackTimer = attackInterval;
    }

    function enemyContinueAction(stats, player, enemy) {
        // Do enemy multi attacks
        if (skipsTurn(stats, enemy)) {
            return;
        }
        stats.enemyAttackCalls++;
        enemyDoAttack(stats, player, enemy, true, false);
        multiAttackTimer(stats, enemy);
        postAttack(stats, enemy, player, stats.player, stats.enemy);
        if (!enemy.isAttacking && enemy.intoTheMist) {
            enemy.intoTheMist = false;
            enemy.increasedDamageReduction = 0;
        }
        if (!enemy.isAttacking && player.removeMarkOfDeath) {
            player.markOfDeath = false;
            player.recompute.damageReduction = true;
            player.removeMarkOfDeath = false;
            player.markOfDeathTurns = 0;
            player.markOfDeathStacks = 0;
        }
    }

    function multiAttackTimer(stats, actor) {
        actor.attackCount++;
        // set up timer for next attack
        if (actor.isAttacking && actor.attackCount < actor.countMax) {
            // next attack is multi attack
            actor.attackTimer = actor.attackInterval;
        } else {
            // next attack is normal attack
            actor.isAttacking = false;
            actor.isActing = true;
            actor.actionTimer = getSpeed(stats, actor);
        }
    }

    function canNotDodge(target) {
        return target.isStunned || target.isSleeping;
    }

    function applyStatus(stats, statusEffect, damage, actor, target) {
        const targetStats = target.isPlayer ? stats.player : stats.enemy;
        ////////////
        // turned //
        ////////////
        // Enemy Passive Effect "Purity" (passiveID 0) prevents stuns and sleep (same difference)
        let stunImmunity = !target.isPlayer && targetStats.passiveID.includes(0);
        // Apply Stun
        if (canApplyStatus(statusEffect.canStun, target.isStunned, statusEffect.stunChance, stunImmunity)) {
            applyStun(stats, statusEffect, target);
        }
        // Apply Sleep
        if (canApplyStatus(statusEffect.canSleep, target.isSleeping, undefined, stunImmunity)) {
            applySleep(stats, statusEffect, target);
        }
        ///////////
        // timed //
        ///////////
        // Apply Burning
        if (canApplyStatus(statusEffect.burnDebuff, target.isBurning)) {
            target.isBurning = true;
            target.burnCount = 0;
            target.burnDamage = Math.floor(target.maxHitpoints * 0.15 / target.burnMaxCount);
            target.burnTimer = target.burnInterval;
        }
        // Apply Bleeding
        if (canApplyStatus(statusEffect.canBleed, target.isBleeding, statusEffect.bleedChance)) {
            applyBleeding(statusEffect, damage, target);
        }
        ////////////
        // debuff //
        ////////////
        // mark of death
        if (statusEffect.markOfDeath) {
            target.markOfDeath = true;
            target.recompute.damageReduction = true;
            target.removeMarkOfDeath = false;
            if (target.markOfDeathStacks <= 0) {
                target.markOfDeathTurns = 3;
            }
            if (target.markOfDeathStacks < 3) {
                target.markOfDeathStacks++;
            }
        }
        // accuracy debuffs
        if (statusEffect.decreasePlayerAccuracy !== undefined) {
            if (statusEffect.decreasePlayerAccuracyStack) {
                target.decreasedAccuracy += statusEffect.decreasePlayerAccuracy;
                target.decreasedAccuracy = Math.min(target.decreasedAccuracy, statusEffect.decreasePlayerAccuracyLimit);
            } else {
                target.decreasedAccuracy += statusEffect.decreasePlayerAccuracy;
            }
        }

        if (!target.isPlayer) {
            // Apply Slow
            if (canApplyStatus(statusEffect.attackSpeedDebuff, target.isSlowed)) {
                target.isSlowed = true;
                target.attackSpeedDebuffTurns = statusEffect.attackSpeedDebuffTurns;
                target.attackSpeedDebuff = statusEffect.attackSpeedDebuff;
                target.recompute.speed = true;
            }
            // evasion debuffs
            if (statusEffect.applyDebuffs && !target.activeDebuffs) {
                target.activeDebuffs = true;
                if (statusEffect.applyDebuffTurns !== null && statusEffect.applyDebuffTurns !== undefined) {
                    target.debuffTurns = statusEffect.applyDebuffTurns;
                } else {
                    target.debuffTurns = 2;
                }
                if (statusEffect.meleeEvasionDebuff) {
                    target.meleeEvasionDebuff = statusEffect.meleeEvasionDebuff;
                }
                if (statusEffect.rangedEvasionDebuff) {
                    target.rangedEvasionDebuff = statusEffect.rangedEvasionDebuff;
                }
                if (statusEffect.magicEvasionDebuff) {
                    target.magicEvasionDebuff = statusEffect.magicEvasionDebuff;
                }
            }
        }
    }

    function canApplyStatus(can, is, chance, immunity = false) {
        if (!can || is || immunity) {
            return false;
        }
        if (chance !== undefined) {
            const stunRoll = Math.random() * 100;
            return chance > stunRoll;
        }
        return true;
    }

    function applyStun(stats, statusEffect, target) {
        // apply new stun
        target.isStunned = true;
        target.stunTurns = statusEffect.stunTurns;
        target.isAttacking = false;
        target.isActing = true;
        target.actionTimer = getSpeed(stats, target);
    }

    function applySleep(stats, statusEffect, target) {
        // apply new sleep
        target.isSleeping = true;
        target.sleepTurns = statusEffect.sleepTurns;
        target.isAttacking = false;
        target.isActing = true;
        target.actionTimer = getSpeed(stats, target);
    }

    function applyBleeding(statusEffect, damage, target) {
        //apply new bleed
        target.isBleeding = true;
        target.bleedMaxCount = statusEffect.bleedCount;
        target.bleedInterval = statusEffect.bleedInterval;
        target.bleedTimer = target.bleedInterval;
        target.bleedCount = 0;
        let totalBleedDamage = 1;
        // base bleed
        if (statusEffect.totalBleedHP > 0) {
            let totalBleedHP = statusEffect.totalBleedHP;
            if (!target.isPlayer && statusEffect.id === 28 && target.hitpoints >= target.maxHitpoints) {
                // Rend
                totalBleedHP = 2.5;
            }
            // bleed for `statusEffect.totalBleedHP` times initial damage
            totalBleedDamage = damage * statusEffect.totalBleedHP;
            if (statusEffect.totalBleedHPCustom === 1) {
                // Rend
                // bleed for up to `statusEffect.totalBleedHP` times initial damage
                totalBleedDamage = damage * totalBleedHP * Math.random();
            } else {
                // bleed for totalBleedHP times damage
                totalBleedDamage = damage * totalBleedHP;
            }
        } else if (statusEffect.totalBleedHPPercent !== undefined) {
            // bleed for `statusEffect.totalBleedHPPercent` % of max HP
            totalBleedDamage = Math.floor(target.maxHitpoints * statusEffect.totalBleedHPPercent / 100);
        }
        // extra bleed
        if (statusEffect.extraBleedDmg) {
            totalBleedDamage += numberMultiplier * statusEffect.extraBleedDmg;
        }
        // spread bleed damage over number of bleed hits
        target.bleedDamage = Math.floor(totalBleedDamage / statusEffect.bleedCount);
    }

    function enemyDoAttack(stats, player, enemy, isSpecial, isAttack) {
        let forceHit = false;
        let currentSpecial = enemy.currentSpecial;
        if (isSpecial) {
            // Do Enemy Special
            // Activate Buffs
            if (currentSpecial.activeBuffs && !enemy.activeBuffs) {
                enemy.activeBuffs = true;
                if (currentSpecial.activeBuffTurns !== null && currentSpecial.activeBuffTurns !== undefined) {
                    enemy.buffTurns = currentSpecial.activeBuffTurns;
                } else {
                    enemy.buffTurns = currentSpecial.attackCount;
                }
                // set increased attack speed buff
                if (currentSpecial.increasedAttackSpeed) {
                    enemy.increasedAttackSpeed = currentSpecial.increasedAttackSpeed;
                    enemy.recompute.speed = true;
                }
                // Set evasion buffs
                if (currentSpecial.increasedMeleeEvasion) {
                    enemy.meleeEvasionBuff = 1 + currentSpecial.increasedMeleeEvasion / 100;
                }
                if (currentSpecial.increasedRangedEvasion) {
                    enemy.rangedEvasionBuff = 1 + currentSpecial.increasedRangedEvasion / 100;
                }
                if (currentSpecial.increasedMagicEvasion) {
                    enemy.magicEvasionBuff = 1 + currentSpecial.increasedMagicEvasion / 100;
                }
                // set reflect attack buff
                if (currentSpecial.reflectMelee) {
                    enemy.reflectMelee = currentSpecial.reflectMelee;
                }
                if (currentSpecial.reflectRanged) {
                    enemy.reflectRanged = currentSpecial.reflectRanged;
                }
                if (currentSpecial.reflectMagic) {
                    enemy.reflectMagic = currentSpecial.reflectMagic;
                }
                // set increased DR buff
                if (currentSpecial.increasedDamageReduction) {
                    enemy.increasedDamageReduction = currentSpecial.increasedDamageReduction;
                }
                // update player accuracy
                player.recompute.accuracy = true;
            }
            forceHit = currentSpecial.forceHit;
            // apply special attack modifiers to player, or apply special effect to enemy
            if (currentSpecial.modifiers !== undefined && player.activeSpecialAttacks.fromEnemy[currentSpecial.id] === undefined) {
                // apply the effect
                const turnsLeft = currentSpecial.attackSpeedDebuffTurns | currentSpecial.applyDebuffTurns | 2;
                player.activeSpecialAttacks.fromEnemy[currentSpecial.id] = {turnsLeft: turnsLeft};
                computeTempModifiers(stats, player, enemy);
            }
            stats.enemy.tracking[attackSources.special].attacks++;
        } else {
            stats.enemy.tracking[attackSources.regular].attacks++;
        }
        // Do the first hit
        let attackHits;
        if (canNotDodge(player) || forceHit) {
            attackHits = true;
        } else {
            // Roll for hit
            const hitChance = Math.floor(Math.random() * 100);
            attackHits = getAccuracy(stats, enemy, player) > hitChance;
        }

        if (!attackHits) {
            return;
        }
        if (isSpecial) {
            stats.enemy.tracking[attackSources.special].hits++;
        } else {
            stats.enemy.tracking[attackSources.regular].hits++;
        }
        //////////////////
        // apply damage //
        //////////////////
        const damage = enemyCalculateDamage(stats, enemy, isSpecial, currentSpecial, player);
        dealDamage(stats, enemy, player, damage, isSpecial ? attackSources.special : attackSources.regular, isAttack);
        //////////////////
        // side effects //
        //////////////////
        // life steal
        if (isSpecial && currentSpecial.lifesteal) {
            healDamage(stats, player, enemy, damage * currentSpecial.lifestealMultiplier);
        }
        if (isSpecial && currentSpecial.setDOTHeal) {
            enemy.intoTheMist = true;
            healDamage(stats, player, enemy, currentSpecial.setDOTHeal * enemy.maxHitpoints / currentSpecial.DOTMaxProcs);
        }
        // player recoil
        if (player.canRecoil) {
            let reflectDamage = 0;
            if (stats.player.activeItems.goldSapphireRing) {
                reflectDamage += Math.floor(Math.random() * 3 * numberMultiplier);
            }
            if (stats.player.reflectDamage) {
                reflectDamage += damage * stats.player.reflectDamage / 100
            }
            if (enemy.hitpoints > reflectDamage && reflectDamage > 0) {
                dealDamageToEnemy(stats, enemy, reflectDamage, attackSources.reflect);
                player.canRecoil = false;
                player.isRecoiling = true;
                player.recoilTimer = 2000;
            }
        }
        // decay curse
        if (enemy.isCursed && enemy.curse.type === 'Decay' && !enemy.isAttacking) {
            dealDamageToEnemy(stats, enemy, enemy.curse.decayDamage, attackSources.curse);
        }
        // confusion curse
        if (enemy.isCursed && enemy.curse.type === 'Confusion' && !enemy.isAttacking) {
            dealDamageToEnemy(stats, enemy, Math.floor(enemy.hitpoints * enemy.curse.confusionMult), attackSources.curse);
        }
        // status effects
        if (isSpecial) {
            applyStatus(stats, currentSpecial, damage, enemy, player)
        }
    }

    function getSpeed(stats, actor) {
        if (actor.recompute.speed) {
            calculateSpeed(stats, actor);
            actor.recompute.speed = false;
        }
        return actor.currentSpeed;
    }

    function calculateSpeed(stats, actor) {
        const actorStats = actor.isPlayer ? stats.player : stats.enemy;
        // base
        let speed = actorStats.attackSpeed;
        if (actor.isPlayer) {
            // recompute attack speed
            speed = 4000;
            speed = actor.equipmentStats.attackSpeed;
            if (actorStats.isRanged && actor.attackStyle.Ranged === 1) {
                speed -= 400;
            }
            speed += mergePlayerModifiers(actor, 'PlayerAttackSpeed');
            let attackSpeedPercent = mergePlayerModifiers(actor, 'PlayerAttackSpeedPercent');
            speed = applyModifier(speed, attackSpeedPercent);
            // increased attack speed buff (aurora)
            speed -= actor.attackSpeedBuff;
        } else {
            speed = Math.floor(speed
                * (1 - actor.increasedAttackSpeed / 100)
                * (1 + actor.attackSpeedDebuff / 100));
        }
        // update actor current speed
        actor.currentSpeed = speed;
    }

    function postAttack(stats, actor, target, targetStats, actorStats) {
        if (actor.isAttacking && actor.attackCount < actor.countMax) {
            // next attack is part of multi attack, so don't advance timers
            return;
        }
        // Buff tracking
        if (actor.activeBuffs) {
            actor.buffTurns--;
            if (actor.buffTurns <= 0) {
                actor.activeBuffs = false;
                // Undo buffs
                actor.increasedAttackSpeed = 0;
                actor.recompute.speed = true;
                actor.meleeEvasionBuff = 1;
                actor.rangedEvasionBuff = 1;
                actor.magicEvasionBuff = 1;
                actor.reflectMelee = 0;
                actor.reflectRanged = 0;
                actor.reflectMagic = 0;
                actor.increasedDamageReduction = 0;
                target.recompute.accuracy = true;
            }
        }
        // Slow Tracking
        if (actor.isSlowed) {
            actor.attackSpeedDebuffTurns--;
            if (actor.attackSpeedDebuffTurns <= 0) {
                actor.isSlowed = false;
                actor.attackSpeedDebuff = 0;
                actor.recompute.speed = true;
            }
        }
        // Curse Tracking
        if (actor.isCursed) {
            enemyCurseUpdate(stats, target, actor);
        }
        // if target is into the mist, then increase its DR
        if (target.intoTheMist) {
            target.increasedDamageReduction += 10;
        }
    }

    function enemyCurseUpdate(stats, player, enemy) {
        // don't curse
        if (enemy.isAttacking) {
            return;
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
                enemy.recompute.accuracy = true;
                break;
            case 'Soul Split':
            case 'Decay':
                player.recompute.accuracy = true;
                break;
            case 'Weakening':
                enemy.maxHit = Math.floor(stats.enemy.baseMaximumStrengthRoll * numberMultiplier);
                break;
        }
    }

    function skipsTurn(stats, actor) {
        // reduce stun
        if (actor.isStunned) {
            actor.stunTurns--;
            if (actor.stunTurns <= 0) {
                actor.isStunned = false;
            }
            actor.actionTimer = getSpeed(stats, actor);
            return true
        }
        // reduce sleep
        if (actor.isSleeping) {
            actor.sleepTurns--;
            if (actor.sleepTurns <= 0) {
                actor.isSleeping = false;
                actor.sleepTurns = 0;
            }
            actor.actionTimer = getSpeed(stats, actor);
            return true
        }
    }

    function playerAction(stats, player, enemy) {
        // player action: reduce stun count or attack
        stats.playerActions++;
        if (skipsTurn(stats, player)) {
            return;
        }
        // attack
        player.actionsTaken++;
        // track rune usage
        if (stats.player.usingMagic) {
            stats.spellCasts++;
        }
        // determine special or normal attack
        let isSpecial = false;
        player.currentSpecial = {};
        if (stats.player.usingAncient) {
            isSpecial = true;
            player.currentSpecial = stats.player.specialData[0];
        } else if (stats.player.hasSpecialAttack) {
            const specialRoll = Math.floor(Math.random() * 100);
            let specialChance = 0;
            for (const special of stats.player.specialData) {
                // Roll for player special
                specialChance += special.chance;
                if (specialRoll < specialChance) {
                    isSpecial = true;
                    player.currentSpecial = special;
                    break;
                }
            }
        }
        if (isSpecial) {
            setupMultiAttack(player, enemy);
        }
        playerDoAttack(stats, player, enemy, isSpecial, false);
        multiAttackTimer(stats, player);
        postAttack(stats, player, enemy, stats.enemy, stats.player);
    }

    function playerContinueAction(stats, player, enemy) {
        // perform continued attack
        if (skipsTurn(stats, player)) {
            return;
        }
        playerDoAttack(stats, player, enemy, true, true);
        multiAttackTimer(stats, player);
        postAttack(stats, player, enemy, stats.enemy, stats.player);
    }

    function healDamage(stats, actor, target, damage) {
        const targetStats = target.isPlayer ? stats.player : stats.enemy;
        const amt = Math.floor(Math.min(damage, target.maxHitpoints - target.hitpoints));
        target.hitpoints += amt;
        target.hitpoints = Math.min(target.hitpoints, target.maxHitpoints);
        targetStats.damageHealed += amt;
        if (target.isPlayer) {
            updatePlayerHPBasedEffects(stats, target, actor);
        }
    }

    function dealDamage(stats, actor, target, damage, attackSource = 0, isAttack = false) {
        if (!target.isPlayer) {
            return dealDamageToEnemy(stats, target, damage, attackSource, isAttack);
        }
        return dealDamageToPlayer(stats, actor, target, damage, attackSource, isAttack);
    }

    function dealDamageToPlayer(stats, enemy, player, damage, attackSource = 0, isAttack = false) {
        // TODO synergy 12, 15
        // do not apply DR at this point, player DR is only applied to monster attacks, not to other damage sources
        stats.player.damageTaken += Math.floor(Math.min(damage, player.hitpoints));
        player.hitpoints -= Math.floor(damage);
        // synergy 0, 13
        if (isAttack && stats.combatData.modifiers.summoningSynergy_0_13) {
            stats.gpGained += stats.combatData.modifiers.summoningSynergy_0_13
                * getPlayerDR(stats, player)
                * (1 + mergePlayerModifiers(player, 'GPGlobal') / 100);
        }
        // update alive status
        player.alive = player.hitpoints > 0;
        // Check for player eat
        if (player.alive) {
            autoEat(stats, player);
            if (stats.player.autoEat.manual && stats.player.foodHeal > 0) {
                // TODO: use a more detailed manual eating simulation?
                player.hitpoints = player.maxHitpoints;
            }
            if (player.hitpoints <= 0.1 * player.maxHitpoints && player.prayerBonus.vars.prayerBonusHitpointHeal) {
                player.hitpoints += Math.floor(player.maxHitpoints * (player.prayerBonus.vars.prayerBonusHitpointHeal / 100));
            }
            if (player.hitpoints < stats.player.lowestHitpoints) {
                stats.player.lowestHitpoints = player.hitpoints;
            }
            updatePlayerHPBasedEffects(stats, player, enemy);
        }
        if (damage > stats.player.highestDamageTaken) {
            stats.player.highestDamageTaken = damage;
        }
    }

    function dealDamageToEnemy(stats, enemy, damage, attackSource, isAttack = false) {
        // apply reductions
        damage = calculateFinalDamageToEnemy(damage, enemy);

        // apply damage
        stats.enemy.damageTaken += damage;
        enemy.hitpoints -= damage;
        // track damage
        stats.player.tracking[attackSource].attacks++;
        stats.player.tracking[attackSource].hits += damage > 0;
        stats.player.tracking[attackSource].damage += damage;
        if (isAttack && damage > 0) {
            stats.player.inflictedDamage += damage;
            stats.player.inflictedHits++;
        }

        // Check for Phoenix Rebirth
        if (!enemy.isPlayer && stats.enemy.passiveID.includes(1) && enemy.hitpoints <= 0) {
            let random = Math.random() * 100;
            if (random < 40) {
                enemy.hitpoints = enemy.maxHitpoints;
            }
        }

        // update alive status
        enemy.alive = enemy.hitpoints > 0;

        // return actual damage dealt
        return damage;
    }

    function calculateFinalDamageToEnemy(damage, enemy) {
        // damage reduction
        if (enemy.increasedDamageReduction > 0) {
            damage *= 1 - enemy.increasedDamageReduction / 100;
        }
        // no overkill
        damage = Math.min(damage, enemy.hitpoints);
        // floor damage
        return Math.floor(damage);
    }

    function applyHPBasedModifiers(player, prop, modifiers, changedHPBasedEffects, changedModifiers, whenBelow = false) {
        if (whenBelow ? !player.hpBasedEffects[prop] : player.hpBasedEffects[prop]) {
            for (let modifier in modifiers) {
                addTempModifier(player, modifier, modifiers[modifier]);
                changedModifiers[modifier] = true;
            }
        } else if (changedHPBasedEffects[prop]) {
            for (let modifier in modifiers) {
                changedModifiers[modifier] = true;
            }
        }
    }

    function checkChangedCreasedModifiers(changedModifiers, modifiers) {
        let changed = false;
        modifiers.forEach(modifier => {
            changed = checkChangedModifier(changedModifiers, 'increased' + modifier) || changed;
            changed = checkChangedModifier(changedModifiers, 'decreased' + modifier) || changed;
        });
        return changed;
    }

    function checkChangedModifier(changedModifiers, modifier) {
        if (changedModifiers[modifier]) {
            delete changedModifiers[modifier];
            return true;
        } else {
        }
        return false;
    }

    function computeTempModifiers(stats, player, enemy, turns = 0, changedHPBasedEffects = {}) {
        player.tempModifiers = {};
        const changedModifiers = {};
        // enemy special attack modifiers
        Object.getOwnPropertyNames(player.activeSpecialAttacks.fromEnemy).forEach(id => {
            const modifiers = enemySpecialAttacks[id].modifiers;
            player.activeSpecialAttacks.fromEnemy[id] -= turns;
            Object.getOwnPropertyNames(modifiers).forEach(modifier => {
                changedModifiers[modifier] = true;
                if (player.activeSpecialAttacks.fromEnemy[id] <= 0) {
                    player.activeSpecialAttacks.fromEnemy[id] = undefined;
                } else {
                    addTempModifier(player, modifier, modifiers[modifier])
                }
            });
        });
        // hp based modifiers
        if (stats.player.activeItems.guardianAmulet) {
            applyHPBasedModifiers(player, 'guardianAmuletAbove', constantModifiers.guardianAmulet, changedHPBasedEffects, changedModifiers, true);
        }
        if (stats.combatData.modifiers.summoningSynergy_1_2) {
            applyHPBasedModifiers(player, 'appliedSynergy_1_2', constantModifiers.occultist, changedHPBasedEffects, changedModifiers, false);
        }
        // process changed modifiers
        if (checkChangedCreasedModifiers(changedModifiers, ['PlayerAttackSpeedPercent'])) {
            player.recompute.speed = true;
        }
        if (checkChangedCreasedModifiers(changedModifiers, ['MeleeEvasion', 'RangedEvasion', 'MagicEvasion'])) {
            enemy.recompute.accuracy = true;
        }
        if (checkChangedCreasedModifiers(changedModifiers, ['EnemyMeleeEvasion', 'EnemyRangedEvasion', 'EnemyMagicEvasion'])) {
            player.recompute.accuracy = true;
        }
        if (checkChangedCreasedModifiers(changedModifiers, ['DamageReduction'])) {
            player.recompute.damageReduction = true;
        }
        if (!stats.warnedUnknownModifiers && Object.getOwnPropertyNames(changedModifiers).length > 0) {
            console.warn('Unknown enemy special attack modifiers!', {...changedModifiers});
            stats.warnedUnknownModifiers = true;
        }
    }

    function addTempModifier(player, modifier, value) {
        if (player.tempModifiers[modifier] === undefined) {
            player.tempModifiers[modifier] = 0;
        }
        player.tempModifiers[modifier] += value;
    }

    function removeTempModifier(player, modifier, value) {
        addTempModifier(player, modifier, -value);
    }

    function checkBelowHPThreshold(player, factor, prop) {
        const check = player.hitpoints < player.maxHitpoints * factor && player.hpBasedEffects[prop];
        if (check) {
            delete player.hpBasedEffects[prop];
        }
        return check;
    }

    function checkAboveHPThreshold(player, factor, prop) {
        const check = player.hitpoints >= player.maxHitpoints * factor && !player.hpBasedEffects[prop];
        if (check) {
            player.hpBasedEffects[prop] = true;
        }
        return check;
    }

    function updatePlayerHPBasedEffect(stats, player, enemy, factor, prop) {
        if (checkBelowHPThreshold(player, factor, prop)) {
            computeTempModifiers(stats, player, enemy, 0, {prop: true});
        } else if (checkAboveHPThreshold(player, factor, prop)) {
            computeTempModifiers(stats, player, enemy, 0, {prop: true});
        }
    }

    function updatePlayerHPBasedEffects(stats, player, enemy) {
        if (stats.player.activeItems.guardianAmulet) {
            updatePlayerHPBasedEffect(stats, player, enemy, 1 / 2, 'guardianAmuletAbove');
        }
        if (stats.combatData.modifiers.summoningSynergy_1_2) {
            updatePlayerHPBasedEffect(stats, player, enemy, 1, 'appliedSynergy_1_2');
        }
    }

    function initPlayerHPBasedEffects(stats, player) {
        if (stats.player.activeItems.guardianAmulet) {
            player.hpBasedEffects.guardianAmuletAbove = true;
        }
        if (stats.combatData.modifiers.summoningSynergy_1_2) {
            player.hpBasedEffects.appliedSynergy_1_2 = true;
        }
    }

    function autoEat(stats, player) {
        if (stats.player.autoEat.eatAt <= 0 || stats.player.foodHeal <= 0) {
            return;
        }
        const eatAt = stats.player.autoEat.eatAt / 100 * player.maxHitpoints;
        if (player.hitpoints > eatAt) {
            return;
        }
        const maxHP = stats.player.autoEat.maxHP / 100 * player.maxHitpoints;
        const healAmt = Math.floor(stats.player.foodHeal * stats.player.autoEat.efficiency / 100);
        const heals = Math.ceil((maxHP - player.hitpoints) / healAmt);
        stats.player.ate += heals;
        player.hitpoints += heals * healAmt;
        player.hitpoints = Math.min(player.hitpoints, player.maxHitpoints);
    }

    function processPlayerAttackResult(stats, attackResult, player, enemy) {
        // damage
        const damage = dealDamageToEnemy(stats, enemy, attackResult.damageToEnemy,
            attackResult.isSpecial ? attackSources.special : attackSources.regular, true);
        // XP Tracking
        if (damage > 0) {
            let xpToAdd = damage / numberMultiplier * 4;
            if (xpToAdd < 4) {
                xpToAdd = 4;
            }
            stats.totalHpXP += damage / numberMultiplier * 1.33;
            stats.totalPrayerXP += damage * stats.player.prayerXpPerDamage;
            stats.totalCombatXP += xpToAdd;
            const currentSpeed = getSpeed(stats, player);
            if (stats.player.prayerXpPerDamage > 0) {
                stats.petRolls.Prayer[currentSpeed] = (stats.petRolls.Prayer[currentSpeed] || 0) + 1;
            }
        }
        return damage;
    }

    function playerUsePreAttackSpecial(stats, enemy, player) {
        if (stats.player.isMelee && player.currentSpecial.decreasedMeleeEvasion) {
            enemy.decreasedMeleeEvasion = player.currentSpecial.decreasedMeleeEvasion;
            player.recompute.accuracy = true;
        }
        if (stats.player.isRanged && player.currentSpecial.decreasedRangedEvasion) {
            enemy.decreasedRangedEvasion = player.currentSpecial.decreasedRangedEvasion;
            player.recompute.accuracy = true;
        }
        if (stats.player.isMagic && player.currentSpecial.decreasedMagicEvasion) {
            enemy.decreasedMagicEvasion = player.currentSpecial.decreasedMagicEvasion;
            player.recompute.accuracy = true;
        }
        if (player.currentSpecial.decreasedAccuracy && !enemy.decreasedAccuracy) {
            enemy.decreasedAccuracy = player.currentSpecial.decreasedAccuracy;
            enemy.recompute.accuracy = true;
        }
    }

    function playerUseCurse(stats, player, enemy) {
        if (!stats.player.canCurse || enemy.isCursed) {
            return;
        }
        stats.curseCasts++;
        enemy.isCursed = true;
        enemy.curseTurns = 3;
        // Update the curses that change stats
        switch (enemy.curse.type) {
            case 'Blinding':
                enemy.recompute.accuracy = true;
                break;
            case 'Soul Split':
            case 'Decay':
                player.recompute.accuracy = true;
                break;
            case 'Weakening':
                enemy.maxHit = Math.floor(stats.enemy.baseMaximumStrengthRoll * numberMultiplier * enemy.curse.maxHitDebuff);
                break;
        }
    }

    function rollPlayerHit(stats, player, enemy, rolls = 1) {
        let roll = 100;
        for (let i = 0; i < rolls; i++) {
            let rolledChance = Math.floor(Math.random() * 100);
            if (rolledChance < roll) {
                roll = rolledChance;
            }
        }
        return getAccuracy(stats, player, enemy) > roll;
    }

    function playerDoAttack(stats, player, enemy, isSpecial, isMulti) {
        stats.playerAttackCalls++;
        // Apply pre-attack special effects
        if (isSpecial) {
            playerUsePreAttackSpecial(stats, enemy, player);
        }
        // Apply curse
        playerUseCurse(stats, player, enemy);
        // default return values
        const attackResult = {
            attackHits: false,
            isSpecial: isSpecial,
            statusEffect: {},
        };
        let attackHits;
        if (canNotDodge(enemy) || (isSpecial && player.currentSpecial.forceHit)) {
            attackHits = true;
        } else {
            // Roll for hit
            attackHits = rollPlayerHit(stats, player, enemy, player.attackRolls);
        }
        // roll for pets
        const currentSpeed = getSpeed(stats, player);
        stats.petRolls.other[currentSpeed] = (stats.petRolls.other[currentSpeed] || 0) + 1;
        // calculate damage
        if (!attackHits) {
            attackResult.damageToEnemy = 0;
        } else {
            attackResult.damageToEnemy = playerCalculateDamage(stats, enemy, isSpecial, player);
        }
        // calculate effective damage and deal damage
        attackResult.damageToEnemy = processPlayerAttackResult(stats, attackResult, player, enemy);
        // reflect melee damage
        if (enemy.reflectMelee) {
            dealDamage(stats, enemy, player, enemy.reflectMelee * numberMultiplier, attackSources.reflect);
        }
        if (enemy.reflectRanged) {
            dealDamage(stats, enemy, player, enemy.reflectRanged * numberMultiplier, attackSources.reflect);
        }
        if (enemy.reflectMagic) {
            dealDamage(stats, enemy, player, enemy.reflectMagic * numberMultiplier, attackSources.reflect);
        }
        ////////////////////
        // status effects //
        ////////////////////
        if (!attackHits || isMulti) {
            // exit early
            return;
        }
        let statusEffect = {...player.currentSpecial};
        // Fighter amulet stun overrides special attack stun
        if (stats.player.activeItems.fighterAmulet && stats.player.isMelee && attackResult.damageToEnemy >= stats.player.maxHit * 0.70) {
            statusEffect.canStun = true;
            statusEffect.stunChance = undefined;
            statusEffect.stunTurns = 1;
        }
        // life steal
        let lifeSteal = 0;
        if (isSpecial && player.currentSpecial.healsFor) {
            lifeSteal += player.currentSpecial.healsFor * 100;
        }
        if (player.equipmentStats.spellHeal && stats.player.isMagic) {
            lifeSteal += player.equipmentStats.spellHeal;
        }
        if (stats.player.lifesteal !== 0) {
            // fervor + passive item stat
            lifeSteal += stats.player.lifesteal;
        }
        // TODO synergy 12, 14
        // TODO synergy 2, 13
        if (lifeSteal > 0) {
            // TODO synergy 2, 12
            healDamage(stats, enemy, player, attackResult.damageToEnemy * lifeSteal / 100)
        }
        // TODO synergy 8, 12
        // confetti crossbow
        if (stats.player.activeItems.confettiCrossbow) {
            // Add gp from this weapon
            let gpMultiplier = stats.player.startingGP / 20000000;
            const modifiers = constantModifiers.confettiCrossbow;
            if (gpMultiplier > modifiers.gpMultiplierCap) {
                gpMultiplier = modifiers.gpMultiplierCap;
            } else if (gpMultiplier < modifiers.gpMultiplierMin) {
                gpMultiplier = modifiers.gpMultiplierMin;
            }
            const damageToUse = Math.min(enemy.hitpoints, attackResult.damageToEnemy) * 10 / numberMultiplier;
            stats.gpGained += damageToUse * gpMultiplier * (
                1
                + mergePlayerModifiers(player, 'GPGlobal') / 100
                + mergePlayerModifiers(player, 'GPFromMonsters') / 100
            );
        }
        // burn
        if (Math.random() < mergePlayerModifiers(player, 'ChanceToApplyBurn')) {
            attackResult.statusEffect.burnDebuff = 15;
        }
        // return the result of the attack
        attackResult.attackHits = true;
        attackResult.statusEffect = statusEffect;
        // apply any status effects
        applyStatus(stats, attackResult.statusEffect, attackResult.damageToEnemy, player, enemy)
    }

    function enemyCalculateDamage(stats, enemy, isSpecial, currentSpecial, player) {
        let damage = setDamage(enemy, stats.enemy, player, stats.player, isSpecial, currentSpecial);
        if (damage === undefined) {
            damage = Math.floor(Math.random() * enemy.maxHit) + 1;
        }
        damage *= 1 + getEnemyDamageModifier(enemy, player) / 100;
        damage -= Math.floor((getPlayerDR(stats, player) / 100) * damage);
        return damage;
    }

    function setDamage(actor, actorStats, target, targetStats, isSpecial, currentSpecial) {
        if (!isSpecial) {
            return undefined;
        }
        let damage = undefined;
        let cbTriangleAlreadyApplied = false;
        // check if any set damage cases apply
        if (currentSpecial.setHPDamage !== undefined) {
            const setHPDamage = currentSpecial.setHPDamage / 100 * actor.hitpoints;
            let setHPDamageMinimum = actor.hitpoints / 100;
            if (currentSpecial.setHPDamageMinimum !== undefined) {
                setHPDamageMinimum = currentSpecial.setHPDamageMinimum / 100 * actor.hitpoints;
            }
            damage = Math.floor(Math.random() * (setHPDamage - setHPDamageMinimum) + setHPDamageMinimum);
        } else if (currentSpecial.customDamageModifier !== undefined) {
            damage = Math.floor(targetStats.maxHit * (1 - currentSpecial.customDamageModifier / 100));
        } else if (currentSpecial.setDamage !== null && currentSpecial.setDamage !== undefined) {
            damage = currentSpecial.setDamage * numberMultiplier;
        } else if (isSpecial && currentSpecial.maxHit) {
            damage = actorStats.maxHit;
            cbTriangleAlreadyApplied = true;
        } else if (isSpecial && currentSpecial.stormsnap) {
            damage = (6 + 6 * actorStats.levels.Magic) * numberMultiplier / 10;
        } else {
            return undefined
        }
        // cb triangle damage modifier
        if (!cbTriangleAlreadyApplied && actor.damageModifier) {
            damage *= actor.damageModifier;
        }
        return damage;
    }

    function getPlayerDamageModifier(player, enemy) {
        let dmgModifier = 0;
        // anguish curse
        if (enemy.isCursed && enemy.curse.type === 'Anguish') {
            dmgModifier += enemy.curse.damageMult;
        }
        // stun
        if (enemy.isStunned) {
            dmgModifier += 30;
        }
        //sleep
        if (enemy.isSleeping) {
            dmgModifier += 20;
        }
        // monster specific modifiers
        dmgModifier += player.increasedDamageToMonster;
        //
        return dmgModifier;
    }

    // get stun and sleep enemy damage modifiers
    function getEnemyDamageModifier(enemy, player) {
        let dmgModifier = 0;
        if (!applyEnemyStunSleepDamage) {
            return dmgModifier;
        }
        // stun
        if (player.isStunned) {
            dmgModifier += 30;
        }
        //sleep
        if (player.isSleeping) {
            dmgModifier += 20;
        }
        return dmgModifier;
    }

    function getPlayerDR(stats, player, noTriangle = false) {
        if (player.recompute.damageReduction) {
            setPlayerDR(stats, player);
            player.recompute.damageReduction = false;
        }
        if (noTriangle) {
            return player.damageReductionNoTriangle;
        }
        return player.damageReduction;
    }

    function setPlayerDR(stats, player) {
        let damageReduction = player.baseStats.damageReduction + mergePlayerModifiers(player, 'DamageReduction');
        // DR cap
        if (damageReduction > 95) {
            damageReduction = 95;
        }
        // apply mark of death
        if (player.markOfDeath)
            damageReduction = Math.floor(damageReduction / 2);
        // recompute synergy 1 13 if required
        if (stats.combatData.modifiers.summoningSynergy_1_13 && player.damageReductionNoTriangle !== damageReduction) {
            player.baseStats.defenceBonus -= player.damageReductionNoTriangle;
            player.baseStats.defenceBonusRanged -= player.damageReductionNoTriangle;
            player.baseStats.defenceBonus += damageReduction;
            player.baseStats.defenceBonusRanged += damageReduction;
        }
        // cache dr without triangle
        player.damageReductionNoTriangle = damageReduction;
        // apply triangle last
        damageReduction = Math.floor(damageReduction * player.reductionModifier);
        // cache
        player.damageReduction = damageReduction;
    }

    function playerCalculateDamage(stats, enemy, isSpecial, player) {
        let damage = setDamage(player, stats.player, enemy, stats.enemy, isSpecial, player.currentSpecial);
        // Calculate attack Damage
        if (damage === undefined) {
            // roll hit based on max hit, max hit already takes cb triangle into account !
            if (player.alwaysMaxHit) {
                damage = stats.player.maxHit;
            } else {
                damage = rollForDamage(stats, player);
            }
        }
        // special attack damage multiplier
        if (isSpecial && player.currentSpecial.damageMultiplier) {
            damage *= player.currentSpecial.damageMultiplier;
        }
        // common modifiers
        if (!stats.player.isMagic || !stats.player.usingAncient) {
            damage = damage * (1 + getPlayerDamageModifier(player, enemy) / 100)
        }
        // deadeye amulet
        if (stats.player.activeItems.deadeyeAmulet && stats.player.isRanged) {
            damage *= critDamageModifier(damage);
        }
        return damage;
    }

    function resetCommonStats(common, stats) {
        common.currentSpecial = {};
        // action
        common.isActing = true;
        common.attackTimer = 0;
        common.isAttacking = false;
        // stun
        common.isStunned = false;
        common.stunTurns = 0;
        // sleep
        common.isSleeping = false;
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
        common.attackSpeedDebuffTurns = 0;
        common.attackSpeedDebuff = 0;
        common.increasedAttackSpeed = 0;
        // buff
        common.activeBuffs = false;
        common.buffTurns = 0;
        common.increasedDamageReduction = 0;
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
        // debuffs
        common.magicEvasionDebuff = 0;
        common.meleeEvasionDebuff = 0;
        common.rangedEvasionDebuff = 0;
        common.decreasedAccuracy = 0;
        // hp
        common.maxHitpoints = stats.maxHitpoints | (stats.baseMaxHitpoints * numberMultiplier);
        // recompute flags
        common.recompute = {
            speed: true,
            accuracy: true,
            damageReduction: true,
        }
    }

    function resetPlayer(stats, combatData, player, enemy) {
        resetCommonStats(player, stats.player);
        if (player.cache === undefined) {
            player.cache = {}
        }
        player.isPlayer = true;
        if (!player.hitpoints || player.hitpoints <= 0) {
            player.hitpoints = stats.player.maxHitpoints;
        }
        player.alwaysMaxHit = stats.player.minHit + 1 >= stats.player.maxHit; // Determine if player always hits for maxHit
        // copy from combatData;
        player.equipmentStats = combatData.equipmentStats;
        player.combatStats = combatData.combatStats;
        player.damageReduction = player.combatStats.damageReduction;
        player.damageReductionNoTriangle = player.combatStats.damageReduction;
        player.attackStyle = combatData.attackStyle;
        player.prayerBonus = combatData.prayerBonus;
        player.baseStats = combatData.baseStats;
        // modifiers
        player.baseModifiers = combatData.modifiers;
        player.tempModifiers = {};
        player.activeSpecialAttacks = {
            fromEnemy: {},
            fromPlayer: {},
        };
        player.increasedDamageToMonster = stats.player.dmgModifier; // combines all the (in|de)creasedDamageToX modifiers
        // compute player hp based effects
        player.hpBasedEffects = {};
        initPlayerHPBasedEffects(stats, player);
        updatePlayerHPBasedEffects(stats, player, enemy);
        // precompute number of attack rolls
        player.attackRolls = 1 + mergePlayerModifiers(player, 'AttackRolls');
        // aurora
        player.attackSpeedBuff = stats.player.decreasedAttackSpeed;
        // summon timer
        player.summonTimer = stats.player.summoningMaxHit > 0 ? 3000 : Infinity;
        // init
        player.actionsTaken = 0;
    }

    function mergePlayerModifiers(player, modifier, both = true) {
        const hash = Object.getOwnPropertyNames(player.activeSpecialAttacks.fromEnemy).join('-')
            + '+' + Object.getOwnPropertyNames(player.activeSpecialAttacks.fromPlayer).join('-')
            + '+' + Object.getOwnPropertyNames(player.hpBasedEffects).join('-');
        if (player.cache[modifier] === undefined) {
            player.cache[modifier] = {};
        }
        const cache = player.cache[modifier];
        if (cache[hash] !== undefined) {
            return cache[hash];
        }
        if (both) {
            const result = mergePlayerModifiers(player, 'increased' + modifier, false)
                - mergePlayerModifiers(player, 'decreased' + modifier, false);
            cache[hash] = result;
            return result;
        }
        const base = player.baseModifiers[modifier];
        const temp = player.tempModifiers[modifier];
        if (temp === undefined) {
            return base;
        }
        if (isNaN(base)) {
            // if it is an array-type modifier, merge two arrays, might be too slow in practice
            const result = [];
            const known = {};
            for (const entry in base) {
                known[entry.id] = result.length;
                result.push({...entry});
            }
            for (const t in temp) {
                let entry;
                if (t.length) {
                    entry = {id: t[0], value: t[1]};
                } else {
                    entry = {id: t.id, value: t.value};
                }
                const idx = known[entry.id];
                if (idx !== undefined) {
                    result[idx].value += entry.value;
                } else {
                    known[entry.id] = result.length;
                    result.push({...entry});
                }
            }
            return result;
        }
        // if it is a number-type modifier, just add them up
        return base + temp;
    }

    function applyModifier(baseStat, modifier, type = 0) {
        if (type === 0) {
            return Math.floor(baseStat * (1 + modifier / 100));
        } else if (type === 1) {
            return baseStat + modifier;
        }
    }


    function resetEnemy(stats, enemy) {
        resetCommonStats(enemy, stats.enemy);
        enemy.isPlayer = false;
        enemy.monsterID = stats.enemy.monsterID;
        enemy.hitpoints = enemy.maxHitpoints;
        enemy.damageReduction = 0;
        enemy.reflectMelee = 0;
        enemy.reflectRanged = 0;
        enemy.reflectMagic = 0;
        enemy.specialID = null;
        enemy.attackInterval = 0;
        enemy.maxAttackRoll = stats.enemy.baseMaximumAttackRoll;
        enemy.maxHit = Math.floor(stats.enemy.baseMaximumStrengthRoll * numberMultiplier);
        enemy.maxDefRoll = stats.enemy.baseMaximumDefenceRoll;
        enemy.maxRngDefRoll = stats.enemy.baseMaximumRangedDefenceRoll;
        enemy.maxMagDefRoll = stats.enemy.baseMaximumMagicDefenceRoll;
        enemy.decreasedRangedEvasion = 0;
        enemy.meleeEvasionBuff = 1;
        enemy.magicEvasionBuff = 1;
        enemy.rangedEvasionBuff = 1;
        enemy.attackType = stats.enemy.attackType;
        enemy.curse = {};
    }

    function gatherStatistics(stats) {
        const result = {
            // max dmg stats
            maxHit: stats.player.maxHit,
            maxAttackRoll: stats.player.maxAttackRoll,
        };

        // kill time statistics
        stats.killTimes = stats.killTimes.map(t => t + enemySpawnTimer);
        result.killTimeMean = stats.killTimes.reduce((acc, val) => acc + val, 0) / stats.killTimes.length;
        const standardDeviation = (arr, mean) => {
            let x = arr.reduce((acc, val) => acc.concat((val - mean) ** 2), []);
            x = x.reduce((acc, val) => acc + val, 0);
            x /= arr.length - 1;
            return Math.sqrt(x);
        };
        result.killTimeSD = standardDeviation(stats.killTimes, result.killTimeMean);
        result.killTimeVar = result.killTimeSD ** 2
        result.killTimes = stats.killTimes;

        // special rate
        const specialAttacks = stats.player.tracking[attackSources.special].attacks;
        const regularAttacks = stats.player.tracking[attackSources.regular].attacks;
        result.specialAttackRate = specialAttacks / (regularAttacks + specialAttacks)

        // compute statistics for every relevant attack type
        computeAttackStatistics('Player', stats.player.tracking, result);
        computeAttackStatistics('Enemy', stats.enemy.tracking, result);

        // return dictionary
        return result;
    }

    function computeAttackStatistics(id, counts, result) {
        // gather stats for each relevant damage type
        for (const i in counts) {
            const x = counts[i];
            if (!x || x.attacks === 0) {
                // filter dmg types that did not occur
                return;
            }
            result[`${x.name}${id}AttackCount`] = x.attacks;
            result[`${x.name}${id}Accuracy`] = x.hits / x.attacks;
            result[`${x.name}${id}Damage`] = x.damage;
            result[`${x.name}${id}DamagePerAttack`] = x.damage / x.attacks;
            result[`${x.name}${id}DamagePerHit`] = x.damage / x.hits;
        }
    }

    function simulationResult(stats, trials, tooManyActions, player) {
        /** @type {MonsterSimResult} */
        const simResult = {
            simSuccess: true,
            petRolls: {},
            tooManyActions: tooManyActions,
            monsterID: stats.enemy.monsterID,
        };

        simResult.verbose = gatherStatistics(stats);
        if (verbose) {
            console.log(simResult.verbose);
        }

        const successes = trials - stats.player.deaths;

        // synergies
        const globalGPMultiplier = 1 + mergePlayerModifiers(player, 'GPGlobal') / 100;
        if (stats.player.isMelee && stats.combatData.modifiers.summoningSynergy_0_6) {
            stats.gpGained += stats.player.inflictedDamage / 10
                * stats.combatData.modifiers.summoningSynergy_0_6 / 100
                * numberMultiplier
                * globalGPMultiplier;
        }
        if (stats.player.isRanged && stats.combatData.modifiers.summoningSynergy_0_7) {
            stats.gpGained += stats.player.inflictedDamage / 10
                * stats.combatData.modifiers.summoningSynergy_0_7 / 100
                * numberMultiplier
                * globalGPMultiplier;
        }
        if (stats.player.isMagic && stats.combatData.modifiers.summoningSynergy_0_8) {
            stats.gpGained += stats.player.inflictedDamage / 10
                * stats.combatData.modifiers.summoningSynergy_0_8 / 100
                * numberMultiplier
                * globalGPMultiplier;
        }
        if (stats.combatData.modifiers.summoningSynergy_0_1) {
            stats.gpGained += Math.max(
                stats.enemy.baseMaximumDefenceRoll,
                stats.enemy.baseMaximumRangedDefenceRoll,
                stats.enemy.baseMaximumMagicDefenceRoll)
                * stats.combatData.modifiers.summoningSynergy_0_1 / 100
                * globalGPMultiplier
                * successes;
        }
        // other post processing
        stats.gpGained += stats.player.inflictedHits * (mergePlayerModifiers(player, 'GPOnEnemyHit') | 0);
        simResult.burningEnemyKilledRate = stats.burningEnemyKilled / trials;

        // convert gains to average rates
        simResult.xpPerHit = stats.totalCombatXP / stats.playerAttackCalls;
        // xp per second
        const totalTime = (trials - tooManyActions) * enemySpawnTimer + stats.totalTime;
        simResult.xpPerSecond = stats.totalCombatXP / totalTime * 1000;
        simResult.hpXpPerSecond = stats.totalHpXP / totalTime * 1000;
        simResult.prayerXpPerSecond = stats.totalPrayerXP / totalTime * 1000;
        simResult.summoningXpPerSecond = stats.combatData.summoningXPPerHit * stats.player.tracking[attackSources.summon].attacks / totalTime * 1000;
        simResult.tabletsUsedPerSecond = stats.player.tracking[attackSources.summon].attacks / totalTime * 1000;
        simResult.tabletsUsedPerSecond *= 1 - mergePlayerModifiers(player, 'SummoningChargePreservation') / 100;
        if (stats.player.synergy) {
            simResult.summoningXpPerSecond *= 2;
            simResult.tabletsUsedPerSecond *= 2;
        }
        simResult.summoningXpPerSecond *= 1 + stats.player.summoningXpBonus / 100;
        // resource use
        // pp
        simResult.ppConsumedPerSecond = stats.playerAttackCalls * stats.player.prayerPointsPerAttack / totalTime * 1000;
        simResult.ppConsumedPerSecond += stats.enemyAttackCalls * stats.player.prayerPointsPerEnemy / totalTime * 1000;
        simResult.ppConsumedPerSecond += stats.player.prayerPointsPerHeal / hitpointRegenInterval * 1000;
        // hp
        let damage = stats.player.damageTaken;
        damage -= stats.player.damageHealed;
        simResult.hpPerSecond = Math.max(0, damage / totalTime * 1000);
        // attacks
        simResult.attacksTakenPerSecond = stats.enemyAttackCalls / totalTime * 1000;
        simResult.attacksMadePerSecond = stats.playerAttackCalls / totalTime * 1000;
        // ammo
        simResult.ammoUsedPerSecond = stats.player.isRanged ? simResult.attacksMadePerSecond : 0;
        simResult.ammoUsedPerSecond *= 1 - stats.player.ammoPreservation / 100;
        // runes
        simResult.spellCastsPerSecond = stats.spellCasts / totalTime * 1000;
        simResult.curseCastsPerSecond = stats.curseCasts / totalTime * 1000;
        // damage
        simResult.avgHitDmg = stats.enemy.damageTaken / stats.playerAttackCalls;
        simResult.dmgPerSecond = stats.enemy.damageTaken / totalTime * 1000;
        // deaths and extreme damage
        simResult.deathRate = stats.player.deaths / (trials - tooManyActions);
        simResult.highestDamageTaken = stats.player.highestDamageTaken;
        simResult.lowestHitpoints = stats.player.lowestHitpoints;
        if (stats.player.autoEat.manual) {
            // TODO: use a more detailed manual eating simulation?
            simResult.atePerSecond = Math.max(0, damage / stats.player.foodHeal / totalTime * 1000);
        } else {
            simResult.atePerSecond = stats.player.ate / totalTime * 1000;
        }
        if (!isFinite(simResult.atePerSecond)) {
            simResult.atePerSecond = NaN;
        }
        // gp
        simResult.gpFromDamagePerSecond = stats.gpGained / totalTime * 1000;

        // stats depending on kills
        if (tooManyActions === 0 && successes) {
            // kill time
            simResult.avgKillTime = totalTime / successes;
            simResult.killTimeS = simResult.avgKillTime / 1000;
            simResult.killsPerSecond = 1 / simResult.killTimeS;
        } else {
            // kill time
            simResult.avgKillTime = NaN;
            simResult.killTimeS = NaN;
            simResult.killsPerSecond = 0;
        }

        // Throw pet rolls in here to be further processed later
        Object.keys(stats.petRolls).forEach((petType) =>
            simResult.petRolls[petType] = Object.keys(stats.petRolls[petType]).map(attackSpeed => ({
                speed: parseInt(attackSpeed),
                rollsPerSecond: stats.petRolls[petType][attackSpeed] / totalTime * 1000,
            }))
        );
        // return successful results
        return simResult;
    }

    function getAccuracy(stats, actor, target) {
        if (actor.recompute.accuracy) {
            setAccuracy(stats, actor, target);
            actor.recompute.accuracy = false;
        }
        return actor.accuracy;
    }

    // TODO: duplicated in injectable/Simulator.js
    /**
     * Sets the accuracy of actor vs target
     */
    function setAccuracy(stats, actor, target) {
        const actorStats = actor.isPlayer ? stats.player : stats.enemy;
        const targetStats = target.isPlayer ? stats.player : stats.enemy;
        // if target is player using protection prayer: return early
        if (target.isPlayer && targetStats.isProtected) {
            actor.accuracy = protectFromValue;
            return;
        }
        // determine attack roll
        let maxAttackRoll;
        if (actor.isPlayer) {
            maxAttackRoll = actor.combatStats.unmodifiedAttackRoll;
            let multiplier = 1 + mergePlayerModifiers(actor, 'GlobalAccuracy') / 100 + actor.decreasedAccuracy
            if (actorStats.isMelee) {
                multiplier += mergePlayerModifiers(actor, 'MeleeAccuracyBonus') / 100;
            } else if (actorStats.isRanged) {
                multiplier += mergePlayerModifiers(actor, 'RangedAccuracyBonus') / 100;
            } else if (actorStats.isMagic) {
                multiplier += mergePlayerModifiers(actor, 'MagicAccuracyBonus') / 100;
            }
            maxAttackRoll = maxAttackRoll * multiplier;
        } else {
            maxAttackRoll = actorStats.baseMaximumAttackRoll;
            if (actor.decreasedAccuracy) {
                maxAttackRoll = Math.floor(maxAttackRoll * (1 - actor.decreasedAccuracy / 100));
            }
            if (actor.isCursed && actor.curse.accuracyDebuff) {
                maxAttackRoll = Math.floor(maxAttackRoll * actor.curse.accuracyDebuff);
            }
        }
        // determine evasion roll
        if (target.isPlayer) {
            calculatePlayerEvasionRating(stats, target);
        } else {
            // Adjust ancient magick forcehit
            if (actorStats.usingAncient && (actorStats.specialData[0].forceHit || actorStats.specialData[0].checkForceHit)) {
                actorStats.specialData[0].forceHit = maxAttackRoll > 20000;
                actorStats.specialData[0].checkForceHit = true;
            }
            setEvasionDebuffsEnemy(stats, target, actor);
        }
        // determine relevant defence roll
        let targetDefRoll;
        if (actorStats.isMelee) {
            targetDefRoll = target.maxDefRoll;
        } else if (actorStats.isRanged) {
            targetDefRoll = target.maxRngDefRoll;
        } else {
            targetDefRoll = target.maxMagDefRoll;
        }
        // accuracy based on attack roll and defence roll
        let acc;
        if (maxAttackRoll < targetDefRoll) {
            acc = (0.5 * maxAttackRoll / targetDefRoll) * 100;
        } else {
            acc = (1 - 0.5 * targetDefRoll / maxAttackRoll) * 100;
        }
        actor.accuracy = acc;
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
                enemy.curse.damageMult = effectValue;
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
     * @param {stats.player} stats.player
     * @returns {number} damage
     */
    function rollForDamage(stats, player) {
        let minHitIncrease = 0;
        minHitIncrease += Math.floor(stats.player.maxHit * mergePlayerModifiers(player, 'increasedMinHitBasedOnMaxHit', false) / 100);
        minHitIncrease -= Math.floor(stats.player.maxHit * mergePlayerModifiers(player, 'decreasedMinHitBasedOnMaxHit', false) / 100);
        // static min hit increase (magic gear and Charged aurora)
        minHitIncrease += stats.player.minHit;
        // if min is equal to or larger than max, roll max
        if (minHitIncrease + 1 >= stats.player.maxHit) {
            return stats.player.maxHit;
        }
        // roll between min and max
        return Math.ceil(Math.random() * (stats.player.maxHit - stats.player.minHit)) + stats.player.minHit;
    }

    /**
     * Rolls for a chance of Deadeye Amulet's crit damage
     * @param {damageToEnemy} damageToEnemy
     * @returns {damageToEnemy} `damageToEnemy`, possibly multiplied by Deadeye Amulet's crit bonus
     */
    function critDamageModifier(damageToEnemy) {
        const chance = Math.random() * 100;
        if (chance < constantModifiers.deadeyeAmulet.chanceToCrit) {
            return constantModifiers.deadeyeAmulet.critDamage;
        }
        return 1;
    }

    /**
     * Modifies the stats of the enemy by the curse
     * @param {stats.enemy} stats.enemy
     * @param {Object} enemy
     * @param {Object} player
     */
    function setEvasionDebuffsEnemy(stats, enemy, player) {
        const isCursed = enemy.isCursed && (enemy.curse.type === 'Decay' || enemy.curse.type === 'Soul Split');
        enemy.maxDefRoll = calculateEnemyEvasion(stats.enemy.baseMaximumDefenceRoll,
            mergePlayerModifiers(player, 'EnemyMeleeEvasion') + enemy.decreasedMeleeEvasion,
            enemy.meleeEvasionBuff,
            isCursed ? enemy.curse.meleeEvasionDebuff : 0);
        enemy.maxRngDefRoll = calculateEnemyEvasion(stats.enemy.baseMaximumRangedDefenceRoll,
            mergePlayerModifiers(player, 'EnemyRangedEvasion') + enemy.decreasedRangedEvasion,
            enemy.rangedEvasionBuff,
            isCursed ? enemy.curse.rangedEvasionDebuff : 0);
        enemy.maxMagDefRoll = calculateEnemyEvasion(stats.enemy.baseMaximumMagicDefenceRoll,
            mergePlayerModifiers(player, 'EnemyMagicEvasion') + enemy.decreasedMagicEvasion,
            enemy.magicEvasionBuff,
            isCursed ? enemy.curse.magicEvasionDebuff : 0);
    }

    function calculateEnemyEvasion(initial, decreasedEvasion, evasionBuff, curseEvasionDebuff) {
        let maxRoll = initial;
        if (decreasedEvasion) {
            maxRoll = Math.floor(maxRoll * (1 - decreasedEvasion / 100));
        }
        if (evasionBuff) {
            maxRoll = Math.floor(maxRoll * evasionBuff);
        }
        if (curseEvasionDebuff) {
            maxRoll = Math.floor(maxRoll * curseEvasionDebuff);
        }
        return maxRoll
    }

    /**
     * mimic calculatePlayerEvasionRating
     */
    function calculatePlayerEvasionRating(stats, player) {
        //Melee defence
        player.maxDefRoll = calculateGenericPlayerEvasionRating(
            player.combatStats.effectiveDefenceLevel,
            player.baseStats.defenceBonus,
            mergePlayerModifiers(player, 'MeleeEvasion'),
            player.meleeEvasionBuff,
        );
        //Ranged Defence
        player.maxRngDefRoll = calculateGenericPlayerEvasionRating(
            player.combatStats.effectiveRangedDefenceLevel,
            player.baseStats.defenceBonusRanged,
            mergePlayerModifiers(player, 'RangedEvasion'),
            player.rangedEvasionBuff,
        );
        //Magic Defence
        player.maxMagDefRoll = calculateGenericPlayerEvasionRating(
            player.combatStats.effectiveMagicDefenceLevel,
            player.baseStats.defenceBonusMagic,
            mergePlayerModifiers(player, 'MagicEvasion'),
            player.magicEvasionBuff,
        );
    }

    function calculateGenericPlayerEvasionRating(effectiveDefenceLevel, baseStat, increaseModifier, buff) {
        let maxDefRoll = Math.floor(effectiveDefenceLevel * (baseStat + 64));
        maxDefRoll = applyModifier(maxDefRoll, increaseModifier);
        //apply player buffs
        if (buff) {
            maxDefRoll = Math.floor(maxDefRoll * (1 + buff / 100));
        }
        return maxDefRoll;
    }

    // Slayer area effect value
    function calculateAreaEffectValue(stats, player) {
        let value = stats.player.slayerAreaEffectValue - mergePlayerModifiers(player, 'SlayerAreaEffectNegationFlat');
        if (value < 0) {
            value = 0;
        }
        return value;
    }

    function setAreaEffects(stats, combatData, player, enemy) {
        // 0: "Penumbra" - no area effect
        // 1: "Strange Cave" - no area effect
        // 2: "High Lands" - no area effect
        // 3: "Holy Isles" - no area effect
        // 4: "Forest of Goo" - no area effect
        // 5: "Desolate Plains" - no area effect
        // 6: "Runic Ruins" - reduced evasion rating
        if (stats.player.slayerArea === 6 && !stats.player.isMagic) {
            combatData.modifiers.decreasedMagicEvasion += calculateAreaEffectValue(stats, player);
        }
        // 7: "Arid Plains" - reduced food efficiency
        if (stats.player.slayerArea === 7) {
            stats.player.autoEat.efficiency -= calculateAreaEffectValue(stats, player);
        }
        // 8: "Shrouded Badlands" - reduced global accuracy
        if (stats.player.slayerArea === 8) {
            combatData.modifiers.decreasedGlobalAccuracy += calculateAreaEffectValue(stats, player);
        }
        // 9: "Perilous Peaks" - reduced evasion rating
        if (stats.player.slayerArea === 9) {
            combatData.modifiers.decreasedMeleeEvasion += calculateAreaEffectValue(stats, player);
            combatData.modifiers.decreasedRangedEvasion += calculateAreaEffectValue(stats, player);
            combatData.modifiers.decreasedMagicEvasion += calculateAreaEffectValue(stats, player);
        }
        // 10: "Dark Waters" - reduced player attack speed
        if (stats.player.slayerArea === 10) {
            combatData.modifiers.increasedPlayerAttackSpeedPercent += calculateAreaEffectValue(stats, player);
            resetPlayer(stats, combatData, player, enemy);
            player.recompute.speed = true;
            stats.player.attackSpeed = getSpeed(stats, player);
        }
    }

})();