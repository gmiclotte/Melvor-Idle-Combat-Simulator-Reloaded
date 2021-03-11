(() => {

    const reqs = [
        'statNames',
    ];

    const setup = () => {

        const MICSR = window.MICSR;

        /**
         * CombatData class, stores all the combat data of a simulation
         */
        MICSR.CombatData = class {
            /**
             *
             */
            constructor(equipmentSelected, equipmentSlotKeys) {
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
                // equipmentSelected, this is shared with an instance of App when it is the child of
                this.equipmentSelected = equipmentSelected;
                // equipmentSlotKeys
                this.equipmentSlotKeys = equipmentSlotKeys;
                // player modifiers
                this.modifiers = this.copyModifierTemplate();
                // base stats
                this.baseStats = this.resetPlayerBaseStats();
                // equipment stats
                this.equipmentStats = {};
                // combat stats
                this.combatStats = {};
            }

            detach() {
                this.equipmentSelected = [...this.equipmentSelected];
            }

            /**
             * Calculates the equipment's combined stats and stores them in `this.equipmentStats`
             */
            updateEquipmentStats() {
                this.setAttackType();
                const maxCape = this.equipmentSelected.includes(CONSTANTS.item.Max_Skillcape) || this.equipmentSelected.includes(CONSTANTS.item.Cape_of_Completion);
                /** @type {EquipmentStats} */
                const equipmentStats = {
                    runesProvidedByWeapon: {},
                    runesProvidedByShield: {},
                    activeItems: {
                        // TODO: check which of these items are passive slot items
                        //   also check any other use of `CONSTANTS.item` and `items`
                        hitpointsSkillcape: this.equipmentSelected.includes(CONSTANTS.item.Hitpoints_Skillcape) || maxCape,
                        magicSkillcape: this.equipmentSelected.includes(CONSTANTS.item.Magic_Skillcape) || maxCape,
                        prayerSkillcape: this.equipmentSelected.includes(CONSTANTS.item.Prayer_Skillcape) || maxCape,
                        slayerSkillcape: this.equipmentSelected.includes(CONSTANTS.item.Slayer_Skillcape) || maxCape,
                        firemakingSkillcape: this.equipmentSelected.includes(CONSTANTS.item.Firemaking_Skillcape) || maxCape,
                        capeOfArrowPreservation: this.equipmentSelected.includes(CONSTANTS.item.Cape_of_Arrow_Preservation),
                        skullCape: this.equipmentSelected.includes(CONSTANTS.item.Skull_Cape),
                        goldDiamondRing: this.equipmentSelected.includes(CONSTANTS.item.Gold_Diamond_Ring),
                        goldEmeraldRing: this.equipmentSelected.includes(CONSTANTS.item.Gold_Emerald_Ring),
                        goldSapphireRing: this.equipmentSelected.includes(CONSTANTS.item.Gold_Sapphire_Ring),
                        fighterAmulet: this.equipmentSelected.includes(CONSTANTS.item.Fighter_Amulet) && this.combatStats.attackType === CONSTANTS.attackType.Melee,
                        warlockAmulet: this.equipmentSelected.includes(CONSTANTS.item.Warlock_Amulet) && this.combatStats.attackType === CONSTANTS.attackType.Magic,
                        guardianAmulet: this.equipmentSelected.includes(CONSTANTS.item.Guardian_Amulet),
                        deadeyeAmulet: this.equipmentSelected.includes(CONSTANTS.item.Deadeye_Amulet) && this.combatStats.attackType === CONSTANTS.attackType.Ranged,
                        confettiCrossbow: this.equipmentSelected.includes(CONSTANTS.item.Confetti_Crossbow),
                        stormsnap: this.equipmentSelected.includes(CONSTANTS.item.Stormsnap),
                        slayerCrossbow: this.equipmentSelected.includes(CONSTANTS.item.Slayer_Crossbow),
                        bigRon: this.equipmentSelected.includes(CONSTANTS.item.Big_Ron),
                        aorpheatsSignetRing: this.equipmentSelected.includes(CONSTANTS.item.Aorpheats_Signet_Ring),
                        elderCrown: this.equipmentSelected.includes(CONSTANTS.item.Elder_Crown),
                        // slayer gear
                        mirrorShield: this.equipmentSelected.includes(CONSTANTS.item.Mirror_Shield),
                        magicalRing: this.equipmentSelected.includes(CONSTANTS.item.Magical_Ring),
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
                for (let equipmentSlot = 0; equipmentSlot < this.equipmentSlotKeys.length; equipmentSlot++) {
                    const itemID = this.equipmentSelected[equipmentSlot];
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

            setAttackType() {
                const weaponID = this.equipmentSelected[CONSTANTS.equipmentSlot.Weapon];
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
            }

            getSkillHiddenLevels(skill) {
                let hiddenLevels = 0;
                for (let i = 0; i < this.modifiers.increasedHiddenSkillLevel.length; i++) {
                    if (this.modifiers.increasedHiddenSkillLevel[i].id === skill)
                        hiddenLevels += this.modifiers.increasedHiddenSkillLevel[i].value;
                }
                for (let i = 0; i < this.modifiers.decreasedHiddenSkillLevel.length; i++) {
                    if (this.modifiers.decreasedHiddenSkillLevel[i].id === skill)
                        hiddenLevels -= this.modifiers.increasedHiddenSkillLevel[i].value;
                }
                return hiddenLevels;
            }

            /**
             * mimic calculatePlayerAccuracyRating
             */
            calculatePlayerAccuracyRating(combatStats, baseStats, modifiers) {
                switch (this.combatStats.attackType) {
                    case CONSTANTS.attackType.Ranged:
                        return this.maxRangedAttackRoll(combatStats, baseStats, modifiers);
                    case CONSTANTS.attackType.Magic:
                        return this.maxMagicAttackRoll(combatStats, baseStats, modifiers);
                    case CONSTANTS.attackType.Melee:
                        return this.maxMeleeAttackRoll(combatStats, baseStats, modifiers);
                }
            }

            maxRangedAttackRoll(combatStats, baseStats, modifiers) {
                // attack style bonus
                let attackStyleBonusAccuracy = 0;
                if (this.attackStyle.Ranged === 0) {
                    attackStyleBonusAccuracy += 3;
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
                combatStats.unmodifierAttachRoll = maxAttackRoll;
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

            maxMagicAttackRoll(combatStats, baseStats, modifiers) {
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
                combatStats.unmodifierAttachRoll = maxAttackRoll;
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

            maxMeleeAttackRoll(combatStats, baseStats, modifiers) {
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
                combatStats.unmodifierAttachRoll = maxAttackRoll;
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
            updatePlayerBaseStats(monsterID = undefined) {
                const baseStats = this.resetPlayerBaseStats();
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
                    return baseStats;
                }
                // changes for items that have different formulas in combat
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
                return baseStats;
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
                baseMaxHit = applyModifier(
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
                    && this.equipmentSelected.includes(CONSTANTS.item.Cloudburst_Staff)
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
             * mimic calculatePlayerEvasionRating
             */
            calculatePlayerEvasionRating(combatStats, player) {
                //Melee defence
                combatStats.effectiveDefenceLevel = Math.floor(this.playerLevels.Defence + 8 + getSkillHiddenLevels(CONSTANTS.skill.Defence));
                if (this.combatStats.attackType === CONSTANTS.attackType.Ranged && this.attackStyle.Ranged === 2) {
                    // long range // TODO this is not implemented in the game #
                    // combatStats.effectiveDefenceLevel += 3;
                }
                const maximumDefenceRoll = this.calculateGenericPlayerEvasionRating(
                    effectiveDefenceLevel,
                    this.baseStats.defenceBonus,
                    this.herbloreBonus.meleeEvasion,
                    this.modifiers.increasedMeleeEvasion,
                    this.modifiers.decreasedMeleeEvasion,
                    player.meleeEvasionBuff,
                    player.meleeEvasionDebuff,
                );
                //Ranged Defence
                combatStats.effectiveRangedDefenceLevel = Math.floor(this.playerLevels.Defence + 8 + 1 + getSkillHiddenLevels(CONSTANTS.skill.Defence));
                const maximumRangedDefenceRoll = this.calculateGenericPlayerEvasionRating(
                    effectiveRangedDefenceLevel,
                    this.baseStats.defenceBonusRanged,
                    this.herbloreBonus.rangedEvasion,
                    this.modifiers.increasedRangedEvasion,
                    this.modifiers.decreasedRangedEvasion,
                    player.rangedEvasionBuff,
                    player.rangedEvasionDebuff,
                );
                //Magic Defence
                combatStats.effectiveMagicDefenceLevel = Math.floor(
                    (this.playerLevels.Magic + getSkillHiddenLevels(CONSTANTS.skill.Magic)) * 0.7
                    + (this.playerLevels.Defence + getSkillHiddenLevels(CONSTANTS.skill.Defence)) * 0.3
                    + 8 + 1
                );
                const maximumMagicDefenceRoll = this.calculateGenericPlayerEvasionRating(
                    effectiveMagicDefenceLevel,
                    this.baseStats.defenceBonusMagic,
                    this.herbloreBonus.magicEvasion,
                    this.modifiers.increasedMagicEvasion,
                    this.modifiers.decreasedMagicEvasion,
                    player.magicEvasionBuff,
                    player.magicEvasionDebuff,
                );
                return {
                    melee: maximumDefenceRoll,
                    ranged: maximumRangedDefenceRoll,
                    magic: maximumMagicDefenceRoll,
                }
            }

            calculateGenericPlayerEvasionRating(effectiveDefenceLevel, baseStat, herbloreBonus, increaseModifier, decreaseModifier, buff, debuff) {
                let maxDefRoll = Math.floor(effectiveDefenceLevel * (baseStat + 64) * (1 + herbloreBonus / 100));
                maxDefRoll = applyModifier(maxDefRoll, increaseModifier - decreaseModifier);
                //apply player buffs first
                if (buff) {
                    maxDefRoll = Math.floor(maxDefRoll * (1 + buff / 100));
                }
                //then apply enemy debuffs
                if (debuff) {
                    maxDefRoll = Math.floor(maxDefRoll * (1 - debuff / 100));
                }
                return maxDefRoll;
            }

            /**
             * mimic calculatePlayerDamageReduction
             */
            calculatePlayerDamageReduction(player = {}) {
                let damageReduction = this.baseStats.damageReduction + this.herbloreBonus.damageReduction + this.modifiers.increasedDamageReduction;
                damageReduction -= this.modifiers.decreasedDamageReduction;
                if (player.markOfDeath) {
                    damageReduction = Math.floor(damageReduction / 2);
                }
                return damageReduction;
            }

            /**
             * Calculates the combat stats from equipment, combat style, spell selection and player levels and stores them in `this.combatStats`
             */
            updateCombatStats() {

                /*
                First, gather all bonuses TODO: extract this
                 */

                // update numberMultiplier
                if (this.isAdventure) {
                    this.numberMultiplier = 100;
                } else {
                    this.numberMultiplier = 10;
                }

                // update modifiers
                this.updateModifiers();
                const modifiers = this.modifiers;

                // update aurora bonuses //TODO: are some of these modifiers?
                this.computeAuroraBonus();

                // set base stats
                this.baseStats = this.updatePlayerBaseStats();

                /*
                Second, start computing and configuring TODO: extract this
                 */

                // attack type
                this.setAttackType();

                // attack speed
                this.combatStats.attackSpeed = 4000;
                this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
                if (this.combatStats.attackType === CONSTANTS.attackType.Ranged && this.attackStyle.Ranged === 1) {
                    this.combatStats.attackSpeed -= 400;
                }
                this.combatStats.attackSpeed -=
                    modifiers.decreasedPlayerAttackSpeed
                    + modifiers.increasedPlayerAttackSpeed;
                this.combatStats.attackSpeed = applyModifier(
                    this.combatStats.attackSpeed,
                    modifiers.increasedPlayerAttackSpeedPercent
                    - modifiers.decreasedPlayerAttackSpeedPercent
                );

                // rune preservation
                this.combatStats.runePreservation = 0;
                if (this.combatStats.attackType === CONSTANTS.attackType.Magic) {
                    // Magic
                    if (this.equipmentStats.activeItems.skullCape) {
                        this.combatStats.runePreservation += 0.2;
                    }
                    if (this.petOwned[17]) {
                        this.combatStats.runePreservation += 0.05;
                    }
                }

                // max attack roll
                this.combatStats.maxAttackRoll = this.calculatePlayerAccuracyRating(this.combatStats, this.baseStats, modifiers);

                // max hit roll
                this.combatStats.maxHit = this.calculatePlayerMaxHit(this.baseStats, modifiers);

                // min hit roll
                this.combatStats.minHit = 0;
                if (this.combatStats.attackType === CONSTANTS.attackType.Magic) {
                    // Magic
                    if (this.spells.standard.isSelected) {
                        this.combatStats.minHit = 0;
                        switch (SPELLS[this.spells.standard.selectedID].spellType) {
                            case CONSTANTS.spellType.Air:
                                this.combatStats.minHit = modifiers.increasedMinAirSpellDmg -
                                    modifiers.decreasedMinAirSpellDmg;
                                break;
                            case CONSTANTS.spellType.Water:
                                this.combatStats.minHit = modifiers.increasedMinWaterSpellDmg -
                                    modifiers.decreasedMinWaterSpellDmg
                                break;
                            case CONSTANTS.spellType.Earth:
                                this.combatStats.minHit = modifiers.increasedMinEarthSpellDmg -
                                    modifiers.decreasedMinEarthSpellDmg;
                                break;
                            case CONSTANTS.spellType.Fire:
                                this.combatStats.minHit = modifiers.increasedMinFireSpellDmg -
                                    modifiers.decreasedMinFireSpellDmg;
                                break;
                            default:
                        }
                    }
                }
                if (this.auroraBonus.increasedMinHit !== 0 && this.spells.standard.isSelected) {
                    this.combatStats.minHit += this.auroraBonus.increasedMinHit;
                }
                this.combatStats.minHit *= this.numberMultiplier;

                // max defence roll
                const evasionRatings = this.calculatePlayerEvasionRating(
                    this.combatStats,
                    {
                        meleeEvasionBuff: this.auroraBonus.meleeEvasionBuff,
                        rangedEvasionBuff: this.auroraBonus.rangedEvasionBuff,
                        magicEvasionBuff: this.auroraBonus.magicEvasionBuff,
                    },
                );
                this.combatStats.maxDefRoll = evasionRatings.melee;
                this.combatStats.maxRngDefRoll = evasionRatings.ranged;
                this.combatStats.maxMagDefRoll = evasionRatings.magic;

                // Calculate damage reduction
                this.combatStats.damageReduction = this.calculatePlayerDamageReduction();

                // Max Hitpoints
                this.combatStats.maxHitpoints = this.playerLevels.Hitpoints;
                this.combatStats.maxHitpoints += modifiers.increasedMaxHitpoints - modifiers.decreasedMaxHitpoints;
                this.combatStats.maxHitpoints *= this.numberMultiplier;
            }

            /**
             * compute a modifier object from a list
             */
            computeModifiers(list) {
                const modifiers = {};
                for (const object of list) {
                    this.addModifiers(object.modifiers, modifiers);
                }
                return modifiers;
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
                    modifiers: {},
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
                    if (source[modifier].length) {
                        MICSR.log(source, modifier, source[modifier])
                        for (const value of source[modifier]) {
                            this.updateKeyValuePair(target, modifier, value);
                        }
                    } else {
                        this.updateKeyValuePair(target, modifier, source[modifier]);
                    }
                }
            }

            mergeModifiers(source, target) {
                for (const modifier in source) {
                    if (source[modifier].length) {
                        MICSR.log(source, modifier, source[modifier])
                        for (const value of source[modifier]) {
                            this.updateKeyValuePair(target, modifier, [value.id, value.value]);
                        }
                    } else {
                        this.updateKeyValuePair(target, modifier, source[modifier]);
                    }
                }
            }

            updateKeyValuePair = (array, key, value, verbose) => {
                if (this.verbose) {
                    MICSR.log(array + " / " + key + " / " + value);
                }
                updateKeyValuePair(array, key, value);
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
             * mimics updateAllPlayerModifiers
             */
            updateModifiers(selectedCombatArea = "") {
                // reset
                this.modifiers = this.copyModifierTemplate();

                // mimic calculateEquippedItemModifiers // passives
                const equipmentList = this.equipmentSelected.filter(x => x > 0).map(x => items[x]);
                this.itemModifiers = this.computeModifiers(equipmentList);
                this.mergeModifiers(this.itemModifiers, this.modifiers);

                // mimic calculateCombatAreaEffectModifiers(selectedCombatArea)
                // TODO: implement this

                // mimic calculatePetModifiers
                const petList = this.petOwned.map((x, i) => x ? i : undefined).filter(x => x !== undefined).map(x => PETS[x]);
                this.petModifiers = this.computeModifiers(petList);
                this.mergeModifiers(this.petModifiers, this.modifiers);

                // mimic calculatePrayerModifiers
                this.computePrayerBonus();
                this.mergeModifiers(this.prayerBonus.modifiers, this.modifiers);

                // mimic calculateAgilityModifiers
                // TODO: implement this

                // mimic calculateShopModifiers
                // implement this if it ever is relevant

                // mimic calculateMiscModifiers
                // implement this if it ever is relevant

                // TODO: SPECIAL ATTACKS, MASTERY, POTIONS
                //  when they get made into modifiers in the game
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
                if (this.equipmentSelected.includes(CONSTANTS.item.Guardian_Amulet)) {
                    // Guardian Amulet gives 20% increase in attack speed (40% if below 50% HP)
                    attackSpeed *= 1.2;
                }
                attackSpeed -= this.decreasedAttackSpeed();
                return attackSpeed;
            }

            decreasedAttackSpeed() {
                return this.auroraBonus.attackSpeedBuff;
            }

            getPlayerStats() {
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
                    equipmentSelected: [...this.equipmentSelected],
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
                    foodHeal: 0,
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
                    for (const itemId of this.equipmentSelected) {
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
                    let amt = Math.floor(this.combatStats.maxHitpoints / 10);
                    amt = Math.floor(amt / this.numberMultiplier);
                    // modifiers
                    amt += this.numberMultiplier * this.modifiers.increasedHPRegenFlat
                        - this.numberMultiplier * this.modifiers.decreasedHPRegenFlat;
                    // rapid heal prayer
                    if (this.prayerBonus.vars[prayerBonusHitpoints] !== undefined) {
                        amt *= 2;
                    }
                    // Regeneration Potion
                    amt = Math.floor(amt * (1 + this.herbloreBonus.hpRegen / 100));
                    applyModifier(
                        amt,
                        this.modifiers.increasedHitpointRegeneration
                        - this.modifiers.decreasedHitpointRegeneration
                    );
                    playerStats.avgHPRegen = amt;
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
                // ammo preservation
                if (this.petOwned[16]) {
                    playerStats.ammoPreservation += 5;
                }
                // Other Bonuses
                if (playerStats.activeItems.goldEmeraldRing) {
                    playerStats.xpBonus = 0.07;
                }
                return playerStats;
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
                    && !this.equipmentStats.activeItems.slayerSkillcape
                    && !this.equipmentSelected.includes(area.slayerItem)) {
                    return false;
                }
                return true;
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
                if (attacker.attackType === CONSTANTS.attackType.Melee) {
                    targetDefRoll = target.maxDefRoll;
                } else if (attacker.attackType === CONSTANTS.attackType.Ranged) {
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
    waitLoadOrder(reqs, setup, 'CombatData');

})();