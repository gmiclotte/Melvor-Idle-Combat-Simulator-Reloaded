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
        'util',
        'statNames',
        'Card',
        'CombatData',
        'Import',
        'Plotter',
        'Loot',
        'Menu',
        'modifierNames',
        'Simulator',
        'TabCard',
    ];

    const setup = () => {

        const MICSR = window.MICSR;

        /**
         * Container Class for the Combat Simulator.
         * A single instance of this is initiated on load.
         */
        MICSR.App = class {
            /**
             * Constructs an instance of mcsApp
             * @param {Object} urls URLs from content script
             * @param {string} urls.simulationWorker URL for simulator script
             * @param {string} urls.crossedOut URL for crossed out svg
             */
            constructor(urls) {
                // slayer tasks
                this.slayerTasks = [
                    SLAYER.task.Easy,
                    SLAYER.task.Normal,
                    SLAYER.task.Hard,
                    SLAYER.task.Elite,
                    SLAYER.task.Master,
                ];
                // Plot Type Options
                this.plotTypes = [];
                const addPlotOption = (option, isTime, value, info) => {
                    this.plotTypes.push({
                        option: option,
                        isTime: isTime,
                        value: value,
                        info: info,
                    });
                }
                // xp gains
                addPlotOption('XP per ', true, 'xpPerSecond', 'XP/');
                addPlotOption('HP XP per ', true, 'hpXpPerSecond', 'HP XP/');
                addPlotOption('Prayer XP per ', true, 'prayerXpPerSecond', 'Prayer XP/');
                addPlotOption('Slayer XP per ', true, 'slayerXpPerSecond', 'Slayer XP/');
                // resource loss
                addPlotOption('Prayer Points per ', true, 'ppConsumedPerSecond', 'Prayer Points/');
                addPlotOption('Ammo per ', true, 'ammoUsedPerSecond', 'Ammo/');
                addPlotOption('Runes per ', true, 'runesUsedPerSecond', 'Runes/');
                addPlotOption('Combination Runes per ', true, 'combinationRunesUsedPerSecond', 'Comb. Runes/');
                addPlotOption('Potions per ', true, 'potionsUsedPerSecond', 'Potions/');
                addPlotOption('Food per', true, 'atePerSecond', 'Food/');
                addPlotOption('HP Loss per ', true, 'hpPerSecond', 'HP Lost/');
                // survivability
                addPlotOption('Estimated Death Rate', false, 'deathRate', 'Est. Death Rate');
                addPlotOption('Highest Hit Taken', false, 'highestDamageTaken', 'Highest Hit Taken');
                addPlotOption('Lowest Hitpoints', false, 'lowestHitpoints', 'Lowest Hitpoints');
                // kill time
                addPlotOption('Average Kill Time (s)', false, 'killTimeS', 'Kill Time(s)');
                addPlotOption('Kills per ', true, 'killsPerSecond', 'Kills/');
                // loot gains
                addPlotOption('GP per ', true, 'gpPerSecond', 'GP/');
                addPlotOption('Drops per', true, 'dropChance', 'Drops/');
                addPlotOption('Chance for Signet Part B(%)', false, 'signetChance', 'Signet Chance (%)');
                addPlotOption('Pet Chance per ', true, 'petChance', ' Pet Chance/');
                addPlotOption('Potential Herblore XP per ', true, 'herbloreXPPerSecond', 'Potential Herb XP/');
                addPlotOption('Slayer Coins per ', true, 'slayerCoinsPerSecond', 'Slayer Coins/');
                // unsorted
                addPlotOption('XP per Attack', false, 'xpPerHit', 'XP/attack');
                addPlotOption('Damage per ', true, 'dmgPerSecond', 'Damage/');
                addPlotOption('Damage per Attack', false, 'avgHitDmg', 'Damage/attack');
                addPlotOption('Attacks Made per ', true, 'attacksMadePerSecond', 'Attacks Made/');
                addPlotOption('Attacks Taken per ', true, 'attacksTakenPerSecond', 'Attacks Taken/');
                // addPlotOption('Simulation Time', false, 'simulationTime', 'Sim Time');
                // Time unit options
                this.timeOptions = ['Kill', 'Second', 'Minute', 'Hour', 'Day'];
                this.timeShorthand = ['kill', 's', 'm', 'h', 'd'];
                this.timeMultipliers = [-1, 1, 60, 3600, 3600 * 24];
                this.initialTimeUnitIndex = 3;
                this.selectedTimeUnit = this.timeOptions[this.initialTimeUnitIndex];
                this.selectedTimeShorthand = this.timeShorthand[this.initialTimeUnitIndex];
                this.timeMultiplier = this.timeMultipliers[this.initialTimeUnitIndex];
                // empty items
                const makeEmptyItem = (img) => {
                    return {
                        name: 'None',
                        itemID: 0,
                        media: img,
                        defenceLevelRequired: 0,
                        magicLevelRequired: 0,
                        rangedLevelRequired: 0,
                    }
                };
                this.emptyItems = {
                    Helmet: makeEmptyItem('assets/media/bank/armour_helmet.svg'),
                    Platebody: makeEmptyItem('assets/media/bank/armour_platebody.svg'),
                    Platelegs: makeEmptyItem('assets/media/bank/armour_platelegs.svg'),
                    Boots: makeEmptyItem('assets/media/bank/armour_boots.svg'),
                    Weapon: makeEmptyItem('assets/media/bank/weapon_sword.svg'),
                    Shield: makeEmptyItem('assets/media/bank/armour_shield.svg'),
                    Amulet: makeEmptyItem('assets/media/bank/misc_amulet.svg'),
                    Ring: makeEmptyItem('assets/media/bank/misc_ring.svg'),
                    Gloves: makeEmptyItem('assets/media/bank/armour_gloves.svg'),
                    Quiver: makeEmptyItem('assets/media/bank/weapon_quiver.svg'),
                    Cape: makeEmptyItem('assets/media/bank/armour_cape.svg'),
                    Passive: makeEmptyItem('assets/media/bank/passive_slot.svg'),
                    Summon: makeEmptyItem('assets/media/bank/misc_summon.svg'),
                    SummonRight: makeEmptyItem('assets/media/bank/misc_summon.svg'),
                };

                // Useful assets
                this.media = {
                    combat: 'assets/media/skills/combat/combat.svg',
                    slayer: 'assets/media/skills/slayer/slayer.svg',
                    prayer: 'assets/media/skills/prayer/prayer.svg',
                    spellbook: 'assets/media/skills/combat/spellbook.svg',
                    curse: 'assets/media/skills/combat/curses.svg',
                    aurora: 'assets/media/skills/combat/auroras.svg',
                    ancient: 'assets/media/skills/combat/ancient.svg',
                    emptyPotion: 'assets/media/skills/herblore/potion_empty.svg',
                    pet: 'assets/media/pets/hitpoints.png',
                    settings: 'assets/media/main/settings_header.svg',
                    gp: 'assets/media/main/coins.svg',
                    attack: 'assets/media/skills/combat/attack.svg',
                    strength: 'assets/media/skills/combat/strength.svg',
                    ranged: 'assets/media/skills/ranged/ranged.svg',
                    magic: 'assets/media/skills/magic/magic.svg',
                    defence: 'assets/media/skills/defence/defence.svg',
                    hitpoints: 'assets/media/skills/hitpoints/hitpoints.svg',
                    emptyFood: 'assets/media/skills/combat/food_empty.svg',
                    agility: 'assets/media/skills/agility/agility.svg',
                    mastery: 'assets/media/main/mastery_header.svg',
                    statistics: 'assets/media/main/statistics_header.svg',
                    loot: 'assets/media/bank/chapeau_noir.svg',
                    summoning: 'assets/media/skills/summoning/summoning.svg',
                };

                // Forced equipment sorting
                this.forceMeleeArmour = [CONSTANTS.item.Slayer_Helmet_Basic, CONSTANTS.item.Slayer_Platebody_Basic];
                this.forceRangedArmour = [CONSTANTS.item.Slayer_Cowl_Basic, CONSTANTS.item.Slayer_Leather_Body_Basic];
                this.forceMagicArmour = [CONSTANTS.item.Slayer_Wizard_Hat_Basic, CONSTANTS.item.Slayer_Wizard_Robes_Basic, CONSTANTS.item.Enchanted_Shield];

                // Generate equipment subsets
                this.equipmentSlotKeys = Object.keys(MICSR.equipmentSlot);
                this.equipmentSubsets = [];
                /** @type {number[]} */
                this.equipmentSelected = [];
                for (let equipmentSlot = 0; equipmentSlot < this.equipmentSlotKeys.length; equipmentSlot++) {
                    const slotId = MICSR.equipmentSlot[this.equipmentSlotKeys[equipmentSlot]];
                    this.equipmentSubsets.push([this.emptyItems[this.equipmentSlotKeys[equipmentSlot]]]);
                    this.equipmentSelected.push(0);
                    for (let i = 0; i < items.length; i++) {
                        if (i === CONSTANTS.item.Candy_Cane) {
                            continue;
                        }
                        if (items[i].equipmentSlot === slotId
                            || (items[i].equipmentSlot === MICSR.equipmentSlot.Summon
                                && slotId === MICSR.equipmentSlot.SummonRight)) {
                            this.equipmentSubsets[equipmentSlot].push(items[i]);
                        }
                    }
                }
                this.equipmentSubsets[MICSR.equipmentSlot.Passive].push(...items.filter(x => x.isPassiveItem));
                // Add ammoType 2 and 3 to weapon subsets
                for (let i = 0; i < items.length; i++) {
                    if (items[i].equipmentSlot === MICSR.equipmentSlot.Quiver && (items[i].ammoType === 2 || items[i].ammoType === 3)) {
                        this.equipmentSubsets[MICSR.equipmentSlot.Weapon].push(items[i]);
                    }
                }
                // Sort equipment subsets
                for (let equipmentSlot = 0; equipmentSlot < this.equipmentSlotKeys.length; equipmentSlot++) {
                    this.equipmentSubsets[equipmentSlot].sort((a, b) => (a.attackLevelRequired || 0) - (b.attackLevelRequired || 0));
                    this.equipmentSubsets[equipmentSlot].sort((a, b) => (a.defenceLevelRequired || 0) - (b.defenceLevelRequired || 0));
                    this.equipmentSubsets[equipmentSlot].sort((a, b) => (a.rangedLevelRequired || 0) - (b.rangedLevelRequired || 0));
                    this.equipmentSubsets[equipmentSlot].sort((a, b) => (a.magicLevelRequired || 0) - (b.magicLevelRequired || 0));
                    if (equipmentSlot === MICSR.equipmentSlot.Quiver) {
                        this.equipmentSubsets[equipmentSlot].sort((a, b) => (a.ammoType || 0) - (b.ammoType || 0));
                    }
                }
                this.skillKeys = ['Attack', 'Strength', 'Defence', 'Hitpoints', 'Ranged', 'Magic', 'Prayer', 'Slayer'];
                this.skillShorthand = {
                    Attack: 'Att.',
                    Strength: 'Str.',
                    Defence: 'Def.',
                    Hitpoints: 'HP',
                    Ranged: 'Ran.',
                    Magic: 'Mag.',
                    Prayer: 'Pra.',
                    Slayer: 'Sla.',
                };
                // Combat Data Object
                this.combatData = new MICSR.CombatData(this.equipmentSelected, this.equipmentSlotKeys);
                // Simulation Object
                this.simulator = new MICSR.Simulator(this, urls.simulationWorker);
                // Import Object
                this.import = new MICSR.Import(this);
                // Loot Object
                this.loot = new MICSR.Loot(this, this.simulator);
                // Temporary GP/s settings variable
                this.itemSubsetTemp = [];

                // drop list filters
                this.dropListFilters = {
                    selectedMonster: false,
                    onlyUndiscovered: false,
                }

                // verbose settings
                this.verbose = false;
                this.veryVerbose = false;

                // Create the top container for the sim
                this.topContent = document.createElement('div');
                this.topContent.className = 'mcsTabContent';
                // Create the bottom container for the sim
                this.botContent = document.createElement('div');
                this.botContent.className = 'mcsTabContent';
                this.botContent.style.flexWrap = 'nowrap';
                this.botContent.style.minHeight = '452px';

                // Plotter Object
                this.plotter = new MICSR.Plotter(this, urls.crossedOut);

                // Add Equipment and Food selection card
                this.createEquipmentSelectCard();
                // Add tab card
                this.mainTabCard = new MICSR.TabCard('mcsMainTab', true, this.topContent, '', '150px', true);

                // Add Cards to the tab card
                this.createLevelSelectCard();
                this.createSpellSelectCards();
                this.createPrayerSelectCard();
                this.createPotionSelectCard();
                this.createPetSelectCard();
                this.createAgilitySelectCard();
                this.createLootOptionsCard();
                this.createGPOptionsCard();
                this.createEquipmentStatCard();
                this.createSimulationAndExportCard();
                this.createCompareCard();
                // Add Combat Stat Display Card
                this.createCombatStatDisplayCard();
                // Individual simulation info card
                this.createIndividualInfoCard();

                // Bar Chart Card
                this.monsterToggleState = true;
                this.dungeonToggleState = true;
                this.slayerToggleState = true;
                // Setup plotter bar clicking
                this.selectedBar = 0;
                this.barSelected = false;
                for (let i = 0; i < this.plotter.bars.length; i++) {
                    this.plotter.bars[i].parentElement.onclick = (() => this.barOnClick(i));
                }
                /** @type {number[]} */
                this.barMonsterIDs = [];
                /** @type {boolean[]} */
                this.barType = [];
                this.barTypes = {
                    monster: 0,
                    dungeon: 1,
                    task: 2,
                }

                combatAreas.forEach((area) => {
                    area.monsters.forEach((monster) => {
                        this.barMonsterIDs.push(monster);
                        this.barType.push(this.barTypes.monster);
                    });
                });
                const bardID = 139;
                this.barMonsterIDs.push(bardID);
                this.barType.push(this.barTypes.monster);
                slayerAreas.forEach((area) => {
                    area.monsters.forEach((monster) => {
                        this.barMonsterIDs.push(monster);
                        this.barType.push(this.barTypes.monster);
                    });
                });
                /** @type {number[]} */
                this.dungeonBarIDs = [];
                for (let i = 0; i < DUNGEONS.length; i++) {
                    this.dungeonBarIDs.push(this.barMonsterIDs.length);
                    this.barMonsterIDs.push(i);
                    this.barType.push(this.barTypes.dungeon);
                }
                for (let i = 0; i < this.slayerTasks.length; i++) {
                    this.dungeonBarIDs.push(this.barMonsterIDs.length);
                    this.barMonsterIDs.push(DUNGEONS.length + i);
                    this.barType.push(this.barTypes.task);
                }
                // Dungeon View Variables
                this.isViewingDungeon = false;
                this.viewedDungeonID = -1;

                // Now that everything is done we add the menu and modal to the document

                this.modalID = 'mcsModal';
                MICSR.addModal(`Combat Simulator Reloaded ${MICSR.version}`, this.modalID, [this.topContent, this.botContent]);
                this.menuItemId = 'mcsButton';
                MICSR.addMenuItem('Combat Simulator', this.media.combat, this.menuItemId, this.modalID);

                // Finalize tooltips
                const tippyOptions = {allowHTML: true, animation: false, hideOnClick: false};
                this.tippyInstances = tippy('#mcsModal [data-tippy-content]', tippyOptions);
                this.plotter.bars.forEach((bar) => {
                    this.tippyInstances.concat(tippy(bar, {triggerTarget: bar.parentElement, ...tippyOptions}));
                });
                this.tippySingleton = tippy.createSingleton(this.tippyInstances, {delay: [0, 200], ...tippyOptions});

                // Setup the default state of the UI
                this.gpOptionsCard.container.style.display = 'none';
                this.exportOptionsCard.outerContainer.style.display = 'none';
                this.plotter.timeDropdown.selectedIndex = this.initialTimeUnitIndex;
                document.getElementById('MCS Edit Subset Button').style.display = 'none';
                this.subInfoCard.container.style.display = 'none';
                this.plotter.petSkillDropdown.style.display = 'none';
                document.getElementById(`MCS  Pet Chance/${this.timeShorthand[this.initialTimeUnitIndex]} Label`).textContent = this.skillShorthand[this.loot.petSkill] + ' Pet Chance/' + this.selectedTimeShorthand;
                this.updateSpellOptions();
                this.updatePrayerOptions();
                // Set up spells
                const standardOpts = this.combatData.spells.standard;
                this.selectButton(document.getElementById(`MCS ${standardOpts.array[standardOpts.selectedID].name} Button`));
                this.updateEquipmentStats();
                this.updateCombatStats();
                this.updatePlotData();
                // Saving and loading of Gear Sets
                this.gearSets = [];
                // slayer sim is off by default, so toggle auto slayer off
                this.toggleSlayerSims();
            }

            showRelevantModifiers(modifiers, text) {
                let passives = `<h5 class=\"font-w600 font-size-sm mb-1 text-combat-smoke\">${text}</h5><h5 class=\"font-w600 font-size-sm mb-3 text-warning\"></h5>`;
                MICSR.showModifiersInstance.printRelevantModifiers(modifiers, 'combat').forEach(toPrint => {
                    passives += `<h5 class=\"font-w400 font-size-sm mb-1 ${toPrint[1]}\">${toPrint[0]}</h5>`;
                });
                Swal.fire({
                    html: passives,
                });
            }

            createEquipmentSelectCard() {
                this.equipmentSelectCard = new MICSR.Card(this.topContent, '', '150px', true);
                const equipmentRows = [
                    [MICSR.equipmentSlot.Passive, MICSR.equipmentSlot.Helmet],
                    [MICSR.equipmentSlot.Cape, MICSR.equipmentSlot.Amulet, MICSR.equipmentSlot.Quiver],
                    [MICSR.equipmentSlot.Weapon, MICSR.equipmentSlot.Platebody, MICSR.equipmentSlot.Shield],
                    [MICSR.equipmentSlot.Platelegs],
                    [MICSR.equipmentSlot.Gloves, MICSR.equipmentSlot.Boots, MICSR.equipmentSlot.Ring],
                    [MICSR.equipmentSlot.Summon, MICSR.equipmentSlot.SummonRight]
                ];
                equipmentRows.forEach((row) => {
                    const rowSources = [];
                    const rowIDs = [];
                    const rowPopups = [];
                    const tooltips = [];
                    row.forEach((equipmentSlot) => {
                        if (!this.emptyItems[this.equipmentSlotKeys[equipmentSlot]]) {
                            console.log(MICSR.equipmentSlot)
                            console.log(this.emptyItems)
                            console.log(this.equipmentSlotKeys)
                            console.log(equipmentSlot)
                            console.log(this.equipmentSlotKeys[equipmentSlot])
                            console.log(this.emptyItems[this.equipmentSlotKeys[equipmentSlot]])
                        }
                        rowSources.push(this.emptyItems[this.equipmentSlotKeys[equipmentSlot]].media);
                        rowIDs.push(`MCS ${this.equipmentSlotKeys[equipmentSlot]} Image`);
                        rowPopups.push(this.createEquipmentPopup(equipmentSlot));
                        tooltips.push(this.equipmentSlotKeys[equipmentSlot]);
                    });
                    this.equipmentSelectCard.addMultiPopupMenu(rowSources, rowIDs, rowPopups, tooltips);
                });
                this.equipmentSelectCard.addToggleRadio(
                    'Activate Synergy',
                    'summoningSynergy',
                    this.combatData,
                    'summoningSynergy',
                    this.combatData.summoningSynergy,
                );
                // Style dropdown (Specially Coded)
                const combatStyleCCContainer = this.equipmentSelectCard.createCCContainer();
                const combatStyleLabel = this.equipmentSelectCard.createLabel('Combat Style', '');
                combatStyleLabel.classList.add('mb-1');
                const meleeStyleDropdown = this.equipmentSelectCard.createDropdown(['Stab', 'Slash', 'Block'], [0, 1, 2], 'MCS Melee Style Dropdown', (event) => this.styleDropdownOnChange(event, 'Melee'));
                const rangedStyleDropdown = this.equipmentSelectCard.createDropdown(['Accurate', 'Rapid', 'Longrange'], [0, 1, 2], 'MCS Ranged Style Dropdown', (event) => this.styleDropdownOnChange(event, 'Ranged'));
                const magicStyleDropdown = this.equipmentSelectCard.createDropdown(['Magic', 'Defensive'], [0, 1], 'MCS Magic Style Dropdown', (event) => this.styleDropdownOnChange(event, 'Magic'));
                rangedStyleDropdown.style.display = 'none';
                magicStyleDropdown.style.display = 'none';
                combatStyleCCContainer.appendChild(combatStyleLabel);
                combatStyleCCContainer.appendChild(meleeStyleDropdown);
                combatStyleCCContainer.appendChild(rangedStyleDropdown);
                combatStyleCCContainer.appendChild(magicStyleDropdown);
                this.equipmentSelectCard.container.appendChild(combatStyleCCContainer);
                // food container
                const foodCCContainer = this.equipmentSelectCard.createCCContainer();
                // food card
                const containerDiv = document.createElement('div');
                containerDiv.style.position = 'relative';
                containerDiv.style.cursor = 'pointer';
                const newImage = document.createElement('img');
                newImage.id = 'MCS Food Image';
                newImage.style.border = '1px solid red';
                newImage.src = this.media.emptyFood;
                newImage.className = 'combat-food';
                newImage.dataset.tippyContent = 'No Food';
                newImage.dataset.tippyHideonclick = 'true';
                containerDiv.appendChild(newImage);
                const foodPopup = (() => {
                    const foodSelectPopup = document.createElement('div');
                    foodSelectPopup.className = 'mcsPopup';
                    const equipmentSelectCard = new MICSR.Card(foodSelectPopup, '', '600px');
                    equipmentSelectCard.addSectionTitle('Food');
                    const menuItems = items.filter((item) => this.filterIfHasKey('healsFor', item));
                    menuItems.sort((a, b) => b.healsFor - a.healsFor);
                    const buttonMedia = menuItems.map((item) => {
                        if (item.itemID === 0) {
                            return this.media.emptyFood;
                        }
                        return item.media;
                    });
                    const buttonIds = menuItems.map((item) => this.getItemName(item.itemID));
                    const buttonCallbacks = menuItems.map((item) => () => this.equipFood(item.itemID));
                    const tooltips = menuItems.map((item) => this.getFoodTooltip(item));
                    equipmentSelectCard.addImageButtons(buttonMedia, buttonIds, 'Small', buttonCallbacks, tooltips, '100%');
                    return foodSelectPopup;
                })();
                containerDiv.appendChild(foodPopup);
                foodCCContainer.appendChild(containerDiv);
                foodPopup.style.display = 'none';
                this.equipmentSelectCard.registerPopupMenu(containerDiv, foodPopup);
                // auto eat dropdown
                let autoEatTierNames = ['Manual Eating'];
                let autoEatTierValues = [-1];
                for (let i = 0; i < this.combatData.autoEatData.length; i++) {
                    autoEatTierNames.push(this.combatData.autoEatData[i].name);
                    autoEatTierValues.push(i);
                }
                const autoEatTierDropdown = this.equipmentSelectCard.createDropdown(autoEatTierNames, autoEatTierValues, 'MCS Auto Eat Tier Dropdown', (event) => {
                    this.combatData.autoEatTier = parseInt(event.currentTarget.selectedOptions[0].value);
                    this.updateCombatStats();
                });
                foodCCContainer.appendChild(autoEatTierDropdown);
                this.equipmentSelectCard.container.appendChild(foodCCContainer);
                // cooking mastery
                this.equipmentSelectCard.addToggleRadio(
                    '95% Cooking Pool',
                    'cookingPool',
                    this.combatData,
                    'cookingPool',
                );
                this.equipmentSelectCard.addToggleRadio(
                    '99 Cooking Mastery',
                    'cookingMastery',
                    this.combatData,
                    'cookingMastery',
                );
                // Slayer task and hardcore mode
                this.equipmentSelectCard.addRadio('Slayer Task', 25, 'slayerTask', ['Yes', 'No'], [(e) => this.slayerTaskRadioOnChange(e, true), (e) => this.slayerTaskRadioOnChange(e, false)], 1);
                this.equipmentSelectCard.addToggleRadio(
                    'Hardcore Mode',
                    'hardcore',
                    this.combatData,
                    'isHardcore',
                );
                this.equipmentSelectCard.addToggleRadio(
                    'Adventure Mode',
                    'adventure',
                    this.combatData,
                    'isAdventure',
                    false, // default
                    25, // default
                    () => this.updateCombatStats(),
                );
                this.equipmentSelectCard.addToggleRadio(
                    'Apply Enemy Stun Dmg',
                    'stunsleep',
                    this.combatData,
                    'applyEnemyStunSleepDamage',
                    this.combatData.applyEnemyStunSleepDamage, // default
                    25, // default
                    () => {
                    },
                );
                // import equipment and settings
                const importSetCCContainer = this.equipmentSelectCard.createCCContainer();
                importSetCCContainer.appendChild(this.equipmentSelectCard.createLabel('Import Set', ''));
                this.equipmentSelectCard.addMultiButton(['1', '2', '3'], [() => this.import.importButtonOnClick(0), () => this.import.importButtonOnClick(1), () => this.import.importButtonOnClick(2)], importSetCCContainer);
                this.equipmentSelectCard.container.appendChild(importSetCCContainer);
                // add button to show all modifiers
                const modifierCCContainer = this.equipmentSelectCard.createCCContainer();
                modifierCCContainer.appendChild(this.equipmentSelectCard.addButton('Show Modifiers', () => this.showRelevantModifiers(this.combatData.modifiers, 'Active modifiers')));
                this.equipmentSelectCard.container.appendChild(modifierCCContainer);
            }

            equipFood(itemID) {
                this.combatData.foodSelected = itemID;
                const img = document.getElementById('MCS Food Image');
                if (itemID === 0) {
                    img.src = 'assets/media/skills/combat/food_empty.svg';
                    img.style.border = '1px solid red';
                } else {
                    img.src = items[itemID].media;
                    img.style.border = '';
                }
                img._tippy.setContent(this.getFoodTooltip(items[itemID]));
            }

            getFoodTooltip(item) {
                if (!item || item.itemID === 0) {
                    return 'No Food';
                }
                let tooltip = `<div class="text-center">${item.name}<br><small>`;
                if (item.description) {
                    tooltip += `<span class='text-info'>${item.description.replace(/<br>\(/, ' (')}</span><br>`;
                }
                if (item.healsFor) {
                    const amt = item.healsFor * numberMultiplier;
                    tooltip += `<h5 class="font-w400 font-size-sm text-left text-combat-smoke m-1 mb-2">Heals for: <img class="skill-icon-xs mr-1" src="${this.media.hitpoints}"><span class="text-bank-desc">+${amt} HP</span></h5>`;
                }
                tooltip += '</small></div>';
                return tooltip;
            }

            createCombatStatDisplayCard() {
                this.combatStatCard = new MICSR.Card(this.topContent, '', '60px', true);
                this.combatStatCard.addSectionTitle('Combat Stats');
                const combatStatNames = [
                    'Attack Speed',
                    'Min Hit',
                    'Max Hit',
                    'Accuracy Rating',
                    'Evasion Rating',
                    'Evasion Rating',
                    'Evasion Rating',
                    'Max Hitpoints',
                    'Damage Reduction',
                    'Drop Doubling (%)',
                    'GP Multiplier',
                ];
                const combatStatIcons = [
                    '',
                    '',
                    '',
                    '',
                    this.media.attack,
                    this.media.ranged,
                    this.media.magic,
                    '',
                    '',
                    '',
                    '',
                ];
                this.combatStatKeys = [
                    'attackSpeed',
                    'minHit',
                    'maxHit',
                    'maxAttackRoll',
                    'maxDefRoll',
                    'maxRngDefRoll',
                    'maxMagDefRoll',
                    'maxHitpoints',
                    'damageReduction',
                    'lootBonusPercent',
                    'gpBonus',
                ];
                for (let i = 0; i < combatStatNames.length; i++) {
                    this.combatStatCard.addNumberOutput(combatStatNames[i], 0, 20, (combatStatIcons[i] !== '') ? combatStatIcons[i] : '', `MCS ${this.combatStatKeys[i]} CS Output`);
                }
                this.combatStatCard.addSectionTitle('Plot Options');
                this.plotter.addToggles(this.combatStatCard);
                this.combatStatCard.addSectionTitle('');
                this.combatStatCard.addButton('Simulate', () => this.simulateButtonOnClick());
            }

            createIndividualInfoCard() {
                this.zoneInfoCard = new MICSR.Card(this.topContent, '', '100px', true);
                this.zoneInfoCard.addSectionTitle('Monster/Dungeon Info.', 'MCS Zone Info Title');
                this.infoPlaceholder = this.zoneInfoCard.addInfoText('Click on a bar for detailed information on a Monster/Dungeon!');
                this.subInfoCard = new MICSR.Card(this.zoneInfoCard.container, '', '80px');
                this.subInfoCard.addImage(this.media.combat, 48, 'MCS Info Image');
                const zoneInfoLabelNames = [];
                for (let i = 0; i < this.plotTypes.length; i++) {
                    if (this.plotTypes[i].isTime) {
                        zoneInfoLabelNames.push(this.plotTypes[i].info + this.selectedTimeShorthand);
                    } else {
                        zoneInfoLabelNames.push(this.plotTypes[i].info);
                    }
                }
                for (let i = 0; i < this.plotTypes.length; i++) {
                    this.subInfoCard.addNumberOutput(zoneInfoLabelNames[i], 'N/A', 20, '', `MCS ${this.plotTypes[i].value} Output`, true);
                }
            }

            createLevelSelectCard() {
                this.levelSelectCard = this.mainTabCard.addTab('Levels', this.media.combat, '', '150px');
                this.levelSelectCard.addSectionTitle('Player Levels');
                this.skillKeys.forEach((skillName) => {
                    let minLevel = 1;
                    if (skillName === 'Hitpoints') {
                        minLevel = 10;
                    }
                    this.levelSelectCard.addNumberInput(skillName, minLevel, minLevel, Infinity, (event) => this.levelInputOnChange(event, skillName));
                });
            }

            createSpellSelectCards() {
                this.spellSelectCard = this.mainTabCard.addPremadeTab(
                    'Spells',
                    this.media.spellbook,
                    new MICSR.TabCard('', false, this.mainTabCard.container, '100%', '150px'),
                );
                // add title for spellbook tab
                this.spellSelectCard.addSectionTitle('Spells');
                // add tab menu, it was not yet created in the constructor
                this.spellSelectCard.addTabMenu();

                // add spell books
                this.spellSelectCard.addPremadeTab(
                    'Standard',
                    this.media.spellbook,
                    this.createSpellSelectCard('Standard Magic', 'standard'),
                );
                this.spellSelectCard.addPremadeTab(
                    'Curses',
                    this.media.curse,
                    this.createSpellSelectCard('Curses', 'curse'),
                );
                this.spellSelectCard.addPremadeTab(
                    'Auroras',
                    this.media.aurora,
                    this.createSpellSelectCard('Auroras', 'aurora'),
                );
                this.spellSelectCard.addPremadeTab(
                    'Ancient Magicks',
                    this.media.ancient,
                    this.createSpellSelectCard('Ancient Magicks', 'ancient'),
                );

                // add combination rune toggle
                this.spellSelectCard.addToggleRadio(
                    'Use Combination Runes',
                    'combinationRunes',
                    this.combatData,
                    'useCombinationRunes',
                );
            }

            /**
             * Creates a card for selecting spells
             * @param {string} title The title of the card
             * @param {string} spellType The type of spells to generate the select menu for
             * @return {Card} The created spell select card
             */
            createSpellSelectCard(title, spellType) {
                const newCard = new MICSR.Card(this.spellSelectCard.container, '', '100px');
                newCard.addSectionTitle(title);
                const spells = this.combatData.spells[spellType].array;
                const spellImages = spells.map((spell) => spell.media);
                const spellNames = spells.map((spell) => spell.name);
                const spellCallbacks = spells.map((_, spellID) => (event) => this.spellButtonOnClick(event, spellID, spellType));
                const tooltips = spells.map((spell) => {
                    let tooltip = `<div class="text-center">${spell.name}<br><small><span class="text-info">`;
                    switch (spellType) {
                        case 'standard':
                            tooltip += `Spell Damage: ${spell.maxHit * numberMultiplier}`;
                            break;
                        case 'aurora':
                            tooltip += spell.description.replace(/^.*?<br>/, '');
                            break;
                        default:
                            tooltip += spell.description;
                    }
                    const runes = spell.runesRequired.map((rune) => `${rune.qty}${this.getTooltipIcon(items[rune.id].media)}`).join(' ');
                    tooltip += `</span><br><span class="text-warning">Requires:</span><br>${runes}</small></div>`;
                    return tooltip;
                });
                newCard.addImageButtons(spellImages, spellNames, 'Medium', spellCallbacks, tooltips);
                return newCard;
            }

            createPrayerSelectCard() {
                this.prayerSelectCard = this.mainTabCard.addTab('Prayers', this.media.prayer, '', '100px');
                this.prayerSelectCard.addSectionTitle('Prayers');
                const prayerSources = [];
                const prayerNames = [];
                const prayerCallbacks = [];
                for (let i = 0; i < PRAYER.length; i++) {
                    prayerSources.push(PRAYER[i].media);
                    prayerNames.push(this.getPrayerName(i));
                    prayerCallbacks.push((e) => this.prayerButtonOnClick(e, i));
                }

                const tooltips = [];
                PRAYER.forEach((prayer) => {
                    let tooltip = `<div class="text-center">${prayer.name}<br><small><span class='text-info'>`;
                    tooltip += prayer.description;
                    tooltip += '<br></span>';
                    if (prayer.pointsPerPlayer > 0) {
                        tooltip += `<span class='text-success'>+${(2 / numberMultiplier * prayer.pointsPerPlayer).toFixed(2)} Prayer XP per damage dealt to enemy</span><br>`;
                    }
                    tooltip += '<span class="text-warning">Prayer Point Cost:</span><br><span class="text-info">';
                    if (prayer.pointsPerPlayer > 0) {
                        tooltip += `${prayer.pointsPerPlayer}</span> per <span class='text-success'>PLAYER</span> attack`;
                    }
                    if (prayer.pointsPerEnemy > 0) {
                        tooltip += `${prayer.pointsPerEnemy}</span> per <span class='text-danger'>ENEMY</span> attack`;
                    }
                    if (prayer.pointsPerRegen > 0) {
                        tooltip += `${prayer.pointsPerRegen}</span> per <span class='text-info'>HP REGEN</span>`;
                    }
                    tooltip += '</small></div>';
                    tooltips.push(tooltip);
                });
                this.prayerSelectCard.addImageButtons(prayerSources, prayerNames, 'Medium', prayerCallbacks, tooltips);
            }

            createPotionSelectCard() {
                this.potionSelectCard = this.mainTabCard.addTab('Potions', this.media.emptyPotion, '', '100px');
                this.potionSelectCard.addSectionTitle('Potions');
                this.potionSelectCard.addDropdown('Potion Tier', ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'], [0, 1, 2, 3], (e) => this.potionTierDropDownOnChange(e));
                const potionSources = [];
                const potionNames = [];
                const potionCallbacks = [];
                const tooltips = [];
                /** @type {number[]} */
                this.combatPotionIDs = [];
                for (let i = 0; i < herbloreItemData.length; i++) {
                    if (herbloreItemData[i].category === 0) {
                        const potion = items[herbloreItemData[i].itemID[0]];
                        potionSources.push(potion.media);
                        potionNames.push(this.getPotionName(i));
                        potionCallbacks.push((e) => this.potionImageButtonOnClick(e, i));
                        tooltips.push(this.getPotionTooltip(potion));
                        this.combatPotionIDs.push(i);
                    }
                }
                this.potionSelectCard.addImageButtons(potionSources, potionNames, 'Medium', potionCallbacks, tooltips);
            }

            createPetSelectCard() {
                const combatPets = this.combatData.petIds.map(id => PETS[id]);
                this.petSelectCard = this.mainTabCard.addTab('Pets', this.media.pet, '', '100px');
                this.petSelectCard.addSectionTitle('Pets');
                const petImageSources = combatPets.map((pet) => pet.media);
                const petNames = combatPets.map((pet) => pet.name);
                const petButtonCallbacks = this.combatData.petIds.map((petId) => (e) => this.petButtonOnClick(e, petId));
                const tooltips = combatPets.map((pet) => `<div class="text-center">${pet.name}<br><small class='text-info'>${pet.description.replace(/\.$/, '')}</small></div>`);
                this.petSelectCard.addImageButtons(petImageSources, petNames, 'Medium', petButtonCallbacks, tooltips);
                this.petSelectCard.addImage(PETS[4].media, 100, 'MCS Rock').style.display = 'none';
            }

            agilityCourseOnChange(event, position) {
                const idx = parseInt(event.currentTarget.selectedOptions[0].value);
                this.combatData.course[position] = idx;
                this.updateCombatStats();
            }

            agilityPillarOnChange(event) {
                const idx = parseInt(event.currentTarget.selectedOptions[0].value);
                this.combatData.pillar = idx;
                this.updateCombatStats();
            }

            agilityMasteryOnClick(event, position) {
                if (this.combatData.courseMastery[position]) {
                    this.combatData.courseMastery[position] = false;
                    this.unselectButton(event.currentTarget);
                } else {
                    this.combatData.courseMastery[position] = true;
                    this.selectButton(event.currentTarget);
                }
                this.updateCombatStats();
            }

            createAgilitySelectCard() {
                this.agilitySelectCard = this.mainTabCard.addTab('Agility', this.media.agility, '', '100px');
                this.agilitySelectCard.addSectionTitle('Agility Course');

                // Style dropdown (Specially Coded)
                const categories = [];
                for (let i = 0; i < 10; i++) {
                    categories.push([]);
                }
                agilityObstacles.forEach((o, j) =>
                    categories[o.category].push(j)
                );
                let i = 0;
                for (; i < 10; i++) {
                    const idx = i;
                    const dropDownContainer = this.agilitySelectCard.createCCContainer();
                    const masteryButton = this.agilitySelectCard.createImageButton(this.media.mastery, `Agility Mastery ${idx} Toggle`, () => this.agilityMasteryOnClick(event, idx), 'Small', '99 Mastery');
                    dropDownContainer.appendChild(masteryButton);
                    const dropdown = this.agilitySelectCard.createDropdown(
                        ['None'].concat(categories[idx].map(j => agilityObstacles[j].name)),
                        [-1].concat(categories[idx]),
                        `MICSR Agility Obstacle ${idx} Dropdown`,
                        (event) => this.agilityCourseOnChange(event, idx)
                    )
                    dropDownContainer.appendChild(dropdown);
                    this.agilitySelectCard.container.appendChild(dropDownContainer);
                }
                const dropDownContainer = this.agilitySelectCard.createCCContainer();
                const dropdown = this.agilitySelectCard.createDropdown(
                    ['None'].concat(agilityPassivePillars.map(p => p.name)),
                    [-1, 0, 1, 2],
                    `MICSR Agility Pillar Dropdown`,
                    (event) => this.agilityPillarOnChange(event, i)
                )
                dropDownContainer.appendChild(dropdown);
                this.agilitySelectCard.container.appendChild(dropDownContainer);
            }

            createLootOptionsCard() {
                if (!this.lootSelectCard) {
                    this.lootSelectCard = this.mainTabCard.addTab('Loot Options', this.media.loot, '', '150px');
                } else {
                    this.lootSelectCard.clearContainer();
                }
                // drop chance options
                this.lootSelectCard.addSectionTitle('Drop Chance Options');
                this.lootSelectCard.addToggleRadio(
                    'Only Selected Monster',
                    'selectedMonster',
                    this.dropListFilters,
                    'selectedMonster',
                    this.dropListFilters.selectedMonster, // default
                    25, // default
                    () => {
                        this.createLootOptionsCard();
                        this.updatePlotForLoot();
                    },
                );
                this.lootSelectCard.addToggleRadio(
                    'Only Undiscovered',
                    'onlyUndiscovered',
                    this.dropListFilters,
                    'onlyUndiscovered',
                    this.dropListFilters.onlyUndiscovered, // default
                    25, // default
                    () => {
                        this.createLootOptionsCard();
                        this.updatePlotForLoot();
                    },
                );
                const droppedItems = this.buildItemDropList()
                let index = droppedItems.indexOf(this.combatData.dropSelected);
                if (index === -1) {
                    index = 0;
                    this.combatData.dropSelected = -1;
                    this.updatePlotForLoot();
                }
                const dropdown = this.lootSelectCard.addDropdown(
                    'Choose Item',
                    droppedItems.map((itemID) => this.getItemName(itemID, -1)),
                    droppedItems,
                    (event) => this.dropChanceOnChange(event),
                );
                dropdown.selectedIndex = index;

                // gp options
                this.lootSelectCard.addSectionTitle('');
                this.lootSelectCard.addSectionTitle('GP/s Options');
                this.lootSelectCard.addRadio('Sell Bones', 25, 'sellBones', ['Yes', 'No'], [(e) => this.sellBonesRadioOnChange(e, true), (e) => this.sellBonesRadioOnChange(e, false)], 1);
                this.lootSelectCard.addRadio('Convert Shards', 25, 'convertShards', ['Yes', 'No'], [(e) => this.convertShardsRadioOnChange(e, true), (e) => this.convertShardsRadioOnChange(e, false)], 1);
                this.lootSelectCard.addDropdown('Sell Loot', ['All', 'Subset', 'None'], ['All', 'Subset', 'None'], (e) => this.sellLootDropdownOnChange(e));
                this.lootSelectCard.addButton('Edit Subset', (e) => this.editSubsetButtonOnClick(e));
                // show or hide "edit subset" button
                this.setEditSubsetDisplay();
            }

            createGPOptionsCard() {
                // GP/s options card
                this.gpOptionsCard = new MICSR.Card(this.lootSelectCard.container, '', '200px');
                this.gpOptionsCard.addSectionTitle('Item Subset Selection');
                this.gpOptionsCard.addMultiButton(['Set Default', 'Set Discovered'], [(e) => this.setDefaultOnClick(e), (e) => this.setDiscoveredOnClick(e)]);
                this.gpOptionsCard.addMultiButton(['Cancel', 'Save'], [(e) => this.cancelSubsetOnClick(e), (e) => this.saveSubsetOnClick(e)]);
                this.gpOptionsCard.addTextInput('Search', '', (e) => this.searchInputOnInput(e));
                // Top labels
                const labelCont = document.createElement('div');
                labelCont.className = 'mcsMultiButtonContainer';
                labelCont.style.borderBottom = 'solid thin';
                const lab1 = document.createElement('div');
                lab1.className = 'mcsMultiHeader';
                lab1.style.borderRight = 'solid thin';
                lab1.textContent = 'Item';
                lab1.style.width = '218px';
                labelCont.appendChild(lab1);
                const lab2 = document.createElement('div');
                lab2.className = 'mcsMultiHeader';
                lab2.textContent = 'Sell';
                lab2.style.width = '124px';
                labelCont.appendChild(lab2);
                this.gpOptionsCard.container.appendChild(labelCont);
                this.gpSearchResults = new MICSR.Card(this.gpOptionsCard.container, '130px', '100px');
                for (let i = 0; i < this.loot.lootList.length; i++) {
                    this.gpSearchResults.addRadio(this.loot.lootList[i].name, 20, `${this.loot.lootList[i].name}-radio`, ['Yes', 'No'], [(e) => this.lootListRadioOnChange(e, i, true), (e) => this.lootListRadioOnChange(e, i, false)], 1);
                }
                this.gpSearchResults.container.style.width = '100%';
                this.gpSearchResults.container.style.overflowY = 'scroll';
                this.gpSearchResults.container.style.overflowX = 'hidden';
                this.gpSearchResults.container.style.marginRight = '0px';
                this.gpSearchResults.container.style.marginBottom = '5px';
            }

            buildItemDropList() {
                // construct map
                const lootMap = {};
                const addToLootMap = (monster) => {
                    if (monster.lootTable) {
                        monster.lootTable.forEach(entry => {
                            const itemID = entry[0];
                            lootMap[itemID] = true;
                        });
                    }
                };
                if (this.dropListFilters.selectedMonster) {
                    if (!this.isViewingDungeon) {
                        if (this.barIsDungeon(this.selectedBar)) {
                            const dungeonID = this.barMonsterIDs[this.selectedBar];
                            const monsters = DUNGEONS[dungeonID].monsters;
                            const bossID = monsters[monsters.length - 1];
                            addToLootMap(MONSTERS[bossID]);
                        } else if (this.barIsTask(this.selectedBar)) {
                            const taskID = this.barMonsterIDs[this.selectedBar] - DUNGEONS.length;
                            const monsters = this.simulator.slayerTaskMonsters[taskID];
                            monsters.map(id => MONSTERS[id]).forEach(monster => addToLootMap(monster));
                        } else {
                            addToLootMap(MONSTERS[this.barMonsterIDs[this.selectedBar]]);
                        }
                    }
                } else {
                    MONSTERS.forEach(monster => addToLootMap(monster));
                }
                // construct list
                let lootList = Object.getOwnPropertyNames(lootMap).map(x => parseInt(x));
                // apply undiscovered filter
                if (this.dropListFilters.onlyUndiscovered) {
                    lootList = lootList.filter(itemID => {
                        return itemStats[itemID].stats[CONSTANTS.itemStats.timesFound] === 0;
                    });
                }
                // sort by name
                return [-1, ...lootList.sort((a, b) => items[a].name > items[b].name)];
            }

            dropChanceOnChange(event) {
                this.combatData.dropSelected = parseInt(event.currentTarget.selectedOptions[0].value);
                this.updatePlotForLoot();
            }

            getSelectedDropLabel() {
                if (this.combatData.dropSelected === -1) {
                    return `Drops/${this.selectedTimeShorthand}`;
                }
                return `${this.getItemName(this.combatData.dropSelected, -1)}/${this.selectedTimeShorthand}`;
            }

            createEquipmentStatCard() {
                this.equipStatCard = this.mainTabCard.addTab('Equipment Stats', this.emptyItems.Helmet.media, '', '50px');
                this.equipStatCard.addSectionTitle('Equipment Stats');
                this.equipKeys = [
                    'attackSpeed',
                    // melee
                    ['attackBonus', 0],
                    ['attackBonus', 1],
                    ['attackBonus', 2],
                    'strengthBonus',
                    // ranged
                    'rangedAttackBonus',
                    'rangedStrengthBonus',
                    // magic
                    'magicAttackBonus',
                    'magicDamageBonus',
                    // defence
                    'damageReduction',
                    'defenceBonus',
                    'rangedDefenceBonus',
                    'magicDefenceBonus',
                ];
                for (let i = 0; i < this.equipKeys.length; i++) {
                    const key = this.equipKeys[i];
                    let stat;
                    if (Array.isArray(key)) {
                        stat = MICSR.equipmentStatNames[key[0]][key[1]];
                    } else {
                        stat = MICSR.equipmentStatNames[key];
                    }
                    this.equipStatCard.addNumberOutput(stat.name, 0, 20, this.media[stat.icon], `MCS ${this.equipKeys[i]} ES Output`);
                }
                // level requirements
                this.equipStatCard.addSectionTitle('Level Requirements');
                this.requiredKeys = Object.getOwnPropertyNames(MICSR.requiredStatNames);
                for (const key of this.requiredKeys) {
                    const stat = MICSR.requiredStatNames[key];
                    this.equipStatCard.addNumberOutput('Level Required', 1, 20, this.media[stat.icon], `MCS ${key} ES Output`);
                }
            }

            createSimulationAndExportCard() {
                this.simOptionsCard = this.mainTabCard.addTab('Sim. Options', this.media.settings, '', '150px');
                this.simOptionsCard.addSectionTitle('Simulation Options');
                this.simOptionsCard.addNumberInput('Max Actions', MICSR.maxActions, 1, 10000, (event) => this.maxActionsInputOnChange(event));
                this.simOptionsCard.addNumberInput('# Trials', MICSR.trials, 1, 100000, (event) => this.numTrialsInputOnChange(event));
                this.simOptionsCard.addToggleRadio(
                    'Force full simulation',
                    'forceFullSim',
                    this.simulator,
                    'forceFullSim',
                );
                this.simOptionsCard.addRadio('Verbose Logging', 25, 'verbose', ['Yes', 'No'], [
                    () => this.verbose = true,
                    () => this.verbose = false,
                ], this.verbose ? 0 : 1);
                this.simOptionsCard.addRadio('Verybose Logging', 25, 'veryVerbose', ['Yes', 'No'], [
                    () => this.veryVerbose = true,
                    () => this.veryVerbose = false,
                ], this.veryVerbose ? 0 : 1);
                this.simOptionsCard.addNumberInput('Signet Time (h)', 1, 1, 1000, (event) => this.signetTimeInputOnChange(event));
                this.simOptionsCard.addSectionTitle('Export');
                this.simOptionsCard.addButton('Export Data', () => this.exportDataOnClick());
                this.simOptionsCard.addButton('Export Settings', () => this.exportSettingButtonOnClick());
                this.simOptionsCard.addTextInput('Settings JSON:', '', (event) => this.importedSettings = JSON.parse(event.currentTarget.value));
                this.simOptionsCard.addButton('Import Settings', () => {
                    if (!this.importedSettings) {
                        MICSR.log('No settings to import.');
                        return;
                    }
                    this.import.importSettings(this.importedSettings);
                    this.import.update();
                });
                this.exportOptionsButton = this.simOptionsCard.addButton('Show Export Options', () => this.exportOptionsOnClick());
                // Export Options Card
                this.createExportOptionsCard();
            }

            createCompareCard() {
                if (!this.compareCard) {
                    this.trackHistory = false;
                    this.savedSimulations = [];
                    this.compareCard = this.mainTabCard.addTab('Saved Simulations', this.media.statistics, '', '150px');
                } else {
                    this.compareCard.clearContainer();
                }
                this.compareCard.addButton('Clear History', () => {
                    this.savedSimulations = [];
                    this.createCompareCard();
                });
                this.compareCard.addRadio('Track History', 25, 'trackHistory', ['Yes', 'No'], [
                    () => this.trackHistory = true,
                    () => this.trackHistory = false,
                ], this.trackHistory ? 0 : 1);

                this.compareCard.addSectionTitle('Saved Simulations');
                this.savedSimulations.forEach((_, i) => {
                    this.compareCard.addButton(`Load simulation ${i}`, () => this.loadSavedSimulation(i));
                });
            }

            loadSavedSimulation(idx) {
                const simulation = this.savedSimulations[idx];
                if (!simulation) {
                    MICSR.log(`Unable to load simualtion with index ${idx}`);
                    return;
                }
                // load settings
                this.import.importSettings(simulation.settings);
                this.import.update();
                // load results
                this.simulator.monsterSimData = simulation.monsterSimData;
                this.simulator.dungeonSimData = simulation.dungeonSimData;
                this.simulator.slayerSimData = simulation.slayerSimData;
                this.updateDisplayPostSim();
            }

            createExportOptionsCard() {
                this.isExportDisplayed = false;
                this.exportOptionsCard = new MICSR.Card(this.topContent, '', '100px', true);
                this.exportOptionsCard.addSectionTitle('Export Options');
                this.exportOptionsCard.addToggleRadio(
                    'Dungeon Monsters',
                    `DungeonMonsterExportRadio`,
                    this.simulator.exportOptions,
                    'dungeonMonsters',
                    true,
                );
                this.exportOptionsCard.addToggleRadio(
                    'Non-Simulated',
                    `NonSimmedExportRadio`,
                    this.simulator.exportOptions,
                    'nonSimmed',
                    true,
                );
                this.exportOptionsCard.addSectionTitle('Data to Export');
                this.exportOptionsCard.addToggleRadio(
                    'Name',
                    `NameExportRadio`,
                    this.simulator.exportOptions,
                    'name',
                    true,
                );
                for (let i = 0; i < this.plotTypes.length; i++) {
                    let timeText = '';
                    if (this.plotTypes[i].isTime) {
                        timeText = 'X';
                    }
                    this.exportOptionsCard.addToggleRadio(
                        `${this.plotTypes[i].info}${timeText}`,
                        `${this.plotTypes[i].value}ExportRadio`,
                        this.simulator.exportOptions.dataTypes,
                        i,
                        true,
                    );
                }
            }

            /** Adds a multi-button with equipment to the equipment select popup
             * @param {Card} card The parent card
             * @param {number} equipmentSlot The equipment slot
             * @param {Function} filterFunction Filter equipment with this function
             * @param {string} [sortKey=itemID] Sort equipment by this key
             */
            addEquipmentMultiButton(card, equipmentSlot, filterFunction, sortKey = 'itemID') {
                const menuItems = this.equipmentSubsets[equipmentSlot].filter(filterFunction);
                menuItems.sort((a, b) => ((a[sortKey]) ? a[sortKey] : 0) - ((b[sortKey]) ? b[sortKey] : 0));
                const buttonMedia = menuItems.map((item) => item.media);
                const buttonIds = menuItems.map((item) => this.getItemName(item.itemID));
                const buttonCallbacks = menuItems.map((item) => () => this.equipItem(equipmentSlot, item.itemID));
                const tooltips = menuItems.map((item) => this.getEquipmentTooltip(equipmentSlot, item));
                card.addImageButtons(buttonMedia, buttonIds, 'Small', buttonCallbacks, tooltips, '100%');
            }

            /**
             * Filters an array by if the array item has the key
             * @param {string} key
             * @param {Object} item
             * @return {boolean}
             */
            filterIfHasKey(key, item) {
                switch (key) {
                    case 'magicLevelRequired':
                        if (this.forceMagicArmour.includes(item.itemID)) {
                            return true;
                        }
                        break;
                    case 'rangedLevelRequired':
                        if (this.forceRangedArmour.includes(item.itemID)) {
                            return true;
                        }
                        break;
                    case 'defenceLevelRequired':
                        if (this.forceMeleeArmour.includes(item.itemID)) {
                            return true;
                        }
                        break;
                }
                return key in item || item.itemID === 0;
            }

            /**
             * Filters equipment by if it has no level requirements
             * @param {Object} item
             * @return {boolean}
             */
            filterIfHasNoLevelReq(item) {
                return (!('defenceLevelRequired' in item) && !('rangedLevelRequired' in item) && !('magicLevelRequired' in item) && !(this.forceMagicArmour.includes(item.itemID) || this.forceRangedArmour.includes(item.itemID) || this.forceMeleeArmour.includes(item.itemID))) || item.itemID === 0;
            }

            /**
             * Filter an item array by the ammoType
             * @param {number} type
             * @param {Object} item
             * @return {boolean}
             */
            filterByAmmoType(type, item) {
                return item.ammoType === type || item.itemID === 0;
            }

            /**
             * Filter an item array by the ammoType
             * @param {number} type
             * @param {Object} item
             * @return {boolean}
             */
            filterByAmmoReq(type, item) {
                return item.ammoTypeRequired === type || item.itemID === 0;
            }

            /**
             * Filter an item if it's twohanded property matches the given state
             * @param {boolean} is2H Filter if twohanded matches this
             * @param {Object} item
             * @return {boolean}
             */
            filterByTwoHanded(is2H, item) {
                return item.isTwoHanded === is2H || item.itemID === 0;
            }

            filterMagicDamage(item) {
                if (item.modifiers === undefined) {
                    return false;
                }
                return item.modifiers.increasedMinAirSpellDmg > 0
                    || item.modifiers.increasedMinEarthSpellDmg > 0
                    || item.modifiers.increasedMinFireSpellDmg > 0
                    || item.modifiers.increasedMinWaterSpellDmg > 0
            }

            filterSlayer(item) {
                if (item.modifiers === undefined) {
                    return false;
                }
                if (item.modifiers.increasedSkillXP && item.modifiers.increasedSkillXP.filter(x => x[0] === CONSTANTS.skill.Slayer).length > 0) {
                    return true;
                }
                return item.modifiers.increasedSlayerAreaEffectNegationFlat > 0
                    || item.modifiers.increasedDamageToSlayerTasks > 0
                    || item.modifiers.increasedDamageToSlayerAreaMonsters > 0
                    || item.modifiers.increasedSlayerTaskLength > 0
                    || item.modifiers.increasedSlayerCoins > 0
            }

            filterRemainingPassive(item) {
                return !this.filterMagicDamage(item) && !this.filterSlayer(item)
            }

            /**
             * Filter an item by the weapon type
             * @param {string} weaponType
             * @param {Object} item
             * @return {boolean}
             */
            filterByWeaponType(weaponType, item) {
                // Change to the correct combat style selector
                return this.getWeaponType(item) === weaponType || item.itemID === 0;
            }

            /**
             * Gets the weapon type of an item
             * @param {Object} item
             * @return {string}
             */
            getWeaponType(item) {
                if ((item.type === 'Ranged Weapon') || item.isRanged) {
                    return 'Ranged';
                } else if (item.isMagic) {
                    return 'Magic';
                } else {
                    return 'Melee';
                }
            }

            /**
             * Filter by returning all elements
             * @return {boolean}
             */
            returnTrue() {
                return true;
            }

            /**
             * Change a button's classes to show that it is selected
             * @param {HTMLButtonElement}
             */
            selectButton(button) {
                button.classList.add('btn-primary');
                button.classList.remove('btn-outline-dark');
            }

            /**
             * Change a button's classes to show that it is not selected
             * @param {HTMLButtonElement}
             */
            unselectButton(button) {
                button.classList.remove('btn-primary');
                button.classList.add('btn-outline-dark');
            }

            /**
             * Creates an equipment popup
             * @param {number} equipmentSlot
             * @return {HTMLDivElement}
             */
            createEquipmentPopup(equipmentSlot) {
                const equipmentSelectPopup = document.createElement('div');
                equipmentSelectPopup.className = 'mcsPopup';
                const equipmentSelectCard = new MICSR.Card(equipmentSelectPopup, '', '600px');
                const triSplit = [0, 1, 2, 3, 5, 8];
                const noSplit = [6, 7, 10];
                if (triSplit.includes(equipmentSlot)) {
                    equipmentSelectCard.addSectionTitle('Melee');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterIfHasKey('defenceLevelRequired', item), 'defenceLevelRequired');
                    equipmentSelectCard.addSectionTitle('Ranged');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterIfHasKey('rangedLevelRequired', item), 'rangedLevelRequired');
                    equipmentSelectCard.addSectionTitle('Magic');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterIfHasKey('magicLevelRequired', item), 'magicLevelRequired');
                    if (this.equipmentSubsets[equipmentSlot].filter((item) => this.filterIfHasNoLevelReq(item)).length > 1) {
                        equipmentSelectCard.addSectionTitle('Other');
                        this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterIfHasNoLevelReq(item), 'name');
                    }
                } else if (noSplit.includes(equipmentSlot)) {
                    equipmentSelectCard.addSectionTitle(this.equipmentSlotKeys[equipmentSlot]);
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, () => this.returnTrue());
                } else if (equipmentSlot === 4) {
                    equipmentSelectCard.addSectionTitle('1H Melee');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => {
                        return this.filterByTwoHanded(false, item) && this.filterByWeaponType('Melee', item);
                    }, 'attackLevelRequired');
                    equipmentSelectCard.addSectionTitle('2H Melee');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => {
                        return this.filterByTwoHanded(true, item) && this.filterByWeaponType('Melee', item);
                    }, 'attackLevelRequired');
                    equipmentSelectCard.addSectionTitle('Bows');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => {
                        return this.filterByAmmoReq(0, item) && this.filterByWeaponType('Ranged', item);
                    }, 'rangedLevelRequired');
                    equipmentSelectCard.addSectionTitle('Crossbows');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => {
                        return this.filterByAmmoReq(1, item) && this.filterByWeaponType('Ranged', item);
                    }, 'rangedLevelRequired');
                    equipmentSelectCard.addSectionTitle('Javelins');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => {
                        return this.filterByAmmoReq(2, item) && this.filterByWeaponType('Ranged', item);
                    }, 'rangedLevelRequired');
                    equipmentSelectCard.addSectionTitle('Throwing Knives');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => {
                        return this.filterByAmmoReq(3, item) && this.filterByWeaponType('Ranged', item);
                    }, 'rangedLevelRequired');
                    equipmentSelectCard.addSectionTitle('1H Magic');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => {
                        return this.filterByTwoHanded(false, item) && this.filterByWeaponType('Magic', item);
                    }, 'magicLevelRequired');
                    equipmentSelectCard.addSectionTitle('2H Magic');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => {
                        return this.filterByTwoHanded(true, item) && this.filterByWeaponType('Magic', item);
                    }, 'magicLevelRequired');
                } else if (equipmentSlot === 9) {
                    equipmentSelectCard.addSectionTitle('Arrows');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterByAmmoType(0, item), 'rangedLevelRequired');
                    equipmentSelectCard.addSectionTitle('Bolts');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterByAmmoType(1, item), 'rangedLevelRequired');
                    equipmentSelectCard.addSectionTitle('Javelins');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterByAmmoType(2, item), 'rangedLevelRequired');
                    equipmentSelectCard.addSectionTitle('Throwing Knives');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterByAmmoType(3, item), 'rangedLevelRequired');
                } else if (equipmentSlot === MICSR.equipmentSlot.Passive) {
                    equipmentSelectCard.addSectionTitle('Magic Damage');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterMagicDamage(item), 'name');
                    equipmentSelectCard.addSectionTitle('Slayer');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterSlayer(item), 'name');
                    equipmentSelectCard.addSectionTitle('Other');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterRemainingPassive(item), 'name');
                } else if (equipmentSlot === MICSR.equipmentSlot.Summon || equipmentSlot === MICSR.equipmentSlot.SummonRight) {
                    equipmentSelectCard.addSectionTitle('Familiars')
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.returnTrue(item), 'itemID');
                } else {
                    throw Error(`Invalid equipmentSlot: ${equipmentSlot}`);
                }
                return equipmentSelectPopup;
            }

            // Callback Functions for equipment select card
            /**
             * Equips an item to an equipment slot
             * @param {number} equipmentSlot
             * @param {number} itemId
             * @memberof McsApp
             */
            equipItem(equipmentSlot, itemId) {
                if (this.equipmentSelected[equipmentSlot] === itemId) {
                    return;
                }

                const prevWeapon = this.equipmentSelected[MICSR.equipmentSlot.Weapon];
                this.equipmentSelected[equipmentSlot] = itemId;
                this.setEquipmentImage(equipmentSlot, itemId);

                const item = items[itemId];
                const weaponAmmo = [2, 3];
                switch (equipmentSlot) {
                    case MICSR.equipmentSlot.Weapon:
                        if (item.equipmentSlot === MICSR.equipmentSlot.Quiver) { // Swapping to throwing knives / javelins
                            this.equipItem(MICSR.equipmentSlot.Quiver, itemId);
                        } else if (weaponAmmo.includes(items[this.equipmentSelected[MICSR.equipmentSlot.Quiver]].ammoType)) { // Swapping from throwing knives / javelins
                            this.equipItem(MICSR.equipmentSlot.Quiver, 0);
                        }
                        if (item.isTwoHanded) {
                            this.equipItem(MICSR.equipmentSlot.Shield, 0);
                        }
                        break;
                    case MICSR.equipmentSlot.Shield:
                        if (itemId && items[this.equipmentSelected[MICSR.equipmentSlot.Weapon]].isTwoHanded) {
                            this.equipItem(MICSR.equipmentSlot.Weapon, 0);
                        }
                        break;
                    case MICSR.equipmentSlot.Quiver:
                        if (weaponAmmo.includes(item.ammoType)) { // Swapping to throwing knives / javelins
                            this.equipItem(MICSR.equipmentSlot.Weapon, itemId);
                        } else if (items[this.equipmentSelected[MICSR.equipmentSlot.Weapon]].equipmentSlot === MICSR.equipmentSlot.Quiver) { // Swapping from throwing knives / javelins
                            this.equipItem(MICSR.equipmentSlot.Weapon, 0);
                        }
                        break;
                }
                if (prevWeapon !== this.equipmentSelected[MICSR.equipmentSlot.Weapon]) {
                    this.updateStyleDropdowns();
                }
                this.checkForElisAss();
                this.updateEquipmentStats();
                this.updateCombatStats();
            }

            /**
             * Change the equipment image
             * @param {number} equipmentSlot
             * @param {number} itemId
             */
            setEquipmentImage(equipmentSlot, itemId) {
                const slotKey = this.equipmentSlotKeys[equipmentSlot];
                const img = document.getElementById(`MCS ${slotKey} Image`);
                let item;
                if (itemId === 0) {
                    img.src = this.emptyItems[slotKey].media;
                } else {
                    item = items[itemId];
                    img.src = item.media;
                }
                img._tippy.setContent(this.getEquipmentTooltip(equipmentSlot, item));
            }

            /**
             * Gets the content for the tooltip of a piece of equipment
             *
             * @param equipmentSlot The equipment slot of the item
             * @param item The item to get the tooltip for
             * @returns {string} The tooltip content
             */
            getEquipmentTooltip(equipmentSlot, item) {
                if (!item) {
                    return this.equipmentSlotKeys[equipmentSlot];
                }

                let tooltip = `<div class="text-center">${item.name}<br><small>`;

                if (item.description) {
                    tooltip += `<span class='text-info'>${item.description.replace(/<br>\(/, ' (')}</span><br>`;
                }

                if (item.hasSpecialAttack) {
                    const special = playerSpecialAttacks[item.specialAttackID];
                    tooltip += `<span class='text-danger'>${special.name} (${special.chance}%): </span><span class='text-warning'>${special.description}</span><br>`;
                }

                if (item.attackSpeed) {
                    tooltip += `<span class='text-info'>Attack Speed: ${item.attackSpeed / 1000}s</span><br>`;
                }

                if (item.strengthBonus || (item.attackBonus && item.attackBonus.some(b => b))) {
                    tooltip += this.getTooltipIcon(this.media.attack);
                    const statBonuses = [];
                    if (item.strengthBonus) {
                        statBonuses.push(this.getTooltipStatBonus('Strength', item.strengthBonus));
                    }
                    if (item.attackBonus) {
                        if (item.attackBonus[0]) {
                            statBonuses.push(this.getTooltipStatBonus('Stab', item.attackBonus[0]));
                        }
                        if (item.attackBonus[1]) {
                            statBonuses.push(this.getTooltipStatBonus('Slash', item.attackBonus[1]));
                        }
                        if (item.attackBonus[2]) {
                            statBonuses.push(this.getTooltipStatBonus('Block', item.attackBonus[2]));
                        }
                    }
                    tooltip += `${statBonuses.join(', ')}<br>`;
                }
                if (item.rangedStrengthBonus || item.rangedAttackBonus) {
                    tooltip += this.getTooltipIcon(this.media.ranged);
                    const statBonuses = [];
                    if (item.rangedStrengthBonus) {
                        statBonuses.push(this.getTooltipStatBonus('Strength', item.rangedStrengthBonus));
                    }
                    if (item.rangedAttackBonus) {
                        statBonuses.push(this.getTooltipStatBonus('Attack', item.rangedAttackBonus));
                    }
                    tooltip += `${statBonuses.join(', ')}<br>`;
                }
                if (item.magicDamageBonus || item.magicAttackBonus) {
                    tooltip += this.getTooltipIcon(this.media.magic);
                    const statBonuses = [];
                    if (item.magicDamageBonus) {
                        statBonuses.push(this.getTooltipStatBonus('Damage', item.magicDamageBonus, '%'));
                    }
                    if (item.magicAttackBonus) {
                        statBonuses.push(this.getTooltipStatBonus('Attack', item.magicAttackBonus));
                    }
                    tooltip += `${statBonuses.join(', ')}<br>`;
                }
                if (item.damageReduction || item.defenceBonus || item.rangedDefenceBonus || item.magicDefenceBonus) {
                    tooltip += `<div class="d-flex justify-content-center" style="align-items: center;">${this.getTooltipIcon(this.media.defence)}`;
                    const statBonuses = [];
                    if (item.damageReduction) {
                        statBonuses.push(this.getTooltipStatBonus('Damage Reduction', item.damageReduction, '%'));
                    }
                    if (item.defenceBonus) {
                        statBonuses.push(this.getTooltipStatBonus('Melee Defence', item.defenceBonus));
                    }
                    if (item.rangedDefenceBonus) {
                        statBonuses.push(this.getTooltipStatBonus('Ranged Defence', item.rangedDefenceBonus));
                    }
                    if (item.magicDefenceBonus) {
                        statBonuses.push(this.getTooltipStatBonus('Magic Defence', item.magicDefenceBonus));
                    }
                    tooltip += `<span style="max-width: 240px;">${statBonuses.join(', ')}</span></div>`;
                }
                if (item.slayerBonusXP) {
                    tooltip += `${this.getTooltipIcon(this.media.slayer)}${this.getTooltipStatBonus('Slayer XP', item.slayerBonusXP, '%')}<br>`;
                }

                const requirements = [
                    {description: 'Attack Level', property: 'attackLevelRequired'},
                    {description: 'Defence Level', property: 'defenceLevelRequired'},
                    {description: 'Ranged Level', property: 'rangedLevelRequired'},
                    {description: 'Magic Level', property: 'magicLevelRequired'},
                    {description: 'Slayer Level', property: 'slayerLevelRequired'},
                    {description: 'Summoning Level', property: 'summoningLevel'},
                ];
                if (requirements.some((req) => item[req.property])) {
                    tooltip += `<span class="text-warning">Requires:</span> ${requirements.flatMap((req) => item[req.property] ? `${req.description} ${item[req.property]}` : []).join(', ')}`;
                }

                tooltip += '</small></div>';
                return tooltip;
            }

            /**
             * Returns a span containing a description of the given stat bonus
             * @param {string} stat The name of the stat
             * @param {number} bonus The value of the bonus
             * @param {string} suffix A suffix to add after the bonus
             * @returns {HTMLSpanElement}
             */
            getTooltipStatBonus(stat, bonus, suffix = '') {
                return `<span style="white-space: nowrap;" class="text-${bonus > 0 ? 'success">+' : 'danger">'}${bonus}${suffix} ${stat}</span>`;
            }

            /**
             * Returns an image element containing the given icon for use in a tooltip
             * @param {string} icon The source of the icon
             * @returns {HTMLImageElement} The image element
             */
            getTooltipIcon(icon) {
                return `<img class="tooltip-icon" src="${icon}">`;
            }

            /**
             * Updates the style selection dropdowns
             * @memberof McsApp
             */
            updateStyleDropdowns() {
                const item = items[this.equipmentSelected[MICSR.equipmentSlot.Weapon]];
                switch (this.getWeaponType(item)) {
                    case 'Ranged':
                        this.disableStyleDropdown('Magic');
                        this.disableStyleDropdown('Melee');
                        this.enableStyleDropdown('Ranged');
                        break;
                    case 'Magic':
                        this.disableStyleDropdown('Ranged');
                        this.disableStyleDropdown('Melee');
                        this.enableStyleDropdown('Magic');
                        break;
                    case 'Melee':
                        this.disableStyleDropdown('Magic');
                        this.disableStyleDropdown('Ranged');
                        this.enableStyleDropdown('Melee');
                        break;
                }
            }

            /**
             * Callback for when a level input is changed
             * @param {Event} event The change event for an input
             * @param {string} skillName The key of playerLevels to Change
             */
            levelInputOnChange(event, skillName) {
                const newLevel = parseInt(event.currentTarget.value);
                if (newLevel >= 1) {
                    this.combatData.playerLevels[skillName] = Math.min(newLevel, 99);
                    this.combatData.virtualLevels[skillName] = newLevel;
                    // Update Spell and Prayer Button UIS, and deselect things if they become invalid
                    if (skillName === 'Magic') {
                        this.updateSpellOptions();
                        this.checkForElisAss();
                    }
                    if (skillName === 'Prayer') {
                        this.updatePrayerOptions();
                    }
                }
                this.updateCombatStats();
            }

            /**
             * Callback for when a combat style is changed
             * @param {Event} event The change event for a dropdown
             * @param {string} combatType The key of styles to change
             */
            styleDropdownOnChange(event, combatType) {
                const styleID = parseInt(event.currentTarget.selectedOptions[0].value);
                this.combatData.attackStyle[combatType] = styleID;
                this.updateCombatStats();
            }

            // Callback Functions for the Prayer Select Card
            /**
             * Callback for when a prayer image button is clicked
             * @param {MouseEvent} event The onclick event for a button
             * @param {number} prayerID Index of prayerSelected
             */
            prayerButtonOnClick(event, prayerID) {
                // Escape if prayer level is not reached
                const prayer = PRAYER[prayerID];
                if (!this.combatData.prayerSelected[prayerID] && this.combatData.playerLevels.Prayer < prayer.prayerLevel) {
                    notifyPlayer(CONSTANTS.skill.Prayer, `${this.getPrayerName(prayerID)} requires level ${prayer.prayerLevel} Prayer.`, 'danger');
                    return;
                }
                let prayerChanged = false;
                if (this.combatData.prayerSelected[prayerID]) {
                    this.combatData.activePrayers--;
                    this.combatData.prayerSelected[prayerID] = false;
                    this.unselectButton(event.currentTarget);
                    prayerChanged = true;
                } else {
                    if (this.combatData.activePrayers < 2) {
                        this.combatData.activePrayers++;
                        this.combatData.prayerSelected[prayerID] = true;
                        this.selectButton(event.currentTarget);
                        prayerChanged = true;
                    } else {
                        notifyPlayer(CONSTANTS.skill.Prayer, 'You can only have 2 prayers active at once.', 'danger');
                    }
                }
                if (prayerChanged) {
                    this.updateCombatStats();
                }
            }

            /**
             * Callback for when the potion tier is changed
             * @param {Event} event The change event for a dropdown
             */
            potionTierDropDownOnChange(event) {
                const potionTier = parseInt(event.currentTarget.selectedOptions[0].value);
                this.combatData.potionTier = potionTier;
                this.updateCombatStats();
                this.updatePotionTier(potionTier);
            }

            /**
             * Callback for when a potion button is clicked
             * @param {MouseEvent} event The onclick event for a button
             * @param {number} potionID The ID of the potion
             */
            potionImageButtonOnClick(event, potionID) {
                if (this.combatData.potionSelected) {
                    if (this.combatData.potionID === potionID) { // Deselect Potion
                        this.combatData.potionSelected = false;
                        this.combatData.potionID = -1;
                        this.unselectButton(event.currentTarget);
                    } else { // Change Potion
                        this.unselectButton(document.getElementById(`MCS ${this.getPotionName(this.combatData.potionID)} Button`));
                        this.combatData.potionID = potionID;
                        this.selectButton(event.currentTarget);
                    }
                } else { // Select Potion
                    this.combatData.potionSelected = true;
                    this.combatData.potionID = potionID;
                    this.selectButton(event.currentTarget);
                }
                this.updateCombatStats();
            }

            // Callback Functions for the spell select buttons
            /**
             * Callback for when a spell is selected
             * @param {MouseEvent} event
             * @param {number} spellID
             * @param {string} spellType
             */
            spellButtonOnClick(event, spellID, spellType) {
                const spellOpts = this.combatData.spells[spellType];
                const spell = spellOpts.array[spellID];
                // Escape for not meeting the level/item requirement
                if (this.combatData.playerLevels.Magic < spell.magicLevelRequired) {
                    notifyPlayer(CONSTANTS.skill.Magic, `${spell.name} requires level ${spell.magicLevelRequired} Magic.`, 'danger');
                    return;
                }
                if (spell.requiredItem !== undefined && spell.requiredItem !== -1 && !this.equipmentSelected.includes(spell.requiredItem)) {
                    notifyPlayer(CONSTANTS.skill.Magic, `${spell.name} requires ${this.getItemName(spell.requiredItem)}.`, 'danger');
                    return;
                }
                // Special Cases: If Ancient or Standard deselect standard/anciennt
                // If Ancient deselect curses
                // If curse and ancient active, do not select
                if (spellOpts.isSelected) {
                    // Spell of type already selected
                    if (spellOpts.selectedID === spellID && spellType !== 'standard' && spellType !== 'ancient') {
                        spellOpts.isSelected = false;
                        spellOpts.selectedID = null;
                        this.unselectButton(event.currentTarget);
                    } else {
                        this.unselectButton(document.getElementById(`MCS ${spellOpts.array[spellOpts.selectedID].name} Button`));
                        spellOpts.selectedID = spellID;
                        this.selectButton(event.currentTarget);
                    }
                } else {
                    switch (spellType) {
                        case 'ancient':
                            const standardOpts = this.combatData.spells.standard;
                            standardOpts.isSelected = false;
                            this.unselectButton(document.getElementById(`MCS ${standardOpts.array[standardOpts.selectedID].name} Button`));
                            standardOpts.selectedID = null;
                            if (this.combatData.spells.curse.isSelected) {
                                const curseOpts = this.combatData.spells.curse;
                                curseOpts.isSelected = false;
                                this.unselectButton(document.getElementById(`MCS ${curseOpts.array[curseOpts.selectedID].name} Button`));
                                curseOpts.selectedID = null;
                                notifyPlayer(CONSTANTS.skill.Magic, 'Curse Deselected, they cannot be used with Ancient Magicks', 'danger');
                            }
                            break;
                        case 'standard':
                            const ancientOpts = this.combatData.spells.ancient;
                            ancientOpts.isSelected = false;
                            this.unselectButton(document.getElementById(`MCS ${ancientOpts.array[ancientOpts.selectedID].name} Button`));
                            ancientOpts.selectedID = null;
                            break;
                    }
                    // Spell of type not selected
                    if (spellType === 'curse' && this.combatData.spells.ancient.isSelected) {
                        notifyPlayer(CONSTANTS.skill.Magic, 'Curses cannot be used with Ancient Magicks', 'danger');
                    } else {
                        spellOpts.isSelected = true;
                        spellOpts.selectedID = spellID;
                        this.selectButton(event.currentTarget);
                    }
                }
                // Update combat stats for new spell
                this.updateCombatStats();
            }

            // Callback Functions for the pet select card
            /**
             *
             * @param {MouseEvent} event
             * @param {number} petID
             */
            petButtonOnClick(event, petID) {
                if (this.combatData.petOwned[petID]) {
                    this.combatData.petOwned[petID] = false;
                    this.unselectButton(event.currentTarget);
                } else {
                    this.combatData.petOwned[petID] = true;
                    this.selectButton(event.currentTarget);
                }
                this.updateCombatStats();
            }

            // Callback Functions for the Sim Options Card
            /**
             * Callback for when the max actions input is changed
             * @param {Event} event The change event for an input
             */
            maxActionsInputOnChange(event) {
                const newMaxActions = parseInt(event.currentTarget.value);
                if (newMaxActions > 0 && newMaxActions <= 10000) {
                    this.simulator.maxActions = newMaxActions;
                }
            }

            /**
             * Callback for when the number of trials input is changed
             * @param {Event} event The change event for an input
             */
            numTrialsInputOnChange(event) {
                const newNumTrials = parseInt(event.currentTarget.value);
                if (newNumTrials > 0 && newNumTrials <= 100000) {
                    this.simulator.trials = newNumTrials;
                }
            }

            /**
             * Callback for when the plot type is changed
             * @param {Event} event The change event for a dropdown
             */
            plottypeDropdownOnChange(event) {
                this.plotter.plotType = event.currentTarget.value;
                this.plotter.plotID = event.currentTarget.selectedIndex;
                this.simulator.selectedPlotIsTime = this.plotTypes[event.currentTarget.selectedIndex].isTime;
                if (this.simulator.selectedPlotIsTime) {
                    this.plotter.timeDropdown.style.display = '';
                } else {
                    this.plotter.timeDropdown.style.display = 'none';
                }
                if (this.plotter.plotType === 'petChance') {
                    this.plotter.petSkillDropdown.style.display = '';
                } else {
                    this.plotter.petSkillDropdown.style.display = 'none';
                }
                this.updatePlotData();
            }

            /**
             * Callback for when the pet skill type is changed
             * @param {Event} event The change event for a dropdown
             */
            petSkillDropdownOnChange(event) {
                this.loot.petSkill = event.currentTarget.value;
                this.loot.updatePetChance();
                if (this.plotter.plotType === 'petChance') {
                    this.updatePlotData();
                }
                document.getElementById(`MCS  Pet Chance/${this.timeShorthand[this.initialTimeUnitIndex]} Label`).textContent = this.skillShorthand[this.loot.petSkill] + ' Pet Chance/' + this.selectedTimeShorthand;
                this.updateZoneInfoCard();
            }

            /**
             * Callback for when the simulate button is clicked
             * @param {MouseEvent} event The onclick event for a button
             */
            simulateButtonOnClick() {
                if (((items[this.equipmentSelected[MICSR.equipmentSlot.Weapon]].type === 'Ranged Weapon') || items[this.equipmentSelected[MICSR.equipmentSlot.Weapon]].isRanged) && (items[this.equipmentSelected[MICSR.equipmentSlot.Weapon]].ammoTypeRequired !== items[this.equipmentSelected[MICSR.equipmentSlot.Quiver]].ammoType)) {
                    notifyPlayer(CONSTANTS.skill.Ranged, 'Incorrect Ammo type equipped for weapon.', 'danger');
                } else {
                    if (this.simulator.simInProgress) {
                        this.simulator.cancelSimulation();
                        const simButton = document.getElementById('MCS Simulate Button');
                        simButton.disabled = true;
                        simButton.textContent = 'Cancelling...';
                    }
                    if (!this.simulator.simInProgress && this.simulator.simulationWorkers.length === this.simulator.maxThreads) {
                        this.simulator.simulateCombat();
                    }
                }
            }

            exportSettingButtonOnClick() {
                const settings = this.import.exportSettings();
                const data = JSON.stringify(settings, null, 1);
                this.popExport(data);
            }

            /**
             * Callback for when the sell bones option is changed
             * @param {Event} event The change event for a radio
             * @param {boolean} newState The new value for the option
             */
            sellBonesRadioOnChange(event, newState) {
                this.loot.sellBones = newState;
                this.updatePlotForGP();
            }

            /**
             * Callback for when the convert shards option is changed
             * @param {Event} event The change event for a radio
             * @param {boolean} newState The new value for the option
             */
            convertShardsRadioOnChange(event, newState) {
                this.loot.convertShards = newState;
                this.updatePlotForGP();
            }

            /**
             * Callback for when the slayer task option is changed
             * @param {Event} event The change event for a radio
             * @param {boolean} newState The new value for the option
             */
            slayerTaskRadioOnChange(event, newState) {
                this.combatData.isSlayerTask = newState;
                // toggle dungeon sims off if slayer task is on
                if (this.combatData.isSlayerTask && this.dungeonToggleState) {
                    this.toggleDungeonSims(true);
                }
                // toggle auto slayer sims off if slayer task is off
                if (!this.combatData.isSlayerTask && this.slayerToggleState) {
                    this.toggleSlayerSims(true);
                }
                this.updatePlotForSlayerXP();
                this.updatePlotForSlayerCoins();
            }

            /**
             * Callback for when the sell loot dropdown is changed
             * @param {Event} event The onchange event for a dropdown
             */
            sellLootDropdownOnChange(event) {
                this.loot.sellLoot = event.currentTarget.value;
                this.setEditSubsetDisplay();
                this.updatePlotForGP();
            }

            setEditSubsetDisplay() {
                const button = document.getElementById('MCS Edit Subset Button');
                if (!button) {
                    return;
                }
                if (this.loot.sellLoot === 'Subset') {
                    button.style.display = 'block';
                } else {
                    button.style.display = 'none';
                }
            }

            /**
             * The callback for when the edit subset button is clicked
             */
            editSubsetButtonOnClick() {
                this.loot.setLootListToSaleList();
                this.updateLootListRadios();
                this.gpOptionsCard.container.style.display = 'flex';
                this.gpOptionsCard.container.style.flexDirection = 'column';
            }

            // Callback Functions for the GP Options Card
            /**
             * The callback for when the set sale list to default button is clicked
             */
            setDefaultOnClick() {
                this.loot.setLootListToDefault();
                this.updateLootListRadios();
            }

            /**
             * The callback for when the set sale list to discovered button is clicked
             */
            setDiscoveredOnClick() {
                this.loot.setLootListToDiscovered();
                this.updateLootListRadios();
            }

            /**
             * The callback for when cancelling the changes to the sale list
             */
            cancelSubsetOnClick() {
                this.gpOptionsCard.container.style.display = 'none';
            }

            /**
             * The callback for when saving the changes to the sale list
             */
            saveSubsetOnClick() {
                this.loot.setSaleListToLootList();
                this.updatePlotForGP();
                this.gpOptionsCard.container.style.display = 'none';
            }

            /**
             * The callback for when the sale list search field is changed
             * @param {InputEvent} event The input event
             */
            searchInputOnInput(event) {
                this.updateGPSubset(event.currentTarget.value);
            }

            /**
             * The callback for when an item is toggled for sale
             * @param {Event} event The onchange event for a radio
             * @param {number} llID Loot list index
             * @param {boolean} newState The new value of the option
             */
            lootListRadioOnChange(event, llID, newState) {
                this.loot.lootList[llID].sell = newState;
            }

            /**
             * The callback for when the signet farm time is changed
             * @param {Event} event The change event for an input
             */
            signetTimeInputOnChange(event) {
                const newFarmTime = parseInt(event.currentTarget.value);
                if (newFarmTime > 0 && newFarmTime <= 1000) {
                    this.loot.signetFarmTime = newFarmTime;
                }
                this.updatePlotForSignetChance();
            }

            /**
             * The callback for when the time unit dropdown is changed
             * @param {Event} event The change event for a dropdown
             */
            timeUnitDropdownOnChange(event) {
                this.timeMultiplier = this.timeMultipliers[event.currentTarget.selectedIndex];
                this.simulator.selectedPlotIsTime = this.plotTypes[this.plotter.plotID].isTime;
                this.selectedTimeUnit = this.timeOptions[event.currentTarget.selectedIndex];
                this.selectedTimeShorthand = this.timeShorthand[event.currentTarget.selectedIndex];
                // Update zone info card time units
                for (let i = 0; i < this.plotTypes.length; i++) {
                    const name = this.plotTypes[i].info;
                    const value = this.plotTypes[i].value;
                    let newName = '';
                    if (value === 'petChance') {
                        newName = this.skillShorthand[this.loot.petSkill] + name + this.selectedTimeShorthand;
                    } else if (value === 'dropChance') {
                        newName = this.getSelectedDropLabel();
                    } else if (this.plotTypes[i].isTime) {
                        newName = name + this.selectedTimeShorthand;
                    }
                    if (newName) {
                        document.getElementById(`MCS ${name}h Label`).textContent = newName;
                    }
                }
                // Update pet chance
                this.loot.updatePetChance();
                // Update Plot
                this.updatePlotData();
                // Update Info Card
                this.updateZoneInfoCard();
            }

            notify(message, type = 'success') {
                let img = this.media.combat;
                Toastify({
                    text: `<div class=text-center><img class=notification-img src=${img}><span class=badge badge-${type}>${message}</span></div>`,
                    duration: 2000,
                    gravity: 'bottom',
                    position: 'center',
                    backgroundColor: 'transparent',
                    stopOnFocus: false,
                }).showToast();
            }

            popExport(data) {
                navigator.clipboard.writeText(data).then(() => {
                    this.notify('Exported to clipboard!');
                }, (error) => {
                    Swal.fire({
                        title: 'Clipboard API error!',
                        html: `<h5 class="font-w600 text-combat-smoke mb-1">Manually copy the data below, e.g. with ctrl-A ctrl-C.</h5><textarea class="mcsLabel mb-1">${data}</textarea>`,
                        showCancelButton: false,
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'Bye',
                    });
                });
            }

            /**
             * The callback for when the export button is clicked
             */
            exportDataOnClick() {
                let data = this.simulator.exportData();
                this.popExport(data);
            }

            /**
             * The callback for when the show/hide export options button is clicked
             */
            exportOptionsOnClick() {
                if (this.isExportDisplayed) {
                    this.exportOptionsCard.outerContainer.style.display = 'none';
                    this.exportOptionsButton.textContent = 'Show Export Options';
                } else {
                    this.exportOptionsCard.outerContainer.style.display = '';
                    this.exportOptionsButton.textContent = 'Hide Export Options';
                }
                this.isExportDisplayed = !this.isExportDisplayed;
            }

            barIsMonster(idx) {
                return this.barType[idx] === this.barTypes.monster;
            }

            barIsDungeon(idx) {
                return this.barType[idx] === this.barTypes.dungeon;
            }

            barIsTask(idx) {
                return this.barType[idx] === this.barTypes.task;
            }

            // Callback Functions for Bar inspection
            /**
             * The callback for when the inspect dungeon button is clicked
             */
            inspectDungeonOnClick() {
                if (this.barSelected && !this.barIsMonster(this.selectedBar)) {
                    this.setPlotToDungeon(this.barMonsterIDs[this.selectedBar]);
                } else {
                    MICSR.warn('How did you click this?');
                }
            }

            /**
             * The callback for when the stop dungeon inspection button is clicked
             */
            stopInspectOnClick() {
                this.setPlotToGeneral();
            }

            /**
             * The callback for when a plotter bar is clicked
             * @param {number} barID The id of the bar
             */
            barOnClick(barID) {
                if (this.barSelected) {
                    if (this.selectedBar === barID) {
                        this.barSelected = false;
                        this.removeBarhighlight(barID);
                    } else {
                        this.removeBarhighlight(this.selectedBar);
                        this.selectedBar = barID;
                        this.setBarHighlight(barID);
                    }
                } else {
                    this.barSelected = true;
                    this.selectedBar = barID;
                    this.setBarHighlight(barID);
                }
                if (this.barSelected && !this.isViewingDungeon && !this.barIsMonster(barID)) {
                    this.plotter.inspectButton.style.display = '';
                } else {
                    this.plotter.inspectButton.style.display = 'none';
                }
                this.updateZoneInfoCard();
                this.createLootOptionsCard();
            }

            /**
             * Turns on the border for a bar
             * @param {number} barID The id of the bar
             */
            setBarHighlight(barID) {
                if (this.plotter.bars[barID].className === 'mcsBar') {
                    this.plotter.bars[barID].style.border = 'thin solid red';
                } else {
                    this.plotter.bars[barID].style.border = 'thin solid blue';
                }
            }

            /**
             * Turns off the border for a bar
             * @param {number} barID The id of the bar
             */
            removeBarhighlight(barID) {
                this.plotter.bars[barID].style.border = 'none';
            }

            /**
             * Callback for when a monster/dungeon image below a bar is clicked
             * @param {number} imageID The id of the image that was clicked
             */
            barImageOnClick(imageID) {
                if (this.isViewingDungeon) {
                    return;
                }
                let newState;
                if (this.barIsDungeon(imageID)) {
                    this.simulator.dungeonSimFilter[this.barMonsterIDs[imageID]] = !this.simulator.dungeonSimFilter[this.barMonsterIDs[imageID]];
                    newState = this.simulator.dungeonSimFilter[this.barMonsterIDs[imageID]];
                    if (newState && this.combatData.isSlayerTask) {
                        this.notify('no dungeon simulation on slayer task')
                        return;
                    }
                } else if (this.barIsTask(imageID)) {
                    const taskID = this.barMonsterIDs[imageID] - DUNGEONS.length;
                    this.simulator.slayerSimFilter[taskID] = !this.simulator.slayerSimFilter[taskID];
                    newState = this.simulator.slayerSimFilter[taskID];
                    if (newState && !this.combatData.isSlayerTask) {
                        this.notify('no auto slayer simulation off slayer task');
                        return;
                    }
                } else {
                    this.simulator.monsterSimFilter[this.barMonsterIDs[imageID]] = !this.simulator.monsterSimFilter[this.barMonsterIDs[imageID]];
                    newState = this.simulator.monsterSimFilter[this.barMonsterIDs[imageID]];
                }
                // UI Changes
                if (newState) {
                    // Uncross
                    this.plotter.unCrossOutBarImage(imageID);
                } else {
                    // Crossout
                    this.plotter.crossOutBarImage(imageID);
                    if (this.selectedBar === imageID) {
                        this.barSelected = false;
                        this.removeBarhighlight(imageID);
                    }
                }
                this.updatePlotData();
            }

            /**
             * Callback to toggle the simulation of dungeons
             */
            toggleDungeonSims(silent = false) {
                const newState = !this.dungeonToggleState;
                if (newState && this.combatData.isSlayerTask) {
                    if (!silent) {
                        this.notify('no dungeon simulation on slayer task')
                    }
                    return;
                }
                this.dungeonToggleState = newState;
                for (let i = 0; i < DUNGEONS.length; i++) {
                    this.simulator.dungeonSimFilter[i] = newState;
                }
                this.updatePlotData();
                this.plotter.crossImagesPerSetting();
            }

            /**
             * Callback to toggle the simulation of dungeons
             */
            toggleSlayerSims(silent = false) {
                const newState = !this.slayerToggleState;
                if (newState && !this.combatData.isSlayerTask) {
                    if (!silent) {
                        this.notify('no auto slayer simulation off slayer task');
                    }
                    return;
                }
                this.slayerToggleState = newState;
                for (let i = 0; i < this.slayerTasks.length; i++) {
                    this.simulator.slayerSimFilter[i] = newState;
                }
                this.updatePlotData();
                this.plotter.crossImagesPerSetting();
            }

            /**
             * Callback to toggle the simulation of monsters in combat and slayer areas
             */
            toggleMonsterSims() {
                const newState = !this.monsterToggleState;
                this.monsterToggleState = newState;
                // Create List of non-dungeon monsters
                combatAreas.forEach((area) => {
                    area.monsters.forEach((monsterID) => {
                        this.simulator.monsterSimFilter[monsterID] = newState;
                    });
                });
                const bardID = 139;
                this.simulator.monsterSimFilter[bardID] = newState;
                slayerAreas.forEach((area) => {
                    area.monsters.forEach((monsterID) => {
                        this.simulator.monsterSimFilter[monsterID] = newState;
                    });
                });
                this.updatePlotData();
                this.plotter.crossImagesPerSetting();
            }

            /**
             * Updates the bars in the plot to the currently selected plot type
             */
            updatePlotData() {
                this.plotter.updateBarData(this.simulator.getDataSet(this.plotter.plotType));
            }

            setZoneInfoCard(title, id, media, data) {
                document.getElementById('MCS Zone Info Title').textContent = `${title} (id ${id})`;
                document.getElementById('MCS Info Image').src = media;
                const updateInfo = data.simSuccess;
                for (let i = 0; i < this.plotTypes.length; i++) {
                    const dataKey = this.plotTypes[i].value;
                    const outElem = document.getElementById(`MCS ${dataKey} Output`);
                    let dataMultiplier = (this.plotTypes[i].isTime) ? this.timeMultiplier : 1;
                    if (dataMultiplier === -1) dataMultiplier = data.killTimeS;
                    if (dataKey === 'petChance') dataMultiplier = 1;
                    outElem.textContent = updateInfo && !isNaN(data[dataKey])
                        ? MICSR.mcsFormatNum(data[dataKey] * dataMultiplier, 4)
                        : 'N/A';
                }
                if (data.deathRate > 0) {
                    document.getElementById('MCS deathRate Output').style.color = 'red';
                } else {
                    document.getElementById('MCS deathRate Output').style.color = '';
                }
            }

            /**
             * Updates the zone info card text fields
             */
            updateZoneInfoCard() {
                if (this.barSelected) {
                    this.subInfoCard.container.style.display = '';
                    this.infoPlaceholder.style.display = 'none';
                    if (!this.isViewingDungeon && this.barIsDungeon(this.selectedBar)) {
                        const dungeonID = this.barMonsterIDs[this.selectedBar];
                        this.setZoneInfoCard(
                            this.getDungeonName(dungeonID),
                            dungeonID,
                            DUNGEONS[dungeonID].media,
                            this.simulator.dungeonSimData[dungeonID],
                        );
                    } else if (!this.isViewingDungeon && this.barIsTask(this.selectedBar)) {
                        const taskID = this.barMonsterIDs[this.selectedBar] - DUNGEONS.length;
                        this.setZoneInfoCard(
                            this.slayerTasks[taskID].display,
                            taskID,
                            SKILLS[CONSTANTS.skill.Slayer].media,
                            this.simulator.slayerSimData[taskID],
                        );
                    } else {
                        let monsterID;
                        if (this.isViewingDungeon) {
                            const selection = this.getMonsterList(this.viewedDungeonID);
                            monsterID = selection[this.selectedBar + selection.length - this.plotter.bars.length];
                        } else {
                            monsterID = this.barMonsterIDs[this.selectedBar];
                        }
                        this.setZoneInfoCard(
                            this.getMonsterName(monsterID),
                            monsterID,
                            MONSTERS[monsterID].media,
                            this.simulator.monsterSimData[monsterID],
                        );
                    }
                } else {
                    document.getElementById('MCS Zone Info Title').textContent = 'Monster/Dungeon Info.';
                    this.subInfoCard.container.style.display = 'none';
                    this.infoPlaceholder.style.display = '';
                }
            }

            /**
             * get list of monsters for dungeon (or slayer task, where task IDs start at DUNGEONS.length)
             */
            getMonsterList(dungeonID) {
                if (dungeonID < DUNGEONS.length) {
                    return DUNGEONS[this.viewedDungeonID].monsters;
                }
                const taskID = dungeonID - DUNGEONS.length;
                return this.simulator.slayerTaskMonsters[taskID];
            }

            // Functions that manipulate the UI
            /**
             * Toggles the display of a style dropdown, and the spell selection dropdown off
             * @param {string} combatType The combat type to disable
             */
            disableStyleDropdown(combatType) {
                document.getElementById(`MCS ${combatType} Style Dropdown`).style.display = 'none';
            }

            /**
             * Toggles the display of a style dropdown, and the spell selection dropdown on
             * @param {string} combatType The combat type to enable
             */
            enableStyleDropdown(combatType) {
                document.getElementById(`MCS ${combatType} Style Dropdown`).style.display = 'inline';
            }

            /**
             * Updates the list of options in the spell menus, based on if the player can use it
             * @param {number} magicLevel The magic level the player has
             */
            updateSpellOptions() {
                const magicLevel = this.combatData.virtualLevels.Magic || 1;
                const setSpellsPerLevel = (spell, index, type) => {
                    const spellOption = this.combatData.spells[type];
                    if (spell.magicLevelRequired > magicLevel) {
                        document.getElementById(`MCS ${spell.name} Button Image`).src = 'assets/media/main/question.svg';
                        if (spellOption.selectedID === index) {
                            spellOption.selectedID = null;
                            spellOption.isSelected = false;
                            this.unselectButton(document.getElementById(`MCS ${spell.name} Button`));
                            if (type === 'standard' || type === 'ancient') {
                                this.combatData.spells.standard.isSelected = true;
                                this.combatData.spells.standard.selectedID = 0;
                                this.selectButton(document.getElementById(`MCS ${SPELLS[0].name} Button`));
                            }
                            notifyPlayer(CONSTANTS.skill.Magic, `${spell.name} has been de-selected. It requires level ${spell.magicLevelRequired} Magic.`, 'danger');
                        }
                    } else {
                        document.getElementById(`MCS ${spell.name} Button Image`).src = spell.media;
                    }
                };
                SPELLS.forEach((spell, index) => setSpellsPerLevel(spell, index, 'standard'));
                AURORAS.forEach((spell, index) => setSpellsPerLevel(spell, index, 'aurora'));
                CURSES.forEach((spell, index) => setSpellsPerLevel(spell, index, 'curse'));
                ANCIENT.forEach((spell, index) => setSpellsPerLevel(spell, index, 'ancient'));
                this.checkForElisAss();
            }

            /**
             * Checks if Eli's Ass is equipped and set aurora menu options
             */
            checkForElisAss() {
                const spellOption = this.combatData.spells.aurora;
                AURORAS.forEach((spell, index) => {
                    if (spell.requiredItem !== -1) {
                        if (this.equipmentSelected.includes(spell.requiredItem) && this.combatData.playerLevels.Magic >= spell.magicLevelRequired) {
                            document.getElementById(`MCS ${spell.name} Button Image`).src = spell.media;
                        } else {
                            document.getElementById(`MCS ${spell.name} Button Image`).src = 'assets/media/main/question.svg';
                            if (spellOption.selectedID === index) {
                                spellOption.selectedID = null;
                                spellOption.isSelected = false;
                                this.unselectButton(document.getElementById(`MCS ${spell.name} Button`));
                                notifyPlayer(CONSTANTS.skill.Magic, `${spell.name} has been de-selected. It requires ${this.getItemName(spell.requiredItem)}.`, 'danger');
                            }
                        }
                    }
                });
            }

            /**
             * Updates the prayers that display in the prayer selection card, based on if the player can use it
             */
            updatePrayerOptions() {
                const prayerLevel = this.combatData.virtualLevels.Prayer || 1;
                PRAYER.forEach((prayer, i) => {
                    if (prayer.prayerLevel > prayerLevel) {
                        document.getElementById(`MCS ${this.getPrayerName(i)} Button Image`).src = 'assets/media/main/question.svg';
                        if (this.combatData.prayerSelected[i]) {
                            this.prayerButtonOnClick({currentTarget: document.getElementById(`MCS ${this.getPrayerName(i)} Button`)}, i);
                            notifyPlayer(CONSTANTS.skill.Prayer, `${this.getPrayerName(i)} has been de-selected. It requires level ${prayer.prayerLevel} Prayer.`, 'danger');
                        }
                    } else {
                        document.getElementById(`MCS ${this.getPrayerName(i)} Button Image`).src = prayer.media;
                    }
                });
            }

            /**
             * Updates the text fields for the stats provided by equipment
             */
            updateEquipmentStats() {
                // first update the values
                this.combatData.updateEquipmentStats();
                let newStatValue;
                [this.equipKeys, this.requiredKeys].forEach(keys => {
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        if (Array.isArray(key)) {
                            newStatValue = this.combatData.equipmentStats[key[0]][key[1]];
                        } else {
                            newStatValue = this.combatData.equipmentStats[key];
                        }
                        document.getElementById(`MCS ${keys[i]} ES Output`).textContent = newStatValue.toLocaleString();
                    }
                });
            }

            /**
             * Updates the text fields for the computed combat stats
             */
            updateCombatStats() {
                // first update the values
                this.combatData.updateCombatStats();
                // second update the view
                this.combatStatKeys.forEach((key) => {
                    if (key === 'attackSpeed') {
                        const attackSpeed = this.combatData.playerAttackSpeed();
                        document.getElementById(`MCS ${key} CS Output`).textContent = attackSpeed.toLocaleString();
                    } else {
                        document.getElementById(`MCS ${key} CS Output`).textContent = this.combatData.combatStats[key].toLocaleString();
                    }
                });
            }

            /**
             * Updates the simulator display for when a gp option is changed
             */
            updatePlotForGP() {
                this.loot.updateGPData();
                if (this.plotter.plotType === 'gpPerSecond') {
                    this.updatePlotData();
                }
                this.updateZoneInfoCard();
            }

            /**
             * Updates the simulator display for when a loot option is changed
             */
            updatePlotForLoot() {
                document.getElementById('MCS Drops/h Label').textContent = this.getSelectedDropLabel();
                this.loot.updateDropChance();
                if (this.plotter.plotType === 'dropChance') {
                    this.updatePlotData();
                }
                this.updateZoneInfoCard();
            }

            /**
             * Updates the simulator display for when the slayer task option is changed
             */
            updatePlotForSlayerXP() {
                this.loot.updateSlayerXP();
                if (this.plotter.plotType === 'slayerXpPerSecond') {
                    this.updatePlotData();
                }
                this.updateZoneInfoCard();
            }

            /**
             * Updates the simulator display for when the slayer task option is changed
             */
            updatePlotForSlayerCoins() {
                this.loot.updateSlayerCoins();
                if (this.plotter.plotType === 'slayerCoinsPerSecond') {
                    this.updatePlotData();
                }
                this.updateZoneInfoCard();
            }

            /**
             * Updates the simulator display for when the signet time option is changed
             */
            updatePlotForSignetChance() {
                this.loot.updateSignetChance();
                if (this.plotter.plotType === 'signetChance') {
                    this.updatePlotData();
                }
                this.updateZoneInfoCard();
            }

            /**
             * Updates the simulator display for when the drop chance time option is changed
             */
            updatePlotForDropChance() {
                this.loot.updateDropChance();
                if (this.plotter.plotType === 'dropChance') {
                    this.updatePlotData();
                }
                this.updateZoneInfoCard();
            }

            /**
             * Updates the images and tooltips for potions when the potion tier is changed
             * @param {number} potionTier The new potion tier
             */
            updatePotionTier(potionTier) {
                this.combatPotionIDs.forEach((potionId) => {
                    const potion = items[herbloreItemData[potionId].itemID[potionTier]];
                    const img = document.getElementById(`MCS ${this.getPotionName(potionId)} Button Image`);
                    img.src = potion.media;
                    img.parentElement._tippy.setContent(this.getPotionTooltip(potion));
                });
            }

            /**
             * Gets the content for the tooltip of a potion
             * @param potion The potion object to get the tooltip for
             * @returns {string} The tooltip content
             */
            getPotionTooltip(potion) {
                return `<div class="text-center">${potion.name}<small>
      <br><span class='text-info'>${potion.description.replace(/\.$/, '')}</span>
      <br><span class='text-warning'>${potion.potionCharges} Potion Charges</span>
      </small></div>`;
            }

            /**
             * Updates the display of the sale list radio options depending on what the user has searched
             * @param {string} searchString The search query
             */
            updateGPSubset(searchString) {
                searchString = searchString.toLowerCase();
                let lootname;
                this.loot.lootList.forEach((loot) => {
                    lootname = loot.name.toLowerCase();
                    if (lootname.includes(searchString)) {
                        document.getElementById(`MCS ${loot.name} Radio Container`).style.display = 'flex';
                    } else {
                        document.getElementById(`MCS ${loot.name} Radio Container`).style.display = 'none';
                    }
                });
            }

            /**
             * Updates the display of sale list radios to match the internal state
             */
            updateLootListRadios() {
                this.loot.lootList.forEach((item) => {
                    if (item.sell) {
                        document.getElementById(`MCS ${item.name} Radio Yes`).checked = true;
                        document.getElementById(`MCS ${item.name} Radio No`).checked = false;
                    } else {
                        document.getElementById(`MCS ${item.name} Radio Yes`).checked = false;
                        document.getElementById(`MCS ${item.name} Radio No`).checked = true;
                    }
                });
            }

            // Functions for dungeon display
            /**
             * Changes the simulator to display an individual dungeon
             * @param {number} dungeonID the index of the dungeon in DUNGEONS
             */
            setPlotToDungeon(dungeonID) {
                this.isViewingDungeon = true;
                this.viewedDungeonID = dungeonID;
                this.loot.update();
                this.updatePlotData();
                // Undo bar selection if needed
                if (this.barSelected) {
                    this.barSelected = false;
                    this.removeBarhighlight(this.selectedBar);
                }
                this.updateZoneInfoCard();
                this.plotter.displayDungeon(dungeonID);
            }

            /**
             * Changes the simulator to display non-dungeon monsters and dungeon summary results
             */
            setPlotToGeneral() {
                this.isViewingDungeon = false;
                this.loot.update();
                if (this.barSelected) {
                    this.removeBarhighlight(this.selectedBar);
                }
                this.barSelected = true;
                const barID = this.dungeonBarIDs[this.viewedDungeonID];
                this.selectedBar = barID;
                this.setBarHighlight(barID);
                this.plotter.inspectButton.style.display = '';
                this.updatePlotData();
                this.updateZoneInfoCard();
                this.plotter.displayGeneral();
            }

            // WIP Stuff for gear sets
            /**
             * @description WIP Function for gear set saving/loading.
             * @param {string} setName
             */
            appendGearSet(setName) {
                this.gearSets.push({
                    setName: setName,
                    setData: this.equipmentSelected,
                });
                // Update gear set dropdown

                // Save gear sets to local storage
            }

            /**
             * @description WIP Function for removing a gear set
             * @param {number} setID
             */
            removeGearSet(setID) {
                // Remove set from array

                // Save gear sets to local storage
            }

            /**
             * WIP function to change the currently selected gear to what is saved in a gear set
             * @param {number} setID The index of the gear set
             */
            setGearToSet(setID) {
                // Set Gearselected to data
                this.equipmentSelected = this.gearSets[setID].setData;
                // Update dropdowns to proper value
                for (let i = 0; i < this.equipmentSelected.length; i++) {
                    for (let j = 0; j < this.equipmentSubsets[i].length; j++) {
                        if (this.equipmentSubsets[i][j].itemID === this.equipmentSelected[i]) {
                            this.equipmentSelectCard.dropDowns[i].selectedIndex = j;
                            break;
                        }
                    }
                    // Do check for weapon type
                    if (i === MICSR.equipmentSlot.Weapon) {
                        if (items[gearID].isTwoHanded) {
                            this.equipmentSelectCard.dropDowns[MICSR.equipmentSlot.Shield].selectedIndex = 0;
                            this.equipmentSelected[MICSR.equipmentSlot.Shield] = 0;
                            this.equipmentSelectCard.dropDowns[MICSR.equipmentSlot.Shield].disabled = true;
                        } else {
                            this.equipmentSelectCard.dropDowns[MICSR.equipmentSlot.Shield].disabled = false;
                        }
                        // Change to the correct combat style selector
                        if ((items[gearID].type === 'Ranged Weapon') || items[gearID].isRanged) {
                            this.disableStyleDropdown('Magic');
                            this.disableStyleDropdown('Melee');
                            this.enableStyleDropdown('Ranged');
                            // Magic
                        } else if (items[gearID].isMagic) {
                            this.disableStyleDropdown('Ranged');
                            this.disableStyleDropdown('Melee');
                            this.enableStyleDropdown('Magic');
                            // Melee
                        } else {
                            this.disableStyleDropdown('Magic');
                            this.disableStyleDropdown('Ranged');
                            this.enableStyleDropdown('Melee');
                        }
                    }
                }
                // Update equipment stats and combat stats
                this.updateEquipmentStats();
                this.updateCombatStats();
            }

            // Data Sanatizing Functions
            /**
             * Removes HTML from the dungeon name
             * @param {number} dungeonID The index of Dungeons
             * @return {string} The name of a dungeon
             */
            getDungeonName(dungeonID) {
                return this.replaceApostrophe(DUNGEONS[dungeonID].name);
            }

            /**
             * Removes HTML from the potion name
             * @param {number} potionID The index of herbloreItemData
             * @return {string} The name of a potion
             */
            getPotionName(potionID) {
                return this.replaceApostrophe(herbloreItemData[potionID].name);
            }

            /**
             * Removes HTML from a prayer name
             * @param {number} prayerID The index of PRAYER
             * @return {string} the name of a prayer
             */
            getPrayerName(prayerID) {
                return this.replaceApostrophe(PRAYER[prayerID].name);
            }

            /**
             * Removes HTML from a spell name
             * @param {number} spellID The index of SPELLS
             * @return {string} The name of a spell
             */
            getSpellName(spellID) {
                return this.replaceApostrophe(SPELLS[spellID].name);
            }

            /**
             * Removes HTML from an item name
             * @param {number} itemID The index of items
             * @return {string} The name of an item
             */
            getItemName(itemID, defaultItemID = 0) {
                if (itemID === defaultItemID) {
                    return 'None';
                } else if (!items[itemID]) {
                    MICSR.warn(`Invalid itemID ${itemID} in getItemName`);
                    return 'None';
                } else {
                    return this.replaceApostrophe(items[itemID].name);
                }
            }

            /**
             * Removes HTML from a monster name
             * @param {number} monsterID The index of MONSTERS
             * @return {string} the name of a monster
             */
            getMonsterName(monsterID) {
                return this.replaceApostrophe(MONSTERS[monsterID].name);
            }

            /**
             * Replaces &apos; with an actual ' character
             * @param {string} stringToFix The string to replace
             * @return {string} the fixed string
             */
            replaceApostrophe(stringToFix) {
                return stringToFix.replace(/&apos;/g, '\'');
            }

            /** Updates the display post simulation */
            updateDisplayPostSim() {
                this.createLootOptionsCard(); // update in case slayer task monsters changed
                this.updatePlotData();
                this.updateZoneInfoCard();
                if (this.isViewingDungeon) {
                    this.setPlotToGeneral();
                    this.setPlotToDungeon(this.barMonsterIDs[this.selectedBar]);
                }
                document.getElementById('MCS Simulate Button').disabled = false;
                document.getElementById('MCS Simulate Button').textContent = 'Simulate';
            }

            destroy() {
                // terminate any workers
                this.simulator.simulationWorkers.forEach((worker) => worker.worker.terminate());
                // remove all tool tips
                this.tippySingleton.destroy();
                this.tippyInstances.forEach(instance => instance.destroy());
                // remove the interface
                MICSR.destroyMenu(this.menuItemId, this.modalID);
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
    waitLoadOrder(reqs, setup, 'App');

})();