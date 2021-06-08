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
    let deadeyeAmulet;
    let confettiCrossbow;
    let CURSEIDS;
    let applyEnemyStunSleepDamage;

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
            deadeyeAmulet = data.deadeyeAmulet;
            confettiCrossbow = data.confettiCrossbow;
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
        async simulateMonster(combatData, enemyStats, playerStats, trials, maxActions, forceFullSim) {
            // configure some additional default values for the `playerStats` and `enemyStats` objects
            playerStats.isPlayer = true;
            playerStats.damageTaken = 0;
            playerStats.damageHealed = 0;
            playerStats.deaths = 0;
            playerStats.ate = 0;
            playerStats.highestDamageTaken = 0;
            playerStats.lowestHitpoints = playerStats.maxHitpoints;
            playerStats.numberOfRegens = 0; // TODO: hook this up to rapid heal prayer and prayer potion usage
            playerStats.regularAttackCount = 0;
            playerStats.regularHitCount = 0;
            playerStats.regularDamage = 0;
            playerStats.specialAttackCount = 0;
            playerStats.specialHitCount = 0;
            playerStats.specialDamage = 0;
            enemyStats.isPlayer = false;
            enemyStats.damageTaken = 0;
            enemyStats.damageHealed = 0;
            enemyStats.regularAttackCount = 0;
            enemyStats.regularHitCount = 0;
            enemyStats.specialAttackCount = 0;
            enemyStats.specialHitCount = 0;
            // copy slayer area values to player stats
            playerStats.slayerArea = enemyStats.slayerArea;
            playerStats.slayerAreaEffectValue = enemyStats.slayerAreaEffectValue;

            // Start Monte Carlo simulation
            let enemyKills = 0;

            // Stats from the simulation
            const stats = {
                totalTime: 0,
                killTimes: [],
                playerAttackCalls: 0,
                enemyAttackCalls: 0,
                totalCombatXP: 0,
                totalHpXP: 0,
                totalPrayerXP: 0,
                gpGainedFromDamage: 0,
                playerActions: 0,
                enemyActions: 0,
                /** @type {PetRolls} */
                petRolls: {Prayer: {}, other: {}},
                spellCasts: 0,
                curseCasts: 0,
            };

            if (!playerStats.isMelee && enemyStats.passiveID.includes(2)) {
                return {simSuccess: false, reason: 'wrong style'};
            }
            if (!playerStats.isRanged && enemyStats.passiveID.includes(3)) {
                return {simSuccess: false, reason: 'wrong style'};
            }
            if (!playerStats.isMagic && enemyStats.passiveID.includes(4)) {
                return {simSuccess: false, reason: 'wrong style'};
            }
            if (enemyStats.passiveID.includes(2) || enemyStats.passiveID.includes(3)) {
                // can't curse these monsters
                playerStats.canCurse = false;
            }

            // Start simulation for each trial
            this.cancelStatus = false;
            const player = {};
            // set initial regen interval
            player.regenTimer = Math.floor(Math.random() * hitpointRegenInterval);
            // Set Combat Triangle
            if (playerStats.hardcore) {
                player.reductionModifier = combatTriangle.hardcore.reductionModifier[playerStats.attackType][enemyStats.attackType];
                player.damageModifier = combatTriangle.hardcore.damageModifier[playerStats.attackType][enemyStats.attackType];
            } else {
                player.reductionModifier = combatTriangle.normal.reductionModifier[playerStats.attackType][enemyStats.attackType];
                player.damageModifier = combatTriangle.normal.damageModifier[playerStats.attackType][enemyStats.attackType];
            }
            // Multiply player max hit
            playerStats.maxHit = Math.floor(playerStats.maxHit * player.damageModifier);
            const enemy = {};
            let innerCount = 0;
            let tooManyActions = 0;
            resetPlayer(combatData, player, playerStats);
            // set slayer area effects
            setAreaEffects(combatData, player, playerStats);
            // track stats.totalTime of previous kill
            let timeStamp = 0;
            while (enemyKills < trials) {
                // Reset Timers and statuses
                resetPlayer(combatData, player, playerStats);
                // regen timer is not reset ! add respawn time to regen, and regen if required
                player.regenTimer -= enemySpawnTimer;
                if (player.regenTimer <= 0) {
                    regen(player, playerStats);
                }
                resetEnemy(enemy, enemyStats);
                if (playerStats.canCurse) {
                    setEnemyCurseValues(enemy, playerStats.curseID, playerStats.curseData.effectValue);
                }
                // Set accuracy based on protection prayers or stats
                setAccuracy(player, playerStats, enemy, enemyStats);
                setAccuracy(enemy, enemyStats, player, playerStats);
                // set action speed
                calculateSpeed(player, playerStats);
                player.actionTimer = player.currentSpeed;
                calculateSpeed(enemy, enemyStats);
                enemy.actionTimer = enemy.currentSpeed;

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
                            monsterID: enemyStats.monsterID,
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
                        regen(player, playerStats);
                    }

                    if (enemy.alive && player.isActing) {
                        if (player.actionTimer <= 0) {
                            verboseLog('player action');
                            playerAction(stats, player, playerStats, enemy, enemyStats);
                            // Multi attack once more when the monster died on the first hit
                            if (!enemy.alive && player.isAttacking && player.attackCount < player.countMax) {
                                stats.totalTime += player.attackInterval;
                            }
                        }
                    }
                    if (enemy.alive && player.isAttacking) {
                        if (player.attackTimer <= 0) {
                            verboseLog('player continue');
                            playerContinueAction(stats, player, playerStats, enemy, enemyStats);
                        }
                    }
                    if (enemy.alive && player.isBurning) {
                        if (player.burnTimer <= 0) {
                            verboseLog('player burning');
                            actorBurn(player, playerStats);
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
                            targetBleed(enemy, enemyStats, player, playerStats);
                        }
                    }
                    //enemy
                    if (enemy.alive && enemy.isActing) {
                        if (enemy.actionTimer <= 0) {
                            verboseLog('enemy action');
                            enemyAction(stats, player, playerStats, enemy, enemyStats);
                        }
                    }
                    if (enemy.alive && enemy.isAttacking) {
                        if (enemy.attackTimer <= 0) {
                            verboseLog('enemy continue');
                            enemyContinueAction(stats, player, playerStats, enemy, enemyStats);
                        }
                    }
                    if (enemy.alive && enemy.isBurning) {
                        if (enemy.burnTimer <= 0) {
                            verboseLog('enemy burning');
                            actorBurn(enemy, enemyStats);
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
                            targetBleed(player, playerStats, enemy, enemyStats);
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
                        monsterID: enemyStats.monsterID,
                        playerStats: {...playerStats},
                        player: {...player},
                        enemyStats: {...enemyStats},
                        enemy: {...enemy},
                    };
                }
                if (player.hitpoints <= 0) {
                    playerStats.deaths++;
                } else if (enemy.hitpoints > 0) {
                    tooManyActions++;
                    if (!forceFullSim) {
                        return {
                            simSuccess: false,
                            reason: 'too many actions',
                            monsterID: enemyStats.monsterID,
                        }
                    }
                }
                if (verbose) {
                    const killTime = stats.totalTime - timeStamp;
                    stats.killTimes.push(killTime);
                    timeStamp = stats.totalTime;
                }
                enemyKills++;
            }

            // Apply XP Bonuses
            stats.totalCombatXP *= 1 + playerStats.combatXpBonus / 100;
            stats.totalHpXP *= 1 + playerStats.combatXpBonus / 100;
            stats.totalPrayerXP *= 1 + playerStats.prayerXpBonus / 100;

            // Final Result from simulation
            return simulationResult(stats, playerStats, enemyStats, trials, tooManyActions);
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
        }
        return timeStep;
    }

    function regen(player, playerStats) {
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
        // rapid heal prayer
        if (player.prayerBonus.vars.prayerBonusHitpoints) {
            amt *= player.prayerBonus.vars.prayerBonusHitpoints;
        }
        // Regeneration modifiers
        applyModifier(amt, mergePlayerModifiers(player, 'HitpointRegeneration'));
        healDamage(player, playerStats, amt);
        player.regenTimer += hitpointRegenInterval;
        playerStats.numberOfRegens += 1;
    }

    function actorRecoilCD(actor) {
        actor.canRecoil = true;
        actor.isRecoiling = false;
    }

    function actorBurn(actor, actorStats) {
        // reset timer
        actor.burnTimer = actor.burnInterval;
        // Check if stopped burning
        if (actor.burnCount >= actor.burnMaxCount) {
            actor.isBurning = false;
            return;
        }
        // Apply burn damage
        dealDamage(actor, actorStats, actor.burnDamage);
        actor.burnCount++;
    }

    function targetBleed(actor, actorStats, target, targetStats) {
        // reset timer
        target.bleedTimer = target.bleedInterval;
        // Check if stopped bleeding
        if (target.bleedCount >= target.bleedMaxCount) {
            target.isBleeding = false;
            return;
        }
        // Apply bleed damage
        dealDamage(target, targetStats, target.bleedDamage);
        target.bleedCount++;
        // Elder Crown life steals bleed damage
        if (actor.isPlayer && actorStats.activeItems.elderCrown) {
            healDamage(actor, actorStats, target.bleedDamage);
        }
    }

    function enemyAction(stats, player, playerStats, enemy, enemyStats) {
        stats.enemyActions++;
        // Do enemy action
        if (skipsTurn(enemy)) {
            return;
        }
        stats.enemyAttackCalls++;
        // Check if doing special
        let isSpecial = false;
        enemy.specialID = -1;
        enemy.currentSpecial = {};
        if (enemyStats.hasSpecialAttack) {
            const specialRoll = Math.floor(Math.random() * 100);
            let specialChance = 0;
            for (let i = 0; i < enemyStats.specialLength; i++) {
                specialChance += enemyStats.specialAttackChances[i];
                if (specialRoll < specialChance) {
                    enemy.specialID = enemyStats.specialIDs[i];
                    enemy.currentSpecial = enemySpecialAttacks[enemy.specialID];
                    isSpecial = true;
                    break;
                }
            }
            // if selected special has active buff without turns, disable any active buffs
            if (enemy.currentSpecial.activeBuffs && enemy.currentSpecial.activeBuffTurns === undefined) {
                enemy.buffTurns = 0;
                postAttack(enemy, enemyStats, player, playerStats);
            }
            // don't stack active buffs
            if (enemy.activeBuffs && enemy.currentSpecial.activeBuffs) {
                enemy.specialID = -1;
                enemy.currentSpecial = {};
                isSpecial = false;
            }
            // stop Ahrenia Phase 3 from using a normal attack
            if (!isSpecial && enemyStats.monsterID === 149) {
                enemy.specialID = 50;
                enemy.currentSpecial = enemySpecialAttacks[50];
                isSpecial = true;
            }
        }
        if (isSpecial) {
            setupMultiAttack(enemy, player);
        }
        enemyDoAttack(player, playerStats, enemy, enemyStats, isSpecial);
        computeTempModifiers(player, playerStats, -1);
        multiAttackTimer(enemy);
        postAttack(enemy, enemyStats, player, playerStats);
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

    function enemyContinueAction(stats, player, playerStats, enemy, enemyStats) {
        // Do enemy multi attacks
        if (skipsTurn(enemy)) {
            return;
        }
        stats.enemyAttackCalls++;
        enemyDoAttack(player, playerStats, enemy, enemyStats, true);
        multiAttackTimer(enemy);
        postAttack(enemy, enemyStats, player, playerStats);
        if (!enemy.isAttacking && enemy.intoTheMist) {
            enemy.intoTheMist = false;
            enemy.increasedDamageReduction = 0;
        }
        if (!enemy.isAttacking && player.removeMarkOfDeath) {
            player.markOfDeath = false;
            player.removeMarkOfDeath = false;
            player.markOfDeathTurns = 0;
            player.markOfDeathStacks = 0;
        }
    }

    function multiAttackTimer(actor) {
        actor.attackCount++;
        // set up timer for next attack
        if (actor.isAttacking && actor.attackCount < actor.countMax) {
            // next attack is multi attack
            actor.attackTimer = actor.attackInterval;
        } else {
            // next attack is normal attack
            actor.isAttacking = false;
            actor.isActing = true;
            actor.actionTimer = actor.currentSpeed;
        }
    }

    function canNotDodge(target) {
        return target.isStunned || target.isSleeping;
    }

    function applyStatus(statusEffect, damage, actorStats, target, targetStats) {
        ////////////
        // turned //
        ////////////
        // Enemy Passive Effect "Purity" (passiveID 0) prevents stuns and sleep (same difference)
        let stunImmunity = !target.isPlayer && targetStats.passiveID.includes(0);
        // Apply Stun
        if (canApplyStatus(statusEffect.canStun, target.isStunned, statusEffect.stunChance, stunImmunity)) {
            applyStun(statusEffect, target);
        }
        // Apply Sleep
        if (canApplyStatus(statusEffect.canSleep, target.isSleeping, undefined, stunImmunity)) {
            applySleep(statusEffect, target);
        }
        ///////////
        // timed //
        ///////////
        // Apply Burning
        if (canApplyStatus(statusEffect.burnDebuff, target.isBurning)) {
            target.isBurning = true;
            target.burnCount = 0;
            target.burnDamage = Math.floor((target.maxHitpoints * (statusEffect.burnDebuff / 100)) / target.burnMaxCount);
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
                calculateSpeed(target, targetStats);
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

    function computeTempModifiers(player, playerStats, turns = 0) {
        player.tempModifiers = {};
        const changedModifiers = {};
        Object.getOwnPropertyNames(player.activeSpecialAttacks.fromEnemy).forEach(id => {
            const modifiers = enemySpecialAttacks[id].modifiers;
            player.activeSpecialAttacks.fromEnemy[id] -= turns;
            Object.getOwnPropertyNames(modifiers).forEach(modifier => {
                changedModifiers[modifier] = true;
                if (player.activeSpecialAttacks.fromEnemy[id] <= 0) {
                    player.activeSpecialAttacks.fromEnemy[id] = undefined;
                } else {
                    if (player.tempModifiers[modifier] === undefined) {
                        player.tempModifiers[modifier] = 0;
                    }
                    player.tempModifiers[modifier] += modifiers[modifier];
                }
            });
        });
        let unknownModifiers = Object.getOwnPropertyNames(changedModifiers).length;
        if (changedModifiers['increasedPlayerAttackSpeedPercent']) {
            calculateSpeed(player, playerStats);
            unknownModifiers--;
        }
        if (changedModifiers['decreasedMagicEvasion']) {
            calculatePlayerEvasionRating(player, playerStats);
            unknownModifiers--;
        }
        if (unknownModifiers > 0) {
            console.warn('Unknown enemy special attack modifiers!', {...changedModifiers});
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

    function applyStun(statusEffect, target) {
        // apply new stun
        target.isStunned = true;
        target.stunTurns = statusEffect.stunTurns;
        target.isAttacking = false;
        target.isActing = true;
        target.actionTimer = target.currentSpeed;
    }

    function applySleep(statusEffect, target) {
        // apply new sleep
        target.isSleeping = true;
        target.sleepTurns = statusEffect.sleepTurns;
        target.isAttacking = false;
        target.isActing = true;
        target.actionTimer = target.currentSpeed;
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

    function enemyDoAttack(player, playerStats, enemy, enemyStats, isSpecial) {
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
                    calculateSpeed(enemy, enemyStats);
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
                setAccuracy(player, playerStats, enemy, enemyStats);
            }
            forceHit = currentSpecial.forceHit;
            // apply special attack modifiers to player, or apply special effect to enemy
            if (currentSpecial.modifiers !== undefined && player.activeSpecialAttacks.fromEnemy[currentSpecial.id] === undefined) {
                // apply the effect
                const turnsLeft = currentSpecial.attackSpeedDebuffTurns | currentSpecial.applyDebuffTurns | 2;
                player.activeSpecialAttacks.fromEnemy[currentSpecial.id] = {turnsLeft: turnsLeft};
                computeTempModifiers(player, playerStats);
            }
            enemyStats.specialAttackCount++;
        } else {
            enemyStats.regularAttackCount++;
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

        if (!attackHits) {
            return;
        }
        if (isSpecial) {
            enemyStats.specialHitCount++;
        } else {
            enemyStats.regularHitCount++;
        }
        //////////////////
        // apply damage //
        //////////////////
        const damage = enemyCalculateDamage(enemy, enemyStats, player, playerStats, isSpecial, currentSpecial);
        dealDamage(player, playerStats, damage);
        //////////////////
        // side effects //
        //////////////////
        // life steal
        if (isSpecial && currentSpecial.lifesteal) {
            healDamage(enemy, enemyStats, damage * currentSpecial.lifestealMultiplier);
        }
        if (isSpecial && currentSpecial.setDOTHeal) {
            enemy.intoTheMist = true;
            healDamage(enemy, enemyStats, currentSpecial.setDOTHeal * enemy.maxHitpoints / currentSpecial.DOTMaxProcs);
        }
        // player recoil
        if (player.canRecoil) {
            let reflectDamage = 0;
            if (playerStats.activeItems.goldSapphireRing) {
                reflectDamage += Math.floor(Math.random() * 3 * numberMultiplier);
            }
            if (playerStats.reflectDamage) {
                reflectDamage += damage * playerStats.reflectDamage / 100
            }
            if (enemy.hitpoints > reflectDamage && reflectDamage > 0) {
                dealDamage(enemy, enemyStats, reflectDamage);
                player.canRecoil = false;
                player.isRecoiling = true;
                player.recoilTimer = 2000;
            }
        }
        // decay curse
        if (enemy.isCursed && enemy.curse.type === 'Decay' && !enemy.isAttacking) {
            dealDamage(enemy, enemyStats, enemy.curse.decayDamage);
        }
        // confusion curse
        if (enemy.isCursed && enemy.curse.type === 'Confusion' && !enemy.isAttacking) {
            dealDamage(enemy, enemyStats, Math.floor(enemy.hitpoints * enemy.curse.confusionMult));
        }
        // status effects
        if (isSpecial) {
            applyStatus(currentSpecial, damage, enemyStats, player, playerStats)
        }
    }

    function calculateSpeed(actor, actorStats, force = false) {
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
            if (actorStats.activeItems.guardianAmulet && actor.hitpoints < actor.maxHitpoints) {
                attackSpeedPercent += 10;
            }
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

    function postAttack(actor, actorStats, target, targetStats) {
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
                calculateSpeed(actor, actorStats)
                actor.meleeEvasionBuff = 1;
                actor.rangedEvasionBuff = 1;
                actor.magicEvasionBuff = 1;
                actor.reflectMelee = 0;
                actor.reflectRanged = 0;
                actor.reflectMagic = 0;
                actor.increasedDamageReduction = 0;
                setAccuracy(target, targetStats, actor, actorStats);
            }
        }
        // Slow Tracking
        if (actor.isSlowed) {
            actor.attackSpeedDebuffTurns--;
            if (actor.attackSpeedDebuffTurns <= 0) {
                actor.isSlowed = false;
                actor.attackSpeedDebuff = 0;
                calculateSpeed(actor, actorStats)
            }
        }
        // Curse Tracking
        if (actor.isCursed) {
            enemyCurseUpdate(target, targetStats, actor, actorStats);
        }
        // if target is into the mist, then increase its DR
        if (target.intoTheMist) {
            target.increasedDamageReduction += 10;
        }
    }

    function enemyCurseUpdate(player, playerStats, enemy, enemyStats) {
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
                setAccuracy(enemy, enemyStats, player, playerStats);
                break;
            case 'Soul Split':
            case 'Decay':
                setAccuracy(player, playerStats, enemy, enemyStats);
                break;
            case 'Weakening':
                enemy.maxHit = Math.floor(enemyStats.baseMaximumStrengthRoll * numberMultiplier);
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
        if (actor.isSleeping) {
            actor.sleepTurns--;
            if (actor.sleepTurns <= 0) {
                actor.isSleeping = false;
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
            stats.spellCasts++;
        }
        // determine special or normal attack
        let isSpecial = false;
        player.currentSpecial = {};
        if (playerStats.usingAncient) {
            isSpecial = true;
            player.currentSpecial = playerStats.specialData[0];
        } else if (playerStats.hasSpecialAttack) {
            const specialRoll = Math.floor(Math.random() * 100);
            let specialChance = 0;
            for (const special of playerStats.specialData) {
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
            playerStats.specialAttackCount++;
        } else {
            playerStats.regularAttackCount++;
        }
        if (isSpecial) {
            setupMultiAttack(player, enemy);
        }
        const attackResult = playerDoAttack(stats, player, playerStats, enemy, enemyStats, isSpecial)
        processPlayerAttackResult(attackResult, stats, player, playerStats, enemy, enemyStats);
        multiAttackTimer(player);
        postAttack(player, playerStats, enemy, enemyStats);
    }

    function playerContinueAction(stats, player, playerStats, enemy, enemyStats) {
        // perform continued attack
        if (skipsTurn(player)) {
            return;
        }
        const attackResult = playerDoAttack(stats, player, playerStats, enemy, enemyStats, true);
        processPlayerAttackResult(attackResult, stats, player, playerStats, enemy, enemyStats);
        multiAttackTimer(player);
        postAttack(player, playerStats, enemy, enemyStats);
    }

    function healDamage(target, targetStats, damage) {
        const amt = Math.floor(Math.min(damage, target.maxHitpoints - target.hitpoints));
        target.hitpoints += amt;
        target.hitpoints = Math.min(target.hitpoints, target.maxHitpoints);
        targetStats.damageHealed += amt;
        if (target.isPlayer && targetStats.activeItems.guardianAmulet) {
            updateGuardianAmuletEffect(target, targetStats);
        }
    }

    function dealDamage(target, targetStats, damage) {
        targetStats.damageTaken += Math.floor(Math.min(damage, target.hitpoints));
        target.hitpoints -= Math.floor(damage);
        // Check for Phoenix Rebirth
        if (!target.isPlayer && targetStats.passiveID.includes(1) && target.hitpoints <= 0) {
            let random = Math.random() * 100;
            if (random < 40) {
                target.hitpoints = target.maxHitpoints;
            }
        }
        // update alive status
        target.alive = target.hitpoints > 0;
        // Check for player eat
        if (target.isPlayer) {
            if (target.alive) {
                autoEat(target, targetStats);
                if (targetStats.autoEat.manual && targetStats.foodHeal > 0) {
                    // TODO: use a more detailed manual eating simulation?
                    target.hitpoints = target.maxHitpoints;
                }
                if (target.hitpoints <= 0.1 * target.maxHitpoints && target.prayerBonus.vars.prayerBonusHitpointHeal) {
                    target.hitpoints += Math.floor(target.maxHitpoints * (target.prayerBonus.vars.prayerBonusHitpointHeal / 100));
                }
                if (target.hitpoints < targetStats.lowestHitpoints) {
                    targetStats.lowestHitpoints = target.hitpoints;
                }
                if (targetStats.activeItems.guardianAmulet) {
                    updateGuardianAmuletEffect(target, targetStats);
                }
            }
            if (damage > targetStats.highestDamageTaken) {
                targetStats.highestDamageTaken = damage;
            }
        }
    }

    function checkGuardianAmuletBelowHalf(player) {
        return player.hitpoints < player.maxHitpoints / 2 && !player.guardianAmuletBelow;
    }

    function checkGuardianAmuletAboveHalf(player) {
        return player.hitpoints >= player.maxHitpoints / 2 && player.guardianAmuletBelow;
    }

    function updateGuardianAmuletEffect(player, playerStats) {
        if (checkGuardianAmuletBelowHalf(player)) {
            player.increasedDamageReduction += 5;
            player.guardianAmuletBelow = true;
            calculateSpeed(player, playerStats);
        } else if (checkGuardianAmuletAboveHalf(player)) {
            player.increasedDamageReduction -= 5;
            player.guardianAmuletBelow = false;
            calculateSpeed(player, playerStats);
        }
    }

    function autoEat(player, playerStats) {
        if (playerStats.autoEat.eatAt <= 0 || playerStats.foodHeal <= 0) {
            return;
        }
        const eatAt = playerStats.autoEat.eatAt / 100 * player.maxHitpoints;
        if (player.hitpoints > eatAt) {
            return;
        }
        const maxHP = playerStats.autoEat.maxHP / 100 * player.maxHitpoints;
        const healAmt = Math.floor(playerStats.foodHeal * playerStats.autoEat.efficiency / 100);
        const heals = Math.ceil((maxHP - player.hitpoints) / healAmt);
        playerStats.ate += heals;
        player.hitpoints += heals * healAmt;
        player.hitpoints = Math.min(player.hitpoints, player.maxHitpoints);
    }

    function processPlayerAttackResult(attackResult, stats, player, playerStats, enemy, enemyStats) {
        if (!attackResult.attackHits) {
            // attack missed, nothing to do
            return;
        }
        // cap damage, to prevent overkill xp
        if (enemy.hitpoints < attackResult.damageToEnemy) {
            attackResult.damageToEnemy = enemy.hitpoints;
        }
        // damage
        dealDamage(enemy, enemyStats, Math.floor(attackResult.damageToEnemy));
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
            applyStatus(attackResult.statusEffect, attackResult.damageToEnemy, playerStats, enemy, enemyStats)
        }
    }

    function playerUsePreAttackSpecial(player, playerStats, enemy, enemyStats) {
        if (playerStats.isMelee && player.currentSpecial.decreasedMeleeEvasion) {
            enemy.decreasedMeleeEvasion = player.currentSpecial.decreasedMeleeEvasion;
            setAccuracy(player, playerStats, enemy, enemyStats);
        }
        if (playerStats.isRanged && player.currentSpecial.decreasedRangedEvasion) {
            enemy.decreasedRangedEvasion = player.currentSpecial.decreasedRangedEvasion;
            setAccuracy(player, playerStats, enemy, enemyStats);
        }
        if (playerStats.isMagic && player.currentSpecial.decreasedMagicEvasion) {
            enemy.decreasedMagicEvasion = player.currentSpecial.decreasedMagicEvasion;
            setAccuracy(player, playerStats, enemy, enemyStats);
        }
        if (player.currentSpecial.decreasedAccuracy && !enemy.decreasedAccuracy) {
            enemy.decreasedAccuracy = player.currentSpecial.decreasedAccuracy;
            setAccuracy(enemy, enemyStats, player, playerStats);
        }
    }

    function playerUseCurse(stats, player, playerStats, enemy, enemyStats) {
        if (!playerStats.canCurse || enemy.isCursed) {
            return;
        }
        stats.curseCasts++;
        enemy.isCursed = true;
        enemy.curseTurns = 3;
        // Update the curses that change stats
        switch (enemy.curse.type) {
            case 'Blinding':
                setAccuracy(enemy, enemyStats, player, playerStats);
                break;
            case 'Soul Split':
            case 'Decay':
                setAccuracy(player, playerStats, enemy, enemyStats);
                break;
            case 'Weakening':
                enemy.maxHit = Math.floor(enemyStats.baseMaximumStrengthRoll * numberMultiplier * enemy.curse.maxHitDebuff);
                break;
        }
    }

    function playerDoAttack(stats, player, playerStats, enemy, enemyStats, isSpecial) {
        stats.playerAttackCalls++;
        // Apply pre-attack special effects
        if (isSpecial) {
            playerUsePreAttackSpecial(player, playerStats, enemy, enemyStats, isSpecial);
        }
        // Apply curse
        playerUseCurse(stats, player, playerStats, enemy, enemyStats);
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
            let roll = 100;
            for (let i = 0; i < player.attackRolls; i++) {
                let rolledChance = Math.floor(Math.random() * 100);
                if (rolledChance < roll) {
                    roll = rolledChance;
                }
            }
            attackHits = player.accuracy > roll;
        }
        if (!attackHits) {
            // exit early
            return attackResult;
        }
        if (isSpecial) {
            playerStats.specialHitCount++;
        } else {
            playerStats.regularHitCount++;
        }
        // roll for pets
        stats.petRolls.other[player.currentSpeed] = (stats.petRolls.other[player.currentSpeed] || 0) + 1;
        // calculate damage
        attackResult.damageToEnemy = playerCalculateDamage(player, playerStats, enemy, enemyStats, isSpecial);
        // reflect melee damage
        if (enemy.reflectMelee) {
            dealDamage(player, playerStats, enemy.reflectMelee * numberMultiplier);
        }
        if (enemy.reflectRanged) {
            dealDamage(player, playerStats, enemy.reflectRanged * numberMultiplier);
        }
        if (enemy.reflectMagic) {
            dealDamage(player, playerStats, enemy.reflectMagic * numberMultiplier);
        }
        ////////////////////
        // status effects //
        ////////////////////
        let statusEffect = {...player.currentSpecial};
        // Fighter amulet stun overrides special attack stun
        if (playerStats.activeItems.fighterAmulet && playerStats.isMelee && attackResult.damageToEnemy >= playerStats.maxHit * 0.70) {
            statusEffect.canStun = true;
            statusEffect.stunChance = undefined;
            statusEffect.stunTurns = 1;
        }
        // life steal
        let lifeSteal = 0;
        if (isSpecial && player.currentSpecial.healsFor) {
            lifeSteal += player.currentSpecial.healsFor * 100;
        }
        if (player.equipmentStats.spellHeal && playerStats.isMagic) {
            lifeSteal += player.equipmentStats.spellHeal;
        }
        if (playerStats.lifesteal !== 0) {
            // fervor + passive item stat
            lifeSteal += playerStats.lifesteal;
        }
        if (lifeSteal > 0) {
            healDamage(player, playerStats, attackResult.damageToEnemy * lifeSteal / 100)
        }
        // confetti crossbow
        if (playerStats.activeItems.confettiCrossbow) {
            // Add gp from this weapon
            let gpMultiplier = playerStats.startingGP / 20000000;
            if (gpMultiplier > confettiCrossbow.gpMultiplierCap) {
                gpMultiplier = confettiCrossbow.gpMultiplierCap;
            } else if (gpMultiplier < confettiCrossbow.gpMultiplierMin) {
                gpMultiplier = confettiCrossbow.gpMultiplierMin;
            }
            const damageToUse = Math.min(enemy.hitpoints, attackResult.damageToEnemy) * 10 / numberMultiplier;
            stats.gpGainedFromDamage += damageToUse * gpMultiplier * (
                1
                + mergePlayerModifiers(player, 'GPGlobal') / 100
                + mergePlayerModifiers(player, 'GPFromMonsters') / 100
            );
        }
        // return the result of the attack
        attackResult.attackHits = true;
        attackResult.statusEffect = statusEffect;
        return attackResult;
    }

    function enemyCalculateDamage(enemy, enemyStats, player, playerStats, isSpecial, currentSpecial) {
        let damage = setDamage(enemy, enemyStats, player, playerStats, isSpecial, currentSpecial);
        if (damage === undefined) {
            damage = Math.floor(Math.random() * enemy.maxHit) + 1;
        }
        damage *= 1 + getEnemyDamageModifier(enemy, player) / 100;
        damage -= Math.floor((calculatePlayerDamageReduction(player) / 100) * damage);
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

    function calculatePlayerDamageReduction(player) {
        let damageReduction = player.baseStats.damageReduction + mergePlayerModifiers(player, 'DamageReduction') + player.increasedDamageReduction;
        if (player.markOfDeath)
            damageReduction = Math.floor(damageReduction / 2);
        damageReduction = Math.floor(damageReduction * player.reductionModifier);
        return damageReduction;
    }

    function playerCalculateDamage(player, playerStats, enemy, enemyStats, isSpecial) {
        let damage = setDamage(player, playerStats, enemy, enemyStats, isSpecial, player.currentSpecial);
        // Calculate attack Damage
        if (damage === undefined) {
            // roll hit based on max hit, max hit already takes cb triangle into account !
            if (player.alwaysMaxHit) {
                damage = playerStats.maxHit;
            } else {
                damage = rollForDamage(player, playerStats);
            }
        }
        // special attack damage multiplier
        if (isSpecial && player.currentSpecial.damageMultiplier) {
            damage *= player.currentSpecial.damageMultiplier;
        }
        // common modifiers
        if (!playerStats.isMagic || !playerStats.usingAncient) {
            damage = damage * (1 + getPlayerDamageModifier(player, enemy) / 100)
        }
        // deadeye amulet
        if (playerStats.activeItems.deadeyeAmulet && playerStats.isRanged) {
            damage *= critDamageModifier(damage);
        }
        // damage reduction
        damage = Math.floor(damage * (1 - enemy.increasedDamageReduction / 100));
        if (isSpecial) {
            playerStats.specialDamage += damage;
        } else {
            playerStats.regularDamage += damage;
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
    }

    function resetPlayer(combatData, player, playerStats) {
        resetCommonStats(player, playerStats);
        if (player.cache === undefined) {
            player.cache = {}
        }
        player.isPlayer = true;
        if (!player.hitpoints || player.hitpoints <= 0) {
            player.hitpoints = playerStats.maxHitpoints;
        }
        player.damageReduction = playerStats.damageReduction;
        player.alwaysMaxHit = playerStats.minHit + 1 >= playerStats.maxHit; // Determine if player always hits for maxHit
        // copy from combatData;
        player.equipmentStats = combatData.equipmentStats;
        player.combatStats = combatData.combatStats;
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
        player.increasedDamageToMonster = playerStats.dmgModifier; // combines all the (in|de)creasedDamageToX modifiers
        // precompute number of attack rolls
        player.attackRolls = 1 + mergePlayerModifiers(player, 'AttackRolls');
        // aurora
        player.attackSpeedBuff = playerStats.decreasedAttackSpeed;
        // compute guardian amulet
        if (playerStats.activeItems.guardianAmulet) {
            player.guardianAmuletBelow = false;
            updateGuardianAmuletEffect(player, playerStats);
        }
        // compute initial accuracy
        calculatePlayerEvasionRating(player, playerStats);
        // init
        player.actionsTaken = 0;
    }

    function mergePlayerModifiers(player, modifier, both = true) {
        const hash = Object.getOwnPropertyNames(player.activeSpecialAttacks.fromEnemy).join('-')
            + '+' + Object.getOwnPropertyNames(player.activeSpecialAttacks.fromPlayer).join('-');
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
            return Math.floor(baseStat * (1 + (modifier / 100)));
        } else if (type === 1) {
            return (baseStat * (1 + (modifier / 100)));
        }
    }


    function resetEnemy(enemy, enemyStats) {
        resetCommonStats(enemy, enemyStats);
        enemy.isPlayer = false;
        enemy.monsterID = enemyStats.monsterID;
        enemy.hitpoints = enemy.maxHitpoints;
        enemy.damageReduction = 0;
        enemy.reflectMelee = 0;
        enemy.reflectRanged = 0;
        enemy.reflectMagic = 0;
        enemy.specialID = null;
        enemy.attackInterval = 0;
        enemy.maxAttackRoll = enemyStats.baseMaximumAttackRoll;
        enemy.maxHit = Math.floor(enemyStats.baseMaximumStrengthRoll * numberMultiplier);
        enemy.maxDefRoll = enemyStats.baseMaximumDefenceRoll;
        enemy.maxRngDefRoll = enemyStats.baseMaximumRangedDefenceRoll;
        enemy.maxMagDefRoll = enemyStats.baseMaximumMagicDefenceRoll;
        enemy.decreasedRangedEvasion = 0;
        enemy.meleeEvasionBuff = 1;
        enemy.magicEvasionBuff = 1;
        enemy.rangedEvasionBuff = 1;
        enemy.attackType = enemyStats.attackType;
        enemy.curse = {};
    }

    function simulationResult(stats, playerStats, enemyStats, trials, tooManyActions) {
        /** @type {MonsterSimResult} */
        const simResult = {
            simSuccess: true,
            petRolls: {},
            tooManyActions: tooManyActions,
            monsterID: enemyStats.monsterID,
        };

        if (verbose) {
            stats.killTimes = stats.killTimes.map(t => t + enemySpawnTimer);
            let mean = 0;
            const standardDeviation = (arr, usePopulation = false) => {
                mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
                return Math.sqrt(
                    arr
                        .reduce((acc, val) => acc.concat((val - mean) ** 2), [])
                        .reduce((acc, val) => acc + val, 0) /
                    (arr.length - (usePopulation ? 0 : 1))
                );
            };
            const sd = standardDeviation(stats.killTimes);
            let verboseResult = {
                // killTimes
                killTimeMean: mean,
                killTimeSD: sd,
                killTimeVar: sd ** 2,
                killTimes: stats.killTimes,
                // stats
                maxHit: playerStats.maxHit,
                maxAttackRoll: playerStats.maxAttackRoll,
                // regular accuracy
                regularAttackCount: playerStats.regularAttackCount,
                regularHitCount: playerStats.regularHitCount,
                regularAccuracy: playerStats.regularHitCount / playerStats.regularAttackCount,
                regularDamage: playerStats.regularDamage,
                regularDamagePerHit: playerStats.regularDamage / playerStats.regularHitCount,
                regularDamagePerAttack: playerStats.regularDamage / playerStats.regularAttackCount,
                // special accuracy
                specialAttackCount: playerStats.specialAttackCount,
                specialHitCount: playerStats.specialHitCount,
                specialAccuracy: playerStats.specialHitCount / playerStats.specialAttackCount,
                specialDamage: playerStats.specialDamage,
                specialDamagePerHit: playerStats.specialDamage / playerStats.specialHitCount,
                specialDamagePerAttack: playerStats.specialDamage / playerStats.specialAttackCount,
                // special rate
                specialAttackRate: playerStats.specialAttackCount / (playerStats.specialAttackCount + playerStats.regularAttackCount),
                // enemy accuracy
                enemyRegularAccuracy: enemyStats.regularHitCount / enemyStats.regularAttackCount,
                enemySpecialAccuracy: enemyStats.specialHitCount / enemyStats.specialAttackCount,
            };
            console.log(verboseResult);
            simResult.verbose = verboseResult;
        }

        simResult.xpPerHit = stats.totalCombatXP / stats.playerAttackCalls;
        // xp per second
        const totalTime = (trials - tooManyActions) * enemySpawnTimer + stats.totalTime;
        simResult.xpPerSecond = stats.totalCombatXP / totalTime * 1000;
        simResult.hpXpPerSecond = stats.totalHpXP / totalTime * 1000;
        simResult.prayerXpPerSecond = stats.totalPrayerXP / totalTime * 1000;
        // resource use
        // pp
        simResult.ppConsumedPerSecond = stats.playerAttackCalls * playerStats.prayerPointsPerAttack / totalTime * 1000;
        simResult.ppConsumedPerSecond += stats.enemyAttackCalls * playerStats.prayerPointsPerEnemy / totalTime * 1000;
        simResult.ppConsumedPerSecond += playerStats.prayerPointsPerHeal / hitpointRegenInterval * 1000;
        // hp
        let damage = playerStats.damageTaken;
        damage -= playerStats.damageHealed;
        simResult.hpPerSecond = Math.max(0, damage / totalTime * 1000);
        // attacks
        simResult.attacksTakenPerSecond = stats.enemyAttackCalls / totalTime * 1000;
        simResult.attacksMadePerSecond = stats.playerAttackCalls / totalTime * 1000;
        // ammo
        simResult.ammoUsedPerSecond = playerStats.isRanged ? simResult.attacksMadePerSecond : 0;
        simResult.ammoUsedPerSecond *= 1 - playerStats.ammoPreservation / 100;
        // runes
        simResult.spellCastsPerSecond = stats.spellCasts / totalTime * 1000;
        simResult.curseCastsPerSecond = stats.curseCasts / totalTime * 1000;
        // damage
        simResult.avgHitDmg = enemyStats.damageTaken / stats.playerAttackCalls;
        simResult.dmgPerSecond = enemyStats.damageTaken / totalTime * 1000;
        // deaths and extreme damage
        simResult.deathRate = playerStats.deaths / (trials - tooManyActions);
        simResult.highestDamageTaken = playerStats.highestDamageTaken;
        simResult.lowestHitpoints = playerStats.lowestHitpoints;
        if (playerStats.autoEat.manual) {
            // TODO: use a more detailed manual eating simulation?
            simResult.atePerSecond = Math.max(0, damage / playerStats.foodHeal / totalTime * 1000);
        } else {
            simResult.atePerSecond = playerStats.ate / totalTime * 1000;
        }
        if (!isFinite(simResult.atePerSecond)) {
            simResult.atePerSecond = NaN;
        }
        // gp
        simResult.gpFromDamagePerSecond = stats.gpGainedFromDamage / totalTime * 1000;

        // stats depending on kills
        const successes = trials - playerStats.deaths;
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

    // TODO: duplicated in injectable/Simulator.js
    /**
     * Sets the accuracy of actor vs target
     * @param {Object} actor
     * @param {number} actor.attackType Attack Type Melee:0, Ranged:1, Magic:2
     * @param {number} actor.maxAttackRoll Accuracy Rating
     * @param {Object} target
     * @param {number} target.maxDefRoll Melee Evasion Rating
     * @param {number} target.maxRngDefRoll Ranged Evasion Rating
     * @param {number} target.maxMagDefRoll Magic Evasion Rating
     */
    function setAccuracy(actor, actorStats, target, targetStats) {
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
            calculatePlayerEvasionRating(target, targetStats);
        } else {
            // Adjust ancient magick forcehit
            if (actorStats.usingAncient && (actorStats.specialData[0].forceHit || actorStats.specialData[0].checkForceHit)) {
                actorStats.specialData[0].forceHit = maxAttackRoll > 20000;
                actorStats.specialData[0].checkForceHit = true;
            }
            setEvasionDebuffsEnemy(target, targetStats);
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
     * @param {playerStats} playerStats
     * @returns {number} damage
     */
    function rollForDamage(player, playerStats) {
        let minHitIncrease = 0;
        minHitIncrease += Math.floor(playerStats.maxHit * mergePlayerModifiers(player, 'increasedMinHitBasedOnMaxHit', false) / 100);
        minHitIncrease -= Math.floor(playerStats.maxHit * mergePlayerModifiers(player, 'decreasedMinHitBasedOnMaxHit', false) / 100);
        // static min hit increase (magic gear and Charged aurora)
        minHitIncrease += playerStats.minHit;
        // if min is equal to or larger than max, roll max
        if (minHitIncrease + 1 >= playerStats.maxHit) {
            return playerStats.maxHit;
        }
        // roll between min and max
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
    function setEvasionDebuffsEnemy(enemy, enemyStats) {
        const isCursed = enemy.isCursed && (enemy.curse.type === 'Decay' || enemy.curse.type === 'Soul Split');
        enemy.maxDefRoll = calculateEnemyEvasion(enemyStats.baseMaximumDefenceRoll, enemy.decreasedMeleeEvasion, enemy.meleeEvasionBuff, isCursed ? enemy.curse.meleeEvasionDebuff : 0);
        enemy.maxRngDefRoll = calculateEnemyEvasion(enemyStats.baseMaximumRangedDefenceRoll, enemy.decreasedRangedEvasion, enemy.rangedEvasionBuff, isCursed ? enemy.curse.rangedEvasionDebuff : 0);
        enemy.maxMagDefRoll = calculateEnemyEvasion(enemyStats.baseMaximumMagicDefenceRoll, enemy.decreasedMagicEvasion, enemy.magicEvasionBuff, isCursed ? enemy.curse.magicEvasionDebuff : 0);
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
    function calculatePlayerEvasionRating(player, playerStats) {
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
    function calculateAreaEffectValue(player, playerStats) {
        let value = playerStats.slayerAreaEffectValue - mergePlayerModifiers(player, 'SlayerAreaEffectNegationFlat');
        if (value < 0) {
            value = 0;
        }
        return value;
    }

    function setAreaEffects(combatData, player, playerStats) {
        // 0: "Penumbra" - no area effect
        // 1: "Strange Cave" - no area effect
        // 2: "High Lands" - no area effect
        // 3: "Holy Isles" - no area effect
        // 4: "Forest of Goo" - no area effect
        // 5: "Desolate Plains" - no area effect
        // 6: "Runic Ruins" - reduced evasion rating
        if (playerStats.slayerArea === 6 && !playerStats.isMagic) {
            combatData.modifiers.decreasedMagicEvasion += calculateAreaEffectValue(player, playerStats);
        }
        // 7: "Arid Plains" - reduced food efficiency
        if (playerStats.slayerArea === 7) {
            playerStats.autoEat.efficiency -= calculateAreaEffectValue(player, playerStats);
        }
        // 8: "Shrouded Badlands" - reduced global accuracy
        if (playerStats.slayerArea === 8) {
            combatData.modifiers.decreasedGlobalAccuracy += calculateAreaEffectValue(player, playerStats);
        }
        // 9: "Perilous Peaks" - reduced evasion rating
        if (playerStats.slayerArea === 9) {
            combatData.modifiers.decreasedMeleeEvasion += calculateAreaEffectValue(player, playerStats);
            combatData.modifiers.decreasedRangedEvasion += calculateAreaEffectValue(player, playerStats);
            combatData.modifiers.decreasedMagicEvasion += calculateAreaEffectValue(player, playerStats);
        }
        // 10: "Dark Waters" - reduced player attack speed
        if (playerStats.slayerArea === 10) {
            combatData.modifiers.increasedPlayerAttackSpeedPercent += calculateAreaEffectValue(player, playerStats);
            resetPlayer(combatData, player, playerStats);
            calculateSpeed(player, playerStats, true);
            playerStats.attackSpeed = player.currentSpeed;
        }
    }

})();