(() => {

    const MICSR = window.MICSR;

    const reqs = [
        'statNames',
    ];

    const setup = () => {

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
                        selectedID: -1,
                    },
                    aurora: {
                        array: AURORAS,
                        isSelected: false,
                        selectedID: -1,
                    },
                    ancient: {
                        array: ANCIENT,
                        isSelected: false,
                        selectedID: -1,
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
                this.prayerKeyMap = {
                    prayerBonusAttack: 'meleeAccuracy',
                    prayerBonusStrength: 'meleeDamage',
                    prayerBonusDefence: 'meleeEvasion',
                    prayerBonusAttackRanged: 'rangedAccuracy',
                    prayerBonusStrengthRanged: 'rangedDamage',
                    prayerBonusDefenceRanged: 'rangedEvasion',
                    prayerBonusAttackMagic: 'magicAccuracy',
                    prayerBonusDamageMagic: 'magicDamage',
                    prayerBonusDefenceMagic: 'magicEvasion',
                    prayerBonusProtectItem: 'protectItem',
                    prayerBonusHitpoints: 'hitpoints',
                    prayerBonusProtectFromMelee: 'protectFromMelee',
                    prayerBonusProtectFromRanged: 'protectFromRanged',
                    prayerBonusProtectFromMagic: 'protectFromMagic',
                    prayerBonusHitpointHeal: 'hitpointHeal',
                    prayerBonusDamageReduction: 'damageReduction',
                };
                this.activePrayers = 0;
                /** Computed Prayer Bonus From UI */
                this.prayerBonus = {
                    meleeAccuracy: 0,
                    meleeDamage: 0,
                    meleeEvasion: 0,
                    rangedAccuracy: 0,
                    rangedDamage: 0,
                    rangedEvasion: 0,
                    magicAccuracy: 0,
                    magicDamage: 0,
                    magicEvasion: 0,
                    protectItem: 0,
                    hitpoints: 1,
                    protectFromMelee: 0,
                    protectFromRanged: 0,
                    protectFromMagic: 0,
                    hitpointHeal: 0,
                    damageReduction: 0,
                };
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
                // Hardcore
                this.isHardcore = false;
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

                /** Herblore XP for Lucky Herb Potions */
                this.xpPerHerb = {
                    527: 10, // Garum
                    528: 14, // Sourweed
                    529: 33, // Mantalyme
                    530: 41, // Lemontyle
                    531: 53, // Oxilyme
                    532: 85, // Poraxx
                    533: 112, // Pigtayle
                    534: 160, // Barrentoe
                };
                // Simulation settings
                /** Max number of player actions to attempt before timeout */
                this.maxActions = MICSR.maxActions;
                /** Number of enemy kills to simulate */
                this.trials = MICSR.trials;
                /** force full sim when too many actions are taken */
                this.forceFullSim = false;
                /** Number of hours to farm for signet ring */
                this.signetFarmTime = 1;
                /** @type {boolean[]} */
                this.monsterSimFilter = [];
                /** @type {boolean[]} */
                this.dungeonSimFilter = [];
                // Simulation data;
                /** @type {MonsterSimResult[]} */
                this.monsterSimData = [];
                for (let i = 0; i < MONSTERS.length; i++) {
                    this.monsterSimData.push({
                        inQueue: false,
                        simSuccess: false,
                        xpPerSecond: 0,
                        xpPerHit: 0,
                        hpXpPerSecond: 0,
                        hpPerSecond: 0,
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
                        petRolls: {other: []},
                        petChance: 0,
                    });
                    this.monsterSimFilter.push(true);
                }
                /** @type {MonsterSimResult[]} */
                this.dungeonSimData = [];
                for (let i = 0; i < DUNGEONS.length; i++) {
                    this.dungeonSimData.push({
                        simSuccess: false,
                        xpPerSecond: 0,
                        xpPerHit: 0,
                        hpXpPerSecond: 0,
                        hpPerSecond: 0,
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
                    });
                    this.dungeonSimFilter.push(true);
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
                    prayerBonus: {},
                    herbloreBonus: {},
                    combatStats: {},
                    attackStyle: {},
                    isSlayerTask: false,
                    virtualLevels: {},
                };
                // Options for GP/s calculations
                this.sellBones = false; // True or false
                this.sellLoot = 'All'; // Options 'All','Subset','None'
                this.saleList = this.getSaleList();
                this.lootList = this.getLootList(); // List of items with id: X and sell: true/false
                this.defaultSaleKeep = [403, 247, 248, 366, 249, 383, 368, 246, 367, 348, 443, 350, 349, 351, 347, 430, 429, 427, 428, 137, 136, 139, 314, 313, 312, 134, 296, 138, 141, 140, 434, 142, 135, 426, 425, 423, 424, 418, 417, 415, 416, 340, 405, 344, 406, 361, 414, 413, 411, 412, 372, 378, 371, 374, 369, 373, 380, 376, 375, 377, 379, 370, 407, 341, 365, 364, 422, 421, 419, 420, 120, 404];
                this.convertShards = false;
                this.setSaleListToDefault();
                // Options for time multiplier
                this.timeMultiplier = 1;
                this.selectedPlotIsTime = true;
                // Data Export Settings
                this.exportDataType = [];
                this.exportName = true;
                this.exportDungeonMonsters = true;
                this.exportNonSimmed = true;
                for (let i = 0; i < this.parent.plotTypeDropdownValues.length; i++) {
                    this.exportDataType.push(true);
                }
                // Pet Settings
                this.petSkill = 'Attack';
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
                    numberMultiplier: numberMultiplier,
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

            /**
             * Calculates the combat stats from equipment, combat style, spell selection and player levels and stores them in `this.combatStats`
             */
            updateCombatStats() {
                this.combatStats.attackSpeed = 4000;
                this.combatStats.minHit = 0;
                this.combatStats.runePreservation = 0;
                let attackStyleBonus = 1;
                let meleeDefenceBonus = 1;
                const weaponID = this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon];
                if (items[weaponID].type === 'Ranged Weapon' || items[weaponID].isRanged) {
                    // Ranged
                    this.combatStats.attackType = CONSTANTS.attackType.Ranged;
                    if (this.attackStyle.Ranged === 0) {
                        attackStyleBonus += 3;
                        this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
                    } else if (this.attackStyle.Ranged === 1) {
                        this.combatStats.attackSpeed = this.equipmentStats.attackSpeed - 400;
                    } else {
                        meleeDefenceBonus += 3;
                        this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
                    }
                    const effectiveAttackLevel = Math.floor(this.playerLevels.Ranged + 8 + attackStyleBonus);
                    this.combatStats.maxAttackRoll = Math.floor(effectiveAttackLevel * (this.equipmentStats.rangedAttackBonus + 64) * (1 + (this.prayerBonus.rangedAccuracy / 100)) * (1 + this.herbloreBonus.rangedAccuracy / 100));

                    const effectiveStrengthLevel = Math.floor(this.playerLevels.Ranged + attackStyleBonus);
                    this.combatStats.maxHit = Math.floor(numberMultiplier * ((1.3 + effectiveStrengthLevel / 10 + this.equipmentStats.rangedStrengthBonus / 80 + effectiveStrengthLevel * this.equipmentStats.rangedStrengthBonus / 640) * (1 + (this.prayerBonus.rangedDamage / 100)) * (1 + this.herbloreBonus.rangedStrength / 100)));
                } else if (items[weaponID].isMagic) {
                    // Magic
                    this.combatStats.attackType = CONSTANTS.attackType.Magic;
                    const effectiveAttackLevel = Math.floor(this.playerLevels.Magic + 8 + attackStyleBonus);
                    this.combatStats.maxAttackRoll = Math.floor(effectiveAttackLevel * (this.equipmentStats.magicAttackBonus + 64) * (1 + (this.prayerBonus.magicAccuracy / 100)) * (1 + this.herbloreBonus.magicAccuracy / 100));
                    if (this.spells.standard.isSelected) {
                        this.combatStats.maxHit = Math.floor(numberMultiplier * ((SPELLS[this.spells.standard.selectedID].maxHit + SPELLS[this.spells.standard.selectedID].maxHit * (this.equipmentStats.magicDamageBonus / 100)) * (1 + (this.playerLevels.Magic + 1) / 200) * (1 + this.prayerBonus.magicDamage / 100) * (1 + this.herbloreBonus.magicDamage / 100)));
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
                        // Cloudburst Water Spell Bonus
                        if (this.parent.equipmentSelected.includes(CONSTANTS.item.Cloudburst_Staff) && SPELLS[this.spells.standard.selectedID].spellType === CONSTANTS.spellType.Water) {
                            this.combatStats.maxHit += items[CONSTANTS.item.Cloudburst_Staff].increasedWaterSpellDamage * numberMultiplier;
                        }
                    } else {
                        this.combatStats.maxHit = ANCIENT[this.spells.ancient.selectedID].maxHit * numberMultiplier;
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
                    this.combatStats.attackType = CONSTANTS.attackType.Melee;
                    if (this.petOwned[12]) attackStyleBonus += 3;
                    const effectiveAttackLevel = Math.floor(this.playerLevels.Attack + 8 + attackStyleBonus);
                    this.combatStats.maxAttackRoll = Math.floor(effectiveAttackLevel * (this.equipmentStats.attackBonus[this.attackStyle.Melee] + 64) * (1 + (this.prayerBonus.meleeAccuracy / 100)) * (1 + this.herbloreBonus.meleeAccuracy / 100));
                    let strengthLevelBonus = 1;
                    if (this.petOwned[13]) strengthLevelBonus += 3;
                    const effectiveStrengthLevel = Math.floor(this.playerLevels.Strength + 8 + strengthLevelBonus);
                    this.combatStats.maxHit = Math.floor(numberMultiplier * ((1.3 + effectiveStrengthLevel / 10 + this.equipmentStats.strengthBonus / 80 + effectiveStrengthLevel * this.equipmentStats.strengthBonus / 640) * (1 + (this.prayerBonus.meleeDamage / 100)) * (1 + this.herbloreBonus.meleeStrength / 100)));
                    this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
                }
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
                if (this.auroraBonus.increasedMaxHit !== 0 && this.spells.standard.isSelected) {
                    this.combatStats.maxHit += this.auroraBonus.increasedMaxHit;
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
                this.combatStats.maxHitpoints *= numberMultiplier;
            }

            /**
             * Computes the prayer bonuses for the selected prayers
             */
            computePrayerBonus() {
                this.resetPrayerBonus();
                for (let i = 0; i < this.prayerSelected.length; i++) {
                    if (this.prayerSelected[i]) {
                        for (let j = 0; j < PRAYER[i].vars.length; j++) {
                            this.prayerBonus[this.prayerKeyMap[PRAYER[i].vars[j]]] += PRAYER[i].values[j];
                        }
                    }
                }
            }

            /**
             * Resets prayer bonuses to none
             */
            resetPrayerBonus() {
                this.prayerBonus.meleeAccuracy = 0;
                this.prayerBonus.meleeDamage = 0;
                this.prayerBonus.meleeEvasion = 0;
                this.prayerBonus.rangedAccuracy = 0;
                this.prayerBonus.rangedDamage = 0;
                this.prayerBonus.rangedEvasion = 0;
                this.prayerBonus.magicAccuracy = 0;
                this.prayerBonus.magicDamage = 0;
                this.prayerBonus.magicEvasion = 0;
                this.prayerBonus.protectItem = 0;
                this.prayerBonus.hitpoints = 1;
                this.prayerBonus.protectFromMelee = 0;
                this.prayerBonus.protectFromRanged = 0;
                this.prayerBonus.protectFromMagic = 0;
                this.prayerBonus.hitpointHeal = 0;
                this.prayerBonus.damageReduction = 0;
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

            /*
             * Export currentsim variables
             */
            exportCurrentSim() {
                // configure current sim object
                this.setupCurrentSim();
                // configure spellSelected object
                const spellSelected = {};
                Object.getOwnPropertyNames(this.spells).forEach(x => {
                    spellSelected[x] = {
                        isSelected: this.spells[x].isSelected,
                        selectedID: this.spells[x].selectedID,
                    }
                });
                // configure the potionSelected object
                const potionSelected = {
                    potionSelected: this.potionSelected,
                    potionID: this.potionID,
                    potionTier: this.potionTier,
                };
                // return the settings
                return {
                    currentSim: this.currentSim,
                    spellSelected: spellSelected,
                    prayerSelected: this.prayerSelected,
                    potionSelected: potionSelected,
                    petSelected: this.petOwned,
                };
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
                        spell: 0,
                        curse: 0,
                        aurora: 0,
                    },
                    // area effects
                    slayerAreaEffectNegationPercent: this.equipmentStats.slayerAreaEffectNegationPercent,
                    slayerAreaEffectNegationFlat: this.equipmentStats.slayerAreaEffectNegationFlat,
                };
                // MICSR.log({...playerStats});

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
                    playerStats.avgHPRegen = 1 + Math.floor(this.combatStats.maxHitpoints / 10 / numberMultiplier);
                    playerStats.avgHPRegen += this.equipmentStats.increasedHPRegen;
                    if (playerStats.activeItems.hitpointsSkillcape) {
                        playerStats.avgHPRegen += 1 * numberMultiplier;
                    }
                    if (this.prayerSelected[CONSTANTS.prayer.Rapid_Heal]) {
                        playerStats.avgHPRegen *= 2;
                    }
                    playerStats.avgHPRegen *= (1 + this.herbloreBonus.hpRegen / 100);
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
                        playerStats.prayerXpPerDamage += 2 * PRAYER[i].pointsPerPlayer / numberMultiplier;
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
             * @returns {number} The amount of runes it costs to use the spell
             */
            getRuneCostForSpell(spell, isAurora = false) {
                return spell.runesRequired.map((req) => Math.max(req.qty - (this.equipmentStats.runesProvidedByWeapon[req.id] || 0) - (isAurora ? (this.equipmentStats.runesProvidedByShield[req.id] || 0) : 0), 0))
                    .reduce((a, b) => a + b, 0);
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
                };
                // Determine slayer zone
                let slayerIdx = 0;
                zone: for (const area of slayerAreas) {
                    for (const id of area.monsters) {
                        if (id === monsterID) {
                            enemyStats.slayerArea = slayerIdx;
                            break zone;
                        }
                    }
                    slayerIdx++;
                }
                // Calculate Enemy Stats
                enemyStats.maxHitpoints = MONSTERS[monsterID].hitpoints * numberMultiplier;
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
                    enemyStats.maxHit = Math.floor(numberMultiplier * (1.3 + (effectiveStrengthLevel / 10) + (MONSTERS[monsterID].strengthBonus / 80) + (effectiveStrengthLevel * MONSTERS[monsterID].strengthBonus / 640)));
                } else if (MONSTERS[monsterID].attackType === CONSTANTS.attackType.Ranged) {
                    const effectiveAttackLevel = Math.floor(MONSTERS[monsterID].rangedLevel + 8 + 1);
                    enemyStats.maxAttackRoll = effectiveAttackLevel * (MONSTERS[monsterID].attackBonusRanged + 64);
                    const effectiveStrengthLevel = Math.floor(MONSTERS[monsterID].rangedLevel + 8 + 1);
                    enemyStats.maxHit = Math.floor(numberMultiplier * (1.3 + (effectiveStrengthLevel / 10) + (MONSTERS[monsterID].strengthBonusRanged / 80) + (effectiveStrengthLevel * MONSTERS[monsterID].strengthBonusRanged / 640)));
                } else if (MONSTERS[monsterID].attackType === CONSTANTS.attackType.Magic) {
                    const effectiveAttackLevel = Math.floor(MONSTERS[monsterID].magicLevel + 8 + 1);
                    enemyStats.maxAttackRoll = effectiveAttackLevel * (MONSTERS[monsterID].attackBonusMagic + 64);
                    if (MONSTERS[monsterID].selectedSpell === null || MONSTERS[monsterID].selectedSpell === undefined) enemyStats.maxHit = Math.floor(numberMultiplier * (MONSTERS[monsterID].setMaxHit + MONSTERS[monsterID].setMaxHit * (MONSTERS[monsterID].damageBonusMagic / 100)));
                    else enemyStats.maxHit = Math.floor(numberMultiplier * (SPELLS[MONSTERS[monsterID].selectedSpell].maxHit + SPELLS[MONSTERS[monsterID].selectedSpell].maxHit * (MONSTERS[monsterID].damageBonusMagic / 100)));
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
                return enemyStats;
            }

            /** Performs all data analysis post queue completion */
            performPostSimAnalysis() {
                // Perform calculation of dungeon stats
                dungeon: for (let dungeonId = 0; dungeonId < DUNGEONS.length; dungeonId++) {
                    if (this.dungeonSimFilter[dungeonId]) {
                        this.dungeonSimData[dungeonId].simSuccess = true;
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
                        let totalSimTime = 0;
                        for (const monsterId of DUNGEONS[dungeonId].monsters) {
                            if (!this.monsterSimData[monsterId].simSuccess || this.monsterSimData[monsterId].tooManyActions > 0) {
                                this.dungeonSimData[dungeonId].simSuccess = false;
                                continue dungeon;
                            }
                            totXp += this.monsterSimData[monsterId].xpPerSecond * this.monsterSimData[monsterId].killTimeS;
                            totHpXp += this.monsterSimData[monsterId].hpXpPerSecond * this.monsterSimData[monsterId].killTimeS;
                            totPrayXP += this.monsterSimData[monsterId].prayerXpPerSecond * this.monsterSimData[monsterId].killTimeS;
                            totHP += this.monsterSimData[monsterId].hpPerSecond * this.monsterSimData[monsterId].killTimeS;
                            totEnemyHP += this.monsterSimData[monsterId].dmgPerSecond * this.monsterSimData[monsterId].killTimeS;
                            totPrayerPoints += this.monsterSimData[monsterId].ppConsumedPerSecond * this.monsterSimData[monsterId].killTimeS;
                            totalGPFromDamage += this.monsterSimData[monsterId].gpFromDamagePerSecond * this.monsterSimData[monsterId].killTimeS;
                            totalAttacksMade += this.monsterSimData[monsterId].attacksMadePerSecond * this.monsterSimData[monsterId].killTimeS;
                            totalAttacksTaken += this.monsterSimData[monsterId].attacksTakenPerSecond * this.monsterSimData[monsterId].killTimeS;
                            totalAmmoUsed += this.monsterSimData[monsterId].ammoUsedPerSecond * this.monsterSimData[monsterId].killTimeS;
                            totalRunesUsed += this.monsterSimData[monsterId].runesUsedPerSecond * this.monsterSimData[monsterId].killTimeS;
                            totTime += this.monsterSimData[monsterId].avgKillTime;
                            totalSimTime += this.monsterSimData[monsterId].simulationTime;
                        }
                        const dungeonTime = totTime / 1000;
                        this.dungeonSimData[dungeonId].xpPerSecond = totXp / dungeonTime;
                        this.dungeonSimData[dungeonId].xpPerHit = totXp / totalAttacksMade;
                        this.dungeonSimData[dungeonId].hpXpPerSecond = totHpXp / dungeonTime;
                        this.dungeonSimData[dungeonId].prayerXpPerSecond = totPrayXP / dungeonTime;
                        this.dungeonSimData[dungeonId].hpPerSecond = totHP / dungeonTime;
                        this.dungeonSimData[dungeonId].dmgPerSecond = totEnemyHP / dungeonTime;
                        this.dungeonSimData[dungeonId].avgKillTime = totTime;
                        this.dungeonSimData[dungeonId].avgHitDmg = totEnemyHP / totalAttacksMade;
                        this.dungeonSimData[dungeonId].killTimeS = dungeonTime;
                        this.dungeonSimData[dungeonId].killsPerSecond = 1 / dungeonTime;
                        this.dungeonSimData[dungeonId].ppConsumedPerSecond = totPrayerPoints / dungeonTime;
                        this.dungeonSimData[dungeonId].gpFromDamagePerSecond = totalGPFromDamage / dungeonTime;
                        this.dungeonSimData[dungeonId].attacksTakenPerSecond = totalAttacksTaken / dungeonTime;
                        this.dungeonSimData[dungeonId].attacksMadePerSecond = totalAttacksMade / dungeonTime;
                        this.dungeonSimData[dungeonId].ammoUsedPerSecond = totalAmmoUsed / dungeonTime;
                        this.dungeonSimData[dungeonId].runesUsedPerSecond = totalRunesUsed / dungeonTime;
                        this.dungeonSimData[dungeonId].simulationTime = totalSimTime;
                    } else {
                        this.dungeonSimData[dungeonId].simSuccess = false;
                    }
                }
                // Update other data
                this.updateGPData();
                this.updateSlayerXP();
                this.updateHerbloreXP();
                this.updateSignetChance();
                this.updatePetChance();
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
                        monsterStats: this.enemyStats[monsterID],
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
                        this.currentSim.playerStats.isProtected = this.currentSim.prayerBonus.protectFromMelee > 0;
                        break;
                    case CONSTANTS.attackType.Ranged:
                        this.currentSim.playerStats.isProtected = this.currentSim.prayerBonus.protectFromRanged > 0;
                        break;
                    case CONSTANTS.attackType.Magic:
                        this.currentSim.playerStats.isProtected = this.currentSim.prayerBonus.protectFromMagic > 0;
                        break;
                }
                // Do preprocessing of player stats for special weapons
                if (this.currentSim.playerStats.activeItems.stormsnap || this.currentSim.playerStats.activeItems.slayerCrossbow) {
                    let attackStyleBonus = 1;
                    // Ranged
                    if (this.attackStyle.Ranged === 0) {
                        attackStyleBonus += 3;
                    }
                    let rangedStrengthBonus = this.currentSim.equipmentStats.rangedStrengthBonus;
                    let rangedAttackBonus = this.currentSim.equipmentStats.rangedAttackBonus;
                    // weapon specific bonuses
                    if (this.currentSim.playerStats.activeItems.stormsnap) {
                        rangedStrengthBonus += Math.floor(110 + (1 + (MONSTERS[monsterID].magicLevel * 6) / 33));
                        rangedAttackBonus += Math.floor(102 * (1 + (MONSTERS[monsterID].magicLevel * 6) / 5500));
                    } else if (this.currentSim.playerStats.activeItems.slayerCrossbow) {
                        const slayerTaskMonsters = new Set(combatAreaDisplayOrder.flatMap(area => combatAreas[area].monsters).concat(slayerAreaDisplayOrder.flatMap(area => slayerAreas[area].monsters)));
                        if (MONSTERS[monsterID].slayerXP !== undefined || (this.currentSim.isSlayerTask && slayerTaskMonsters.has(monsterID))) {
                            rangedStrengthBonus = Math.floor(rangedStrengthBonus * items[CONSTANTS.item.Slayer_Crossbow].slayerStrengthMultiplier);
                        }
                    }
                    // general formulas
                    const effectiveAttackLevel = Math.floor(this.currentSim.playerStats.levels.Ranged + 8 + attackStyleBonus);
                    this.currentSim.playerStats.maxAttackRoll = Math.floor(effectiveAttackLevel * (rangedAttackBonus + 64) * (1 + (this.currentSim.prayerBonus.rangedAccuracy / 100)) * (1 + this.currentSim.herbloreBonus.rangedAccuracy / 100));
                    const effectiveStrengthLevel = Math.floor(this.currentSim.playerStats.levels.Ranged + attackStyleBonus);
                    this.currentSim.playerStats.maxHit = Math.floor(numberMultiplier * ((1.3 + effectiveStrengthLevel / 10 + rangedStrengthBonus / 80 + effectiveStrengthLevel * rangedStrengthBonus / 640) * (1 + (this.currentSim.prayerBonus.rangedDamage / 100)) * (1 + this.currentSim.herbloreBonus.rangedStrength / 100)));
                } else if (this.currentSim.playerStats.activeItems.bigRon) {
                    // Melee
                    let meleeStrengthBonus = this.currentSim.equipmentStats.strengthBonus;
                    if (this.currentSim.playerStats.activeItems.bigRon && MONSTERS[monsterID].isBoss) {
                        meleeStrengthBonus = Math.floor(meleeStrengthBonus * items[CONSTANTS.item.Big_Ron].bossStrengthMultiplier);
                    }
                    const effectiveStrengthLevel = Math.floor(this.currentSim.playerStats.levels.Strength + 8 + 1);
                    this.currentSim.playerStats.maxHit = Math.floor(numberMultiplier * ((1.3 + effectiveStrengthLevel / 10 + meleeStrengthBonus / 80 + effectiveStrengthLevel * meleeStrengthBonus / 640) * (1 + (this.currentSim.prayerBonus.meleeDamage / 100)) * (1 + this.currentSim.herbloreBonus.meleeStrength / 100)));
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
                    dataMultiplier = this.timeMultiplier;
                }
                let isKillTime = (this.timeMultiplier === -1 && this.selectedPlotIsTime);
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
                            dataSet.push((this.monsterSimFilter[monsterID] && this.monsterSimData[monsterID].simSuccess) ? this.monsterSimData[monsterID][keyValue] * dataMultiplier : 0);
                        });
                    });
                    // Compile data from monsters in slayer zones
                    slayerAreas.forEach((area) => {
                        area.monsters.forEach((monsterID) => {
                            if (isKillTime) dataMultiplier = this.monsterSimData[monsterID].killTimeS;
                            dataSet.push((this.monsterSimFilter[monsterID] && this.monsterSimData[monsterID].simSuccess) ? this.monsterSimData[monsterID][keyValue] * dataMultiplier : 0);
                        });
                    });
                    // Perform simulation of monsters in dungeons
                    for (let i = 0; i < DUNGEONS.length; i++) {
                        if (isKillTime) dataMultiplier = this.dungeonSimData[i].killTimeS;
                        dataSet.push((this.dungeonSimFilter[i] && this.dungeonSimData[i].simSuccess) ? this.dungeonSimData[i][keyValue] * dataMultiplier : 0);
                    }
                } else {
                    const dungeonID = this.parent.viewedDungeonID;
                    const isSignet = keyValue === 'signetChance';
                    DUNGEONS[dungeonID].monsters.forEach((monsterId) => {
                        if (!isSignet) {
                            if (isKillTime) dataMultiplier = this.monsterSimData[monsterId].killTimeS;
                            dataSet.push((this.monsterSimData[monsterId].simSuccess) ? this.monsterSimData[monsterId][keyValue] * dataMultiplier : 0);
                        } else {
                            dataSet.push(0);
                        }
                    });
                    if (isSignet) {
                        const bossId = DUNGEONS[dungeonID].monsters[DUNGEONS[dungeonID].monsters.length - 1];
                        dataSet[dataSet.length - 1] = (this.monsterSimData[bossId].simSuccess) ? this.monsterSimData[bossId][keyValue] * dataMultiplier : 0;
                    }
                }
                return dataSet;
            }

            /**
             * Creates a string to paste into your favourite spreadsheet software
             * @return {string}
             */
            exportData() {
                let exportString = '';
                const colDel = '\t';
                const colLen = colDel.length;
                const rowDel = '\n';
                const rowLen = rowDel.length;
                if (this.exportName) {
                    exportString += 'Monster/Dungeon Name' + colDel;
                }
                for (let i = 0; i < this.parent.plotTypeDropdownOptions.length; i++) {
                    if (this.exportDataType[i]) {
                        if (this.parent.plotTypeIsTime[i]) {
                            exportString += this.parent.plotTypeDropdownOptions[i] + this.parent.selectedTimeUnit + colDel;
                        } else {
                            exportString += this.parent.plotTypeDropdownOptions[i] + colDel;
                        }
                    }
                }
                exportString = exportString.slice(0, -colLen);
                exportString += rowDel;
                combatAreas.forEach((area) => {
                    area.monsters.forEach((monsterID) => {
                        if (this.exportNonSimmed || this.monsterSimFilter[monsterID]) {
                            if (this.exportName) exportString += this.parent.getMonsterName(monsterID) + colDel;
                            for (let i = 0; i < this.parent.plotTypeDropdownValues.length; i++) {
                                if (this.exportDataType[i]) {
                                    let dataMultiplier = this.parent.plotTypeIsTime[i] ? this.timeMultiplier : 1;
                                    if (dataMultiplier === -1) dataMultiplier = this.monsterSimData[monsterID].killTimeS;
                                    exportString += (this.monsterSimFilter[monsterID] && this.monsterSimData[monsterID].simSuccess) ? this.monsterSimData[monsterID][this.parent.plotTypeDropdownValues[i]] * dataMultiplier : 0;
                                    exportString += colDel;
                                }
                            }
                            exportString = exportString.slice(0, -colLen);
                            exportString += rowDel;
                        }
                    });
                });
                slayerAreas.forEach((area) => {
                    area.monsters.forEach((monsterID) => {
                        if (this.exportNonSimmed || this.monsterSimFilter[monsterID]) {
                            if (this.exportName) exportString += this.parent.getMonsterName(monsterID) + colDel;
                            for (let i = 0; i < this.parent.plotTypeDropdownValues.length; i++) {
                                if (this.exportDataType[i]) {
                                    let dataMultiplier = this.parent.plotTypeIsTime[i] ? this.timeMultiplier : 1;
                                    if (dataMultiplier === -1) dataMultiplier = this.monsterSimData[monsterID].killTimeS;
                                    exportString += (this.monsterSimFilter[monsterID] && this.monsterSimData[monsterID].simSuccess) ? this.monsterSimData[monsterID][this.parent.plotTypeDropdownValues[i]] * dataMultiplier : 0;
                                    exportString += colDel;
                                }
                            }
                            exportString = exportString.slice(0, -colLen);
                            exportString += rowDel;
                        }
                    });
                });
                for (let dungeonId = 0; dungeonId < DUNGEONS.length; dungeonId++) {
                    if (this.exportNonSimmed || this.dungeonSimFilter[dungeonId]) {
                        if (this.exportName) exportString += this.parent.getDungeonName(dungeonId) + colDel;
                        for (let i = 0; i < this.parent.plotTypeDropdownValues.length; i++) {
                            if (this.exportDataType[i]) {
                                let dataMultiplier = this.parent.plotTypeIsTime[i] ? this.timeMultiplier : 1;
                                if (dataMultiplier === -1) dataMultiplier = this.dungeonSimData[dungeonId].killTimeS;
                                exportString += (this.dungeonSimFilter[dungeonId] && this.dungeonSimData[dungeonId].simSuccess) ? this.dungeonSimData[dungeonId][this.parent.plotTypeDropdownValues[i]] * dataMultiplier : 0;
                                exportString += colDel;
                            }
                        }
                        exportString = exportString.slice(0, -colLen);
                        exportString += rowDel;
                        if (this.exportDungeonMonsters) {
                            DUNGEONS[dungeonId].monsters.forEach((monsterId) => {
                                if (this.exportName) exportString += this.parent.getMonsterName(monsterId) + colDel;
                                for (let i = 0; i < this.parent.plotTypeDropdownValues.length; i++) {
                                    if (this.exportDataType[i]) {
                                        if (this.parent.plotTypeDropdownValues[i] === 'signetChance') {
                                            exportString += '0';
                                        } else {
                                            let dataMultiplier = this.parent.plotTypeIsTime[i] ? this.timeMultiplier : 1;
                                            if (dataMultiplier === -1) dataMultiplier = this.monsterSimData[monsterId].killTimeS;
                                            exportString += (this.monsterSimData[monsterId].simSuccess) ? this.monsterSimData[monsterId][this.parent.plotTypeDropdownValues[i]] * dataMultiplier : 0;
                                        }
                                        exportString += colDel;
                                    }
                                }
                                exportString = exportString.slice(0, -colLen);
                                exportString += rowDel;
                            });
                        }
                    }
                }
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
                // Check which slayer areas we can access with current stats and equipment
                for (const area of slayerAreas) {
                    let canEnter = true;
                    // check level requirement
                    if (area.slayerLevel !== undefined && this.playerLevels.Slayer < area.slayerLevel) {
                        canEnter = false;
                    }
                    // check clear requirement
                    if (area.dungeonCompleted >= 0 && dungeonCompleteCount[area.dungeonCompleted] < 1) {
                        canEnter = false
                    }
                    // check gear requirement
                    if (area.slayerItem > 0
                        && !this.currentSim.playerStats.activeItems.slayerSkillcape
                        && !this.currentSim.playerStats.equipmentSelected.includes(area.slayerItem)) {
                        canEnter = false;
                    }
                    // push `canEnter` for every monster in this zone
                    for (let j = 0; j < area.monsters.length; j++) {
                        enterSet.push(canEnter);
                    }
                }
                // Perform simulation of monsters in dungeons
                for (let i = 0; i < DUNGEONS.length; i++) {
                    enterSet.push(true);
                }
                return enterSet;
            }

            /**
             * Computes the average number of coins that a monster drops
             * @param {number} monsterID Index of MONSTERS
             * @return {number}
             */
            computeAverageCoins(monsterID) {
                return ((MONSTERS[monsterID].dropCoins[1] + MONSTERS[monsterID].dropCoins[0] - 1) / 2 + this.currentSim.increasedGP) * this.currentSim.gpBonus;
            }

            /**
             * Computes the chance that a monster will drop loot when it dies
             * @param {number} monsterID
             * @return {number}
             */
            computeLootChance(monsterID) {
                return ((MONSTERS[monsterID].lootChance !== undefined) ? MONSTERS[monsterID].lootChance / 100 : 1);
            }

            /**
             * Computes the value of a monsters drop table respecting the loot sell settings
             * @param {number} monsterID
             * @return {number}
             */
            computeDropTableValue(monsterID) {
                // lootTable[x][0]: Item ID, [x][1]: Weight [x][2]: Max Qty
                if (MONSTERS[monsterID].lootTable && this.sellLoot !== 'None') {
                    let gpWeight = 0;
                    let totWeight = 0;
                    if (this.sellLoot === 'All') {
                        MONSTERS[monsterID].lootTable.forEach((x) => {
                            const itemID = x[0];
                            let avgQty = (x[2] + 1) / 2;
                            if (items[itemID].canOpen) {
                                gpWeight += this.computeChestOpenValue(itemID) * avgQty;
                            } else {
                                if (this.currentSim.herbConvertChance && (items[itemID].tier === 'Herb' && items[itemID].type === 'Seeds')) {
                                    avgQty += 3;
                                    gpWeight += (items[itemID].sellsFor * (1 - this.currentSim.herbConvertChance) + items[items[itemID].grownItemID].sellsFor * this.currentSim.herbConvertChance) * x[1] * avgQty;
                                } else {
                                    gpWeight += items[itemID].sellsFor * x[1] * avgQty;
                                }
                            }
                            totWeight += x[1];
                        });
                    } else {
                        MONSTERS[monsterID].lootTable.forEach((x) => {
                            const itemID = x[0];
                            let avgQty = (x[2] + 1) / 2;
                            if (items[itemID].canOpen) {
                                gpWeight += this.computeChestOpenValue(itemID) * avgQty;
                            } else {
                                if (this.currentSim.herbConvertChance && (items[itemID].tier === 'Herb' && items[itemID].type === 'Seeds')) {
                                    const herbItem = items[itemID].grownItemID;
                                    avgQty += 3;
                                    gpWeight += (items[itemID].sellsFor * (1 - this.currentSim.herbConvertChance) * ((this.shouldSell(itemID)) ? 1 : 0) + items[herbItem].sellsFor * this.currentSim.herbConvertChance * ((this.shouldSell(herbItem)) ? 1 : 0)) * x[1] * avgQty;
                                } else {
                                    gpWeight += ((this.shouldSell(itemID)) ? items[itemID].sellsFor : 0) * x[1] * avgQty;
                                }
                            }
                            totWeight += x[1];
                        });
                    }
                    return gpWeight / totWeight * this.currentSim.lootBonus;
                } else {
                    return 0;
                }
            }

            /**
             * Determines if an itemID should be sold and turns true/false
             * @param {number} itemID
             * @return {boolean}
             */
            shouldSell(itemID) {
                return this.saleList[itemID].sell;
            }

            /**
             * Gets an object array equal in length to the items array that determines if a particular item should be sold or kept
             * @return {Object[]}
             */
            getSaleList() {
                const saleList = [];
                for (let i = 0; i < items.length; i++) {
                    saleList.push({
                        id: i,
                        name: this.parent.getItemName(i),
                        sell: true,
                        onLootList: false,
                        lootlistID: -1,
                    });
                }
                return saleList;
            }

            /**
             * Gets an object array containing only items that are obtainable from combatAreas/Dungeons
             * @return {Object[]}
             */
            getLootList() {
                const lootList = [];
                const specialDrops = [CONSTANTS.item.Signet_Ring_Half_B, CONSTANTS.item.Air_Shard, CONSTANTS.item.Water_Shard, CONSTANTS.item.Earth_Shard, CONSTANTS.item.Fire_Shard];
                specialDrops.forEach((itemID) => {
                    lootList.push({
                        id: itemID,
                        name: this.parent.getItemName(itemID),
                        sell: false,
                    });
                });
                this.saleList[CONSTANTS.item.Signet_Ring_Half_B].onLootList = true;
                combatAreas.forEach((area) => {
                    area.monsters.forEach((mID) => {
                        MONSTERS[mID].lootTable.forEach((loot) => {
                            if (items[loot[0]].canOpen) {
                                items[loot[0]].dropTable.forEach((loot2) => {
                                    if (!this.saleList[loot2[0]].onLootList) {
                                        lootList.push({
                                            id: loot2[0],
                                            name: this.parent.getItemName(loot2[0]),
                                            sell: false,
                                        });
                                        this.saleList[loot2[0]].onLootList = true;
                                    }
                                });
                            } else {
                                if (!this.saleList[loot[0]].onLootList) {
                                    lootList.push({
                                        id: loot[0],
                                        name: this.parent.getItemName(loot[0]),
                                        sell: false,
                                    });
                                    this.saleList[loot[0]].onLootList = true;
                                }
                                if (items[loot[0]].tier === 'Herb' && items[loot[0]].type === 'Seeds') {
                                    const herbItem = items[loot[0]].grownItemID;
                                    if (!this.saleList[herbItem].onLootList) {
                                        lootList.push({
                                            id: herbItem,
                                            name: this.parent.getItemName(herbItem),
                                            sell: false,
                                        });
                                        this.saleList[herbItem].onLootList = true;
                                    }
                                }
                            }
                        });
                    });
                });
                slayerAreas.forEach((area) => {
                    area.monsters.forEach((mID) => {
                        MONSTERS[mID].lootTable.forEach((loot) => {
                            if (items[loot[0]].canOpen) {
                                items[loot[0]].dropTable.forEach((loot2) => {
                                    if (!this.saleList[loot2[0]].onLootList) {
                                        lootList.push({
                                            id: loot2[0],
                                            name: this.parent.getItemName(loot2[0]),
                                            sell: false,
                                        });
                                        this.saleList[loot2[0]].onLootList = true;
                                    }
                                });
                            } else {
                                if (!this.saleList[loot[0]].onLootList) {
                                    lootList.push({
                                        id: loot[0],
                                        name: this.parent.getItemName(loot[0]),
                                        sell: false,
                                    });
                                    this.saleList[loot[0]].onLootList = true;
                                }
                                if (items[loot[0]].tier === 'Herb' && items[loot[0]].type === 'Seeds') {
                                    const herbItem = items[loot[0]].grownItemID;
                                    if (!this.saleList[herbItem].onLootList) {
                                        lootList.push({
                                            id: herbItem,
                                            name: this.parent.getItemName(herbItem),
                                            sell: false,
                                        });
                                        this.saleList[herbItem].onLootList = true;
                                    }
                                }
                            }
                        });
                    });
                });
                DUNGEONS.forEach((dungeon) => {
                    dungeon.rewards.forEach((item) => {
                        if (items[item].canOpen) {
                            items[item].dropTable.forEach((loot) => {
                                if (!this.saleList[loot[0]].onLootList) {
                                    lootList.push({
                                        id: loot[0],
                                        name: this.parent.getItemName(loot[0]),
                                        sell: false,
                                    });
                                    this.saleList[loot[0]].onLootList = true;
                                }
                            });
                        } else {
                            if (!this.saleList[item].onLootList) {
                                lootList.push({
                                    id: item,
                                    name: this.parent.getItemName(item),
                                    sell: false,
                                });
                                this.saleList[item].onLootList = true;
                            }
                        }
                    });
                });
                const elementalChests = [CONSTANTS.item.Air_Chest, CONSTANTS.item.Water_Chest, CONSTANTS.item.Earth_Chest, CONSTANTS.item.Fire_Chest];
                elementalChests.forEach((chest) => {
                    items[chest].dropTable.forEach((loot2) => {
                        if (!this.saleList[loot2[0]].onLootList) {
                            lootList.push({
                                id: loot2[0],
                                name: this.parent.getItemName(loot2[0]),
                                sell: false,
                            });
                            this.saleList[loot2[0]].onLootList = true;
                        }
                    });
                });
                // Alphabetize loot list
                lootList.sort((a, b) => {
                    const nameA = a.name.toUpperCase(); // ignore upper and lowercase
                    const nameB = b.name.toUpperCase(); // ignore upper and lowercase
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    // names must be equal
                    return 0;
                });
                // Set Salelist IDs
                for (let i = 0; i < lootList.length; i++) {
                    this.saleList[lootList[i].id].lootlistID = i;
                }
                return lootList;
            }

            /**
             * Sets the lootlist to the current sale list
             */
            setLootListToSaleList() {
                this.saleList.forEach((item) => {
                    if (item.lootlistID !== -1) {
                        this.lootList[item.lootlistID].sell = item.sell;
                    }
                });
            }

            /**
             * Sets the salelist to the loot list
             */
            setSaleListToLootList() {
                this.lootList.forEach((item) => {
                    this.saleList[item.id].sell = item.sell;
                });
            }

            /**
             * Prints out the current loot list to the console
             */
            printLootList() {
                let outStr = 'ID\tName\tSell\n';
                this.lootList.forEach((item) => {
                    outStr += `${item.id}\t${item.name}\t${item.sell}\n`;
                });
                MICSR.log(outStr);
            }

            /**
             * Sets the sale list to the default setting of combat uniques
             */
            setSaleListToDefault() {
                for (let i = 0; i < this.saleList.length; i++) {
                    this.saleList[i].sell = true;
                }
                this.defaultSaleKeep.forEach((itemID) => {
                    this.saleList[itemID].sell = false;
                });
            }

            /**
             * Sets the loot list to sell only items that have been discovered by the player
             */
            setLootListToDiscovered() {
                for (let i = 0; i < itemStats.length; i++) {
                    if (this.saleList[i].onLootList) {
                        this.lootList[this.saleList[i].lootlistID].sell = (itemStats[i].timesFound > 0);
                    }
                }
            }

            /**
             * Sets the loot list to default settings
             */
            setLootListToDefault() {
                for (let i = 0; i < this.lootList.length; i++) {
                    this.lootList[i].sell = true;
                }
                this.defaultSaleKeep.forEach((itemID) => {
                    if (this.saleList[itemID].onLootList) {
                        this.lootList[this.saleList[itemID].lootlistID].sell = false;
                    }
                });
            }

            /**
             * Computes the value of the contents of a chest respecting the loot sell settings
             * @param {number} chestID
             * @return {number}
             */
            computeChestOpenValue(chestID) {
                if (this.sellLoot !== 'None') {
                    let gpWeight = 0;
                    let totWeight = 0;
                    let avgQty;
                    if (this.sellLoot === 'All') {
                        for (let i = 0; i < items[chestID].dropTable.length; i++) {
                            if ((items[chestID].dropQty !== undefined) && (items[chestID].dropQty[i] !== undefined)) {
                                avgQty = (items[chestID].dropQty[i] + 1) / 2;
                            } else {
                                avgQty = 1;
                            }
                            gpWeight += avgQty * items[items[chestID].dropTable[i][0]].sellsFor * items[chestID].dropTable[i][1];
                            totWeight += items[chestID].dropTable[i][1];
                        }
                    } else {
                        for (let i = 0; i < items[chestID].dropTable.length; i++) {
                            if (items[chestID].dropQty) {
                                avgQty = (items[chestID].dropQty[i] + 1) / 2;
                            } else {
                                avgQty = 1;
                            }
                            gpWeight += ((this.shouldSell(items[chestID].dropTable[i][0])) ? items[items[chestID].dropTable[i][0]].sellsFor : 0) * avgQty * items[chestID].dropTable[i][1];
                            totWeight += items[chestID].dropTable[i][1];
                        }
                    }
                    return gpWeight / totWeight;
                } else {
                    return 0;
                }
            }

            /**
             * Computes the average amount of GP earned when killing a monster, respecting the loot sell settings
             * @param {number} monsterID
             * @return {number}
             */
            computeMonsterValue(monsterID) {
                let monsterValue = 0;
                monsterValue += this.computeAverageCoins(monsterID);
                monsterValue += this.computeDropTableValue(monsterID);
                if (this.currentSim.canTopazDrop && this.shouldSell(CONSTANTS.item.Signet_Ring_Half_B)) {
                    monsterValue += items[CONSTANTS.item.Signet_Ring_Half_B].sellsFor * this.getMonsterCombatLevel(monsterID) / 500000;
                }
                monsterValue *= this.computeLootChance(monsterID);
                if (this.sellBones && !this.currentSim.doBonesAutoBury && MONSTERS[monsterID].bones) {
                    monsterValue += items[MONSTERS[monsterID].bones].sellsFor * this.currentSim.lootBonus * ((MONSTERS[monsterID].boneQty) ? MONSTERS[monsterID].boneQty : 1);
                }
                return monsterValue;
            }

            /**
             * Computes the average amount of potional herblore xp from killing a monster
             * @param {number} monsterID Index of MONSTERS
             * @param {number} convertChance The chance to convert seeds into herbs
             * @return {number}
             */
            computeMonsterHerbXP(monsterID, convertChance) {
                let herbWeight = 0;
                let totalWeight = 0;
                for (let i = 0; i < MONSTERS[monsterID].lootTable.length; i++) {
                    const itemID = MONSTERS[monsterID].lootTable[i][0];
                    if (items[itemID].tier === 'Herb' && items[itemID].type === 'Seeds') {
                        const avgQty = (1 + MONSTERS[monsterID].lootTable[i][2]) / 2 + 3;
                        herbWeight += MONSTERS[monsterID].lootTable[i][1] * this.xpPerHerb[itemID] * convertChance * avgQty;
                    }
                    totalWeight += MONSTERS[monsterID].lootTable[i][1];
                }
                return herbWeight / totalWeight * this.computeLootChance(monsterID) * this.currentSim.lootBonus;
            }

            /**
             * Computes the average amount of GP earned when completing a dungeon, respecting the loot sell settings
             * @param {number} dungeonID
             * @return {number}
             */
            computeDungeonValue(dungeonID) {
                let dungeonValue = 0;
                if (this.sellLoot !== 'None') {
                    DUNGEONS[dungeonID].rewards.forEach((reward) => {
                        if (items[reward].canOpen) {
                            dungeonValue += this.computeChestOpenValue(reward) * this.currentSim.lootBonus;
                        } else {
                            if (this.sellLoot === 'All') {
                                dungeonValue += items[reward].sellsFor;
                            } else {
                                dungeonValue += ((this.shouldSell(reward)) ? items[reward].sellsFor : 0);
                            }
                        }
                    });
                    // Shards
                    if (godDungeonID.includes(dungeonID)) {
                        let shardCount = 0;
                        const shardID = MONSTERS[DUNGEONS[dungeonID].monsters[0]].bones;
                        DUNGEONS[dungeonID].monsters.forEach((monsterId) => {
                            shardCount += MONSTERS[monsterId].boneQty || 1;
                        });
                        shardCount *= this.currentSim.lootBonus;
                        if (this.convertShards) {
                            const chestID = items[shardID].trimmedItemID;
                            dungeonValue += shardCount / items[chestID].itemsRequired[0][1] * this.computeChestOpenValue(chestID);
                        } else {
                            dungeonValue += this.shouldSell(shardID) ? shardCount * items[shardID].sellsFor : 0;
                        }
                    }
                }
                if (this.currentSim.canTopazDrop && this.shouldSell(CONSTANTS.item.Signet_Ring_Half_B)) {
                    dungeonValue += items[CONSTANTS.item.Signet_Ring_Half_B].sellsFor * this.getMonsterCombatLevel(DUNGEONS[dungeonID].monsters[DUNGEONS[dungeonID].monsters.length - 1]) / 500000;
                }
                dungeonValue += this.computeAverageCoins(DUNGEONS[dungeonID].monsters[DUNGEONS[dungeonID].monsters.length - 1]);
                return dungeonValue;
            }

            /**
             * Computes the gp/kill and gp/s data for monsters and dungeons and sets those values.
             */
            updateGPData() {
                // Set data for monsters in combat zones
                if (this.parent.isViewingDungeon) {
                    DUNGEONS[this.parent.viewedDungeonID].monsters.forEach((monsterId) => {
                        if (this.monsterSimData[monsterId].simSuccess && this.monsterSimData[monsterId].tooManyActions === 0) {
                            let gpPerKill = 0;
                            if (godDungeonID.includes(this.parent.viewedDungeonID)) {
                                const boneQty = MONSTERS[monsterId].boneQty || 1;
                                const shardID = MONSTERS[monsterId].bones;
                                if (this.convertShards) {
                                    const chestID = items[shardID].trimmedItemID;
                                    gpPerKill += boneQty * this.currentSim.lootBonus / items[chestID].itemsRequired[0][1] * this.computeChestOpenValue(chestID);
                                } else if (this.shouldSell(shardID)) {
                                    gpPerKill += boneQty * this.currentSim.lootBonus * items[shardID].sellsFor;
                                }
                            }
                            this.monsterSimData[monsterId].gpPerSecond = this.monsterSimData[monsterId].gpFromDamagePerSecond + gpPerKill / this.monsterSimData[monsterId].killTimeS;
                        } else {
                            this.monsterSimData[monsterId].gpPerSecond = 0;
                        }
                    });
                } else {
                    combatAreas.forEach((area) => {
                        area.monsters.forEach((monster) => {
                            this.monsterSimData[monster].gpPerSecond = this.monsterSimData[monster].gpFromDamagePerSecond;
                            if (this.monsterSimData[monster].simSuccess && this.monsterSimData[monster].tooManyActions === 0) {
                                this.monsterSimData[monster].gpPerSecond += this.computeMonsterValue(monster) / this.monsterSimData[monster].killTimeS;
                            }
                        });
                    });
                    slayerAreas.forEach((area) => {
                        area.monsters.forEach((monster) => {
                            this.monsterSimData[monster].gpPerSecond = this.monsterSimData[monster].gpFromDamagePerSecond;
                            if (this.monsterSimData[monster].simSuccess && this.monsterSimData[monster].tooManyActions === 0) {
                                this.monsterSimData[monster].gpPerSecond += this.computeMonsterValue(monster) / this.monsterSimData[monster].killTimeS;
                            }
                        });
                    });
                    // Set data for dungeons
                    for (let i = 0; i < DUNGEONS.length; i++) {
                        if (this.dungeonSimData[i].simSuccess) {
                            this.dungeonSimData[i].gpPerSecond = this.dungeonSimData[i].gpFromDamagePerSecond;
                            this.dungeonSimData[i].gpPerSecond += this.computeDungeonValue(i) / this.dungeonSimData[i].killTimeS;
                        }
                    }
                }
            }

            /**
             * Updates the potential herblore xp for all monsters
             */
            updateHerbloreXP() {
                if (this.parent.isViewingDungeon) {
                    DUNGEONS[this.parent.viewedDungeonID].monsters.forEach((monsterId) => {
                        this.monsterSimData[monsterId].herbloreXPPerSecond = 0;
                    });
                } else {
                    // Set data for monsters in combat zones
                    combatAreas.forEach((area) => {
                        area.monsters.forEach((monster) => {
                            if (this.monsterSimData[monster].simSuccess && this.monsterSimData[monster].tooManyActions === 0) {
                                this.monsterSimData[monster].herbloreXPPerSecond = this.computeMonsterHerbXP(monster, this.currentSim.herbConvertChance) / this.monsterSimData[monster].killTimeS;
                            } else {
                                this.monsterSimData[monster].herbloreXPPerSecond = 0;
                            }
                        });
                    });
                    slayerAreas.forEach((area) => {
                        area.monsters.forEach((monster) => {
                            if (this.monsterSimData[monster].simSuccess && this.monsterSimData[monster].tooManyActions === 0) {
                                this.monsterSimData[monster].herbloreXPPerSecond = this.computeMonsterHerbXP(monster, this.currentSim.herbConvertChance) / this.monsterSimData[monster].killTimeS;
                            } else {
                                this.monsterSimData[monster].herbloreXPPerSecond = 0;
                            }
                        });
                    });
                }
            }

            /**
             * Updates the amount of slayer xp earned when killing monsters
             */
            updateSlayerXP() {
                if (this.parent.isViewingDungeon) {
                    DUNGEONS[this.parent.viewedDungeonID].monsters.forEach((monsterId) => {
                        this.monsterSimData[monsterId].slayerXpPerSecond = 0;
                    });
                } else {
                    // Set data for monsters in combat zones
                    combatAreas.forEach((area) => {
                        area.monsters.forEach((monster) => {
                            if (this.monsterSimData[monster].simSuccess && this.monsterSimData[monster].killTimeS) {
                                let monsterXP = 0;
                                monsterXP += Math.floor(((MONSTERS[monster].slayerXP !== undefined) ? MONSTERS[monster].slayerXP : 0) * (1 + this.currentSim.slayerBonusXP / 100));
                                if (this.isSlayerTask) {
                                    monsterXP += Math.floor(MONSTERS[monster].hitpoints * (1 + this.currentSim.slayerBonusXP / 100));
                                }
                                this.monsterSimData[monster].slayerXpPerSecond = monsterXP * this.currentSim.playerStats.globalXPMult / this.monsterSimData[monster].killTimeS;
                            } else {
                                this.monsterSimData[monster].slayerXpPerSecond = 0;
                            }
                        });
                    });
                    slayerAreas.forEach((area) => {
                        area.monsters.forEach((monster) => {
                            if (this.monsterSimData[monster].simSuccess && this.monsterSimData[monster].killTimeS) {
                                let monsterXP = 0;
                                monsterXP += Math.floor(((MONSTERS[monster].slayerXP !== undefined) ? MONSTERS[monster].slayerXP : 0) * (1 + this.currentSim.slayerBonusXP / 100));
                                if (this.isSlayerTask) {
                                    monsterXP += Math.floor(MONSTERS[monster].hitpoints * (1 + this.currentSim.slayerBonusXP / 100));
                                }
                                this.monsterSimData[monster].slayerXpPerSecond = monsterXP * this.currentSim.playerStats.globalXPMult / this.monsterSimData[monster].killTimeS;
                            } else {
                                this.monsterSimData[monster].slayerXpPerSecond = 0;
                            }
                        });
                    });
                }
            }

            /**
             * Updates the chance to receive signet when killing monsters
             */
            updateSignetChance() {
                if (this.parent.isViewingDungeon) {
                    DUNGEONS[this.parent.viewedDungeonID].monsters.forEach((monsterId) => {
                        this.monsterSimData[monsterId].signetChance = 0;
                    });
                } else {
                    // Set data for monsters in combat zones
                    combatAreas.forEach((area) => {
                        area.monsters.forEach((monster) => {
                            if (this.currentSim.canTopazDrop && this.monsterSimData[monster].simSuccess) {
                                this.monsterSimData[monster].signetChance = (1 - Math.pow(1 - this.getSignetDropRate(monster), Math.floor(this.signetFarmTime * 3600 / this.monsterSimData[monster].killTimeS))) * 100;
                            } else {
                                this.monsterSimData[monster].signetChance = 0;
                            }
                        });
                    });
                    slayerAreas.forEach((area) => {
                        area.monsters.forEach((monster) => {
                            if (this.currentSim.canTopazDrop && this.monsterSimData[monster].simSuccess) {
                                this.monsterSimData[monster].signetChance = (1 - Math.pow(1 - this.getSignetDropRate(monster), Math.floor(this.signetFarmTime * 3600 / this.monsterSimData[monster].killTimeS))) * 100;
                            } else {
                                this.monsterSimData[monster].signetChance = 0;
                            }
                        });
                    });
                    for (let i = 0; i < DUNGEONS.length; i++) {
                        if (this.currentSim.canTopazDrop && this.dungeonSimData[i].simSuccess) {
                            const monster = DUNGEONS[i].monsters[DUNGEONS[i].monsters.length - 1];
                            this.dungeonSimData[i].signetChance = (1 - Math.pow(1 - this.getSignetDropRate(monster), Math.floor(this.signetFarmTime * 3600 / this.dungeonSimData[i].killTimeS))) * 100;
                        } else {
                            this.dungeonSimData[i].signetChance = 0;
                        }
                    }
                }
            }

            /**
             * Calculates the drop chance of a signet half from a monster
             * @param {number} monsterID The index of MONSTERS
             * @return {number}
             */
            getSignetDropRate(monsterID) {
                return this.getMonsterCombatLevel(monsterID) * this.computeLootChance(monsterID) / 500000;
            }

            /**
             * Calculates the combat level of a monster
             * @param {number} monsterID The index of MONSTERS
             * @return {number}
             */
            getMonsterCombatLevel(monsterID) {
                const prayer = 1;
                const base = 0.25 * (MONSTERS[monsterID].defenceLevel + MONSTERS[monsterID].hitpoints + Math.floor(prayer / 2));
                const melee = 0.325 * (MONSTERS[monsterID].attackLevel + MONSTERS[monsterID].strengthLevel);
                const range = 0.325 * (Math.floor(3 * MONSTERS[monsterID].rangedLevel / 2));
                const magic = 0.325 * (Math.floor(3 * MONSTERS[monsterID].magicLevel / 2));
                const levels = [melee, range, magic];
                return Math.floor(base + Math.max(...levels));
            }

            /** Updates the chance to get a pet for the given skill*/
            updatePetChance() {
                const petSkills = ['Hitpoints', 'Prayer'];
                if (this.currentSim.isSlayerTask) {
                    petSkills.push('Slayer');
                }
                const attackType = this.currentSim.playerStats.attackType;
                switch (attackType) {
                    case CONSTANTS.attackType.Melee:
                        switch (this.currentSim.attackStyle.Melee) {
                            case 0:
                                petSkills.push('Attack');
                                break;
                            case 1:
                                petSkills.push('Strength');
                                break;
                            case 2:
                                petSkills.push('Defence');
                                break;
                        }
                        break;
                    case CONSTANTS.attackType.Ranged:
                        petSkills.push('Ranged');
                        if (this.currentSim.attackStyle.Ranged === 2) petSkills.push('Defence');
                        break;
                    case CONSTANTS.attackType.Magic:
                        petSkills.push('Magic');
                        if (this.currentSim.attackStyle.Magic === 1) petSkills.push('Defence');
                        break;
                }
                if (petSkills.includes(this.petSkill)) {
                    const petSkillLevel = this.currentSim.virtualLevels[this.petSkill] + 1;
                    this.monsterSimData.forEach((simResult) => {
                        if (!simResult.simSuccess) {
                            simResult.petChance = 0;
                            return;
                        }
                        const timePeriod = (this.timeMultiplier === -1) ? simResult.killTimeS : this.timeMultiplier;
                        const petRolls = simResult.petRolls[this.petSkill] || simResult.petRolls.other;
                        simResult.petChance = 1 - petRolls.reduce((chanceToNotGet, petRoll) => {
                            return chanceToNotGet * Math.pow((1 - petRoll.speed * petSkillLevel / 25000000000), timePeriod * petRoll.rollsPerSecond);
                        }, 1);
                        simResult.petChance *= 100;
                    });
                    DUNGEONS.forEach((_, dungeonId) => {
                        const dungeonResult = this.dungeonSimData[dungeonId];
                        if (!dungeonResult.simSuccess || this.petSkill === 'Slayer') {
                            dungeonResult.petChance = 0;
                            return;
                        }
                        const timePeriod = (this.timeMultiplier === -1) ? dungeonResult.killTimeS : this.timeMultiplier;
                        dungeonResult.petChance = 1 - DUNGEONS[dungeonId].monsters.reduce((cumChanceToNotGet, monsterId) => {
                            const monsterResult = this.monsterSimData[monsterId];
                            const timeRatio = monsterResult.killTimeS / dungeonResult.killTimeS;
                            const petRolls = monsterResult.petRolls[this.petSkill] || monsterResult.petRolls.other;
                            const monsterChanceToNotGet = petRolls.reduce((chanceToNotGet, petRoll) => {
                                return chanceToNotGet * Math.pow((1 - petRoll.speed * petSkillLevel / 25000000000), timePeriod * timeRatio * petRoll.rollsPerSecond);
                            }, 1);
                            return cumChanceToNotGet * monsterChanceToNotGet;
                        }, 1);
                        dungeonResult.petChance *= 100;
                    });
                } else {
                    this.monsterSimData.forEach((simResult) => {
                        simResult.petChance = 0;
                    });
                    this.dungeonSimData.forEach((simResult) => {
                        simResult.petChance = 0;
                    });
                }
            }
        }

    }

    MICSR.waitLoadOrder(reqs, setup, 'Simulator');

})();