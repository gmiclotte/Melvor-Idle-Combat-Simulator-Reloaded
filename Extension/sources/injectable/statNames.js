(() => {

    const reqs = [
        'util',
    ];

    const setup = () => {

        const MICSR = window.MICSR;

        // equipment stats are non-passive stats that apply to combat
        MICSR.equipmentStatNames = {

            // general
            attackSpeed: {
                implemented: true,
                name: 'Weapon Speed',
                icon: 'combat',
            },
            modifiers: {implemented: true},
            isTwoHanded: {implemented: true},

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

            // slayer
            slayerBonusXP: {implemented: true},

            ////////////////////
            // weapon effects //
            ////////////////////
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

            // ranged
            ammoPreservation: {implemented: true},

            // magic
            increasedMinAirSpellDmg: {implemented: true},
            increasedMinEarthSpellDmg: {implemented: true},
            increasedMinFireSpellDmg: {implemented: true},
            increasedMinWaterSpellDmg: {implemented: true},
            spellHeal: {implemented: true},

            // hitpoints
            hpRegenBonus: {implemented: true},
            increasedHPRegen: {implemented: true},
            increasedMaxHitpoints: {implemented: true},
            lifesteal: {implemented: true},

            // auto eat
            decreasedAutoEatEfficiency: {implemented: true},
            increasedAutoEat: {implemented: true},

            // prayer
            prayerCostReduction: {implemented: true},

            // slayer
            slayerAreaEffectNegationFlat: {implemented: true},
            slayerAreaEffectNegationPercent: {implemented: true},
        };

        // requirements to wear gear
        MICSR.requiredStatNames = {

            // level requirements
            attackLevelRequired: {
                implemented: true,
                icon: 'attack',
            },
            defenceLevelRequired: {
                implemented: true,
                icon: 'defence',
            },
            magicLevelRequired: {
                implemented: true,
                icon: 'magic',
            },
            rangedLevelRequired: {
                implemented: true,
                icon: 'ranged',
            },

            // other requirements
            slayerLevelRequired: {
                implemented: true,
                icon: 'slayer',
            },
        };

        // stats that do not apply to combat
        MICSR.irrelevantStatNames = {

            // this does nothing
            prayerBonus: {implemented: false},

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
            slayerTaskRequirement: {},
            tier: {},
            trimmedGPCost: {},
            trimmedItemID: {},
            type: {},

        };

        // stats bugged in the base game
        MICSR.brokenStatNames = {};

        // report stats that no longer exist
        const existing = {};
        items.forEach(item => {
            Object.getOwnPropertyNames(item).forEach(prop => {
                existing[prop] = true;
            });
        });
        [
            MICSR.equipmentStatNames,
            MICSR.passiveStatNames,
            MICSR.requiredStatNames,
            MICSR.irrelevantStatNames,
        ].forEach(props => {
            Object.getOwnPropertyNames(props).forEach(prop => {
                if (!existing[prop]) {
                    MICSR.log(`unknown item property ${prop}`);
                }
            });
        });

        // report unknown stats
        const known = [MICSR.equipmentStatNames, MICSR.passiveStatNames, MICSR.requiredStatNames, MICSR.irrelevantStatNames];
        MICSR.checkUnknown(items.filter(item => item.equipmentSlot !== undefined || item.isPassiveItem), 'Item', 'items', known, MICSR.brokenStatNames);

        // report stats that are known but not implemented
        MICSR.checkImplemented(MICSR.equipmentStatNames, 'Item equipment stat');
        MICSR.checkImplemented(MICSR.passiveStatNames, 'Item passive stat');
        MICSR.checkImplemented(MICSR.requiredStatNames, 'Item required stat');
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
    waitLoadOrder(reqs, setup, 'statNames');

})();