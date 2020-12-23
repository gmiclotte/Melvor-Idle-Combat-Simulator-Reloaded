(() => {

    const MICSR = window.MICSR;

    // equipment stats are non-passive stats that apply to combat
    MICSR.equipmentStatNames = {

        // general
        attackSpeed: {
            implemented: true,
            name: 'Weapon Speed',
            icon: 'combat',
        },
        isTwoHanded: {implemented: true},
        prayerBonus: {implemented: false},

        // special attack TODO: non-weapon special attacks
        specialAttackID: {implemented: true},
        hasSpecialAttack: {implemented: true},

        // slot TODO unequip identical item if already equipped
        equipmentSlot: {implemented: true},
        isPassiveItem: {implemented: true},

        // defence
        damageReduction: {
            implemented: true,
            name: 'Damage Reduction',
            icon: 'defence',
        },
        defenceBonus: {
            implemented: true,
            name: 'Melee Defence',
            icon: 'defence',
        },
        magicDefenceBonus: {
            implemented: true,
            name: 'Magic Defence',
            icon: 'defence',
        },
        rangedDefenceBonus: {
            implemented: true,
            name: 'Ranged Defence',
            icon: 'defence',
        },

        // melee
        attackBonus: [
            {
                implemented: true,
                name: 'Stab',
                icon: 'attack',
            },
            {
                implemented: true,
                name: 'Slash',
                icon: 'strength',
            },
            {
                implemented: true,
                name: 'Block',
                icon: 'defence',
            },
        ],
        strengthBonus: {
            implemented: true,
            name: 'Melee Strength',
            icon: 'strength',
        },

        // ranged
        ammoPreservation: {implemented: false},
        ammoTypeRequired: {implemented: true},
        ammoType: {implemented: true},
        isAmmo: {implemented: true},
        rangedAttackBonus: {
            implemented: true,
            name: 'Ranged Attack',
            icon: 'ranged',
        },
        rangedStrengthBonus: {
            implemented: true,
            name: 'Ranged Strength',
            icon: 'ranged',
        },

        // magic
        isMagic: {implemented: true},
        magicAttackBonus: {
            implemented: true,
            name: 'Magic Attack',
            icon: 'magic',
        },
        magicDamageBonus: {
            implemented: true,
            name: 'Magic % Damage',
            icon: 'magic',
        },
        providesRune: {implemented: true},
        providesRuneQty: {implemented: true},

        // miolite sceptre
        canUseMagic: {implemented: true},

        // Cloudburst Staff
        increasedWaterSpellDamage: {implemented: true},

        // slayer crossbow
        slayerStrengthMultiplier: {implemented: true},

        // confetti crossbow
        gpMultiplierCap: {implemented: true},
        gpMultiplierMin: {implemented: true},

        // deadeye amulet
        chanceToCrit: {implemented: true},
        critDamage: {implemented: true},

        // big ol ron
        bossStrengthMultiplier: {implemented: true},
    };

    // passive stats that apply to combat
    MICSR.passiveStatNames = {

        // general
        decreasedAttackSpeed: {implemented: true},
        reflectDamage: {implemented: true},

        // loot
        chanceToDoubleLoot: {implemented: true},
        gpMultiplier: {implemented: true}, // not properly defined for Gold Topaz Ring and Almight Lute
        increasedGP: {implemented: true},

        // magic
        increasedMinAirSpellDmg: {implemented: true},
        increasedMinEarthSpellDmg: {implemented: true},
        increasedMinFireSpellDmg: {implemented: true},
        increasedMinWaterSpellDmg: {implemented: true},
        spellHeal: {implemented: true},

        // hitpoints
        decreasedAutoEatEfficiency: {implemented: false},
        hpRegenBonus: {implemented: true},
        increasedAutoEat: {implemented: false},
        increasedHPRegen: {implemented: true},
        increasedMaxHitpoints: {implemented: true},
        lifesteal: {implemented: true},

        // prayer
        prayerCostReduction: {implemented: true},

        // slayer
        slayerAreaEffectNegationFlat: {implemented: true},
        slayerAreaEffectNegationPercent: {implemented: true},
        slayerBonusXP: {implemented: true},

    };

    // requirements to wear gear
    MICSR.requiredStatNames = {

        // level requirements
        attackLevelRequired: {
            implemented: true,
            name: 'Level Required',
            icon: 'attack',
        },
        defenceLevelRequired: {
            implemented: true,
            name: 'Level Required',
            icon: 'defence',
        },
        magicLevelRequired: {
            implemented: true,
            name: 'Level Required',
            icon: 'magic',
        },
        rangedLevelRequired: {
            implemented: true,
            name: 'Level Required',
            icon: 'ranged',
        },

        // other requirements
        slayerLevelRequired: {
            implemented: true,
            name: 'Level Required',
            icon: 'slayer',
        },
        slayerTaskRequirement: {implemented: false},

    };

    // stats that do not apply to combat
    MICSR.irrelevantStatNames = {

        // crafting
        craftingID: {},
        craftingLevel: {},
        craftingXP: {},
        craftQty: {},
        craftReq: {},

        // fishing
        fishingBonusXP: {},
        fishingCatchWeight: {},
        fishingSpeedBonus: {},

        // fletching
        fletchQty: {},
        fletchReq: {},
        fletchingCategory: {},
        fletchingID: {},
        fletchingLevel: {},
        fletchingXP: {},

        // runecrafting
        runecraftingCategory: {},
        runecraftingID: {},
        runecraftingLevel: {},
        runecraftingXP: {},
        runecraftQty: {},
        runecraftReq: {},

        // smithing
        smithingLevel: {},
        smithingQty: {},
        smithingXP: {},
        smithReq: {},
        smithingID: {},

        // thieving
        increasedSuccessRate: {},

        // various
        baseChanceToPreserve: {},
        baseDropRate: {},
        bonusMasteryXP: {},
        bonusSkillXP: {},
        buysFor: {},
        canEquip: {},
        canMultiUpgrade: {},
        canUpgrade: {},
        category: {},
        chanceToDoubleResources: {},
        chanceToPreserve: {},
        description: {},
        gloveID: {},
        harvestBonus: {},
        hasAnimation: {},
        hasStats: {},
        id: {},
        ignoreCompletion: {},
        increasedItemChance: {},
        itemID: {},
        itemsRequired: {},
        masteryID: {},
        maxDropRate: {},
        media: {},
        mediaAnimation: {},
        name: {},
        sellsFor: {},
        slayerCost: {},
        tier: {},
        trimmedGPCost: {},
        trimmedItemID: {},
        type: {},

    };

    // stats bugged in the base game
    MICSR.brokenStatNames = {
        increasedWaterAirSpellDmg: {},
        increasedEarthFireSpellDmg: {},
    }

    // construct a list of stats that are not in any of the previous categories
    MICSR.unknownStatNames = {};
    items.filter(item => item.equipmentSlot !== undefined || item.isPassiveItem).forEach(item => {
        Object.getOwnPropertyNames(item).forEach(stat => {
            // check if any bugged stats are still present
            if (MICSR.brokenStatNames[stat] !== undefined) {
                MICSR.log("Item stat " + stat + " is bugged for " + item.name + "!")
                return;
            }
            // check if we already know this stat
            if (MICSR.equipmentStatNames[stat] !== undefined
                || MICSR.passiveStatNames[stat] !== undefined
                || MICSR.requiredStatNames[stat] !== undefined
                || MICSR.irrelevantStatNames[stat] !== undefined) {
                return;
            }
            // unknown stat found !
            if (MICSR.unknownStatNames[stat] === undefined) {
                MICSR.unknownStatNames[stat] = [];
            }
            MICSR.unknownStatNames[stat].push(item.name);
        })
    })

    Object.getOwnPropertyNames(MICSR.unknownStatNames).forEach(stat => {
        MICSR.log("Unknown stat " + stat + " for items: ", MICSR.unknownStatNames[stat]);
    });

    // report stats that are known but not implemented
    [
        'equipment',
        'passive',
        'required',
    ].forEach(statType => {
        const stats = MICSR[statType + 'StatNames'];
        Object.getOwnPropertyNames(stats).forEach(stat => {
            if (!stats[stat].implemented) {
                MICSR.log("Stat not yet implemented: " + stat);
            }
        })
    })

    MICSR.loadedFiles.statNames = true;

})();