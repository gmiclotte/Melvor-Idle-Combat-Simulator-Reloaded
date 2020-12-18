(() => {

    // equipment stats are non-passive stats that apply to combat
    MICSR.equipmentStatNames = {

        // general
        attackSpeed: {
            implemented: false,
            name: 'Attack Speed',
            icon: 'combat',
        },
        bossStrengthMultiplier: {implemented: false},
        canUseMagic: {implemented: false},
        chanceToCrit: {implemented: false},
        critDamage: {implemented: false},
        gpMultiplierCap: {implemented: false},
        gpMultiplierMin: {implemented: false},
        hasSpecialAttack: {implemented: false},
        isTwoHanded: {implemented: false},
        prayerBonus: {implemented: false},
        specialAttackID: {implemented: false},

        // slot
        equipmentSlot: {implemented: false},
        isPassiveItem: {implemented: false},

        // defence
        damageReduction: {
            implemented: false,
            name: 'Damage Reduction',
            icon: 'defence',
        },
        defenceBonus: {
            implemented: false,
            name: 'Defence Bonus',
            icon: 'defence',
        },
        magicDefenceBonus: {
            implemented: false,
            name: 'Defence Bonus',
            icon: 'defence',
        },
        rangedDefenceBonus: {
            implemented: false,
            name: 'Defence Bonus',
            icon: 'defence',
        },

        // melee
        attackBonus: [
            {
                implemented: false,
                name: 'Stab Bonus',
                icon: 'attack',
            },
            {
                implemented: false,
                name: 'Slash Bonus',
                icon: 'strength',
            },
            {
                implemented: false,
                name: 'Block Bonus',
                icon: 'defence',
            },
        ],
        strengthBonus: {
            implemented: false,
            name: 'Strength Bonus',
            icon: 'strength',
        },

        // ranged
        ammoPreservation: {implemented: false},
        ammoTypeRequired: {implemented: false},
        ammoType: {implemented: false},
        isAmmo: {implemented: false},
        rangedAttackBonus: {
            implemented: false,
            name: 'Attack Bonus',
            icon: 'attack',
        },
        rangedStrengthBonus: {
            implemented: false,
            name: 'Strength Bonus',
            icon: 'strength',
        },

        // magic
        increasedWaterSpellDamage: {implemented: false},
        isMagic: {implemented: false},
        magicAttackBonus: {implemented: false},
        magicDamageBonus: {
            implemented: false,
            name: '% Damage Bonus',
            icon: 'magic',
        },
        providesRune: {implemented: false},
        providesRuneQty: {implemented: false},

        // slayer
        slayerStrengthMultiplier: {implemented: false},

    };

    // passive stats that apply to combat
    MICSR.passiveStatNames = {

        // general
        decreasedAttackSpeed: {implemented: false},
        reflectDamage: {implemented: false},

        // loot
        chanceToDoubleLoot: {implemented: false},
        gpMultiplier: {implemented: false},
        increasedGP: {implemented: false},

        // magic
        increasedMinAirSpellDmg: {implemented: false},
        increasedMinEarthSpellDmg: {implemented: false},
        increasedMinFireSpellDmg: {implemented: false},
        increasedMinWaterSpellDmg: {implemented: false},
        spellHeal: {implemented: false},

        // hitpoints
        decreasedAutoEatEfficiency: {implemented: false},
        hpRegenBonus: {implemented: false},
        increasedAutoEat: {implemented: false},
        increasedHPRegen: {implemented: false},
        increasedMaxHitpoints: {implemented: false},
        lifesteal: {implemented: false},

        // prayer
        prayerCostReduction: {implemented: false},

        // slayer
        slayerAreaEffectNegationFlat: {implemented: false},
        slayerAreaEffectNegationPercent: {implemented: false},
        slayerBonusXP: {implemented: false},

    };

    // requirements to wear gear
    MICSR.requiredStatNames = {

        // level requirements
        attackLevelRequired: {
            implemented: false,
            name: 'Level Required',
            icon: 'attack',
        },
        defenceLevelRequired: {
            implemented: false,
            name: 'Level Required',
            icon: 'defence',
        },
        magicLevelRequired: {
            implemented: false,
            name: 'Level Required',
            icon: 'magic',
        },
        rangedLevelRequired: {
            implemented: false,
            name: 'Level Required',
            icon: 'ranged',
        },

        // other requirements
        slayerLevelRequired: {
            implemented: false,
            name: 'Level Required',
            icon: 'slayer',
        },
        slayerTaskRequirement: {implemented: false},

    };

    // stats that do not apply to combat
    MICSR.irrelevantStatNames = {

        // crafting
        craftingID: {implemented: false},
        craftingLevel: {implemented: false},
        craftingXP: {implemented: false},
        craftQty: {implemented: false},
        craftReq: {implemented: false},

        // fishing
        fishingBonusXP: {implemented: false},
        fishingCatchWeight: {implemented: false},
        fishingSpeedBonus: {implemented: false},

        // fletching
        fletchQty: {implemented: false},
        fletchReq: {implemented: false},
        fletchingCategory: {implemented: false},
        fletchingID: {implemented: false},
        fletchingLevel: {implemented: false},
        fletchingXP: {implemented: false},

        // runecrafting
        runecraftingCategory: {implemented: false},
        runecraftingID: {implemented: false},
        runecraftingLevel: {implemented: false},
        runecraftingXP: {implemented: false},
        runecraftQty: {implemented: false},
        runecraftReq: {implemented: false},

        // smithing
        smithingLevel: {implemented: false},
        smithingQty: {implemented: false},
        smithingXP: {implemented: false},
        smithReq: {implemented: false},
        smithingID: {implemented: false},

        // thieving
        increasedSuccessRate: {implemented: false},

        // various
        baseChanceToPreserve: {implemented: false},
        baseDropRate: {implemented: false},
        bonusMasteryXP: {implemented: false},
        bonusSkillXP: {implemented: false},
        buysFor: {implemented: false},
        canEquip: {implemented: false},
        canMultiUpgrade: {implemented: false},
        canUpgrade: {implemented: false},
        category: {implemented: false},
        chanceToDoubleResources: {implemented: false},
        chanceToPreserve: {implemented: false},
        description: {implemented: false},
        gloveID: {implemented: false},
        harvestBonus: {implemented: false},
        hasAnimation: {implemented: false},
        hasStats: {implemented: false},
        id: {implemented: false},
        ignoreCompletion: {implemented: false},
        increasedItemChance: {implemented: false},
        itemID: {implemented: false},
        itemsRequired: {implemented: false},
        masteryID: {implemented: false},
        maxDropRate: {implemented: false},
        media: {implemented: false},
        mediaAnimation: {implemented: false},
        name: {implemented: false},
        sellsFor: {implemented: false},
        slayerCost: {implemented: false},
        tier: {implemented: false},
        trimmedGPCost: {implemented: false},
        trimmedItemID: {implemented: false},
        type: {implemented: false},

    };

    // stats bugged in the base game
    MICSR.brokenStatNames = {
        increasedWaterAirSpellDmg: {implemented: false},
        increasedEarthFireSpellDmg: {implemented: false},
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