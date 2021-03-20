(() => {

    const reqs = [
        'util',
    ];

    const setup = () => {
        const MICSR = window.MICSR;

        /**
         * Class to handle importing
         */
        MICSR.Import = class {

            constructor(app) {
                this.app = app;
            }

            /**
             * Callback for when the import button is clicked
             * @param {number} setID Index of equipmentSets from 0-2 to import
             */
            importButtonOnClick(setID) {
                // get in game levels
                const levels = {};
                this.app.skillKeys.forEach((key) => {
                    const skillId = CONSTANTS.skill[key];
                    const virtualLevel = Math.max(skillLevel[skillId], exp.xp_to_level(skillXP[skillId]) - 1);
                    levels[key] = virtualLevel;
                });
                // get potion
                let potionID = -1;
                let potionTier = -1;
                const itemID = herbloreBonuses[13].itemID;
                if (itemID !== 0) {
                    // Get tier and potionID
                    for (let i = 0; i < herbloreItemData.length; i++) {
                        if (herbloreItemData[i].category === 0) {
                            for (let j = 0; j < herbloreItemData[i].itemID.length; j++) {
                                if (herbloreItemData[i].itemID[j] === itemID) {
                                    potionID = i;
                                    potionTier = j;
                                }
                            }
                        }
                    }
                }
                // get cooking mastery for food
                const foodMastery = items[this.app.combatData.foodSelected].masteryID;
                const cookingMastery = this.app.combatData.foodSelected && foodMastery && foodMastery[0] === CONSTANTS.skill.Cooking
                    && exp.xp_to_level(MASTERY[CONSTANTS.skill.Cooking].xp[foodMastery[1]]) > 99;

                // create settings object
                const settings = {
                    equipment: equipmentSets[setID].equipment,
                    levels: levels,
                    meleeStyle: selectedAttackStyle[0],
                    rangedStyle: selectedAttackStyle[1] - 3,
                    magicStyle: selectedAttackStyle[2] - 6,
                    isAncient: isSpellAncient,
                    ancient: selectedAncient,
                    spell: selectedSpell,
                    curse: selectedCurse,
                    aurora: activeAurora,
                    prayerSelected: activePrayer,
                    potionID: potionID,
                    potionTier: potionTier,
                    petOwned: petUnlocked,
                    autoEatTier: -1,
                    foodSelected: equippedFood[currentCombatFood].itemID,
                    cookingPool: getMasteryPoolProgress(CONSTANTS.skill.Cooking) >= 95,
                    cookingMastery: cookingMastery,
                    isHardcore: currentGamemode === 1,
                    isAdventure: currentGamemode === 2,
                    useCombinationRunes: useCombinationRunes,
                    course: chosenAgilityObstacles,
                    courseMastery: MASTERY[CONSTANTS.skill.Agility].xp.map(x => x > 13034431),
                    pillar: agilityPassivePillarActive,
                };

                // get the player's auto eat tier
                [
                    CONSTANTS.shop.general.Auto_Eat_Tier_I,
                    CONSTANTS.shop.general.Auto_Eat_Tier_II,
                    CONSTANTS.shop.general.Auto_Eat_Tier_III,
                ].forEach(id => {
                    if (shopItemsPurchased.filter(x => x[0] === "General" && x[1] === id).length > 0) {
                        settings.autoEatTier++;
                    }
                });

                // import settings
                this.importSettings(settings);
                // update app and simulator objects
                this.update();
            }

            exportSettings() {
                const courseMastery = {};
                this.app.combatData.course.forEach((o, i) => courseMastery[o] = this.app.combatData.courseMastery[i]);
                return {
                    // combatData: this.app.combatData,
                    // TODO: all these should be in CombatData class?
                    equipment: this.app.equipmentSelected,
                    levels: this.app.combatData.virtualLevels,
                    meleeStyle: this.app.combatData.attackStyle.Melee,
                    rangedStyle: this.app.combatData.attackStyle.Ranged,
                    magicStyle: this.app.combatData.attackStyle.Magic,
                    isAncient: this.app.combatData.spells.ancient.isSelected,
                    ancient: this.app.combatData.spells.ancient.selectedID,
                    spell: this.app.combatData.spells.standard.selectedID,
                    curse: this.app.combatData.spells.curse.selectedID,
                    aurora: this.app.combatData.spells.aurora.selectedID,
                    prayerSelected: this.app.combatData.prayerSelected,
                    potionID: this.app.combatData.potionID,
                    potionTier: this.app.combatData.potionTier,
                    petOwned: this.app.combatData.petOwned,
                    autoEatTier: this.app.combatData.autoEatTier,
                    foodSelected: this.app.combatData.foodSelected,
                    cookingPool: this.app.combatData.cookingPool,
                    cookingMastery: this.app.combatData.cookingMastery,
                    isHardcore: this.app.combatData.isHardcore,
                    isAdventure: this.app.combatData.isAdventure,
                    useCombinationRunes: this.app.combatData.useCombinationRunes,
                    course: this.app.combatData.course,
                    courseMastery: courseMastery,
                    pillar: this.app.combatData.pillar,
                }
            }

            importSettings(settings) {
                // import settings
                this.importEquipment(settings.equipment);
                this.importLevels(settings.levels);
                this.importStyle(settings.meleeStyle, settings.rangedStyle, settings.magicStyle);
                this.importSpells(settings.isAncient, settings.ancient, settings.spell, settings.curse, settings.aurora);
                this.importPrayers(settings.prayerSelected);
                this.importPotion(settings.potionID, settings.potionTier);
                this.importPets(settings.petOwned);
                this.importAutoEat(settings.autoEatTier, settings.foodSelected, settings.cookingPool, settings.cookingMastery);
                this.importHardCore(settings.isHardcore);
                this.importAdventure(settings.isAdventure);
                this.importUseCombinationRunes(settings.useCombinationRunes);
                this.importAgilityCourse(settings.course, settings.courseMastery, settings.pillar);
            }

            update() {
                // update and compute values
                this.app.updateSpellOptions();
                this.app.checkForElisAss();
                this.app.updatePrayerOptions();
                this.app.combatData.updateEquipmentStats();
                this.app.updateEquipmentStats();
                this.app.updateCombatStats();
            }

            importEquipment(equipment) {
                this.app.equipmentSlotKeys.forEach((key, i) => {
                    const itemID = equipment[i];
                    this.app.equipmentSelected[i] = itemID;
                    this.app.setEquipmentImage(i, itemID);
                });
                this.app.updateStyleDropdowns();
            }

            importLevels(levels) {
                this.app.skillKeys.forEach(key => {
                    const virtualLevel = levels[key];
                    document.getElementById(`MCS ${key} Input`).value = virtualLevel;
                    this.app.combatData.playerLevels[key] = Math.min(virtualLevel, 99);
                    this.app.combatData.virtualLevels[key] = virtualLevel;
                });
            }

            importStyle(meleeStyle, rangedStyle, magicStyle) {
                this.app.combatData.attackStyle.Melee = meleeStyle;
                document.getElementById('MCS Melee Style Dropdown').selectedIndex = meleeStyle;
                this.app.combatData.attackStyle.Ranged = rangedStyle;
                document.getElementById('MCS Ranged Style Dropdown').selectedIndex = rangedStyle;
                this.app.combatData.attackStyle.Magic = magicStyle;
                document.getElementById('MCS Magic Style Dropdown').selectedIndex = magicStyle;
            }

            importSpells(isAncient, ancient, spell, curse, aurora) {
                // Set all active spell UI to be disabled
                Object.keys(this.app.combatData.spells).forEach((spellType) => {
                    const spellOpts = this.app.combatData.spells[spellType];
                    if (spellOpts.isSelected) {
                        this.app.unselectButton(document.getElementById(`MCS ${spellOpts.array[spellOpts.selectedID].name} Button`));
                    }
                });
                // import spells
                if (isAncient) {
                    this.app.combatData.spells.ancient.isSelected = true;
                    this.app.combatData.spells.ancient.selectedID = ancient;
                    this.app.combatData.spells.standard.isSelected = false;
                    this.app.combatData.spells.standard.selectedID = null;
                    this.app.combatData.spells.curse.isSelected = false;
                    this.app.combatData.spells.curse.selectedID = null;
                } else {
                    this.app.combatData.spells.standard.isSelected = true;
                    this.app.combatData.spells.standard.selectedID = spell;
                    this.app.combatData.spells.ancient.isSelected = false;
                    this.app.combatData.spells.ancient.selectedID = null;
                    if (curse !== null) {
                        this.app.combatData.spells.curse.isSelected = true;
                        this.app.combatData.spells.curse.selectedID = curse;
                    } else {
                        this.app.combatData.spells.curse.isSelected = false;
                        this.app.combatData.spells.curse.selectedID = null;
                    }
                }
                if (aurora !== null) {
                    this.app.combatData.spells.aurora.isSelected = true;
                    this.app.combatData.spells.aurora.selectedID = aurora;
                } else {
                    this.app.combatData.spells.aurora.isSelected = false;
                    this.app.combatData.spells.aurora.selectedID = null;
                }
                // Update spell UI
                Object.values(this.app.combatData.spells).forEach((spellOpts, i) => {
                    if (spellOpts.isSelected) {
                        this.app.selectButton(document.getElementById(`MCS ${spellOpts.array[spellOpts.selectedID].name} Button`));
                        this.app.spellSelectCard.onTabClick(i);
                    }
                });
            }

            importPrayers(prayerSelected) {
                // Update prayers
                this.app.combatData.activePrayers = 0;
                for (let i = 0; i < PRAYER.length; i++) {
                    const prayButton = document.getElementById(`MCS ${this.app.getPrayerName(i)} Button`);
                    if (prayerSelected[i]) {
                        this.app.selectButton(prayButton);
                        this.app.combatData.prayerSelected[i] = true;
                        this.app.combatData.activePrayers++;
                    } else {
                        this.app.unselectButton(prayButton);
                        this.app.combatData.prayerSelected[i] = false;
                    }
                }
            }

            importPotion(potionID, potionTier) {
                // Deselect potion if selected
                if (this.app.combatData.potionSelected) {
                    this.app.unselectButton(document.getElementById(`MCS ${this.app.getPotionName(this.app.combatData.potionID)} Button`));
                    this.app.combatData.potionSelected = false;
                    this.app.combatData.potionID = -1;
                }
                // Select new potion if applicable
                if (potionID !== -1) {
                    this.app.combatData.potionSelected = true;
                    this.app.combatData.potionID = potionID;
                    this.app.selectButton(document.getElementById(`MCS ${this.app.getPotionName(this.app.combatData.potionID)} Button`));
                }
                // Set potion tier if applicable
                if (potionTier !== -1) {
                    this.app.combatData.potionTier = potionTier;
                    this.app.updatePotionTier(potionTier);
                    // Set dropdown to correct option
                    document.getElementById('MCS Potion Tier Dropdown').selectedIndex = potionTier;
                }
            }

            importPets(petOwned) {
                // Import PETS
                petOwned.forEach((owned, petID) => {
                    this.app.combatData.petOwned[petID] = owned;
                    if (this.app.combatData.petIds.includes(petID)) {
                        if (owned) {
                            this.app.selectButton(document.getElementById(`MCS ${PETS[petID].name} Button`));
                        } else {
                            this.app.unselectButton(document.getElementById(`MCS ${PETS[petID].name} Button`));
                        }
                    }
                    if (petID === 4 && owned) document.getElementById('MCS Rock').style.display = '';
                });
            }

            importAutoEat(autoEatTier, foodSelected, cookingPool, cookingMastery) {
                // Import Food Settings
                this.app.combatData.autoEatTier = autoEatTier;
                document.getElementById('MCS Auto Eat Tier Dropdown').selectedIndex = autoEatTier + 1;
                this.app.equipFood(foodSelected);
                if (cookingPool) {
                    this.app.combatData.cookingPool = true;
                    document.getElementById('MCS 95% Pool: +10% Radio Yes').checked = true;
                } else {
                    this.app.combatData.cookingPool = false;
                    document.getElementById('MCS 95% Pool: +10% Radio No').checked = true;
                }
                if (cookingMastery) {
                    this.app.combatData.cookingMastery = true;
                    document.getElementById('MCS 99 Mastery: +20% Radio Yes').checked = true;
                } else {
                    this.app.combatData.cookingMastery = false;
                    document.getElementById('MCS 99 Mastery: +20% Radio No').checked = true;
                }
            }

            importHardCore(isHardcore) {
                // Update hardcore mode
                if (isHardcore) {
                    this.app.combatData.isHardcore = true;
                    document.getElementById('MCS Hardcore Mode Radio Yes').checked = true;
                } else {
                    this.app.combatData.isHardcore = false;
                    document.getElementById('MCS Hardcore Mode Radio No').checked = true;
                }
            }

            importAdventure(isAdventure) {
                // Update adventure mode
                if (isAdventure) {
                    this.app.combatData.isAdventure = true;
                    document.getElementById('MCS Adventure Mode Radio Yes').checked = true;
                } else {
                    this.app.combatData.isAdventure = false;
                    document.getElementById('MCS Adventure Mode Radio No').checked = true;
                }
                this.app.updateCombatStats();
            }

            importUseCombinationRunes(useCombinationRunes) {
                // Update hardcore mode
                if (useCombinationRunes) {
                    this.app.combatData.useCombinationRunes = true;
                    document.getElementById('MCS Use Combination Runes Radio Yes').checked = true;
                } else {
                    this.app.combatData.useCombinationRunes = false;
                    document.getElementById('MCS Use Combination Runes Radio No').checked = true;
                }
            }

            importAgilityCourse(course, masteries, pillar) {
                // clear current values
                this.app.combatData.course.fill(-1);
                this.app.combatData.courseMastery.fill(false);
                // import settings
                course.forEach((o, i) => {
                    this.app.combatData.course[i] = o
                    if (masteries[o]) {
                        this.app.combatData.courseMastery[i] = true;
                    }
                });
                this.app.combatData.pillar = pillar;
                // set dropdowns
                this.app.combatData.course.forEach((o, i) => {
                    const elt = document.getElementById(`MICSR Agility Obstacle ${i} Dropdown`);
                    for (let index = 0; elt[index] !== undefined; index++) {
                        const tmp = elt[index].value;
                        if (tmp === "" + o) {
                            elt.selectedIndex = index;
                            return;
                        }
                    }
                })
                document.getElementById(`MICSR Agility Pillar Dropdown`).selectedIndex = this.app.combatData.pillar + 1;
                // set image selection
                this.app.combatData.courseMastery.forEach((m, i) => {
                    const elt = document.getElementById(`MCS Agility Mastery ${i} Toggle Button`);
                    if (m) {
                        this.app.selectButton(elt);
                    } else {
                        this.app.unselectButton(elt);
                    }
                });
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
    waitLoadOrder(reqs, setup, 'Import');

})();