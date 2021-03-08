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
                // player modifiers
                this.modifiers = this.copyModifierTemplate();
                // base stats
                this.baseStats = this.resetPlayerBaseStats();
                // Player combat stats
                /** @type {Levels} */
                this.playerLevels = {
                    Attack: 1,
                    Strength: 1,
                    Defence: 1,
                    Hitpoints: 10,
                    Ranged: 1,
                    Magic: 1,
                    Prayer: 1,
                    Slayer: 1,
                };
                /** @type {Levels} */
                this.virtualLevels = {
                    Attack: 1,
                    Strength: 1,
                    Defence: 1,
                    Hitpoints: 10,
                    Ranged: 1,
                    Magic: 1,
                    Prayer: 1,
                    Slayer: 1,
                };
                /** @type {EquipmentStats} */
                this.equipmentStats = {};
                // Spell Selection
                this.spells = {
                    standard: {
                        array: SPELLS,
                        isSelected: true,
                        selectedID: 0,
                    },
                    curse: {
                        array: CURSES,
                        isSelected: false,
                        selectedID: null,
                    },
                    aurora: {
                        array: AURORAS,
                        isSelected: false,
                        selectedID: null,
                    },
                    ancient: {
                        array: ANCIENT,
                        isSelected: false,
                        selectedID: null,
                    },
                };
                // Pet Selection
                this.petOwned = PETS.map(() => false);
                // Style Selection
                this.attackStyle = {
                    Melee: 0,
                    Ranged: 0,
                    Magic: 0,
                };
                // Combat Stats
                this.combatStats = {
                    attackSpeed: 4000,
                    maxHit: 0,
                    minHit: 0,
                    maxAttackRoll: 0,
                    maxDefRoll: 0,
                    maxRngDefRoll: 0,
                    maxMagDefRoll: 0,
                    damageReduction: 0,
                    attackType: 0,
                    maxHitpoints: 0,
                    runePreservation: 0,
                };
                // Prayer Stats
                /** @type {boolean[]} */
                this.prayerSelected = [];
                for (let i = 0; i < PRAYER.length; i++) {
                    this.prayerSelected.push(false);
                }
                this.activePrayers = 0;
                /** Computed Prayer Bonus From UI */
                this.resetPrayerBonus();
                /** Aurora Bonuses */
                this.auroraBonus = {
                    attackSpeedBuff: 0,
                    rangedEvasionBuff: 0,
                    increasedMaxHit: 0,
                    magicEvasionBuff: 0,
                    lifesteal: 0,
                    meleeEvasionBuff: 0,
                    increasedMinHit: 0,
                };
                // Slayer Variables
                this.isSlayerTask = false;
                // Game Mode Settings
                this.isHardcore = false;
                this.isAdventure = false;
                this.numberMultiplier = 10;
                // combination runes
                this.useCombinationRunes = false;
                // Herblore Bonuses
                this.potionSelected = false;
                this.potionTier = 0;
                this.potionID = -1;
                this.herbloreBonus = {
                    damageReduction: 0, // 8
                    rangedAccuracy: 0, // 3
                    rangedStrength: 0, // 4
                    magicAccuracy: 0, // 5
                    magicDamage: 0, // 6
                    meleeAccuracy: 0, // 0
                    meleeStrength: 0, // 2
                    meleeEvasion: 0, // 1
                    rangedEvasion: 0, // 3
                    magicEvasion: 0, // 5
                    hpRegen: 0, // 7
                    diamondLuck: false, // 9
                    divine: 0, // 10
                    luckyHerb: 0, // 11
                };
                // Food
                this.autoEatTier = -1;
                this.foodSelected = 0;
                this.cookingPool = false;
                this.cookingMastery = false;


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
                this.currentSim = {
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
                };
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
                    numberMultiplier: this.numberMultiplier,
                    enemySpecialAttacks: enemySpecialAttacks,
                    enemySpawnTimer: enemySpawnTimer,
                    hitpointRegenInterval: hitpointRegenInterval,
                    deadeyeAmulet: items[CONSTANTS.item.Deadeye_Amulet],
                    confettiCrossbow: items[CONSTANTS.item.Confetti_Crossbow],
                    CURSEIDS: CONSTANTS.curse,
                });
            }

            /**
             * Calculates the equipment's combined stats and stores them in `this.equipmentStats`
             */
            updateEquipmentStats() {
                const weaponID = this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon];
                if (items[weaponID].type === 'Ranged Weapon' || items[weaponID].isRanged) {
                    this.combatStats.attackType = CONSTANTS.attackType.Ranged;
                } else if (items[weaponID].isMagic) {
                    this.combatStats.attackType = CONSTANTS.attackType.Magic;
                } else {
                    this.combatStats.attackType = CONSTANTS.attackType.Melee;
                }

                const maxCape = this.parent.equipmentSelected.includes(CONSTANTS.item.Max_Skillcape) || this.parent.equipmentSelected.includes(CONSTANTS.item.Cape_of_Completion);
                /** @type {EquipmentStats} */
                const equipmentStats = {
                    runesProvidedByWeapon: {},
                    runesProvidedByShield: {},
                    activeItems: {
                        // TODO: check which of these items are passive slot items
                        //   also check any other use of `CONSTANTS.item` and `items`
                        hitpointsSkillcape: this.parent.equipmentSelected.includes(CONSTANTS.item.Hitpoints_Skillcape) || maxCape,
                        magicSkillcape: this.parent.equipmentSelected.includes(CONSTANTS.item.Magic_Skillcape) || maxCape,
                        prayerSkillcape: this.parent.equipmentSelected.includes(CONSTANTS.item.Prayer_Skillcape) || maxCape,
                        slayerSkillcape: this.parent.equipmentSelected.includes(CONSTANTS.item.Slayer_Skillcape) || maxCape,
                        firemakingSkillcape: this.parent.equipmentSelected.includes(CONSTANTS.item.Firemaking_Skillcape) || maxCape,
                        capeOfArrowPreservation: this.parent.equipmentSelected.includes(CONSTANTS.item.Cape_of_Arrow_Preservation),
                        skullCape: this.parent.equipmentSelected.includes(CONSTANTS.item.Skull_Cape),
                        goldDiamondRing: this.parent.equipmentSelected.includes(CONSTANTS.item.Gold_Diamond_Ring),
                        goldEmeraldRing: this.parent.equipmentSelected.includes(CONSTANTS.item.Gold_Emerald_Ring),
                        goldSapphireRing: this.parent.equipmentSelected.includes(CONSTANTS.item.Gold_Sapphire_Ring),
                        fighterAmulet: this.parent.equipmentSelected.includes(CONSTANTS.item.Fighter_Amulet) && this.combatStats.attackType === CONSTANTS.attackType.Melee,
                        warlockAmulet: this.parent.equipmentSelected.includes(CONSTANTS.item.Warlock_Amulet) && this.combatStats.attackType === CONSTANTS.attackType.Magic,
                        guardianAmulet: this.parent.equipmentSelected.includes(CONSTANTS.item.Guardian_Amulet),
                        deadeyeAmulet: this.parent.equipmentSelected.includes(CONSTANTS.item.Deadeye_Amulet) && this.combatStats.attackType === CONSTANTS.attackType.Ranged,
                        confettiCrossbow: this.parent.equipmentSelected.includes(CONSTANTS.item.Confetti_Crossbow),
                        stormsnap: this.parent.equipmentSelected.includes(CONSTANTS.item.Stormsnap),
                        slayerCrossbow: this.parent.equipmentSelected.includes(CONSTANTS.item.Slayer_Crossbow),
                        bigRon: this.parent.equipmentSelected.includes(CONSTANTS.item.Big_Ron),
                        aorpheatsSignetRing: this.parent.equipmentSelected.includes(CONSTANTS.item.Aorpheats_Signet_Ring),
                        elderCrown: this.parent.equipmentSelected.includes(CONSTANTS.item.Elder_Crown),
                        // slayer gear
                        mirrorShield: this.parent.equipmentSelected.includes(CONSTANTS.item.Mirror_Shield),
                        magicalRing: this.parent.equipmentSelected.includes(CONSTANTS.item.Magical_Ring),
                    },
                };

                // set defaults based on known item stats
                Object.getOwnPropertyNames(MICSR.equipmentStatNames).forEach(stat => {
                    equipmentStats[stat] = 0;
                });
                Object.getOwnPropertyNames(MICSR.passiveStatNames).forEach(stat => {
                    equipmentStats[stat] = 0;
                });
                Object.getOwnPropertyNames(MICSR.requiredStatNames).forEach(stat => {
                    equipmentStats[stat] = 1;
                });

                // set custom defaults
                equipmentStats.attackSpeed = 4000;
                equipmentStats.attackBonus = [0, 0, 0];

                // iterate over gear
                for (let equipmentSlot = 0; equipmentSlot < this.parent.equipmentSlotKeys.length; equipmentSlot++) {
                    const itemID = this.parent.equipmentSelected[equipmentSlot];
                    if (itemID === 0) {
                        continue;
                    }
                    const item = items[itemID];

                    // passive stats
                    Object.getOwnPropertyNames(MICSR.passiveStatNames).forEach(stat => {
                        if (equipmentSlot === CONSTANTS.equipmentSlot.Weapon && item.isAmmo) {
                            return;
                        }
                        equipmentStats[stat] += item[stat] || 0;
                    });

                    // level requirements
                    Object.getOwnPropertyNames(MICSR.requiredStatNames).forEach(stat => {
                        const itemStat = item[stat];
                        if (itemStat === undefined || itemStat === null) {
                            return;
                        }
                        equipmentStats[stat] = Math.max(equipmentStats[stat], item[stat] || 0);
                    });

                    // equipment stats
                    if (equipmentSlot !== CONSTANTS.equipmentSlot.Passive) {
                        Object.getOwnPropertyNames(MICSR.equipmentStatNames).forEach(stat => {
                            const itemStat = item[stat];
                            if (itemStat === undefined || itemStat === null) {
                                return;
                            }
                            // special cases
                            switch (stat) {
                                case 'attackBonus':
                                    for (let j = 0; j < 3; j++) {
                                        equipmentStats[stat][j] += itemStat[j];
                                    }
                                    return;
                                case 'attackSpeed':
                                    if (equipmentSlot === CONSTANTS.equipmentSlot.Weapon) {
                                        equipmentStats.attackSpeed = item.attackSpeed || 4000;
                                    }
                                    return;
                                case 'providesRuneQty':
                                    if (equipmentSlot === CONSTANTS.equipmentSlot.Weapon) {
                                        item.providesRune.forEach((rune) => equipmentStats.runesProvidedByWeapon[rune] = itemStat * (equipmentStats.activeItems.magicSkillcape ? 2 : 1));
                                    } else if (equipmentSlot === CONSTANTS.equipmentSlot.Shield) {
                                        item.providesRune.forEach((rune) => equipmentStats.runesProvidedByShield[rune] = itemStat * (equipmentStats.activeItems.magicSkillcape ? 2 : 1));
                                    } else {
                                        console.error(`Runes provided by ${item.name} are not taken into account!`)
                                    }
                                    return;
                            }
                            if (equipmentSlot === CONSTANTS.equipmentSlot.Weapon && item.isAmmo) {
                                return;
                            }
                            // standard stats
                            equipmentStats[stat] += itemStat || 0;
                        });
                    }
                }

                this.equipmentStats = equipmentStats;
            }

            //TODO: implement this
            getSkillHiddenLevels(skillID) {
                return 0;
            }

            /**
             * mimic calculatePlayerAccuracyRating
             */
            calculatePlayerAccuracyRating(baseStats, modifiers) {
                switch (this.combatStats.attackType) {
                    case CONSTANTS.attackType.Ranged:
                        return this.maxRangedAttackRoll(baseStats, modifiers);
                    case CONSTANTS.attackType.Magic:
                        return this.maxMagicAttackRoll(baseStats, modifiers);
                    case CONSTANTS.attackType.Melee:
                        return this.maxMeleeAttackRoll(baseStats, modifiers);
                }
            }

            maxRangedAttackRoll(baseStats, modifiers) {
                // attack style bonus
                let attackStyleBonusAccuracy = 0;
                if (this.attackStyle.Ranged === 0) {
                    attackStyleBonusAccuracy += 3;
                    this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
                }
                // effective level
                const effectiveAttackLevel = Math.floor(
                    this.playerLevels.Ranged + 8 + attackStyleBonusAccuracy
                    + this.getSkillHiddenLevels(CONSTANTS.skill.Ranged)
                );
                // max roll
                let maxAttackRoll = Math.floor(
                    effectiveAttackLevel
                    * (baseStats.attackBonusRanged + 64)
                    * (1 + this.herbloreBonus.rangedAccuracy / 100)
                );
                maxAttackRoll = applyModifier(
                    maxAttackRoll,
                    modifiers.increasedRangedAccuracyBonus
                    + modifiers.increasedGlobalAccuracy
                    - modifiers.decreasedRangedAccuracyBonus
                    - modifiers.decreasedGlobalAccuracy
                    // TODO: is this a debuff? if so, add it to the acc calc in the simulation
                    // - combatData.player.decreasedAccuracy
                );
                return maxAttackRoll;
            }

            maxMagicAttackRoll(baseStats, modifiers) {
                // attack style bonus
                let attackStyleBonusAccuracy = 0;
                // effective level
                const effectiveAttackLevel = Math.floor(
                    this.playerLevels.Magic + 8 + attackStyleBonusAccuracy +
                    this.getSkillHiddenLevels(CONSTANTS.skill.Magic)
                );
                // max roll
                let maxAttackRoll = Math.floor(
                    effectiveAttackLevel
                    * (baseStats.attackBonusMagic + 64)
                    * (1 + this.herbloreBonus.magicAccuracy / 100)
                );
                maxAttackRoll = applyModifier(
                    maxAttackRoll,
                    modifiers.increasedMagicAccuracyBonus
                    + modifiers.increasedGlobalAccuracy
                    - modifiers.decreasedMagicAccuracyBonus
                    - modifiers.decreasedGlobalAccuracy
                    // TODO: is this a debuff? if so, add it to the acc calc in the simulation
                    // - combatData.player.decreasedAccuracy
                );
                return maxAttackRoll;
            }

            maxMeleeAttackRoll(baseStats, modifiers) {
                // attack style bonus
                let attackStyleBonusAccuracy = 0;
                if (this.petOwned[12]) {
                    attackStyleBonusAccuracy += 3;
                }
                // effective level
                const effectiveAttackLevel = Math.floor(
                    this.playerLevels.Attack + 8 + attackStyleBonusAccuracy +
                    this.getSkillHiddenLevels(CONSTANTS.skill.Attack)
                );
                // max roll
                let maxAttackRoll = Math.floor(
                    effectiveAttackLevel
                    * (baseStats.attackBonus[this.attackStyle.Melee] + 64)
                    * (1 + this.herbloreBonus.meleeAccuracy / 100)
                );
                maxAttackRoll = applyModifier(
                    maxAttackRoll,
                    modifiers.increasedMeleeAccuracyBonus
                    + modifiers.increasedGlobalAccuracy
                    - modifiers.decreasedMeleeAccuracyBonus
                    - modifiers.decreasedGlobalAccuracy
                    // TODO: is this a debuff? if so, add it to the acc calc in the simulation
                    // - combatData.player.decreasedAccuracy
                );
                return maxAttackRoll;
            }

            /**
             * mimic getNumberMultiplierValue
             */
            getNumberMultiplierValue(value) {
                return value * this.numberMultiplier;
            }

            /**
             * mimic resetPlayerBaseStats
             */
            resetPlayerBaseStats() {
                return {
                    attackBonus: [0, 0, 0],
                    defenceBonus: 0,
                    strengthBonus: 0,
                    damageReduction: 0,
                    attackBonusRanged: 0,
                    defenceBonusRanged: 0,
                    strengthBonusRanged: 0,
                    attackBonusMagic: 0,
                    defenceBonusMagic: 0,
                    damageBonusMagic: 0,
                };
            }

            /**
             * mimic updatePlayerBaseStats
             */
            updatePlayerBaseStats(baseStats, monsterID = undefined) {
                baseStats = this.resetPlayerBaseStats(baseStats);
                for (let i = 0; i < 3; i++) {
                    baseStats.attackBonus[i] += this.equipmentStats.attackBonus[i];
                }
                baseStats.defenceBonus += this.equipmentStats.defenceBonus;
                baseStats.strengthBonus += this.equipmentStats.strengthBonus;
                baseStats.damageReduction += this.equipmentStats.damageReduction;
                baseStats.attackBonusRanged += this.equipmentStats.rangedAttackBonus;
                baseStats.defenceBonusRanged += this.equipmentStats.rangedDefenceBonus;
                baseStats.strengthBonusRanged += this.equipmentStats.rangedStrengthBonus;
                baseStats.attackBonusMagic += this.equipmentStats.magicAttackBonus;
                baseStats.defenceBonusMagic += this.equipmentStats.magicDefenceBonus;
                baseStats.damageBonusMagic += this.equipmentStats.magicDamageBonus;
                if (monsterID === undefined) {
                    return;
                }
                if (this.equipmentStats.activeItems.stormsnap) {
                    baseStats.strengthBonusRanged = Math.floor(110 + (1 + (MONSTERS[monsterID].magicLevel * 6) / 33));
                    baseStats.attackBonusRanged = Math.floor(102 * (1 + (MONSTERS[monsterID].magicLevel * 6) / 5500));
                } else if (this.equipmentStats.activeItems.slayerCrossbow
                    // && !isDungeon // TODO: implement this check by duplicating certain sims? see issue #10
                    && (MONSTERS[monsterID].slayerXP !== undefined || this.isSlayerTask)) {
                    baseStats.strengthBonusRanged = Math.floor(baseStats.strengthBonusRanged * items[CONSTANTS.item.Slayer_Crossbow].slayerStrengthMultiplier);
                } else if (this.equipmentStats.activeItems.bigRon && MONSTERS[monsterID].isBoss) {
                    baseStats.strengthBonus = Math.floor(baseStats.strengthBonus * items[CONSTANTS.item.Big_Ron].bossStrengthMultiplier);
                }
            }

            /**
             * calculatePlayerMaxHit
             */
            calculatePlayerMaxHit(baseStats, modifiers) {
                let maxHit = 0;
                switch (this.combatStats.attackType) {
                    case CONSTANTS.attackType.Ranged:
                        maxHit = this.maxRangedHit(baseStats, modifiers);
                        break;
                    case CONSTANTS.attackType.Magic:
                        maxHit = this.maxMagicHit(baseStats, modifiers);
                        break;
                    case CONSTANTS.attackType.Melee:
                        maxHit = this.maxMeleeHit(baseStats, modifiers);
                        break;
                }
                // max hit modifiers apply to everything except for ancient magics
                // TODO: not implemented in game yet
                if (this.combatStats.attackType !== CONSTANTS.attackType.Magic || !this.spells.ancient.isSelected) {
                    //maxHit += applyModifier(playerModifiers.increasedMaxHitPercent - playerModifiers.decreasedMaxHitPercent);
                    //maxHit += getNumberMultiplierValue(playerModifiers.increasedMaxHitFlat - playerModifiers.decreasedMaxHitFlat);
                }
                return maxHit
            }

            maxRangedHit(baseStats, modifiers) {
                let attackStyleBonusStrength = 0;
                if (this.attackStyle.Ranged === 0) {
                    attackStyleBonusStrength += 3;
                }
                const effectiveStrengthLevel = Math.floor(this.playerLevels.Ranged + attackStyleBonusStrength + this.getSkillHiddenLevels(CONSTANTS.skill.Ranged));
                let baseMaxHit = Math.floor(this.numberMultiplier * ((1.3 + effectiveStrengthLevel / 10 + baseStats.strengthBonusRanged / 80 + (effectiveStrengthLevel * baseStats.strengthBonusRanged) / 640) * (1 + this.herbloreBonus.rangedStrength / 100)));
                baseMaxHit = this.applyModifier(
                    baseMaxHit,
                    modifiers.increasedRangedStrengthBonus
                    - modifiers.decreasedRangedStrengthBonus
                );
                return baseMaxHit;
            }

            maxMagicHit(baseStats, modifiers) {
                let baseMaxHit;
                let selectedSpell = this.spells.standard.selectedID;
                if (!this.spells.ancient.isSelected) {
                    baseMaxHit = Math.floor(this.numberMultiplier
                        * (SPELLS[selectedSpell].maxHit + SPELLS[selectedSpell].maxHit * baseStats.damageBonusMagic / 100)
                        * (1 + (this.playerLevels.Magic + 1 + this.getSkillHiddenLevels(CONSTANTS.skill.Magic)) / 200)
                        * (1 + this.herbloreBonus.magicDamage / 100));
                    baseMaxHit = applyModifier(
                        baseMaxHit,
                        modifiers.increasedMagicDamageBonus
                        - modifiers.decreasedMagicDamageBonus
                    );
                } else {
                    selectedSpell = this.spells.ancient.selectedID;
                    baseMaxHit = ANCIENT[selectedSpell].maxHit;
                }
                // apply cloud burst effect to normal water spells
                if (!this.spells.ancient.isSelected
                    && this.parent.equipmentSelected.includes(CONSTANTS.item.Cloudburst_Staff)
                    && SPELLS[selectedSpell].spellType === CONSTANTS.spellType.Water) {
                    baseMaxHit += this.getNumberMultiplierValue(items[CONSTANTS.item.Cloudburst_Staff].increasedWaterSpellDamage);
                }
                // Apply Fury aurora
                if (this.auroraBonus.increasedMaxHit !== undefined && !this.spells.ancient.isSelected) {
                    if (this.auroraBonus.increasedMaxHit !== null) {
                        baseMaxHit += this.auroraBonus.increasedMaxHit;
                    }
                }
                return baseMaxHit;
            }

            maxMeleeHit(baseStats, modifiers) {
                const effectiveStrengthLevel = Math.floor(this.playerLevels.Strength + 8 + this.getSkillHiddenLevels(CONSTANTS.skill.Strength));
                let baseMaxHit = Math.floor(this.numberMultiplier * ((1.3 + effectiveStrengthLevel / 10 + baseStats.strengthBonus / 80 + (effectiveStrengthLevel * baseStats.strengthBonus) / 640) * (1 + this.herbloreBonus.meleeStrength / 100)));
                baseMaxHit = applyModifier(
                    baseMaxHit,
                    modifiers.increasedMeleeStrengthBonus -
                    modifiers.decreasedMeleeStrengthBonus
                );
                return baseMaxHit;
            }

            /**
             * Calculates the combat stats from equipment, combat style, spell selection and player levels and stores them in `this.combatStats`
             */
            updateCombatStats() {
                // update numberMultiplier
                if (this.isAdventure) {
                    this.numberMultiplier = 100;
                } else {
                    this.numberMultiplier = 10;
                }
                // update modifiers
                this.updateModifiers();
                const modifiers = this.modifiers;
                // set base stats
                this.updatePlayerBaseStats(this.baseStats);
                // attack type
                const weaponID = this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon];
                if (items[weaponID].type === 'Ranged Weapon' || items[weaponID].isRanged) {
                    // Ranged
                    this.combatStats.attackType = CONSTANTS.attackType.Ranged;
                } else if (items[weaponID].isMagic) {
                    // Magic
                    this.combatStats.attackType = CONSTANTS.attackType.Magic;
                } else {
                    // Melee
                    this.combatStats.attackType = CONSTANTS.attackType.Melee;
                }
                // attack speed
                this.combatStats.attackSpeed = 4000;
                // min hit
                this.combatStats.minHit = 0;
                // rune preservation
                this.combatStats.runePreservation = 0;
                let attackStyleBonus = 1;
                let meleeDefenceBonus = 1;
                // various
                if (items[weaponID].type === 'Ranged Weapon' || items[weaponID].isRanged) {
                    // Ranged
                    if (this.attackStyle.Ranged === 1) {
                        this.combatStats.attackSpeed = this.equipmentStats.attackSpeed - 400;
                    }
                    if (this.attackStyle.Ranged === 2) {
                        meleeDefenceBonus += 3;
                        this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
                    }
                    const effectiveStrengthLevel = Math.floor(this.playerLevels.Ranged + attackStyleBonus);
                } else if (items[weaponID].isMagic) {
                    // Magic
                    if (this.spells.standard.isSelected) {
                        this.combatStats.minHit = 0;
                        switch (SPELLS[this.spells.standard.selectedID].spellType) {
                            case CONSTANTS.spellType.Air:
                                this.combatStats.minHit = this.equipmentStats.increasedMinAirSpellDmg;
                                break;
                            case CONSTANTS.spellType.Water:
                                this.combatStats.minHit = this.equipmentStats.increasedMinWaterSpellDmg;
                                break;
                            case CONSTANTS.spellType.Earth:
                                this.combatStats.minHit = this.equipmentStats.increasedMinEarthSpellDmg;
                                break;
                            case CONSTANTS.spellType.Fire:
                                this.combatStats.minHit = this.equipmentStats.increasedMinFireSpellDmg;
                                break;
                            default:
                        }
                    }
                    this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
                    if (this.equipmentStats.activeItems.skullCape) {
                        this.combatStats.runePreservation += 0.2;
                    }
                    if (this.petOwned[17]) {
                        this.combatStats.runePreservation += 0.05;
                    }
                } else {
                    // Melee
                    // max hit
                    let strengthLevelBonus = 1;
                    if (this.petOwned[13]) strengthLevelBonus += 3;
                    const effectiveStrengthLevel = Math.floor(this.playerLevels.Strength + 8 + strengthLevelBonus);
                    // attack speed
                    this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
                }
                // max attack roll
                this.combatStats.maxAttackRoll = this.calculatePlayerAccuracyRating(this.baseStats, modifiers);
                // max hit roll
                this.combatStats.maxHit = this.calculatePlayerMaxHit(this.baseStats, modifiers);
                // defence
                const effectiveDefenceLevel = Math.floor(this.playerLevels.Defence + 8 + meleeDefenceBonus);
                this.combatStats.maxDefRoll = Math.floor(effectiveDefenceLevel * (this.equipmentStats.defenceBonus + 64) * (1 + (this.prayerBonus.meleeEvasion) / 100) * (1 + this.herbloreBonus.meleeEvasion / 100));
                const effectiveRngDefenceLevel = Math.floor(this.playerLevels.Defence + 8 + 1);
                this.combatStats.maxRngDefRoll = Math.floor(effectiveRngDefenceLevel * (this.equipmentStats.rangedDefenceBonus + 64) * (1 + (this.prayerBonus.rangedEvasion) / 100) * (1 + this.herbloreBonus.rangedEvasion / 100));
                const effectiveMagicDefenceLevel = Math.floor(this.playerLevels.Magic * 0.7 + this.playerLevels.Defence * 0.3 + 9);
                this.combatStats.maxMagDefRoll = Math.floor(effectiveMagicDefenceLevel * (this.equipmentStats.magicDefenceBonus + 64) * (1 + (this.prayerBonus.magicEvasion / 100)) * (1 + this.herbloreBonus.magicEvasion / 100));
                // Peri
                if (this.petOwned[22]) {
                    this.combatStats.maxDefRoll = Math.floor(this.combatStats.maxDefRoll * 1.05);
                    this.combatStats.maxRngDefRoll = Math.floor(this.combatStats.maxRngDefRoll * 1.05);
                    this.combatStats.maxMagDefRoll = Math.floor(this.combatStats.maxMagDefRoll * 1.05);
                }
                // Update aurora bonuses
                this.computeAuroraBonus();
                if (this.auroraBonus.meleeEvasionBuff !== 0) {
                    this.combatStats.maxDefRoll = Math.floor(this.combatStats.maxDefRoll * (1 + this.auroraBonus.meleeEvasionBuff / 100));
                }
                if (this.auroraBonus.rangedEvasionBuff !== 0) {
                    this.combatStats.maxRngDefRoll = Math.floor(this.combatStats.maxRngDefRoll * (1 + this.auroraBonus.rangedEvasionBuff / 100));
                }
                if (this.auroraBonus.magicEvasionBuff !== 0) {
                    this.combatStats.maxMagDefRoll = Math.floor(this.combatStats.maxMagDefRoll * (1 + this.auroraBonus.magicEvasionBuff / 100));
                }
                if (this.auroraBonus.increasedMinHit !== 0 && this.spells.standard.isSelected) {
                    this.combatStats.minHit += this.auroraBonus.increasedMinHit;
                }
                // Calculate damage reduction
                this.combatStats.damageReduction = this.equipmentStats.damageReduction + this.herbloreBonus.damageReduction + this.prayerBonus.damageReduction;
                if (this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Passive] === CONSTANTS.item.Guardian_Amulet) {
                    // Guardian Amulet gives +5% DR in passive slot
                    this.combatStats.damageReduction += 5;
                }
                if (this.petOwned[14]) {
                    this.combatStats.damageReduction++;
                }
                // Max Hitpoints
                this.combatStats.maxHitpoints = this.playerLevels.Hitpoints + this.equipmentStats.increasedMaxHitpoints;
                if (this.petOwned[15]) {
                    this.combatStats.maxHitpoints++;
                }
                this.combatStats.maxHitpoints *= this.numberMultiplier;
            }

            /**
             * Computes the prayer bonuses for the selected prayers
             */
            computePrayerBonus() {
                this.resetPrayerBonus();
                for (let i = 0; i < this.prayerSelected.length; i++) {
                    if (this.prayerSelected[i]) {
                        if (PRAYER[i].modifiers !== undefined) {
                            for (const modifier in PRAYER[i].modifiers) {
                                this.addModifiers(PRAYER[i].modifiers, this.prayerBonus.modifiers);
                            }
                        }
                        if (PRAYER[i].vars !== undefined) {
                            let j = 0;
                            for (const v of PRAYER[i].vars) {
                                this.prayerBonus[v] += PRAYER[i].values[j];
                                j++;
                            }
                        }
                    }
                }
            }

            /**
             * Resets prayer bonuses to none
             */
            resetPrayerBonus() {
                const prayerVars = {};
                PRAYER.map(x => x.vars)
                    .filter(x => x !== undefined)
                    .forEach(vars => vars.forEach(v => {
                        if (prayerVars[v] === undefined) {
                            prayerVars[v] = 0;
                        }
                    }));
                this.prayerBonus = {
                    modifiers: this.copyModifierTemplate(),
                    vars: prayerVars,
                };
            }

            /**
             * Add modifiers in source to target
             * @param source
             * @param target
             */
            addModifiers(source, target) {
                for (const modifier in source) {
                    target[modifier] += source[modifier];
                }
            }

            /**
             * Create new modifiers object
             * @returns {{}}
             */
            copyModifierTemplate() {
                const modifiers = {}
                for (const prop in playerModifiersTemplate) {
                    if (playerModifiersTemplate[prop].length || !Number.isInteger(playerModifiersTemplate[prop])) {
                        modifiers[prop] = [];
                    } else {
                        modifiers[prop] = 0;
                    }
                }
                return modifiers;
            }

            /**
             * Update this.modifiers
             */
            updateModifiers() {
                this.modifiers = this.copyModifierTemplate();
                // TODO: implement this
                this.addModifiers(this.prayerBonus.modifiers, this.modifiers);
            }

            /**
             * Sets aurora bonuses
             */
            computeAuroraBonus() {
                this.resetAuroraBonus();
                if ((this.combatStats.attackType === CONSTANTS.attackType.Magic || this.equipmentStats.canUseMagic) && this.spells.aurora.isSelected) {
                    const auroraID = this.spells.aurora.selectedID;
                    switch (auroraID) {
                        case CONSTANTS.aurora.Surge_I:
                        case CONSTANTS.aurora.Surge_II:
                        case CONSTANTS.aurora.Surge_III:
                            this.auroraBonus.attackSpeedBuff = AURORAS[auroraID].effectValue[0];
                            this.auroraBonus.rangedEvasionBuff = AURORAS[auroraID].effectValue[1];
                            break;
                        case CONSTANTS.aurora.Fury_I:
                        case CONSTANTS.aurora.Fury_II:
                        case CONSTANTS.aurora.Fury_III:
                            this.auroraBonus.increasedMaxHit = AURORAS[auroraID].effectValue[0];
                            this.auroraBonus.magicEvasionBuff = AURORAS[auroraID].effectValue[1];
                            break;
                        case CONSTANTS.aurora.Fervor_I:
                        case CONSTANTS.aurora.Fervor_II:
                        case CONSTANTS.aurora.Fervor_III:
                            this.auroraBonus.lifesteal = AURORAS[auroraID].effectValue[0];
                            this.auroraBonus.meleeEvasionBuff = AURORAS[auroraID].effectValue[1];
                            break;
                        case CONSTANTS.aurora.Charged_I:
                        case CONSTANTS.aurora.Charged_II:
                        case CONSTANTS.aurora.Charged_III:
                            this.auroraBonus.increasedMinHit = AURORAS[auroraID].effectValue;
                            break;
                    }
                }
            }

            /**
             * Resets the aurora bonuses to default
             */
            resetAuroraBonus() {
                Object.keys(this.auroraBonus).forEach((key) => {
                    this.auroraBonus[key] = 0;
                });
            }

            /**
             * Computes the potion bonuses for the selected potion
             * */
            computePotionBonus() {
                this.resetPotionBonus();
                if (this.potionSelected) {
                    const bonusID = items[herbloreItemData[this.potionID].itemID[this.potionTier]].potionBonusID;
                    const bonusValue = items[herbloreItemData[this.potionID].itemID[this.potionTier]].potionBonus;
                    switch (bonusID) {
                        case 0: // Melee Accuracy
                            this.herbloreBonus.meleeAccuracy = bonusValue;
                            break;
                        case 1: // Melee Evasion
                            this.herbloreBonus.meleeEvasion = bonusValue;
                            break;
                        case 2: // Melee Strength
                            this.herbloreBonus.meleeStrength = bonusValue;
                            break;
                        case 3: // Ranged Evasion/Accuracy
                            this.herbloreBonus.rangedEvasion = bonusValue;
                            this.herbloreBonus.rangedAccuracy = bonusValue;
                            break;
                        case 4: // Ranged Strength
                            this.herbloreBonus.rangedStrength = bonusValue;
                            break;
                        case 5: // Magic Evasion/Accruracy
                            this.herbloreBonus.magicEvasion = bonusValue;
                            this.herbloreBonus.magicAccuracy = bonusValue;
                            break;
                        case 6: // Magic Damage
                            this.herbloreBonus.magicDamage = bonusValue;
                            break;
                        case 7: // HP regen
                            this.herbloreBonus.hpRegen = bonusValue;
                            break;
                        case 8: // Damage Reduction
                            this.herbloreBonus.damageReduction = bonusValue;
                            break;
                        case 9: // Diamond luck
                            this.herbloreBonus.diamondLuck = true;
                            break;
                        case 10: // Divine
                            this.herbloreBonus.divine = bonusValue;
                            break;
                        case 11: // Lucky Herb
                            this.herbloreBonus.luckyHerb = bonusValue;
                            break;
                        default:
                            MICSR.error(`Unknown Potion Bonus: ${bonusID}`);
                    }
                }
            }

            /**
             * Resets the potion bonuses to none
             */
            resetPotionBonus() {
                this.herbloreBonus.meleeAccuracy = 0; // 0
                this.herbloreBonus.meleeEvasion = 0; // 1
                this.herbloreBonus.meleeStrength = 0; // 2
                this.herbloreBonus.rangedAccuracy = 0; // 3
                this.herbloreBonus.rangedEvasion = 0; // 3
                this.herbloreBonus.rangedStrength = 0; // 4
                this.herbloreBonus.magicEvasion = 0; // 5
                this.herbloreBonus.magicAccuracy = 0; // 5
                this.herbloreBonus.magicDamage = 0; // 6
                this.herbloreBonus.hpRegen = 0; // 7
                this.herbloreBonus.damageReduction = 0; // 8
                this.herbloreBonus.diamondLuck = false; // 9
                this.herbloreBonus.divine = 0; // 10
                this.herbloreBonus.luckyHerb = 0; // 11
            }

            playerAttackSpeed() {
                let attackSpeed = this.combatStats.attackSpeed;
                if (this.parent.equipmentSelected.includes(CONSTANTS.item.Guardian_Amulet)) {
                    // Guardian Amulet gives 20% increase in attack speed (40% if below 50% HP)
                    attackSpeed *= 1.2;
                }
                attackSpeed -= this.decreasedAttackSpeed();
                return attackSpeed;
            }

            decreasedAttackSpeed() {
                let decrease = this.auroraBonus.attackSpeedBuff + this.equipmentStats.decreasedAttackSpeed;
                // Otto
                if (this.petOwned[23]) {
                    decrease += 100;
                }
                return decrease;
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

            getFoodHealAmt() {
                let amt = items[this.foodSelected].healsFor;
                amt *= this.numberMultiplier;
                let multiplier = 1;
                if (this.cookingPool) {
                    multiplier += .1;
                }
                if (this.cookingMastery && items[this.foodSelected].masteryID && items[this.foodSelected].masteryID[0] === CONSTANTS.skill.Cooking) {
                    multiplier += .2;
                }
                amt *= multiplier;
                return amt;
            }

            /**
             * Setup currentsim variables
             */
            setupCurrentSim() {
                this.simStartTime = performance.now();
                this.simCancelled = false;
                // Start by grabbing the player stats
                /** @type {PlayerStats} */
                const playerStats = {
                    attackSpeed: this.combatStats.attackSpeed,
                    attackType: this.combatStats.attackType,
                    isMelee: this.combatStats.attackType === CONSTANTS.attackType.Melee,
                    isRanged: this.combatStats.attackType === CONSTANTS.attackType.Ranged,
                    isMagic: this.combatStats.attackType === CONSTANTS.attackType.Magic,
                    maxAttackRoll: this.combatStats.maxAttackRoll,
                    maxHit: this.combatStats.maxHit,
                    minHit: this.combatStats.minHit,
                    maxDefRoll: this.combatStats.maxDefRoll,
                    maxMagDefRoll: this.combatStats.maxMagDefRoll,
                    maxRngDefRoll: this.combatStats.maxRngDefRoll,
                    xpBonus: 0,
                    globalXPMult: 1,
                    maxHitpoints: this.combatStats.maxHitpoints,
                    avgHPRegen: 0,
                    damageReduction: this.combatStats.damageReduction,
                    diamondLuck: this.herbloreBonus.diamondLuck,
                    usingMagic: false,
                    usingAncient: false,
                    hasSpecialAttack: false,
                    specialData: {},
                    startingGP: 50000000,
                    levels: Object.assign({}, this.playerLevels), // Shallow copy of player levels
                    activeItems: {...this.equipmentStats.activeItems},
                    equipmentSelected: [...this.parent.equipmentSelected],
                    prayerPointsPerAttack: 0,
                    prayerPointsPerEnemy: 0,
                    prayerPointsPerHeal: 0,
                    prayerXpPerDamage: 0,
                    isProtected: false,
                    hardcore: this.isHardcore,
                    // passive stats
                    ammoPreservation: this.equipmentStats.ammoPreservation,
                    lifesteal: this.auroraBonus.lifesteal + this.equipmentStats.lifesteal,
                    spellheal: this.equipmentStats.spellheal,
                    reflectDamage: this.equipmentStats.reflectDamage,
                    decreasedAttackSpeed: this.decreasedAttackSpeed(),
                    runePreservation: this.combatStats.runePreservation,
                    // curses
                    canCurse: false,
                    curseID: -1,
                    curseData: {},
                    runeCosts: {
                        spell: [],
                        curse: [],
                        aurora: [],
                    },
                    // area effects
                    slayerAreaEffectNegationPercent: this.equipmentStats.slayerAreaEffectNegationPercent,
                    slayerAreaEffectNegationFlat: this.equipmentStats.slayerAreaEffectNegationFlat,
                    // healing
                    autoEat: {
                        cost: 0,
                        eatAt: 0,
                        maxHP: 0,
                        efficiency: 0,
                        manual: false,
                    },
                    foodHeal: 0, // TODO: add food selection and add cooking mastery checkboxes
                };
                // MICSR.log({...playerStats});

                // set auto eat
                if (this.autoEatTier >= 0) {
                    playerStats.autoEat = {...autoEatData[this.autoEatTier]};
                    playerStats.autoEat.eatAt += this.equipmentStats.increasedAutoEat | 0;
                    playerStats.autoEat.efficiency -= this.equipmentStats.decreasedAutoEatEfficiency | 0;
                } else {
                    playerStats.autoEat.manual = true;
                }
                if (this.foodSelected > 0) {
                    playerStats.foodHeal = this.getFoodHealAmt();
                }

                // Magic curses and auroras
                if (this.combatStats.attackType === CONSTANTS.attackType.Magic || this.equipmentStats.canUseMagic) {
                    playerStats.usingMagic = true;

                    // Rune costs
                    if (!this.spells.ancient.isSelected && this.spells.curse.isSelected) {
                        playerStats.runeCosts.curse = this.getRuneCostForSpell(CURSES[this.spells.curse.selectedID]);
                    }
                    if (this.spells.aurora.isSelected) {
                        playerStats.runeCosts.aurora = this.getRuneCostForSpell(AURORAS[this.spells.aurora.selectedID], true);
                    }
                }
                // spells
                if (this.combatStats.attackType === CONSTANTS.attackType.Magic) {
                    if (this.spells.ancient.isSelected) {
                        playerStats.runeCosts.spell = this.getRuneCostForSpell(ANCIENT[this.spells.ancient.selectedID]);
                    } else {
                        playerStats.runeCosts.spell = this.getRuneCostForSpell(SPELLS[this.spells.standard.selectedID]);
                    }
                }

                // Special Attack and Ancient Magicks
                playerStats.specialData = [];
                if (this.combatStats.attackType === CONSTANTS.attackType.Magic && this.spells.ancient.isSelected) {
                    playerStats.usingAncient = true;
                    playerStats.specialData.push(playerSpecialAttacks[ANCIENT[this.spells.ancient.selectedID].specID]);
                } else {
                    for (const itemId of this.parent.equipmentSelected) {
                        if (items[itemId].hasSpecialAttack) {
                            playerStats.hasSpecialAttack = true;
                            playerStats.specialData.push(playerSpecialAttacks[items[itemId].specialAttackID]);
                        }
                    }
                }
                // MICSR.log({...playerStats.specialData});

                // Curses
                if (this.spells.curse.isSelected && (this.combatStats.attackType === CONSTANTS.attackType.Magic && !this.spells.ancient.isSelected || this.equipmentStats.canUseMagic)) {
                    playerStats.canCurse = true;
                    playerStats.curseID = this.spells.curse.selectedID;
                    playerStats.curseData = CURSES[this.spells.curse.selectedID];
                }

                // Regen Calculation
                if (!this.isHardcore) {
                    // Base
                    playerStats.avgHPRegen = 1 + Math.floor(this.combatStats.maxHitpoints / 10 / this.numberMultiplier);
                    // Shaman Ring
                    playerStats.avgHPRegen += this.equipmentStats.increasedHPRegen;
                    // Hitpoints Skillcape
                    if (playerStats.activeItems.hitpointsSkillcape) {
                        playerStats.avgHPRegen += 1 * this.numberMultiplier;
                    }
                    // Rapid Heal Prayer
                    if (this.prayerSelected[CONSTANTS.prayer.Rapid_Heal]) {
                        playerStats.avgHPRegen *= 2;
                    }
                    // Regeneration Potion
                    playerStats.avgHPRegen = Math.floor(playerStats.avgHPRegen * (1 + this.herbloreBonus.hpRegen / 100));
                    // Gold Ruby Ring
                    playerStats.avgHPRegen = Math.floor(playerStats.avgHPRegen * (1 + this.equipmentStats.hpRegenBonus / 100));
                }

                // Life Steal from gear
                playerStats.lifesteal += this.equipmentStats.lifesteal;

                // Calculate Global XP Multiplier
                if (playerStats.activeItems.firemakingSkillcape) {
                    playerStats.globalXPMult += 0.05;
                }
                if (this.petOwned[2]) {
                    playerStats.globalXPMult += 0.01;
                }

                // ammo preservation
                if (this.petOwned[16]) {
                    playerStats.ammoPreservation += 5;
                }
                // Other Bonuses
                if (playerStats.activeItems.goldEmeraldRing) {
                    playerStats.xpBonus = 0.07;
                }
                this.currentSim.canTopazDrop = false;
                // base gp increase
                this.currentSim.increasedGP = this.equipmentStats.increasedGP;
                // multiplier gp increase
                this.currentSim.gpBonus = 1;
                if (this.parent.equipmentSelected.includes(CONSTANTS.item.Gold_Topaz_Ring)) {
                    this.currentSim.gpBonus *= 1.15;
                    this.currentSim.canTopazDrop = true;
                }
                if (this.parent.equipmentSelected.includes(CONSTANTS.item.Aorpheats_Signet_Ring)) {
                    this.currentSim.gpBonus *= 2;
                }
                if (this.parent.equipmentSelected.includes(CONSTANTS.item.Almighty_Lute)) {
                    this.currentSim.gpBonus *= 5;
                }
                this.currentSim.lootBonus = 1 + this.equipmentStats.chanceToDoubleLoot / 100;
                if (this.petOwned[20]) this.currentSim.lootBonus += 0.01;
                this.currentSim.slayerBonusXP = this.equipmentStats.slayerBonusXP;
                this.currentSim.herbConvertChance = this.herbloreBonus.luckyHerb / 100;
                this.currentSim.doBonesAutoBury = (this.parent.equipmentSelected.includes(CONSTANTS.item.Bone_Necklace));


                // adjust prayer usage
                const adjustPP = (pp) => {
                    if (pp > 0) {
                        pp -= this.equipmentStats.prayerCostReduction;
                    }
                    if (playerStats.activeItems.prayerSkillcape && pp > 0) {
                        pp = Math.max(1, Math.floor(pp / 2));
                    }
                    let save = this.herbloreBonus.divine;
                    if (this.petOwned[18]) {
                        save += 5;
                    }
                    pp *= 1 - save / 100;
                    return pp;
                }
                // Compute prayer point usage and xp gain
                for (let i = 0; i < PRAYER.length; i++) {
                    if (this.prayerSelected[i]) {
                        // Base PP Usage
                        playerStats.prayerPointsPerAttack += adjustPP(PRAYER[i].pointsPerPlayer);
                        playerStats.prayerPointsPerEnemy += adjustPP(PRAYER[i].pointsPerEnemy);
                        playerStats.prayerPointsPerHeal += adjustPP(PRAYER[i].pointsPerRegen);
                        // XP Gain
                        // TODO: this matches the bugged behaviour of 0.18?613 of Melvor Idle
                        playerStats.prayerXpPerDamage += 2 * PRAYER[i].pointsPerPlayer / this.numberMultiplier;
                    }
                }

                this.currentSim.options = {
                    trials: this.trials,
                    maxActions: this.maxActions,
                    forceFullSim: this.forceFullSim,
                };
                this.currentSim.playerStats = playerStats;
                this.currentSim.isSlayerTask = this.isSlayerTask;
                this.currentSim.playerStats.isSlayerTask = this.isSlayerTask;
                Object.assign(this.currentSim.equipmentStats, this.equipmentStats);
                Object.assign(this.currentSim.herbloreBonus, this.herbloreBonus);
                Object.assign(this.currentSim.prayerBonus, this.prayerBonus);
                Object.assign(this.currentSim.attackStyle, this.attackStyle);
                Object.assign(this.currentSim.virtualLevels, this.virtualLevels);

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
                        if (area[0] === 1 && !this.canAccessArea(slayerAreas[area[1]])) {
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
                // An attempt to sort jobs by relative complexity so they go from highest to lowest.
                this.simulationQueue = this.simulationQueue.sort((jobA, jobB) => {
                    const jobAComplex = this.enemyStats[jobA.monsterID].hitpoints / this.calculateAccuracy(playerStats, this.enemyStats[jobA.monsterID]);
                    const jobBComplex = this.enemyStats[jobB.monsterID].hitpoints / this.calculateAccuracy(playerStats, this.enemyStats[jobB.monsterID]);
                    return jobBComplex - jobAComplex;
                });
            }

            /**
             * Returns the combined amount of runes it costs to use a spell after discounts from equipment
             * @param {Spell} spell The spell to get the rune cost for
             * @param {boolean} [isAurora=false] If the spell is an aurora
             * @returns {array} The amount of runes it costs to use the spell
             */
            getRuneCostForSpell(spell, isAurora = false) {
                const runesRequired = this.useCombinationRunes && spell.runesRequiredAlt ? spell.runesRequiredAlt : spell.runesRequired;
                return runesRequired.map(req => {
                    let qty = req.qty;
                    qty -= this.equipmentStats.runesProvidedByWeapon[req.id] || 0;
                    qty -= isAurora ? (this.equipmentStats.runesProvidedByShield[req.id] || 0) : 0;
                    return {
                        id: req.id,
                        qty: Math.max(qty, 0),
                    };
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
                enemyStats.maxHitpoints = MONSTERS[monsterID].hitpoints * this.numberMultiplier;
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
                    enemyStats.maxHit = Math.floor(this.numberMultiplier * (1.3 + (effectiveStrengthLevel / 10) + (MONSTERS[monsterID].strengthBonus / 80) + (effectiveStrengthLevel * MONSTERS[monsterID].strengthBonus / 640)));
                } else if (MONSTERS[monsterID].attackType === CONSTANTS.attackType.Ranged) {
                    const effectiveAttackLevel = Math.floor(MONSTERS[monsterID].rangedLevel + 8 + 1);
                    enemyStats.maxAttackRoll = effectiveAttackLevel * (MONSTERS[monsterID].attackBonusRanged + 64);
                    const effectiveStrengthLevel = Math.floor(MONSTERS[monsterID].rangedLevel + 8 + 1);
                    enemyStats.maxHit = Math.floor(this.numberMultiplier * (1.3 + (effectiveStrengthLevel / 10) + (MONSTERS[monsterID].strengthBonusRanged / 80) + (effectiveStrengthLevel * MONSTERS[monsterID].strengthBonusRanged / 640)));
                } else if (MONSTERS[monsterID].attackType === CONSTANTS.attackType.Magic) {
                    const effectiveAttackLevel = Math.floor(MONSTERS[monsterID].magicLevel + 8 + 1);
                    enemyStats.maxAttackRoll = effectiveAttackLevel * (MONSTERS[monsterID].attackBonusMagic + 64);
                    if (MONSTERS[monsterID].selectedSpell === null || MONSTERS[monsterID].selectedSpell === undefined) {
                        enemyStats.maxHit = Math.floor(this.numberMultiplier * MONSTERS[monsterID].setMaxHit * (1 + MONSTERS[monsterID].damageBonusMagic / 100));
                    } else {
                        enemyStats.maxHit = Math.floor(this.numberMultiplier * SPELLS[MONSTERS[monsterID].selectedSpell].maxHit * (1 + MONSTERS[monsterID].damageBonusMagic / 100));
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
                // TODO: this still uses some variables from the global Simulator object, this is a bug !
                if (this.currentSim.playerStats.activeItems.stormsnap
                    || this.currentSim.playerStats.activeItems.slayerCrossbow
                    || this.currentSim.playerStats.activeItems.bigRon) {
                    // recompute base stats
                    this.updatePlayerBaseStats(this.currentSim.baseStats, monsterID);
                    // max attack roll
                    this.combatStats.maxAttackRoll = this.calculatePlayerAccuracyRating(this.currentSim.baseStats, this.currentSim.modifiers);
                    // max hit roll
                    this.combatStats.maxHit = this.calculatePlayerMaxHit(this.currentSim.baseStats, this.currentSim.modifiers);
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

            // TODO: duplicated in workers/simulator.js
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
                // determine relevant defence roll
                let targetDefRoll;
                if (attacker.attackType === 0) {
                    targetDefRoll = target.maxDefRoll;
                } else if (attacker.attackType === 1) {
                    targetDefRoll = target.maxRngDefRoll;
                } else {
                    targetDefRoll = target.maxMagDefRoll;
                }
                // accuracy based on attack roll and defence roll
                if (attacker.maxAttackRoll < targetDefRoll) {
                    return (0.5 * attacker.maxAttackRoll / targetDefRoll) * 100;
                }
                return (1 - 0.5 * targetDefRoll / attacker.maxAttackRoll) * 100;
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
                        enterSet.push(this.canAccessArea(area));
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

            /**
             * Check if we can enter the slayer area `area` with current settings
             */
            canAccessArea(area) {
                // check level requirement
                if (area.slayerLevel !== undefined && this.playerLevels.Slayer < area.slayerLevel) {
                    return false;
                }
                // check clear requirement
                if (area.dungeonCompleted >= 0 && dungeonCompleteCount[area.dungeonCompleted] < 1) {
                    return false
                }
                // check gear requirement
                if (area.slayerItem > 0
                    && !this.currentSim.playerStats.activeItems.slayerSkillcape
                    && !this.currentSim.playerStats.equipmentSelected.includes(area.slayerItem)) {
                    return false;
                }
                return true;
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