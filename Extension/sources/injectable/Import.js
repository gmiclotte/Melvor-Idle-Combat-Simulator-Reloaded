(() => {

    const MICSR = window.MICSR;

    const reqs = [
        'util',
    ];

    const setup = () => {

        /**
         * Class to handle importing
         */
        MICSR.Import = class {

            constructor(app, simulator) {
                this.app = app;
                this.simulator = simulator;
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
                const foodMastery = items[this.simulator.foodSelected].masteryID;
                const cookingMastery = this.simulator.foodSelected && foodMastery && foodMastery[0] === CONSTANTS.skill.Cooking
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
                    autoEatTier: currentAutoEat - 1,
                    foodSelected: equippedFood[currentCombatFood].itemID,
                    cookingPool: getMasteryPoolProgress(CONSTANTS.skill.Cooking) >= 95,
                    cookingMastery: cookingMastery,
                    isHardcore: currentGamemode === 1,
                }

                // import settings
                this.importSettings(settings);
                // update app and simulator objects
                this.update();
            }

            exportSettings() {
                return {
                    equipment: this.app.equipmentSelected,
                    levels: this.simulator.virtualLevels,
                    meleeStyle: this.simulator.attackStyle.Melee,
                    rangedStyle: this.simulator.attackStyle.Ranged,
                    magicStyle: this.simulator.attackStyle.Magic,
                    isAncient: this.simulator.spells.ancient.isSelected,
                    ancient: this.simulator.spells.ancient.selectedID,
                    spell: this.simulator.spells.standard.selectedID,
                    curse: this.simulator.spells.curse.selectedID,
                    aurora: this.simulator.spells.aurora.selectedID,
                    prayerSelected: this.simulator.prayerSelected,
                    potionID: this.simulator.potionID,
                    potionTier: this.simulator.potionTier,
                    petOwned: this.simulator.petOwned,
                    autoEatTier: this.simulator.autoEatTier,
                    foodSelected: this.simulator.foodSelected,
                    cookingPool: this.simulator.cookingPool,
                    cookingMastery: this.simulator.cookingMastery,
                    isHardcore: this.simulator.isHardcore,
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
            }

            update() {
                // update and compute values
                this.app.updateSpellOptions();
                this.app.checkForElisAss();
                this.app.updatePrayerOptions();
                this.simulator.updateEquipmentStats();
                this.app.updateEquipmentStats();
                this.simulator.computePotionBonus();
                this.simulator.computePrayerBonus();
                this.simulator.updateCombatStats();
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
                    this.simulator.playerLevels[key] = Math.min(virtualLevel, 99);
                    this.simulator.virtualLevels[key] = virtualLevel;
                });
            }

            importStyle(meleeStyle, rangedStyle, magicStyle) {
                this.simulator.attackStyle.Melee = meleeStyle;
                document.getElementById('MCS Melee Style Dropdown').selectedIndex = meleeStyle;
                this.simulator.attackStyle.Ranged = rangedStyle;
                document.getElementById('MCS Ranged Style Dropdown').selectedIndex = rangedStyle;
                this.simulator.attackStyle.Magic = magicStyle;
                document.getElementById('MCS Magic Style Dropdown').selectedIndex = magicStyle;
            }

            importSpells(isAncient, ancient, spell, curse, aurora) {
                // Set all active spell UI to be disabled
                Object.keys(this.simulator.spells).forEach((spellType) => {
                    const spellOpts = this.simulator.spells[spellType];
                    if (spellOpts.isSelected) {
                        this.app.unselectButton(document.getElementById(`MCS ${spellOpts.array[spellOpts.selectedID].name} Button`));
                    }
                });
                // import spells
                if (isAncient) {
                    this.simulator.spells.ancient.isSelected = true;
                    this.simulator.spells.ancient.selectedID = ancient;
                    this.simulator.spells.standard.isSelected = false;
                    this.simulator.spells.standard.selectedID = null;
                    this.simulator.spells.curse.isSelected = false;
                    this.simulator.spells.curse.selectedID = null;
                } else {
                    this.simulator.spells.standard.isSelected = true;
                    this.simulator.spells.standard.selectedID = spell;
                    this.simulator.spells.ancient.isSelected = false;
                    this.simulator.spells.ancient.selectedID = null;
                    if (curse !== null) {
                        this.simulator.spells.curse.isSelected = true;
                        this.simulator.spells.curse.selectedID = curse;
                    } else {
                        this.simulator.spells.curse.isSelected = false;
                        this.simulator.spells.curse.selectedID = null;
                    }
                }
                if (aurora !== null) {
                    this.simulator.spells.aurora.isSelected = true;
                    this.simulator.spells.aurora.selectedID = aurora;
                } else {
                    this.simulator.spells.aurora.isSelected = false;
                    this.simulator.spells.aurora.selectedID = null;
                }
                // Update spell UI
                Object.values(this.simulator.spells).forEach((spellOpts, i) => {
                    if (spellOpts.isSelected) {
                        this.app.selectButton(document.getElementById(`MCS ${spellOpts.array[spellOpts.selectedID].name} Button`));
                        this.app.spellTabOnClick(i);
                    }
                });
            }

            importPrayers(prayerSelected) {
                // Update prayers
                this.simulator.activePrayers = 0;
                for (let i = 0; i < PRAYER.length; i++) {
                    const prayButton = document.getElementById(`MCS ${this.app.getPrayerName(i)} Button`);
                    if (prayerSelected[i]) {
                        this.app.selectButton(prayButton);
                        this.simulator.prayerSelected[i] = true;
                        this.simulator.activePrayers++;
                    } else {
                        this.app.unselectButton(prayButton);
                        this.simulator.prayerSelected[i] = false;
                    }
                }
            }

            importPotion(potionID, potionTier) {
                // Deselect potion if selected
                if (this.simulator.potionSelected) {
                    this.app.unselectButton(document.getElementById(`MCS ${this.app.getPotionName(this.simulator.potionID)} Button`));
                    this.simulator.potionSelected = false;
                    this.simulator.potionID = -1;
                }
                // Select new potion if applicable
                if (potionID !== -1) {
                    this.simulator.potionSelected = true;
                    this.simulator.potionID = potionID;
                    this.app.selectButton(document.getElementById(`MCS ${this.app.getPotionName(this.simulator.potionID)} Button`));
                }
                // Set potion tier if applicable
                if (potionTier !== -1) {
                    this.simulator.potionTier = potionTier;
                    this.app.updatePotionTier(potionTier);
                    // Set dropdown to correct option
                    document.getElementById('MCS Potion Tier Dropdown').selectedIndex = potionTier;
                }
            }

            importPets(petOwned) {
                // Import PETS
                petOwned.forEach((owned, petID) => {
                    this.simulator.petOwned[petID] = owned;
                    if (this.app.combatPetsIds.includes(petID)) {
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
                this.simulator.autoEatTier = autoEatTier;
                document.getElementById('MCS Auto Eat Tier Dropdown').selectedIndex = autoEatTier + 1;
                this.app.equipFood(foodSelected);
                if (cookingPool) {
                    this.simulator.cookingPool = true;
                    document.getElementById('MCS 95% Pool: +10% Radio Yes').checked = true;
                } else {
                    this.simulator.cookingPool = false;
                    document.getElementById('MCS 95% Pool: +10% Radio No').checked = true;
                }
                if (cookingMastery) {
                    this.simulator.cookingMastery = true;
                    document.getElementById('MCS 99 Mastery: +20% Radio Yes').checked = true;
                } else {
                    this.simulator.cookingMastery = false;
                    document.getElementById('MCS 99 Mastery: +20% Radio No').checked = true;
                }
            }

            importHardCore(isHardcore) {
                // Update hardcore mode
                if (isHardcore) {
                    this.simulator.isHardcore = true;
                    document.getElementById('MCS Hardcore Mode Radio Yes').checked = true;
                } else {
                    this.simulator.isHardcore = false;
                    document.getElementById('MCS Hardcore Mode Radio No').checked = true;
                }
            }
        }
    }

    MICSR.waitLoadOrder(reqs, setup, 'Import')

})();