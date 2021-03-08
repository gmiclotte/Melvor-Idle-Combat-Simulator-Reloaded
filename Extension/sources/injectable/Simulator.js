(() => {

    const reqs = [
        'statNames',
    ];

    const setup = () => {

        const MICSR = window.MICSR;

        /**
         * Simulator class, used for all simulation work, and storing simulation results and settings
         */
        MICSR.Simulator = class {
            /**
             *
             * @param {McsApp} parent Reference to container class
             * @param {string} workerURL URL to simulator web worker
             */
            constructor(parent, workerURL) {
                this.parent = parent;
                // Simulation settings
                /** Max number of player actions to attempt before timeout */
                this.maxActions = MICSR.maxActions;
                /** Number of enemy kills to simulate */
                this.trials = MICSR.trials;
                /** force full sim when too many actions are taken */
                this.forceFullSim = false;
                /** @type {boolean[]} */
                this.monsterSimFilter = [];
                /** @type {boolean[]} */
                this.dungeonSimFilter = [];
                this.slayerSimFilter = [];
                // Simulation data;
                /** @type {MonsterSimResult[]} */
                const newSimData = (monster) => {
                    const data = {
                        simSuccess: false,
                        xpPerSecond: 0,
                        xpPerHit: 0,
                        hpXpPerSecond: 0,
                        hpPerSecond: 0,
                        deathRate: 0,
                        highestDamageTaken: 0,
                        lowestHitpoints: Infinity,
                        atePerSecond: 0,
                        dmgPerSecond: 0,
                        avgKillTime: 0,
                        avgHitDmg: 0,
                        killTimeS: 0,
                        killsPerSecond: 0,
                        gpPerSecond: 0,
                        prayerXpPerSecond: 0,
                        slayerXpPerSecond: 0,
                        ppConsumedPerSecond: 0,
                        herbloreXPPerSecond: 0,
                        signetChance: 0,
                        gpFromDamagePerSecond: 0,
                        attacksTakenPerSecond: 0,
                        attacksMadePerSecond: 0,
                        simulationTime: 0,
                        petChance: 0,
                    };
                    if (monster) {
                        data.inQueue = false;
                        data.petRolls = {other: []};
                    }
                    return data
                }
                this.monsterSimData = [];
                for (let i = 0; i < MONSTERS.length; i++) {
                    this.monsterSimData.push(newSimData(true));
                    this.monsterSimFilter.push(true);
                }
                /** @type {MonsterSimResult[]} */
                this.dungeonSimData = [];
                for (let i = 0; i < DUNGEONS.length; i++) {
                    this.dungeonSimData.push(newSimData(false));
                    this.dungeonSimFilter.push(true);
                }
                //
                this.slayerTaskMonsters = [];
                this.slayerSimData = [];
                for (let i = 0; i < this.parent.slayerTasks.length; i++) {
                    this.slayerTaskMonsters.push([]);
                    this.slayerSimData.push(newSimData(false));
                    this.slayerSimFilter.push(true);
                }
                // Pre Compute Monster Base Stats
                /** @type {EnemyStats[]} */
                this.enemyStats = [];
                for (let i = 0; i < MONSTERS.length; i++) {
                    this.enemyStats.push(this.getEnemyStats(i));
                }
                /** Variables of currently stored simulation */
                this.currentSim = this.initCurrentSim();
                // Options for time multiplier
                this.selectedPlotIsTime = true;
                // Data Export Settings
                this.exportOptions = {
                    dataTypes: [],
                    name: true,
                    dungeonMonsters: true,
                    nonSimmed: true,
                }
                for (let i = 0; i < this.parent.plotTypes.length; i++) {
                    this.exportOptions.dataTypes.push(true);
                }
                // Test Settings
                this.isTestMode = false;
                this.testMax = 10;
                this.testCount = 0;
                // Simulation queue and webworkers
                this.workerURL = workerURL;
                this.currentJob = 0;
                this.simInProgress = false;
                /** @type {SimulationJob[]} */
                this.simulationQueue = [];
                /** @type {SimulationWorker[]} */
                this.simulationWorkers = [];
                this.maxThreads = window.navigator.hardwareConcurrency;
                this.simStartTime = 0;
                /** If the current sim has been cancelled */
                this.simCancelled = false;
                // Create Web workers
                this.createWorkers();
            }

            /**
             * Initializes a performance test
             * @param {number} numSims number of simulations to run in a row
             * @memberof McsSimulator
             */
            runTest(numSims) {
                this.testCount = 0;
                this.isTestMode = true;
                this.testMax = numSims;
                this.simulateCombat();
            }

            /**
             * Creates the webworkers for simulation jobs
             */
            async createWorkers() {
                for (let i = 0; i < this.maxThreads; i++) {
                    const worker = await this.createWorker();
                    this.intializeWorker(worker, i);
                    const newWorker = {
                        worker: worker,
                        inUse: false,
                        selfTime: 0,
                    };
                    this.simulationWorkers.push(newWorker);
                }
            }

            /**
             * Attempts to create a web worker, if it fails uses a chrome hack to get a URL that works
             * @return {Promise<Worker>}
             */
            createWorker() {
                return new Promise((resolve, reject) => {
                    let newWorker;
                    try {
                        newWorker = new Worker(this.workerURL);
                        resolve(newWorker);
                    } catch (error) {
                        // Chrome Hack
                        if (error.name === 'SecurityError' && error.message.includes('Failed to construct \'Worker\': Script')) {
                            const workerContent = new XMLHttpRequest();
                            workerContent.open('GET', this.workerURL);
                            workerContent.send();
                            workerContent.addEventListener('load', (event) => {
                                const blob = new Blob([event.currentTarget.responseText], {type: 'application/javascript'});
                                this.workerURL = URL.createObjectURL(blob);
                                resolve(new Worker(this.workerURL));
                            });
                        } else { // Other Error
                            reject(error);
                        }
                    }
                });
            }

            /**
             * Intializes a simulation worker
             * @param {Worker} worker
             * @param {number} i
             */
            intializeWorker(worker, i) {
                worker.onmessage = (event) => this.processWorkerMessage(event, i);
                worker.onerror = (event) => {
                    MICSR.log('An error occured in a simulation worker');
                    MICSR.log(event);
                };
                worker.postMessage({
                    action: 'RECEIVE_GAMEDATA',
                    protectFromValue: protectFromValue,
                    numberMultiplier: this.parent.combatData.numberMultiplier,
                    enemySpecialAttacks: enemySpecialAttacks,
                    enemySpawnTimer: enemySpawnTimer,
                    hitpointRegenInterval: hitpointRegenInterval,
                    deadeyeAmulet: items[CONSTANTS.item.Deadeye_Amulet],
                    confettiCrossbow: items[CONSTANTS.item.Confetti_Crossbow],
                    CURSEIDS: CONSTANTS.curse,
                });
            }

            /**
             * Calculates the equipment stats in `this.parent.combatData.equipmentStats`
             */
            updateEquipmentStats() {
                this.parent.combatData.updateEquipmentStats();
            }

            /**
             * Calculates the combat stats in `this.parent.combatData.updateCombatStats`
             */
            updateCombatStats() {
                this.parent.combatData.updateCombatStats();
            }

            /**
             * Iterate through all the combatAreas and DUNGEONS to create a set of monsterSimData and dungeonSimData
             */
            simulateCombat() {
                this.setupCurrentSim();
                // Start simulation workers
                document.getElementById('MCS Simulate Button').textContent = `Cancel (0/${this.simulationQueue.length})`;
                this.initializeSimulationJobs();
            }

            initCurrentSim() {
                return {
                    increasedGP: 0,
                    gpBonus: 1,
                    lootBonus: 1,
                    slayerBonusXP: 0,
                    canTopazDrop: false,
                    herbConvertChance: 0,
                    doBonesAutoBury: false,
                    /** @type {PlayerStats} */
                    playerStats: {
                        activeItems: {},
                        equipmentSelected: [],
                    },
                    /** @type {EquipmentStats} */
                    equipmentStats: {},
                    options: {},
                    prayerBonus: {modifiers: {}, vars: {}},
                    herbloreBonus: {},
                    combatStats: {},
                    attackStyle: {},
                    isSlayerTask: false,
                    virtualLevels: {},
                }
            }

            setupCurrentSimCombatData(currentSim, combatData) {
                // Start by grabbing the player stats
                currentSim.playerStats = combatData.getPlayerStats();
                // base gp increase
                currentSim.increasedGP = combatData.equipmentStats.increasedGP;
                // multiplier gp increase
                currentSim.gpBonus = 1;
                currentSim.canTopazDrop = false;
                if (combatData.equipmentSelected.includes(CONSTANTS.item.Gold_Topaz_Ring)) {
                    currentSim.gpBonus *= 1.15;
                    currentSim.canTopazDrop = true;
                }
                if (combatData.equipmentSelected.includes(CONSTANTS.item.Aorpheats_Signet_Ring)) {
                    currentSim.gpBonus *= 2;
                }
                if (combatData.equipmentSelected.includes(CONSTANTS.item.Almighty_Lute)) {
                    currentSim.gpBonus *= 5;
                }
                currentSim.lootBonus = 1 + combatData.equipmentStats.chanceToDoubleLoot / 100;
                if (combatData.petOwned[20]) {
                    currentSim.lootBonus += 0.01;
                }
                currentSim.slayerBonusXP = combatData.equipmentStats.slayerBonusXP;
                currentSim.herbConvertChance = combatData.herbloreBonus.luckyHerb / 100;
                currentSim.doBonesAutoBury = (combatData.equipmentSelected.includes(CONSTANTS.item.Bone_Necklace));
                currentSim.isSlayerTask = combatData.isSlayerTask;
                currentSim.playerStats.isSlayerTask = combatData.isSlayerTask;
                Object.assign(currentSim.equipmentStats, combatData.equipmentStats);
                Object.assign(currentSim.herbloreBonus, combatData.herbloreBonus);
                Object.assign(currentSim.prayerBonus, combatData.prayerBonus);
                Object.assign(currentSim.attackStyle, combatData.attackStyle);
                Object.assign(currentSim.virtualLevels, combatData.virtualLevels);
            }

            resetSimulationData() {
                // Reset the simulation status of all enemies
                this.resetSimDone();
                // Set up simulation queue
                this.simulationQueue = [];
                // Queue simulation of monsters in combat areas
                combatAreas.forEach((area) => {
                    area.monsters.forEach((monsterID) => {
                        if (this.monsterSimFilter[monsterID] && !this.monsterSimData[monsterID].inQueue) {
                            this.monsterSimData[monsterID].inQueue = true;
                            this.simulationQueue.push({monsterID: monsterID});
                        }
                    });
                });
                // Wandering Bard
                const bardID = 139;
                if (this.monsterSimFilter[bardID] && !this.monsterSimData[bardID].inQueue) {
                    this.monsterSimData[bardID].inQueue = true;
                    this.simulationQueue.push({monsterID: bardID});
                }
                // Queue simulation of monsters in slayer areas
                slayerAreas.forEach((area) => {
                    area.monsters.forEach((monsterID) => {
                        if (this.monsterSimFilter[monsterID] && !this.monsterSimData[monsterID].inQueue) {
                            this.monsterSimData[monsterID].inQueue = true;
                            this.simulationQueue.push({monsterID: monsterID});
                        }
                    });
                });
                // Queue simulation of monsters in dungeons
                for (let i = 0; i < DUNGEONS.length; i++) {
                    if (this.dungeonSimFilter[i]) {
                        for (let j = 0; j < DUNGEONS[i].monsters.length; j++) {
                            const monsterID = DUNGEONS[i].monsters[j];
                            if (!this.monsterSimData[monsterID].inQueue) {
                                this.monsterSimData[monsterID].inQueue = true;
                                this.simulationQueue.push({monsterID: monsterID});
                            }
                        }
                    }
                }
                // Queue simulation of monsters in slayer tasks
                for (let i = 0; i < this.slayerTaskMonsters.length; i++) {
                    const task = this.parent.slayerTasks[i];
                    this.slayerTaskMonsters[i] = [];
                    if (!this.slayerSimFilter[i]) {
                        continue;
                    }
                    const minLevel = task.minLevel;
                    const maxLevel = task.maxLevel === -1 ? 6969 : task.maxLevel;
                    for (let monsterID = 0; monsterID < MONSTERS.length; monsterID++) {
                        // check if it is a slayer monster
                        if (!MONSTERS[monsterID].canSlayer) {
                            continue;
                        }
                        // check if combat level fits the current task type
                        const cbLevel = MICSR.getMonsterCombatLevel(monsterID, true);
                        if (cbLevel < minLevel || cbLevel > maxLevel) {
                            continue;
                        }
                        // check if the area is accessible, this only works for auto slayer
                        // without auto slayer you can get some tasks for which you don't wear/own the gear
                        let area = findEnemyArea(monsterID, false);
                        if (area[0] === 1 && !this.parent.combatData.canAccessArea(slayerAreas[area[1]])) {
                            continue;
                        }
                        // all checks passed
                        if (!this.monsterSimData[monsterID].inQueue) {
                            this.monsterSimData[monsterID].inQueue = true;
                            this.simulationQueue.push({monsterID: monsterID});
                        }
                        this.slayerTaskMonsters[i].push(monsterID);
                    }
                }
            }

            /**
             * Setup currentsim variables
             */
            setupCurrentSim() {
                this.simStartTime = performance.now();
                this.simCancelled = false;
                this.currentSim = this.initCurrentSim();

                // setup combat data for simulation
                this.setupCurrentSimCombatData(this.currentSim, this.parent.combatData);

                // detach and deep clone this.parent.combatData
                this.parent.combatData.detach();
                this.parent.import.importSettings(JSON.parse(JSON.stringify(this.parent.import.exportSettings(), null, 1)));
                // reattach
                this.parent.combatData.equipmentSelected = this.parent.equipmentSelected;
                this.parent.combatData.equipmentSlotKeys = this.parent.equipmentSlotKeys;
                // update view
                this.parent.import.update();

                // add sim options
                this.currentSim.options = {
                    trials: this.trials,
                    maxActions: this.maxActions,
                    forceFullSim: this.forceFullSim,
                };

                // reset and setup sim data
                this.resetSimulationData()

                // An attempt to sort jobs by relative complexity so they go from highest to lowest.
                this.simulationQueue = this.simulationQueue.sort((jobA, jobB) => {
                    const jobAComplex = this.enemyStats[jobA.monsterID].hitpoints / this.parent.combatData.calculateAccuracy(this.currentSim.playerStats, this.enemyStats[jobA.monsterID]);
                    const jobBComplex = this.enemyStats[jobB.monsterID].hitpoints / this.parent.combatData.calculateAccuracy(this.currentSim.playerStats, this.enemyStats[jobB.monsterID]);
                    return jobBComplex - jobAComplex;
                });
            }

            /**
             * Gets the stats of a monster
             * @param {number} monsterID
             * @return {enemyStats}
             */
            getEnemyStats(monsterID) {
                /** @type {enemyStats} */
                const enemyStats = {
                    monsterID: monsterID,
                    hitpoints: 0,
                    maxHitpoints: 0,
                    damageTaken: 0,
                    attackSpeed: 0,
                    attackType: 0,
                    isMelee: false,
                    isRanged: false,
                    isMagic: false,
                    maxAttackRoll: 0,
                    maxHit: 0,
                    maxDefRoll: 0,
                    maxMagDefRoll: 0,
                    maxRngDefRoll: 0,
                    hasSpecialAttack: false,
                    specialAttackChances: [],
                    specialIDs: [],
                    specialLength: 0,
                    passiveID: [],
                };
                // Determine slayer zone
                let slayerIdx = 0;
                zone: for (const area of slayerAreas) {
                    for (const id of area.monsters) {
                        if (id === monsterID) {
                            enemyStats.slayerArea = slayerIdx;
                            enemyStats.slayerAreaEffectValue = area.areaEffectValue;
                            break zone;
                        }
                    }
                    slayerIdx++;
                }
                // Calculate Enemy Stats
                enemyStats.maxHitpoints = MONSTERS[monsterID].hitpoints * this.parent.combatData.numberMultiplier;
                enemyStats.attackSpeed = MONSTERS[monsterID].attackSpeed;
                const effectiveDefenceLevel = Math.floor(MONSTERS[monsterID].defenceLevel + 8 + 1);
                enemyStats.maxDefRoll = effectiveDefenceLevel * (MONSTERS[monsterID].defenceBonus + 64);

                const effectiveRangedDefenceLevel = Math.floor(MONSTERS[monsterID].defenceLevel + 8 + 1);
                enemyStats.maxRngDefRoll = effectiveRangedDefenceLevel * (MONSTERS[monsterID].defenceBonusRanged + 64);
                const effectiveMagicDefenceLevel = Math.floor((Math.floor(MONSTERS[monsterID].magicLevel * 0.7) + Math.floor(MONSTERS[monsterID].defenceLevel * 0.3)) + 8 + 1);
                enemyStats.maxMagDefRoll = effectiveMagicDefenceLevel * (MONSTERS[monsterID].defenceBonusMagic + 64);
                enemyStats.attackType = MONSTERS[monsterID].attackType;
                enemyStats.isMelee = enemyStats.attackType === CONSTANTS.attackType.Melee;
                enemyStats.isRanged = enemyStats.attackType === CONSTANTS.attackType.Ranged;
                enemyStats.isMagic = enemyStats.attackType === CONSTANTS.attackType.Magic;

                if (MONSTERS[monsterID].attackType === CONSTANTS.attackType.Melee) {
                    const effectiveAttackLevel = Math.floor(MONSTERS[monsterID].attackLevel + 8 + 1);
                    enemyStats.maxAttackRoll = effectiveAttackLevel * (MONSTERS[monsterID].attackBonus + 64);
                    const effectiveStrengthLevel = Math.floor(MONSTERS[monsterID].strengthLevel + 8 + 1);
                    enemyStats.maxHit = Math.floor(this.parent.combatData.numberMultiplier * (1.3 + (effectiveStrengthLevel / 10) + (MONSTERS[monsterID].strengthBonus / 80) + (effectiveStrengthLevel * MONSTERS[monsterID].strengthBonus / 640)));
                } else if (MONSTERS[monsterID].attackType === CONSTANTS.attackType.Ranged) {
                    const effectiveAttackLevel = Math.floor(MONSTERS[monsterID].rangedLevel + 8 + 1);
                    enemyStats.maxAttackRoll = effectiveAttackLevel * (MONSTERS[monsterID].attackBonusRanged + 64);
                    const effectiveStrengthLevel = Math.floor(MONSTERS[monsterID].rangedLevel + 8 + 1);
                    enemyStats.maxHit = Math.floor(this.parent.combatData.numberMultiplier * (1.3 + (effectiveStrengthLevel / 10) + (MONSTERS[monsterID].strengthBonusRanged / 80) + (effectiveStrengthLevel * MONSTERS[monsterID].strengthBonusRanged / 640)));
                } else if (MONSTERS[monsterID].attackType === CONSTANTS.attackType.Magic) {
                    const effectiveAttackLevel = Math.floor(MONSTERS[monsterID].magicLevel + 8 + 1);
                    enemyStats.maxAttackRoll = effectiveAttackLevel * (MONSTERS[monsterID].attackBonusMagic + 64);
                    if (MONSTERS[monsterID].selectedSpell === null || MONSTERS[monsterID].selectedSpell === undefined) {
                        enemyStats.maxHit = Math.floor(this.parent.combatData.numberMultiplier * MONSTERS[monsterID].setMaxHit * (1 + MONSTERS[monsterID].damageBonusMagic / 100));
                    } else {
                        enemyStats.maxHit = Math.floor(this.parent.combatData.numberMultiplier * SPELLS[MONSTERS[monsterID].selectedSpell].maxHit * (1 + MONSTERS[monsterID].damageBonusMagic / 100));
                    }
                }
                // Calculate special attacks
                if (MONSTERS[monsterID].hasSpecialAttack) {
                    enemyStats.hasSpecialAttack = true;
                    for (let i = 0; i < MONSTERS[monsterID].specialAttackID.length; i++) {
                        if (MONSTERS[monsterID].overrideSpecialChances !== undefined) {
                            enemyStats.specialAttackChances.push(MONSTERS[monsterID].overrideSpecialChances[i]);
                        } else {
                            enemyStats.specialAttackChances.push(enemySpecialAttacks[MONSTERS[monsterID].specialAttackID[i]].chance);
                        }
                        enemyStats.specialIDs.push(MONSTERS[monsterID].specialAttackID[i]);
                    }
                    enemyStats.specialLength = enemyStats.specialAttackChances.length;
                }
                // add passive effects
                if (MONSTERS[monsterID].passiveID) {
                    enemyStats.passiveID = MONSTERS[monsterID].passiveID;
                }
                return enemyStats;
            }

            computeAverageSimData(filter, data, monsterIDs) {
                if (filter) {
                    data.simSuccess = true;
                    let totXp = 0;
                    let totHpXp = 0;
                    let totPrayXP = 0;
                    let totHP = 0;
                    let totEnemyHP = 0;
                    let totPrayerPoints = 0;
                    let totTime = 0;
                    let totalGPFromDamage = 0;
                    let totalAttacksMade = 0;
                    let totalAttacksTaken = 0;
                    let totalAmmoUsed = 0;
                    let totalRunesUsed = 0;
                    let totalCombinationRunesUsed = 0;
                    let totalPotionsUsed = 0;
                    data.deathRate = 0;
                    data.highestDamageTaken = 0;
                    data.lowestHitpoints = Infinity;
                    let totalAte = 0;
                    let totalSimTime = 0;
                    for (const monsterID of monsterIDs) {
                        if (!this.monsterSimData[monsterID].simSuccess || this.monsterSimData[monsterID].tooManyActions > 0) {
                            data.simSuccess = false;
                            return;
                        }
                        totXp += this.monsterSimData[monsterID].xpPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totHpXp += this.monsterSimData[monsterID].hpXpPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totPrayXP += this.monsterSimData[monsterID].prayerXpPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totHP += this.monsterSimData[monsterID].hpPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totEnemyHP += this.monsterSimData[monsterID].dmgPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totPrayerPoints += this.monsterSimData[monsterID].ppConsumedPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totalGPFromDamage += this.monsterSimData[monsterID].gpFromDamagePerSecond * this.monsterSimData[monsterID].killTimeS;
                        totalAttacksMade += this.monsterSimData[monsterID].attacksMadePerSecond * this.monsterSimData[monsterID].killTimeS;
                        totalAttacksTaken += this.monsterSimData[monsterID].attacksTakenPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totalAmmoUsed += this.monsterSimData[monsterID].ammoUsedPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totalRunesUsed += this.monsterSimData[monsterID].runesUsedPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totalCombinationRunesUsed += this.monsterSimData[monsterID].combinationRunesUsedPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totalPotionsUsed += this.monsterSimData[monsterID].potionsUsedPerSecond * this.monsterSimData[monsterID].killTimeS;
                        totTime += this.monsterSimData[monsterID].avgKillTime;
                        data.deathRate = 1 - (1 - data.deathRate) * (1 - this.monsterSimData[monsterID].deathRate);
                        data.highestDamageTaken = Math.max(data.highestDamageTaken, this.monsterSimData[monsterID].highestDamageTaken);
                        data.lowestHitpoints = Math.min(data.lowestHitpoints, this.monsterSimData[monsterID].lowestHitpoints);
                        totalAte += this.monsterSimData[monsterID].atePerSecond * this.monsterSimData[monsterID].killTimeS;
                        totalSimTime += this.monsterSimData[monsterID].simulationTime;
                    }
                    const dungeonTime = totTime / 1000;
                    data.xpPerSecond = totXp / dungeonTime;
                    data.xpPerHit = totXp / totalAttacksMade;
                    data.hpXpPerSecond = totHpXp / dungeonTime;
                    data.prayerXpPerSecond = totPrayXP / dungeonTime;
                    data.hpPerSecond = totHP / dungeonTime;
                    data.dmgPerSecond = totEnemyHP / dungeonTime;
                    data.avgKillTime = totTime;
                    data.avgHitDmg = totEnemyHP / totalAttacksMade;
                    data.killTimeS = dungeonTime;
                    data.killsPerSecond = 1 / dungeonTime;
                    data.ppConsumedPerSecond = totPrayerPoints / dungeonTime;
                    data.gpFromDamagePerSecond = totalGPFromDamage / dungeonTime;
                    data.attacksTakenPerSecond = totalAttacksTaken / dungeonTime;
                    data.attacksMadePerSecond = totalAttacksMade / dungeonTime;
                    data.ammoUsedPerSecond = totalAmmoUsed / dungeonTime;
                    data.runesUsedPerSecond = totalRunesUsed / dungeonTime;
                    data.combinationRunesUsedPerSecond = totalCombinationRunesUsed / dungeonTime;
                    data.potionsUsedPerSecond = totalPotionsUsed / dungeonTime;
                    data.atePerSecond = totalAte / dungeonTime;
                    data.simulationTime = totalSimTime;
                } else {
                    data.simSuccess = false;
                }
            }

            computeRuneUsage(runes, combinationRunes, runeCosts, castsPerSecond, preservation) {
                runeCosts.forEach(x => {
                    const runeID = x.id;
                    const qty = x.qty * castsPerSecond * (1 - preservation);
                    if (items[runeID].providesRune && items[runeID].providesRune.length > 1) {
                        combinationRunes[runeID] = qty + (combinationRunes[runeID] || 0);
                    } else {
                        runes[runeID] = qty + (runes[runeID] || 0);
                    }
                });
            }

            computeAllRuneUsage() {
                // compute rune usage
                const runeCosts = this.currentSim.playerStats.runeCosts;
                const preservation = this.currentSim.playerStats.runePreservation;
                for (let data of this.monsterSimData) {
                    let runes = {};
                    let combinationRunes = {};
                    this.computeRuneUsage(runes, combinationRunes, runeCosts.spell, data.spellCastsPerSecond, preservation);
                    this.computeRuneUsage(runes, combinationRunes, runeCosts.aurora, data.spellCastsPerSecond, preservation);
                    this.computeRuneUsage(runes, combinationRunes, runeCosts.curse, data.curseCastsPerSecond, preservation);
                    data.runesUsedPerSecond = Object.values(runes).reduce((a, b) => a + b, 0);
                    data.combinationRunesUsedPerSecond = Object.values(combinationRunes).reduce((a, b) => a + b, 0);
                }
            }

            computePotionUsage() {
                for (let data of this.monsterSimData) {
                    data.potionsUsedPerSecond = 0;
                }
                if (!this.potionSelected) {
                    return;
                }
                const potionCharges = items[herbloreItemData[this.potionID].itemID[this.potionTier]].potionCharges;
                // check prayers for divine potion
                let perPlayer = false;
                let perEnemy = false;
                let perRegen = false;
                if (this.potionID === 22) {
                    for (let i = 0; i < PRAYER.length; i++) {
                        if (this.prayerSelected[i]) {
                            perPlayer = perPlayer || PRAYER[i].pointsPerPlayer > 0;
                            perEnemy = perEnemy || PRAYER[i].pointsPerEnemy > 0;
                            perRegen = perRegen || PRAYER[i].pointsPerRegen > 0;
                        }
                    }
                }
                // set potion usage for each monster
                for (let data of this.monsterSimData) {
                    if (this.potionID === 5) {
                        // regen potion
                        data.potionsUsedPerSecond = 0.1 / potionCharges;
                    } else if (this.potionID === 6) {
                        // damage reduction potion
                        data.potionsUsedPerSecond = data.attacksTakenPerSecond / potionCharges;
                    } else if (this.potionID === 23) {
                        // lucky herb potion
                        data.potionsUsedPerSecond = data.killsPerSecond / potionCharges;
                    } else if (this.potionID === 22) {
                        // divine potion
                        if (perPlayer) {
                            data.potionsUsedPerSecond += data.attacksMadePerSecond / potionCharges;
                        }
                        if (perEnemy) {
                            data.potionsUsedPerSecond += data.attacksTakenPerSecond / potionCharges;
                        }
                        if (perRegen) {
                            data.potionsUsedPerSecond += 0.1 / potionCharges;
                        }
                    } else {
                        data.potionsUsedPerSecond = data.attacksMadePerSecond / potionCharges;
                    }
                }
            }

            /** Performs all data analysis post queue completion */
            performPostSimAnalysis() {
                this.computeAllRuneUsage();
                this.computePotionUsage();
                // Perform calculation of dungeon stats
                for (let dungeonId = 0; dungeonId < DUNGEONS.length; dungeonId++) {
                    this.computeAverageSimData(this.dungeonSimFilter[dungeonId], this.dungeonSimData[dungeonId], DUNGEONS[dungeonId].monsters);
                }
                for (let slayerTaskID = 0; slayerTaskID < this.slayerTaskMonsters.length; slayerTaskID++) {
                    this.computeAverageSimData(this.slayerSimFilter[slayerTaskID], this.slayerSimData[slayerTaskID], this.slayerTaskMonsters[slayerTaskID]);
                    // set average kill time for auto slayer
                    this.slayerSimData[slayerTaskID].avgKillTime /= this.slayerTaskMonsters[slayerTaskID].length;
                    // log monster IDs
                    if (this.slayerTaskMonsters[slayerTaskID].length) {
                        console.log(`Tier ${slayerTaskID} auto slayer task list`, this.slayerTaskMonsters[slayerTaskID]);
                    }
                }
                // Update other data
                this.parent.loot.update(
                    this.currentSim,
                    this.monsterSimData,
                    this.dungeonSimData,
                    this.slayerSimData,
                    this.slayerTaskMonsters,
                );
                MICSR.log(`Elapsed Simulation Time: ${performance.now() - this.simStartTime}ms`);
            }

            /** Starts processing simulation jobs */
            initializeSimulationJobs() {
                if (!this.simInProgress) {
                    if (this.simulationQueue.length > 0) {
                        this.simInProgress = true;
                        this.currentJob = 0;
                        for (let i = 0; i < this.simulationWorkers.length; i++) {
                            this.simulationWorkers[i].selfTime = 0;
                            if (i < this.simulationQueue.length) {
                                this.startJob(i);
                            } else {
                                break;
                            }
                        }
                    } else {
                        this.performPostSimAnalysis();
                        this.parent.updateDisplayPostSim();
                    }
                }
            }

            /** Starts a job for a given worker
             * @param {number} workerID
             */
            startJob(workerID) {
                if (this.currentJob < this.simulationQueue.length && !this.simCancelled) {
                    const monsterID = this.simulationQueue[this.currentJob].monsterID;
                    this.modifyCurrentSimStatsForMonster(monsterID);
                    this.simulationWorkers[workerID].worker.postMessage({
                        action: 'START_SIMULATION',
                        monsterID: monsterID,
                        enemyStats: this.enemyStats[monsterID],
                        playerStats: this.currentSim.playerStats,
                        simOptions: this.currentSim.options
                    });
                    this.simulationWorkers[workerID].inUse = true;
                    this.currentJob++;
                } else {
                    // Check if none of the workers are in use
                    let allDone = true;
                    this.simulationWorkers.forEach((simWorker) => {
                        if (simWorker.inUse) {
                            allDone = false;
                        }
                    });
                    if (allDone) {
                        this.simInProgress = false;
                        this.performPostSimAnalysis();
                        this.parent.updateDisplayPostSim();
                        if (this.isTestMode) {
                            this.testCount++;
                            if (this.testCount < this.testMax) {
                                this.simulateCombat();
                            } else {
                                this.isTestMode = false;
                            }
                        }
                        // MICSR.log(this.simulationWorkers);
                    }
                }
            }

            /**
             * Modifies the playerStats before starting a job for a specific monster
             * @param {number} monsterID Index of MONSTERS
             */
            modifyCurrentSimStatsForMonster(monsterID) {
                // Do check for protection prayer
                switch (MONSTERS[monsterID].attackType) {
                    case CONSTANTS.attackType.Melee:
                        this.currentSim.playerStats.isProtected = this.currentSim.prayerBonus.vars.protectFromMelee > 0;
                        break;
                    case CONSTANTS.attackType.Ranged:
                        this.currentSim.playerStats.isProtected = this.currentSim.prayerBonus.vars.protectFromRanged > 0;
                        break;
                    case CONSTANTS.attackType.Magic:
                        this.currentSim.playerStats.isProtected = this.currentSim.prayerBonus.vars.protectFromMagic > 0;
                        break;
                }
                // Do preprocessing of player stats for special weapons
                if (this.currentSim.playerStats.activeItems.stormsnap
                    || this.currentSim.playerStats.activeItems.slayerCrossbow
                    || this.currentSim.playerStats.activeItems.bigRon) {
                    // recompute base stats
                    this.currentSim.combatData.updatePlayerBaseStats(this.currentSim.baseStats, monsterID);
                    // max attack roll
                    this.combatStats.maxAttackRoll = this.currentSim.combatData.calculatePlayerAccuracyRating(this.currentSim.baseStats, this.currentSim.modifiers);
                    // max hit roll
                    this.combatStats.maxHit = this.currentSim.combatData.calculatePlayerMaxHit(this.currentSim.baseStats, this.currentSim.modifiers);
                }
            }

            /**
             * Attempts to cancel the currently running simulation and sends a cancelation message to each of the active workers
             */
            cancelSimulation() {
                this.simCancelled = true;
                this.simulationWorkers.forEach((simWorker) => {
                    if (simWorker.inUse) {
                        simWorker.worker.postMessage({action: 'CANCEL_SIMULATION'});
                    }
                });
            }

            /**
             * Processes a message received from one of the simulation workers
             * @param {MessageEvent} event The event data of the worker
             * @param {number} workerID The ID of the worker that sent the message
             */
            processWorkerMessage(event, workerID) {
                // MICSR.log(`Received Message ${event.data.action} from worker: ${workerID}`);
                if (!event.data.simResult.simSuccess || event.data.simResult.tooManyActions > 0) {
                    MICSR.log({...event.data.simResult});
                }
                switch (event.data.action) {
                    case 'FINISHED_SIM':
                        // Send next job in queue to worker
                        this.simulationWorkers[workerID].inUse = false;
                        this.simulationWorkers[workerID].selfTime += event.data.selfTime;
                        // Transfer data into monsterSimData
                        const monsterID = event.data.monsterID;
                        Object.assign(this.monsterSimData[monsterID], event.data.simResult);
                        this.monsterSimData[monsterID].simulationTime = event.data.selfTime;
                        document.getElementById('MCS Simulate Button').textContent = `Cancel (${this.currentJob - 1}/${this.simulationQueue.length})`;
                        // MICSR.log(event.data.simResult);
                        // Attempt to add another job to the worker
                        this.startJob(workerID);
                        break;
                    case 'ERR_SIM':
                        MICSR.error(event.data.error);
                        break;
                }
            }

            /**
             * Resets the simulation status for each monster
             */
            resetSimDone() {
                for (let i = 0; i < MONSTERS.length; i++) {
                    this.monsterSimData[i].inQueue = false;
                    this.monsterSimData[i].simSuccess = false;
                }
            }

            /**
             * Extracts a set of data for plotting that matches the keyValue in monsterSimData and dungeonSimData
             * @param {string} keyValue
             * @return {number[]}
             */
            getDataSet(keyValue) {
                let dataMultiplier = 1;
                if (this.selectedPlotIsTime) {
                    dataMultiplier = this.parent.timeMultiplier;
                }
                let isKillTime = (this.parent.timeMultiplier === -1 && this.selectedPlotIsTime);
                if (keyValue === 'petChance') {
                    isKillTime = false;
                    dataMultiplier = 1;
                }
                const dataSet = [];
                if (!this.parent.isViewingDungeon) {
                    // Compile data from monsters in combat zones
                    combatAreas.forEach((area) => {
                        area.monsters.forEach((monsterID) => {
                            if (isKillTime) dataMultiplier = this.monsterSimData[monsterID].killTimeS;
                            dataSet.push((this.monsterSimFilter[monsterID] && this.monsterSimData[monsterID].simSuccess) ? this.monsterSimData[monsterID][keyValue] * dataMultiplier : NaN);
                        });
                    });
                    // Wandering Bard
                    const bardID = 139;
                    if (isKillTime) dataMultiplier = this.monsterSimData[bardID].killTimeS;
                    dataSet.push((this.monsterSimFilter[bardID] && this.monsterSimData[bardID].simSuccess) ? this.monsterSimData[bardID][keyValue] * dataMultiplier : NaN);
                    // Compile data from monsters in slayer zones
                    slayerAreas.forEach((area) => {
                        area.monsters.forEach((monsterID) => {
                            if (isKillTime) dataMultiplier = this.monsterSimData[monsterID].killTimeS;
                            dataSet.push((this.monsterSimFilter[monsterID] && this.monsterSimData[monsterID].simSuccess) ? this.monsterSimData[monsterID][keyValue] * dataMultiplier : NaN);
                        });
                    });
                    // Perform simulation of monsters in dungeons
                    for (let i = 0; i < DUNGEONS.length; i++) {
                        if (isKillTime) dataMultiplier = this.dungeonSimData[i].killTimeS;
                        dataSet.push((this.dungeonSimFilter[i] && this.dungeonSimData[i].simSuccess) ? this.dungeonSimData[i][keyValue] * dataMultiplier : NaN);
                    }
                    // Perform simulation of monsters in slayer tasks
                    for (let i = 0; i < this.slayerTaskMonsters.length; i++) {
                        if (isKillTime) dataMultiplier = this.slayerSimData[i].killTimeS;
                        dataSet.push((this.slayerSimFilter[i] && this.slayerSimData[i].simSuccess) ? this.slayerSimData[i][keyValue] * dataMultiplier : NaN);
                    }
                } else if (this.parent.viewedDungeonID < DUNGEONS.length) {
                    // dungeons
                    const dungeonID = this.parent.viewedDungeonID;
                    const isSignet = keyValue === 'signetChance';
                    DUNGEONS[dungeonID].monsters.forEach((monsterID) => {
                        if (!isSignet) {
                            if (isKillTime) dataMultiplier = this.monsterSimData[monsterID].killTimeS;
                            dataSet.push((this.monsterSimData[monsterID].simSuccess) ? this.monsterSimData[monsterID][keyValue] * dataMultiplier : NaN);
                        } else {
                            dataSet.push(0);
                        }
                    });
                    if (isSignet) {
                        const bossId = DUNGEONS[dungeonID].monsters[DUNGEONS[dungeonID].monsters.length - 1];
                        dataSet[dataSet.length - 1] = (this.monsterSimData[bossId].simSuccess) ? this.monsterSimData[bossId][keyValue] * dataMultiplier : NaN;
                    }
                } else {
                    // slayer tasks
                    const taskID = this.parent.viewedDungeonID - DUNGEONS.length;
                    const isSignet = keyValue === 'signetChance';
                    this.slayerTaskMonsters[taskID].forEach(monsterID => {
                        if (!isSignet) {
                            if (isKillTime) dataMultiplier = this.monsterSimData[monsterID].killTimeS;
                            dataSet.push((this.monsterSimData[monsterID].simSuccess) ? this.monsterSimData[monsterID][keyValue] * dataMultiplier : NaN);
                        } else {
                            dataSet.push(0);
                        }
                    });
                }
                return dataSet;
            }

            /**
             * Creates a string to paste into your favourite spreadsheet software
             * @return {string}
             */
            exportData() {
                const exportOptions = this.exportOptions;
                const exportEntity = (entityID, filter, data, name, isDungeonMonster = false) => {
                    if (!exportOptions.nonSimmed && !filter[entityID]) {
                        return;
                    }
                    if (exportOptions.name) {
                        exportString += name + colDel;
                    }
                    for (let i = 0; i < this.parent.plotTypes.length; i++) {
                        if (!exportOptions.dataTypes[i]) {
                            continue;
                        }
                        if (isDungeonMonster) {
                            if (this.parent.plotTypes[i].value === 'signetChance') {
                                exportString += '0';
                            } else {
                                let dataMultiplier = this.parent.plotTypes[i].isTime ? this.parent.timeMultiplier : 1;
                                if (dataMultiplier === -1) dataMultiplier = data[entityID].killTimeS;
                                exportString += (data[entityID].simSuccess) ? data[entityID][this.parent.plotTypes[i].value] * dataMultiplier : 0;
                            }
                        } else {
                            let dataMultiplier = this.parent.plotTypes[i].isTime ? this.parent.timeMultiplier : 1;
                            if (dataMultiplier === -1) dataMultiplier = data[entityID].killTimeS;
                            exportString += (filter[entityID] && data[entityID].simSuccess) ? data[entityID][this.parent.plotTypes[i].value] * dataMultiplier : 0;
                        }
                        exportString += colDel;
                    }
                    exportString = exportString.slice(0, -colLen);
                    exportString += rowDel;
                }
                let exportString = '';
                const colDel = '\t';
                const colLen = colDel.length;
                const rowDel = '\n';
                const rowLen = rowDel.length;
                if (exportOptions.name) {
                    exportString += 'Monster/Dungeon Name' + colDel;
                }
                for (let i = 0; i < this.parent.plotTypes.length; i++) {
                    if (exportOptions.dataTypes[i]) {
                        if (this.parent.plotTypes[i].isTime) {
                            exportString += this.parent.plotTypes[i].option + this.parent.selectedTimeUnit + colDel;
                        } else {
                            exportString += this.parent.plotTypes[i].option + colDel;
                        }
                    }
                }
                exportString = exportString.slice(0, -colLen);
                exportString += rowDel;
                // Combat Areas
                combatAreas.forEach((area) => {
                    area.monsters.forEach(monsterID => exportEntity(monsterID, this.monsterSimFilter, this.monsterSimData, this.parent.getMonsterName(monsterID)));
                });
                // Wandering Bard
                const bardID = 139;
                exportEntity(bardID, this.monsterSimFilter, this.monsterSimData, this.parent.getMonsterName(bardID));
                // Slayer Areas
                slayerAreas.forEach((area) => {
                    area.monsters.forEach(monsterID => exportEntity(monsterID, this.monsterSimFilter, this.monsterSimData, this.parent.getMonsterName(monsterID)));
                });
                // Dungeons
                for (let dungeonId = 0; dungeonId < DUNGEONS.length; dungeonId++) {
                    exportEntity(dungeonId, this.dungeonSimFilter, this.dungeonSimData, this.parent.getDungeonName(dungeonId))
                    if (exportOptions.dungeonMonsters) {
                        const dungeonMonsterFilter = Object.fromEntries(DUNGEONS[dungeonId].monsters.map((id) => [id, this.dungeonSimFilter[dungeonId]]));
                        DUNGEONS[dungeonId].monsters.forEach(monsterID => exportEntity(monsterID, dungeonMonsterFilter, this.monsterSimData, this.parent.getMonsterName(monsterID), true));
                    }
                }
                // TODO: export for auto slayer
                exportString = exportString.slice(0, -rowLen);
                return exportString;
            }

            /**
             * Finds the monsters/dungeons you can currently fight
             * @return {boolean[]}
             */
            getEnterSet() {
                const enterSet = [];
                // Compile data from monsters in combat zones
                for (let i = 0; i < combatAreas.length; i++) {
                    for (let j = 0; j < combatAreas[i].monsters.length; j++) {
                        enterSet.push(true);
                    }
                }
                // Wandering Bard
                enterSet.push(true);
                // Check which slayer areas we can access with current stats and equipment
                for (const area of slayerAreas) {
                    // push `canEnter` for every monster in this zone
                    for (let j = 0; j < area.monsters.length; j++) {
                        enterSet.push(this.parent.combatData.canAccessArea(area));
                    }
                }
                // Perform simulation of monsters in dungeons and auto slayer
                for (let i = 0; i < DUNGEONS.length; i++) {
                    enterSet.push(true);
                }
                for (let i = 0; i < this.slayerTaskMonsters.length; i++) {
                    enterSet.push(true);
                }
                return enterSet;
            }
        }
    }

    let loadCounter = 0;
    const waitLoadOrder = (reqs, setup, id) => {
        loadCounter++;
        if (loadCounter > 100) {
            console.log('Failed to load ' + id);
            return;
        }
        // check requirements
        let reqMet = true;
        if (window.MICSR === undefined) {
            reqMet = false;
            console.log(id + ' is waiting for the MICSR object');
        } else {
            for (const req of reqs) {
                if (window.MICSR.loadedFiles[req]) {
                    continue;
                }
                reqMet = false;
                // not defined yet: try again later
                if (loadCounter === 1) {
                    window.MICSR.log(id + ' is waiting for ' + req)
                }
            }
        }
        if (!reqMet) {
            setTimeout(() => waitLoadOrder(reqs, setup, id), 50);
            return;
        }
        // requirements met
        window.MICSR.log('setting up ' + id)
        setup();
        // mark as loaded
        window.MICSR.loadedFiles[id] = true;
    }
    waitLoadOrder(reqs, setup, 'Simulator');

})();