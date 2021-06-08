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

(() => {

    const reqs = [
        'statNames',
        'util',
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
                // auto eat data
                this.autoEatData = [
                    SHOP["General"][CONSTANTS.shop.general.Auto_Eat_Tier_I],
                    SHOP["General"][CONSTANTS.shop.general.Auto_Eat_Tier_II],
                    SHOP["General"][CONSTANTS.shop.general.Auto_Eat_Tier_III],
                ];
                // pet IDs
                this.petIds = [
                    2, // FM pet
                    12, 13, 14, 15, 16, 17, 18, 19, 20, // cb skill pets
                    22, 23, // slayer area pets
                    25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40 // dungeon pets
                ];
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
                // Agility course selection
                this.course = Array(10).fill(-1);
                this.courseMastery = Array(10).fill(false);
                this.pillar = -1;
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
                    ammoPreservation: 0,
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
                this.herbloreModifiers = {};
                this.luckyHerb = 0;
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
                // ignore stun sleep damage modifier on enemy attacks
                this.applyEnemyStunSleepDamage = false;
                // selected item drop
                this.dropSelected = 0;
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
                        if (equipmentSlot === MICSR.equipmentSlot.Weapon && item.isAmmo) {
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
                    if (equipmentSlot !== MICSR.equipmentSlot.Passive) {
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
                                    if (equipmentSlot === MICSR.equipmentSlot.Weapon) {
                                        equipmentStats.attackSpeed = item.attackSpeed || 4000;
                                    }
                                    return;
                                case 'providesRuneQty':
                                    if (equipmentSlot === MICSR.equipmentSlot.Weapon) {
                                        item.providesRune.forEach((rune) => equipmentStats.runesProvidedByWeapon[rune] = itemStat * (equipmentStats.activeItems.magicSkillcape ? 2 : 1));
                                    } else if (equipmentSlot === MICSR.equipmentSlot.Shield) {
                                        item.providesRune.forEach((rune) => equipmentStats.runesProvidedByShield[rune] = itemStat * (equipmentStats.activeItems.magicSkillcape ? 2 : 1));
                                    } else {
                                        console.error(`Runes provided by ${item.name} are not taken into account!`)
                                    }
                                    return;
                            }
                            if (equipmentSlot === MICSR.equipmentSlot.Weapon && item.isAmmo) {
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
                const weaponID = this.equipmentSelected[MICSR.equipmentSlot.Weapon];
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
                return MICSR.getModifierValue(this.modifiers, 'HiddenSkillLevel', skill);
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
                );
                combatStats.unmodifiedAttackRoll = maxAttackRoll;
                maxAttackRoll = applyModifier(
                    maxAttackRoll,
                    MICSR.getModifierValue(modifiers, 'RangedAccuracyBonus')
                    + MICSR.getModifierValue(modifiers, 'GlobalAccuracy')
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
                );
                combatStats.unmodifiedAttackRoll = maxAttackRoll;
                maxAttackRoll = applyModifier(
                    maxAttackRoll,
                    MICSR.getModifierValue(modifiers, 'MagicAccuracyBonus')
                    + MICSR.getModifierValue(modifiers, 'GlobalAccuracy')
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
                );
                combatStats.unmodifiedAttackRoll = maxAttackRoll;
                maxAttackRoll = applyModifier(
                    maxAttackRoll,
                    MICSR.getModifierValue(modifiers, 'MeleeAccuracyBonus')
                    + MICSR.getModifierValue(modifiers, 'GlobalAccuracy')
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
                    baseStats.strengthBonusRanged += Math.floor(110 + (1 + (MONSTERS[monsterID].magicLevel * 6) / 33));
                    baseStats.attackBonusRanged += Math.floor(102 * (1 + (MONSTERS[monsterID].magicLevel * 6) / 5500));
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
                if (this.combatStats.attackType !== CONSTANTS.attackType.Magic || !this.spells.ancient.isSelected) {
                    maxHit = applyModifier(maxHit, MICSR.getModifierValue(modifiers, 'MaxHitPercent'));
                    maxHit += MICSR.getModifierValue(modifiers, 'MaxHitFlat');
                }
                return maxHit
            }

            maxRangedHit(baseStats, modifiers) {
                let attackStyleBonusStrength = 0;
                if (this.attackStyle.Ranged === 0) {
                    attackStyleBonusStrength += 3;
                }
                const effectiveStrengthLevel = Math.floor(this.playerLevels.Ranged + attackStyleBonusStrength + this.getSkillHiddenLevels(CONSTANTS.skill.Ranged));
                let baseMaxHit = Math.floor(this.numberMultiplier * (1.3 + effectiveStrengthLevel / 10 + baseStats.strengthBonusRanged / 80 + (effectiveStrengthLevel * baseStats.strengthBonusRanged) / 640));
                baseMaxHit = applyModifier(
                    baseMaxHit,
                    MICSR.getModifierValue(modifiers, 'RangedStrengthBonus')
                );
                return baseMaxHit;
            }

            maxMagicHit(baseStats, modifiers) {
                let baseMaxHit;
                let selectedSpell = this.spells.standard.selectedID;
                if (!this.spells.ancient.isSelected) {
                    baseMaxHit = Math.floor(this.numberMultiplier
                        * (SPELLS[selectedSpell].maxHit + SPELLS[selectedSpell].maxHit * baseStats.damageBonusMagic / 100)
                        * (1 + (this.playerLevels.Magic + 1 + this.getSkillHiddenLevels(CONSTANTS.skill.Magic)) / 200));
                    baseMaxHit = applyModifier(
                        baseMaxHit,
                        MICSR.getModifierValue(modifiers, 'MagicDamageBonus')
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
                        baseMaxHit += this.auroraBonus.increasedMaxHit * this.numberMultiplier;
                    }
                }
                return baseMaxHit;
            }

            maxMeleeHit(baseStats, modifiers) {
                const effectiveStrengthLevel = Math.floor(this.playerLevels.Strength + 8 + this.getSkillHiddenLevels(CONSTANTS.skill.Strength));
                let baseMaxHit = Math.floor(this.numberMultiplier * (1.3 + effectiveStrengthLevel / 10 + baseStats.strengthBonus / 80 + (effectiveStrengthLevel * baseStats.strengthBonus) / 640));
                baseMaxHit = applyModifier(
                    baseMaxHit,
                    MICSR.getModifierValue(modifiers, 'MeleeStrengthBonus')
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
                    combatStats.effectiveDefenceLevel,
                    this.baseStats.defenceBonus,
                    'MeleeEvasion',
                    player.meleeEvasionBuff,
                    player.meleeEvasionDebuff,
                );
                //Ranged Defence
                combatStats.effectiveRangedDefenceLevel = Math.floor(this.playerLevels.Defence + 8 + 1 + getSkillHiddenLevels(CONSTANTS.skill.Defence));
                const maximumRangedDefenceRoll = this.calculateGenericPlayerEvasionRating(
                    combatStats.effectiveRangedDefenceLevel,
                    this.baseStats.defenceBonusRanged,
                    'RangedEvasion',
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
                    combatStats.effectiveMagicDefenceLevel,
                    this.baseStats.defenceBonusMagic,
                    'MagicEvasion',
                    player.magicEvasionBuff,
                    player.magicEvasionDebuff,
                );
                return {
                    melee: maximumDefenceRoll,
                    ranged: maximumRangedDefenceRoll,
                    magic: maximumMagicDefenceRoll,
                }
            }

            calculateGenericPlayerEvasionRating(effectiveDefenceLevel, baseStat, modifier, buff, debuff) {
                let maxDefRoll = Math.floor(effectiveDefenceLevel * (baseStat + 64));
                maxDefRoll = applyModifier(maxDefRoll, MICSR.getModifierValue(this.modifiers, modifier));
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
                let damageReduction = this.baseStats.damageReduction + MICSR.getModifierValue(this.modifiers, 'DamageReduction');
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

                // set enemy spawn timer
                this.enemySpawnTimer = enemySpawnTimer + MICSR.getModifierValue(modifiers, 'MonsterRespawnTimer');

                // attack type
                this.setAttackType();

                // attack speed without aurora
                this.combatStats.attackSpeed = 4000;
                this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
                if (this.combatStats.attackType === CONSTANTS.attackType.Ranged && this.attackStyle.Ranged === 1) {
                    this.combatStats.attackSpeed -= 400;
                }
                this.combatStats.attackSpeed += MICSR.getModifierValue(modifiers, 'PlayerAttackSpeed');
                this.combatStats.attackSpeed = applyModifier(
                    this.combatStats.attackSpeed,
                    MICSR.getModifierValue(modifiers, 'PlayerAttackSpeedPercent')
                );

                // preservation
                this.combatStats.ammoPreservation = MICSR.getModifierValue(this.modifiers, 'AmmoPreservation');
                this.combatStats.runePreservation = MICSR.getModifierValue(this.modifiers, 'RunePreservation');

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
                                this.combatStats.minHit = MICSR.getModifierValue(modifiers, 'MinAirSpellDmg');
                                break;
                            case CONSTANTS.spellType.Water:
                                this.combatStats.minHit = MICSR.getModifierValue(modifiers, 'MinWaterSpellDmg');
                                break;
                            case CONSTANTS.spellType.Earth:
                                this.combatStats.minHit = MICSR.getModifierValue(modifiers, 'MinEarthSpellDmg');
                                break;
                            case CONSTANTS.spellType.Fire:
                                this.combatStats.minHit = MICSR.getModifierValue(modifiers, 'MinFireSpellDmg');
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
                this.combatStats.maxHitpoints += MICSR.getModifierValue(modifiers, 'MaxHitpoints');
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
                            this.addModifiers(PRAYER[i].modifiers, this.prayerBonus.modifiers);
                        }
                        if (PRAYER[i].vars !== undefined) {
                            let j = 0;
                            for (const v of PRAYER[i].vars) {
                                this.prayerBonus.vars[v] += PRAYER[i].values[j];
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
                        if (this.verbose) {
                            MICSR.log(source, modifier, source[modifier]);
                        }
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
                        if (this.verbose) {
                            MICSR.log(source, modifier, source[modifier]);
                        }
                        for (const value of source[modifier]) {
                            this.updateKeyValuePair(target, modifier, [value.id, value.value]);
                        }
                    } else {
                        this.updateKeyValuePair(target, modifier, source[modifier]);
                    }
                }
            }

            updateKeyValuePair(array, key, value, verbose) {
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
                const petList = this.petIds.filter(id => this.petOwned[id]).map(id => PETS[id]);
                this.petModifiers = this.computeModifiers(petList);
                this.mergeModifiers(this.petModifiers, this.modifiers);

                // mimic calculatePrayerModifiers
                this.computePrayerBonus();
                this.mergeModifiers(this.prayerBonus.modifiers, this.modifiers);

                // mimic calculateAgilityModifiers
                const obstacles = [];
                let fullCourse = true
                for (let i = 0; i < this.course.length; i++) {
                    if (this.course[i] < 0) {
                        fullCourse = false;
                        break;
                    }
                    let modifiers = {};
                    if (this.courseMastery[i]) {
                        const m = agilityObstacles[this.course[i]].modifiers;
                        Object.getOwnPropertyNames(m).forEach(prop => {
                            let passiveType = printPlayerModifier(prop, m[prop]);
                            if (passiveType[1] !== "text-danger") {
                                modifiers[prop] = m[prop];
                                return;
                            }
                            const value = m[prop];
                            if (value.length === undefined) {
                                modifiers[prop] = value / 2;
                                return;
                            }
                            modifiers[prop] = value.map(x => [x[0], x[1] / 2]);
                        });
                    } else {
                        modifiers = agilityObstacles[this.course[i]].modifiers;
                    }
                    obstacles.push({modifiers: modifiers});
                }
                this.agilityModifiers = this.computeModifiers(obstacles);
                if (fullCourse && this.pillar > -1) {
                    this.mergeModifiers(agilityPassivePillars[this.pillar].modifiers, this.agilityModifiers);
                }
                this.mergeModifiers(this.agilityModifiers, this.modifiers);

                // mimic calculateShopModifiers
                // implement other parts of this if they ever are relevant
                this.autoEatModifiers = {};
                for (let i = 0; i <= this.autoEatTier; i++) {
                    this.mergeModifiers(this.autoEatData[i].contains.modifiers, this.autoEatModifiers);
                }
                this.mergeModifiers(this.autoEatModifiers, this.modifiers);

                // mimic calculateMiscModifiers
                // implement this if it ever is relevant

                // potion modifiers
                this.computePotionBonus();
                this.mergeModifiers(this.herbloreModifiers, this.modifiers);

                // TODO: SPECIAL ATTACKS, MASTERY
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
                this.herbloreModifiers = {};
                this.luckyHerb = 0;
                if (this.potionSelected) {
                    const potion = items[herbloreItemData[this.potionID].itemID[this.potionTier]];
                    this.herbloreModifiers = potion.modifiers;
                    if (potion.potionBonusID === 11) {
                        this.luckyHerb = potion.potionBonus;
                    }
                }
            }

            playerAttackSpeed() {
                let attackSpeed = this.combatStats.attackSpeed;
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
                    ammoPreservation: this.combatStats.ammoPreservation,
                    lifesteal: this.auroraBonus.lifesteal + this.equipmentStats.lifesteal,
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
                    // healing
                    autoEat: {
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
                    playerStats.autoEat.eatAt = MICSR.getModifierValue(this.modifiers, 'AutoEatThreshold');
                    playerStats.autoEat.efficiency = MICSR.getModifierValue(this.modifiers, 'AutoEatEfficiency');
                    playerStats.autoEat.maxHP = MICSR.getModifierValue(this.modifiers, 'AutoEatHPLimit');
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
                    amt += this.numberMultiplier * MICSR.getModifierValue(this.modifiers, 'HPRegenFlat');
                    // rapid heal prayer
                    if (this.prayerBonus.vars[prayerBonusHitpoints] !== undefined) {
                        amt *= 2;
                    }
                    // Regeneration modifiers
                    applyModifier(
                        amt,
                        MICSR.getModifierValue(this.modifiers, 'HitpointRegeneration')
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
                    pp -= MICSR.getModifierValue(this.modifiers, 'FlatPrayerCostReduction');
                    if (playerStats.activeItems.prayerSkillcape && pp > 0) {
                        pp = Math.floor(pp / 2);
                    }
                    pp = Math.max(1, pp);
                    let save = MICSR.getModifierValue(this.modifiers, 'ChanceToPreservePrayerPoints');
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
                        playerStats.prayerXpPerDamage += PRAYER[i].pointsPerPlayer / this.numberMultiplier;
                    }
                }
                // Xp Bonuses
                const globalXpBonus = MICSR.getModifierValue(this.modifiers, 'GlobalSkillXP', CONSTANTS.skill.Slayer);
                playerStats.combatXpBonus = globalXpBonus;
                if (this.combatStats.attackType === CONSTANTS.attackType.Melee) {
                    switch (this.attackStyle.Melee) {
                        case 0:
                            playerStats.combatXpBonus += MICSR.getModifierValue(this.modifiers, 'SkillXP', CONSTANTS.skill.Attack);
                            break
                        case 1:
                            playerStats.combatXpBonus += MICSR.getModifierValue(this.modifiers, 'SkillXP', CONSTANTS.skill.Strength);
                            break
                        case 2:
                            playerStats.combatXpBonus += MICSR.getModifierValue(this.modifiers, 'SkillXP', CONSTANTS.skill.Defence);
                            break
                    }
                }
                if (this.combatStats.attackType === CONSTANTS.attackType.Ranged) {
                    const xpBonus = MICSR.getModifierValue(this.modifiers, 'SkillXP', CONSTANTS.skill.Ranged);
                    if (this.attackStyle.Ranged === 2) {
                        const defenceXpBonus = MICSR.getModifierValue(this.modifiers, 'SkillXP', CONSTANTS.skill.Defence);
                        playerStats.combatXpBonus += (xpBonus + defenceXpBonus) / 2;
                    } else {
                        playerStats.combatXpBonus += xpBonus;
                    }
                }
                if (this.combatStats.attackType === CONSTANTS.attackType.Magic) {
                    const xpBonus = MICSR.getModifierValue(this.modifiers, 'SkillXP', CONSTANTS.skill.Magic);
                    if (this.attackStyle.Magic === 2) {
                        const defenceXpBonus = MICSR.getModifierValue(this.modifiers, 'SkillXP', CONSTANTS.skill.Defence);
                        playerStats.combatXpBonus += (xpBonus + defenceXpBonus) / 2;
                    } else {
                        playerStats.combatXpBonus += xpBonus;
                    }
                }
                playerStats.slayerXpBonus = globalXpBonus + MICSR.getModifierValue(this.modifiers, 'SkillXP', CONSTANTS.skill.Slayer);
                playerStats.prayerXpBonus = globalXpBonus + MICSR.getModifierValue(this.modifiers, 'SkillXP', CONSTANTS.skill.Prayer);
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
                multiplier += MICSR.getModifierValue(this.modifiers, 'FoodHealingValue') / 100;
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
                    window.MICSR.log(id + ' is waiting for ' + req);
                }
            }
        }
        if (!reqMet) {
            setTimeout(() => waitLoadOrder(reqs, setup, id), 50);
            return;
        }
        // requirements met
        window.MICSR.log('setting up ' + id);
        setup();
        // mark as loaded
        window.MICSR.loadedFiles[id] = true;
    }
    waitLoadOrder(reqs, setup, 'CombatData');

})();