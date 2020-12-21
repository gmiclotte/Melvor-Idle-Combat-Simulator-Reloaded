(() => {

    const MICSR = window.MICSR;

    const reqs = [
        'util',
        'statNames',
        'Card',
        'Plotter',
        'Simulator',
    ];

    const setup = () => {

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
                // Plot Type Options
                this.plotTypeDropdownOptions = [
                    'XP per ',
                    'HP XP per ',
                    'Prayer XP per ',
                    'Slayer XP per ',
                    'XP per Attack',
                    'HP Loss per ',
                    'Prayer Points per ',
                    'Damage per ',
                    'Average Kill Time (s)',
                    'Damage per Attack',
                    'GP per ',
                    'Potential Herblore XP per ',
                    'Chance for Signet Part B(%)',
                    'Attacks Made per ',
                    'Attacks Taken per ',
                    'Pet Chance per ',
                    'Kills per ',
                    'Runes per ',
                    // 'Simulation Time',
                ];
                this.plotTypeIsTime = [
                    true,
                    true,
                    true,
                    true,
                    false,
                    true,
                    true,
                    true,
                    false,
                    false,
                    true,
                    true,
                    false,
                    true,
                    true,
                    true,
                    true,
                    true,
                    // false,
                ];
                this.plotTypeDropdownValues = [
                    'xpPerSecond',
                    'hpxpPerSecond',
                    'prayerXpPerSecond',
                    'slayerXpPerSecond',
                    'xpPerHit',
                    'hpPerSecond',
                    'ppConsumedPerSecond',
                    'dmgPerSecond',
                    'killTimeS',
                    'avgHitDmg',
                    'gpPerSecond',
                    'herbloreXPPerSecond',
                    'signetChance',
                    'attacksMadePerSecond',
                    'attacksTakenPerSecond',
                    'petChance',
                    'killsPerSecond',
                    'runesUsedPerSecond',
                    // 'simulationTime',
                ];
                this.zoneInfoNames = [
                    'XP/',
                    'HP XP/',
                    'Prayer XP/',
                    'Slayer XP/',
                    'XP/attack',
                    'HP Lost/',
                    'Prayer Points/',
                    'Damage/',
                    'Kill Time(s)',
                    'Damage/attack',
                    'GP/',
                    'Herb XP/',
                    'Signet Chance (%)',
                    'Attacks Made/',
                    'Attacks Taken/',
                    ' Pet Chance/',
                    'Kills/',
                    'Runes/',
                    // 'Sim Time',
                ];
                // Time unit options
                this.timeOptions = ['Kill', 'Second', 'Minute', 'Hour', 'Day'];
                this.timeShorthand = ['kill', 's', 'm', 'h', 'd'];
                this.selectedTimeUnit = this.timeOptions[1];
                this.selectedTimeShorthand = this.timeShorthand[1];
                this.timeMultipliers = [-1, 1, 60, 3600, 3600 * 24];
                this.emptyItems = {
                    Helmet: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/armour_helmet.svg',
                        defenceLevelRequired: 0,
                        magicLevelRequired: 0,
                        rangedLevelRequired: 0,
                    },
                    Platebody: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/armour_platebody.svg',
                        defenceLevelRequired: 0,
                        magicLevelRequired: 0,
                        rangedLevelRequired: 0,
                    },
                    Platelegs: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/armour_platelegs.svg',
                        defenceLevelRequired: 0,
                        magicLevelRequired: 0,
                        rangedLevelRequired: 0,
                    },
                    Boots: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/armour_boots.svg',
                        defenceLevelRequired: 0,
                        magicLevelRequired: 0,
                        rangedLevelRequired: 0,
                    },
                    Weapon: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/weapon_sword.svg',
                        attackLevelRequired: 0,
                        magicLevelRequired: 0,
                        rangedLevelRequired: 0,
                    },
                    Shield: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/armour_shield.svg',
                        defenceLevelRequired: 0,
                        magicLevelRequired: 0,
                        rangedLevelRequired: 0,
                    },
                    Amulet: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/misc_amulet.svg',
                    },
                    Ring: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/misc_ring.svg',
                    },
                    Gloves: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/armour_gloves.svg',
                        defenceLevelRequired: 0,
                        magicLevelRequired: 0,
                        rangedLevelRequired: 0,
                    },
                    Quiver: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/weapon_quiver.svg',
                    },
                    Cape: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/armour_cape.svg',
                    },
                    Passive: {
                        name: 'None',
                        itemID: 0,
                        media: 'assets/media/bank/passive_slot.svg'
                    }
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
                };

                // Forced equipment sorting
                this.forceMeleeArmour = [CONSTANTS.item.Slayer_Helmet_Basic, CONSTANTS.item.Slayer_Platebody_Basic];
                this.forceRangedArmour = [CONSTANTS.item.Slayer_Cowl_Basic, CONSTANTS.item.Slayer_Leather_Body_Basic];
                this.forceMagicArmour = [CONSTANTS.item.Slayer_Wizard_Hat_Basic, CONSTANTS.item.Slayer_Wizard_Robes_Basic, CONSTANTS.item.Enchanted_Shield];
                // Generate equipment subsets
                this.equipmentSlotKeys = Object.keys(CONSTANTS.equipmentSlot);
                this.equipmentSubsets = [];
                /** @type {number[]} */
                this.equipmentSelected = [];
                for (let equipmentSlot = 0; equipmentSlot < this.equipmentSlotKeys.length; equipmentSlot++) {
                    this.equipmentSubsets.push([this.emptyItems[this.equipmentSlotKeys[equipmentSlot]]]);
                    this.equipmentSelected.push(0);
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].equipmentSlot === CONSTANTS.equipmentSlot[this.equipmentSlotKeys[equipmentSlot]]) {
                            this.equipmentSubsets[equipmentSlot].push(items[i]);
                            this.equipmentSubsets[equipmentSlot][this.equipmentSubsets[equipmentSlot].length - 1].itemID = i;
                        }
                    }
                }
                this.equipmentSubsets[CONSTANTS.equipmentSlot.Passive].push(...items.filter(x => x.isPassiveItem));
                // Add ammoType 2 and 3 to weapon subsets
                for (let i = 0; i < items.length; i++) {
                    if (items[i].equipmentSlot === CONSTANTS.equipmentSlot.Quiver && (items[i].ammoType === 2 || items[i].ammoType === 3)) {
                        this.equipmentSubsets[CONSTANTS.equipmentSlot.Weapon].push(items[i]);
                        this.equipmentSubsets[CONSTANTS.equipmentSlot.Weapon][this.equipmentSubsets[CONSTANTS.equipmentSlot.Weapon].length - 1].itemID = i;
                    }
                }
                // Sort equipment subsets
                for (let equipmentSlot = 0; equipmentSlot < this.equipmentSlotKeys.length; equipmentSlot++) {
                    this.equipmentSubsets[equipmentSlot].sort((a, b) => (a.attackLevelRequired || 0) - (b.attackLevelRequired || 0));
                    this.equipmentSubsets[equipmentSlot].sort((a, b) => (a.defenceLevelRequired || 0) - (b.defenceLevelRequired || 0));
                    this.equipmentSubsets[equipmentSlot].sort((a, b) => (a.rangedLevelRequired || 0) - (b.rangedLevelRequired || 0));
                    this.equipmentSubsets[equipmentSlot].sort((a, b) => (a.magicLevelRequired || 0) - (b.magicLevelRequired || 0));
                    if (equipmentSlot === CONSTANTS.equipmentSlot.Quiver) {
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
                // Simulation Object
                this.simulator = new MICSR.Simulator(this, urls.simulationWorker);
                // Temporary GP/s settings variable
                this.itemSubsetTemp = [];

                // Create the top container for the sim
                this.topContent = document.createElement('div');
                this.topContent.className = 'mcsTabContent';
                // Create the bottom container for the sim
                this.botContent = document.createElement('div');
                this.botContent.className = 'mcsTabContent';
                this.botContent.style.flexWrap = 'nowrap';
                this.botContent.style.minHeight = '452px';

                this.mcsModal = document.createElement('div');
                this.mcsModal.id = 'mcsModal';
                this.mcsModal.className = 'modal';

                const modalDialog = document.createElement('div');
                modalDialog.className = 'modal-dialog';
                this.mcsModal.appendChild(modalDialog);

                const modalContent = document.createElement('div');
                modalContent.className = 'modal-content';
                modalDialog.appendChild(modalContent);

                const modalHeader = $(`<div class="block block-themed block-transparent mb-0"><div class="block-header bg-primary-dark">
        <h3 class="block-title">Combat Simulator Reloaded ${MICSR.version}</h3>
        <div class="block-options"><button type="button" class="btn-block-option" data-dismiss="modal" aria-label="Close">
        <i class="fa fa-fw fa-times"></i></button></div></div></div>`);
                $(modalContent).append(modalHeader);
                modalContent.appendChild(this.topContent);
                modalContent.appendChild(this.botContent);

                // Insert Tools menu and MCS tab into the sidebar
                this.newHeading = document.createElement('li');
                this.newHeading.id = 'mcsToolsMenu';
                this.newHeading.className = 'nav-main-heading mcsNoSelect';
                this.newHeading.textContent = 'Tools';
                this.headingEye = document.createElement('i');
                this.headingEye.className = 'far fa-eye text-muted ml-1';
                this.headingEye.onclick = (e) => this.headingEyeOnClick(e);
                this.headingEye.style.cursor = 'pointer';
                this.newHeading.appendChild(this.headingEye);
                this.eyeHidden = false;

                this.tabDiv = document.createElement('li');
                this.tabDiv.id = 'mcsButton';
                this.tabDiv.style.cursor = 'pointer';
                this.tabDiv.className = 'nav-main-item mcsNoSelect';

                const menuButton = document.createElement('div');
                menuButton.className = 'nav-main-link nav-compact';
                menuButton.dataset.toggle = 'modal';
                menuButton.dataset.target = '#mcsModal';
                this.tabDiv.appendChild(menuButton);
                const icon = document.createElement('img');
                icon.className = 'nav-img';
                icon.src = this.media.combat;
                menuButton.appendChild(icon);
                const menuText = document.createElement('span');
                menuText.className = 'nav-main-link-name';
                menuText.textContent = 'Combat Simulator';
                menuButton.appendChild(menuText);

                document.getElementsByClassName('nav-main-heading').forEach((heading) => {
                    if (heading.textContent === 'Minigame') {
                        heading.parentElement.insertBefore(this.newHeading, heading);
                        heading.parentElement.insertBefore(this.tabDiv, heading);
                    }
                });

                this.createEquipmentSelectCard();

                // Add tab card
                {
                    this.selectedMainTab = 0;
                    this.mainTabCard = new MICSR.Card(this.topContent, '', '150px', true);
                    const mainTabNames = ['Levels', 'Spells', 'Prayers', 'Potions', 'Pets', 'Sim. Options', 'GP Options'];
                    const mainTabImages = [this.media.combat, this.media.spellbook, this.media.prayer, this.media.emptyPotion, this.media.pet, this.media.settings, this.media.gp];
                    const mainTabCallbacks = mainTabNames.map((_, i) => () => this.mainTabOnClick(i));
                    this.mainTabIDs = mainTabNames.map((name) => MICSR.toId(`${name}-tab`));
                    this.mainTabContainer = this.mainTabCard.addTabMenu(mainTabNames, mainTabImages, mainTabCallbacks);
                    /** @type {Card[]} */
                    this.mainTabCards = [];
                }

                // Add Cards to the tab card
                this.createLevelSelectCard();
                this.createSpellSelectCards();
                this.createPrayerSelectCard();
                this.createPotionSelectCard();
                this.createPetSelectCard();

                // Equipment Stat Display Card
                {
                    this.equipStatCard = new MICSR.Card(this.topContent, '', '50px', true);
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
                }
                // Level requirement display card
                {
                    this.requiredStatCard = new MICSR.Card(this.topContent, '', '50px', true);
                    this.requiredStatCard.addSectionTitle('Level Requirements');
                    this.requiredKeys = [
                        'attackLevelRequired',
                        'defenceLevelRequired',
                        'rangedLevelRequired',
                        'magicLevelRequired',
                        'slayerLevelRequired',
                    ];
                    for (let i = 0; i < this.requiredKeys.length; i++) {
                        const stat = MICSR.requiredStatNames[this.requiredKeys[i]];
                        this.requiredStatCard.addNumberOutput(stat.name, 0, 20, this.media[stat.icon], `MCS ${this.requiredKeys[i]} ES Output`);
                    }
                }
                // Combat Stat Display Card
                {
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
                    ];
                    for (let i = 0; i < combatStatNames.length; i++) {
                        this.combatStatCard.addNumberOutput(combatStatNames[i], 0, 20, (combatStatIcons[i] !== '') ? combatStatIcons[i] : '', `MCS ${this.combatStatKeys[i]} CS Output`);
                    }
                    this.combatStatCard.addSectionTitle('Simulate/Export');
                    this.combatStatCard.addButton('Simulate', () => this.simulateButtonOnClick());
                    this.combatStatCard.addButton('Export Data', () => this.exportDataOnClick());
                    this.combatStatCard.addButton('Show Export Options', () => this.exportOptionsOnClick());
                }
                // Export Options Card
                {
                    this.isExportDisplayed = false;
                    this.exportOptionsCard = new MICSR.Card(this.topContent, '', '100px', true);
                    this.exportOptionsCard.addSectionTitle('Export Options');
                    this.exportOptionsCard.addRadio('Dungeon Monsters', 25, `DungeonMonsterExportRadio`, ['Yes', 'No'], [(e) => this.exportDungeonMonsterRadioOnChange(e, true), (e) => this.exportDungeonMonsterRadioOnChange(e, false)], 0);
                    this.exportOptionsCard.addRadio('Non-Simulated', 25, `NonSimmedExportRadio`, ['Yes', 'No'], [(e) => this.exportNonSimmedRadioOnChange(e, true), (e) => this.exportNonSimmedRadioOnChange(e, false)], 0);
                    this.exportOptionsCard.addSectionTitle('Data to Export');
                    this.exportOptionsCard.addRadio('Name', 25, `NameExportRadio`, ['Yes', 'No'], [(e) => this.exportNameRadioOnChange(e, true), (e) => this.exportNameRadioOnChange(e, false)], 0);
                    for (let i = 0; i < this.plotTypeDropdownOptions.length; i++) {
                        let timeText = '';
                        if (this.plotTypeIsTime[i]) {
                            timeText = 'X';
                        }
                        this.exportOptionsCard.addRadio(`${this.zoneInfoNames[i]}${timeText}`, 25, `${this.plotTypeDropdownValues[i]}ExportRadio`, ['Yes', 'No'], [(e) => this.exportDataTypeRadioOnChange(e, true, i), (e) => this.exportDataTypeRadioOnChange(e, false, i)], 0);
                    }
                }
                // Simulation/Plot Options Card
                {
                    this.simOptionsCard = new MICSR.Card(this.mainTabContainer, '', '150px');
                    this.mainTabCards.push(this.simOptionsCard);
                    this.simOptionsCard.addSectionTitle('Simulation Options');
                    this.simOptionsCard.addNumberInput('Max Actions', 300, 1, 10000, (event) => this.maxActionsInputOnChange(event));
                    this.simOptionsCard.addNumberInput('# Trials', 10000, 1, 100000, (event) => this.numTrialsInputOnChange(event));
                    this.simOptionsCard.addNumberInput('Signet Time (h)', 1, 1, 1000, (event) => this.signetTimeInputOnChange(event));
                    const dropDownOptionNames = [];
                    for (let i = 0; i < this.plotTypeDropdownOptions.length; i++) {
                        if (this.plotTypeIsTime[i]) {
                            dropDownOptionNames.push(this.plotTypeDropdownOptions[i] + this.timeOptions[1]);
                        } else {
                            dropDownOptionNames.push(this.plotTypeDropdownOptions[i]);
                        }
                    }
                    this.simOptionsCard.addRadio('Slayer Task', 25, 'slayerTask', ['Yes', 'No'], [(e) => this.slayerTaskRadioOnChange(e, true), (e) => this.slayerTaskRadioOnChange(e, false)], 1);
                    this.simOptionsCard.addRadio('Hardcore Mode', 25, 'hardcore', ['Yes', 'No'], [() => this.hardcoreRadioOnChange(true), () => this.hardcoreRadioOnChange(false)], 1);
                }
                // Gp Options card
                {
                    this.gpSelectCard = new MICSR.Card(this.mainTabContainer, '', '150px');
                    this.mainTabCards.push(this.gpSelectCard);
                    this.gpSelectCard.addSectionTitle('GP/s Options');
                    this.gpSelectCard.addRadio('Sell Bones', 25, 'sellBones', ['Yes', 'No'], [(e) => this.sellBonesRadioOnChange(e, true), (e) => this.sellBonesRadioOnChange(e, false)], 1);
                    this.gpSelectCard.addRadio('Convert Shards', 25, 'convertShards', ['Yes', 'No'], [(e) => this.convertShardsRadioOnChange(e, true), (e) => this.convertShardsRadioOnChange(e, false)], 1);
                    this.gpSelectCard.addDropdown('Sell Loot', ['All', 'Subset', 'None'], ['All', 'Subset', 'None'], (e) => this.sellLootDropdownOnChange(e));
                    this.gpSelectCard.addButton('Edit Subset', (e) => this.editSubsetButtonOnClick(e));
                }
                // GP/s options card
                {
                    this.gpOptionsCard = new MICSR.Card(this.gpSelectCard.container, '', '200px');
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
                    for (let i = 0; i < this.simulator.lootList.length; i++) {
                        this.gpSearchResults.addRadio(this.simulator.lootList[i].name, 20, `${this.simulator.lootList[i].name}-radio`, ['Yes', 'No'], [(e) => this.lootListRadioOnChange(e, i, true), (e) => this.lootListRadioOnChange(e, i, false)], 1);
                    }
                    this.gpSearchResults.container.style.width = '100%';
                    this.gpSearchResults.container.style.overflowY = 'scroll';
                    this.gpSearchResults.container.style.overflowX = 'hidden';
                    this.gpSearchResults.container.style.marginRight = '0px';
                    this.gpSearchResults.container.style.marginBottom = '5px';
                }
                // Individual info card
                {
                    this.zoneInfoCard = new MICSR.Card(this.botContent, '', '100px', true);
                    this.zoneInfoCard.addSectionTitle('Monster/Dungeon Info.', 'MCS Zone Info Title');
                    this.infoPlaceholder = this.zoneInfoCard.addInfoText('Click on a bar for detailed information on a Monster/Dungeon!');
                    this.subInfoCard = new MICSR.Card(this.zoneInfoCard.container, '', '80px');
                    this.subInfoCard.addImage(this.media.combat, 48, 'MCS Info Image');
                    const zoneInfoLabelNames = [];
                    for (let i = 0; i < this.zoneInfoNames.length; i++) {
                        if (this.plotTypeIsTime[i]) {
                            zoneInfoLabelNames.push(this.zoneInfoNames[i] + this.timeShorthand[1]);
                        } else {
                            zoneInfoLabelNames.push(this.zoneInfoNames[i]);
                        }
                    }
                    for (let i = 0; i < this.plotTypeDropdownOptions.length; i++) {
                        this.subInfoCard.addNumberOutput(zoneInfoLabelNames[i], 'N/A', 20, '', `MCS ${this.plotTypeDropdownValues[i]} Output`, true);
                    }
                }
                // Bar Chart Card
                this.monsterToggleState = true;
                this.dungeonToggleState = true;
                this.plotter = new MICSR.Plotter(this, urls.crossedOut);
                // Setup plotter bar clicking
                this.selectedBar = 0;
                this.barSelected = false;
                for (let i = 0; i < this.plotter.bars.length; i++) {
                    this.plotter.bars[i].parentElement.onclick = (() => this.barOnClick(i));
                }
                /** @type {number[]} */
                this.barMonsterIDs = [];
                /** @type {boolean[]} */
                this.barIsDungeon = [];

                combatAreas.forEach((area) => {
                    area.monsters.forEach((monster) => {
                        this.barMonsterIDs.push(monster);
                        this.barIsDungeon.push(false);
                    });
                });
                slayerAreas.forEach((area) => {
                    area.monsters.forEach((monster) => {
                        this.barMonsterIDs.push(monster);
                        this.barIsDungeon.push(false);
                    });
                });
                /** @type {number[]} */
                this.dungeonBarIDs = [];
                for (let i = 0; i < DUNGEONS.length; i++) {
                    this.dungeonBarIDs.push(this.barMonsterIDs.length);
                    this.barMonsterIDs.push(i);
                    this.barIsDungeon.push(true);
                }
                // Dungeon View Variables
                this.isViewingDungeon = false;
                this.viewedDungeonID = -1;

                // Now that everything is done we add it to the document
                document.getElementById('page-container').appendChild(this.mcsModal);

                // Finalize tooltips
                const tippyOptions = {allowHTML: true, animation: false, hideOnClick: false};
                this.tippyInstances = tippy('#mcsModal [data-tippy-content]', tippyOptions);
                this.plotter.bars.forEach((bar) => {
                    this.tippyInstances.concat(tippy(bar, {triggerTarget: bar.parentElement, ...tippyOptions}));
                });
                this.tippySingleton = tippy.createSingleton(this.tippyInstances, {delay: [0, 200], ...tippyOptions});

                // Setup the default state of the UI
                this.gpOptionsCard.container.style.display = 'none';
                this.mainTabCards.forEach((card, cardID) => {
                    if (cardID !== 0) {
                        card.container.style.display = 'none';
                    }
                });
                this.exportOptionsCard.outerContainer.style.display = 'none';
                this.plotter.timeDropdown.selectedIndex = 1;
                document.getElementById('MCS Edit Subset Button').style.display = 'none';
                this.subInfoCard.container.style.display = 'none';
                this.setTabIDToSelected(this.spellTabIDs[0]);
                this.setTabIDToSelected(this.mainTabIDs[0]);
                this.plotter.petSkillDropdown.style.display = 'none';
                document.getElementById(`MCS  Pet Chance/s Label`).textContent = this.skillShorthand[this.simulator.petSkill] + ' Pet Chance/' + this.selectedTimeShorthand;
                this.updateSpellOptions(1);
                this.updatePrayerOptions(1);
                // Set up spells
                const standardOpts = this.simulator.spells.standard;
                this.selectButton(document.getElementById(`MCS ${standardOpts.array[standardOpts.selectedID].name} Button`));
                this.simulator.updateEquipmentStats();
                this.updateEquipmentStats();
                this.simulator.updateCombatStats();
                this.updateCombatStats();
                this.updatePlotData();
                // Export Options element
                this.exportOptionsButton = document.getElementById('MCS Show Export Options Button');
                // Saving and loading of Gear Sets
                this.gearSets = [];
            }

            createEquipmentSelectCard() {
                this.equipmentSelectCard = new MICSR.Card(this.topContent, '', '150px', true);
                const equipmentRows = [
                    [CONSTANTS.equipmentSlot.Passive, CONSTANTS.equipmentSlot.Helmet],
                    [CONSTANTS.equipmentSlot.Cape, CONSTANTS.equipmentSlot.Amulet, CONSTANTS.equipmentSlot.Quiver],
                    [CONSTANTS.equipmentSlot.Weapon, CONSTANTS.equipmentSlot.Platebody, CONSTANTS.equipmentSlot.Shield],
                    [CONSTANTS.equipmentSlot.Platelegs],
                    [CONSTANTS.equipmentSlot.Gloves, CONSTANTS.equipmentSlot.Boots, CONSTANTS.equipmentSlot.Ring],
                ];
                equipmentRows.forEach((row) => {
                    const rowSources = [];
                    const rowIDs = [];
                    const rowPopups = [];
                    const tooltips = [];
                    row.forEach((equipmentSlot) => {
                        rowSources.push(this.emptyItems[this.equipmentSlotKeys[equipmentSlot]].media);
                        rowIDs.push(`MCS ${this.equipmentSlotKeys[equipmentSlot]} Image`);
                        rowPopups.push(this.createEquipmentPopup(equipmentSlot));
                        tooltips.push(this.equipmentSlotKeys[equipmentSlot]);
                    });
                    this.equipmentSelectCard.addMultiPopupMenu(rowSources, rowIDs, rowPopups, tooltips);
                });
                const importSetCCContainer = this.equipmentSelectCard.createCCContainer();
                importSetCCContainer.appendChild(this.equipmentSelectCard.createLabel('Import Set', ''));
                this.equipmentSelectCard.addMultiButton(['1', '2', '3'], [() => this.importButtonOnClick(0), () => this.importButtonOnClick(1), () => this.importButtonOnClick(2)], importSetCCContainer);
                this.equipmentSelectCard.container.appendChild(importSetCCContainer);
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
            }

            createLevelSelectCard() {
                this.levelSelectCard = new MICSR.Card(this.mainTabContainer, '', '150px');
                this.mainTabCards.push(this.levelSelectCard);
                this.levelSelectCard.addSectionTitle('Player Levels');
                this.skillKeys.forEach((skillName) => {
                    let minLevel = 1;
                    if (skillName === 'Hitpoints') {
                        minLevel = 10;
                    }
                    this.levelSelectCard.addNumberInput(skillName, minLevel, minLevel, 500, (event) => this.levelInputOnChange(event, skillName));
                });
            }

            createSpellSelectCards() {
                this.spellSelectCard = new MICSR.Card(this.mainTabContainer, '100%', '150px');
                this.mainTabCards.push(this.spellSelectCard);
                this.spellSelectCard.addSectionTitle('Spells');
                this.selectedSpellTab = 0;
                const spellTypeNames = ['Standard', 'Curses', 'Auroras', 'Ancient Magicks'];
                const spellTypeImages = [this.media.spellbook, this.media.curse, this.media.aurora, this.media.ancient];
                const spellTabCallbacks = spellTypeNames.map((_name, index) => {
                    return () => this.spellTabOnClick(index);
                });
                this.spellTabIDs = spellTypeNames.map((name) => MICSR.toId(`${name}-tab`));
                this.spellTabContainer = this.spellSelectCard.addTabMenu(spellTypeNames, spellTypeImages, spellTabCallbacks);
                /** @type {Card[]} */
                this.spellTabCards = [];
                this.spellTabCards.push(this.createSpellSelectCard('Standard Magic', 'standard'));
                this.spellTabCards.push(this.createSpellSelectCard('Curses', 'curse'));
                this.spellTabCards.push(this.createSpellSelectCard('Auroras', 'aurora'));
                this.spellTabCards.push(this.createSpellSelectCard('Ancient Magicks', 'ancient'));
                this.spellTabCards.forEach((card, cardID) => {
                    if (cardID !== 0) {
                        card.container.style.display = 'none';
                    }
                });
            }

            /**
             * Creates a card for selecting spells
             * @param {string} title The title of the card
             * @param {string} spellType The type of spells to generate the select menu for
             * @return {Card} The created spell select card
             */
            createSpellSelectCard(title, spellType) {
                const newCard = new MICSR.Card(this.spellTabContainer, '', '100px');
                newCard.addSectionTitle(title);
                const spells = this.simulator.spells[spellType].array;
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
                this.prayerSelectCard = new MICSR.Card(this.mainTabContainer, '', '100px');
                this.mainTabCards.push(this.prayerSelectCard);
                this.prayerSelectCard.addSectionTitle('Prayers');
                const prayerSources = [];
                const prayerNames = [];
                const prayerCallbacks = [];
                for (let i = 0; i < PRAYER.length; i++) {
                    prayerSources.push(PRAYER[i].media);
                    prayerNames.push(this.getPrayerName(i));
                    prayerCallbacks.push((e) => this.prayerButtonOnClick(e, i));
                }

                // Generate the tooltip contents
                const prayerBonuses = {
                    prayerBonusAttack: {description: 'Melee Accuracy', isNumeric: true},
                    prayerBonusStrength: {description: 'Melee Strength', isNumeric: true},
                    prayerBonusDefence: {description: 'Melee Evasion', isNumeric: true},
                    prayerBonusAttackRanged: {description: 'Ranged Accuracy', isNumeric: true},
                    prayerBonusStrengthRanged: {description: 'Ranged Strength', isNumeric: true},
                    prayerBonusDefenceRanged: {description: 'Ranged Evasion', isNumeric: true},
                    prayerBonusAttackMagic: {description: 'Magic Accuracy', isNumeric: true},
                    prayerBonusDamageMagic: {description: 'Magic Damage', isNumeric: true},
                    prayerBonusDefenceMagic: {description: 'Magic Evasion', isNumeric: true},
                    prayerBonusProtectItem: {description: 'Keep item on death', isNumeric: false},
                    prayerBonusHitpoints: {description: '2x Restore Rate for Hitpoints', isNumeric: false},
                    prayerBonusProtectFromMelee: {
                        description: `${protectFromValue}% chance to dodge Melee Attacks`,
                        isNumeric: false
                    },
                    prayerBonusProtectFromRanged: {
                        description: `${protectFromValue}% chance to dodge Ranged Attacks`,
                        isNumeric: false
                    },
                    prayerBonusProtectFromMagic: {
                        description: `${protectFromValue}% chance to dodge Magic Attacks`,
                        isNumeric: false
                    },
                    prayerBonusHitpointHeal: {description: 'Heal +20% HP when HP falls below 10%', isNumeric: false},
                    prayerBonusDamageReduction: {description: 'Damage Reduction', isNumeric: true},
                };
                const tooltips = [];
                PRAYER.forEach((prayer) => {
                    let tooltip = `<div class="text-center">${prayer.name}<br><small><span class='text-info'>`;
                    prayer.vars.forEach((prayerBonus, i) => {
                        if (prayerBonuses[prayerBonus].isNumeric) {
                            tooltip += `+${prayer.values[i]}% `;
                        }
                        tooltip += `${prayerBonuses[prayerBonus].description}<br>`;
                    });
                    tooltip += '</span>';
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
                this.potionSelectCard = new MICSR.Card(this.mainTabContainer, '', '100px');
                this.mainTabCards.push(this.potionSelectCard);
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
                this.combatPetsIds = [2, 12, 13, 14, 15, 16, 17, 18, 19, 20];
                const combatPets = PETS.filter((_pet, petID) => {
                    return this.combatPetsIds.includes(petID);
                });
                this.petSelectCard = new MICSR.Card(this.mainTabContainer, '', '100px');
                this.mainTabCards.push(this.petSelectCard);
                this.petSelectCard.addSectionTitle('Pets');
                const petImageSources = combatPets.map((pet) => pet.media);
                const petNames = combatPets.map((pet) => pet.name);
                const petButtonCallbacks = this.combatPetsIds.map((petId) => (e) => this.petButtonOnClick(e, petId));
                const tooltips = combatPets.map((pet) => `<div class="text-center">${pet.name}<br><small class='text-info'>${pet.description.replace(/\.$/, '')}</small></div>`);
                this.petSelectCard.addImageButtons(petImageSources, petNames, 'Medium', petButtonCallbacks, tooltips);
                this.petSelectCard.addImage(PETS[4].media, 100, 'MCS Rock').style.display = 'none';
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
                return item.increasedMinAirSpellDmg !== undefined
                    || item.increasedMinEarthSpellDmg !== undefined
                    || item.increasedMinFireSpellDmg !== undefined
                    || item.increasedMinWaterSpellDmg !== undefined
            }

            filterSlayer(item) {
                return item.slayerAreaEffectNegationPercent !== undefined || item.slayerBonusXP !== undefined
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
                } else if (equipmentSlot === CONSTANTS.equipmentSlot.Passive) {
                    equipmentSelectCard.addSectionTitle('Magic Damage');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterMagicDamage(item), 'name');
                    equipmentSelectCard.addSectionTitle('Slayer');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterSlayer(item), 'name');
                    equipmentSelectCard.addSectionTitle('Other');
                    this.addEquipmentMultiButton(equipmentSelectCard, equipmentSlot, (item) => this.filterRemainingPassive(item), 'name');
                } else {
                    throw Error(`Invalid equipmentSlot: ${equipmentSlot}`);
                }
                return equipmentSelectPopup;
            }

            // Tab Callbacks
            /**
             * Main tab menu tab on click callback
             * @param {number} tabID
             */
            mainTabOnClick(tabID) {
                if (this.selectedMainTab !== tabID) {
                    this.mainTabCards[this.selectedMainTab].container.style.display = 'none';
                    this.setTabIDToUnSelected(this.mainTabIDs[this.selectedMainTab]);
                    this.mainTabCards[tabID].container.style.display = '';
                    this.setTabIDToSelected(this.mainTabIDs[tabID]);
                    this.selectedMainTab = tabID;
                }
            }

            /**
             * Spell tab menu tab on click callback
             * @param {number} tabID
             */
            spellTabOnClick(tabID) {
                if (this.selectedSpellTab !== tabID) {
                    this.spellTabCards[this.selectedSpellTab].container.style.display = 'none';
                    this.setTabIDToUnSelected(this.spellTabIDs[this.selectedSpellTab]);
                    this.spellTabCards[tabID].container.style.display = '';
                    this.setTabIDToSelected(this.spellTabIDs[tabID]);
                    this.selectedSpellTab = tabID;
                }
            }

            /**
             * Sets a tab to the selected state
             * @param {string} tabID
             */
            setTabIDToSelected(tabID) {
                document.getElementById(tabID).className = 'mcsTabButton mcsTabButtonSelected';
            }

            /**
             * Sets a tab to the default state
             * @param {string} tabID
             */
            setTabIDToUnSelected(tabID) {
                document.getElementById(tabID).className = 'mcsTabButton';
            }

            /**
             * Callback for when sidebar eye is clicked
             */
            headingEyeOnClick() {
                if (this.eyeHidden) {
                    this.headingEye.className = 'far fa-eye text-muted ml-1';
                    this.tabDiv.style.display = '';
                    this.eyeHidden = false;
                } else {
                    this.headingEye.className = 'far fa-eye-slash text-muted ml-1';
                    this.tabDiv.style.display = 'none';
                    this.eyeHidden = true;
                }
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

                const prevWeapon = this.equipmentSelected[CONSTANTS.equipmentSlot.Weapon];
                this.equipmentSelected[equipmentSlot] = itemId;
                this.setEquipmentImage(equipmentSlot, itemId);

                const item = items[itemId];
                const weaponAmmo = [2, 3];
                switch (equipmentSlot) {
                    case CONSTANTS.equipmentSlot.Weapon:
                        if (item.equipmentSlot === CONSTANTS.equipmentSlot.Quiver) { // Swapping to throwing knives / javelins
                            this.equipItem(CONSTANTS.equipmentSlot.Quiver, itemId);
                        } else if (weaponAmmo.includes(items[this.equipmentSelected[CONSTANTS.equipmentSlot.Quiver]].ammoType)) { // Swapping from throwing knives / javelins
                            this.equipItem(CONSTANTS.equipmentSlot.Quiver, 0);
                        }
                        if (item.isTwoHanded) {
                            this.equipItem(CONSTANTS.equipmentSlot.Shield, 0);
                        }
                        break;
                    case CONSTANTS.equipmentSlot.Shield:
                        if (itemId && items[this.equipmentSelected[CONSTANTS.equipmentSlot.Weapon]].isTwoHanded) {
                            this.equipItem(CONSTANTS.equipmentSlot.Weapon, 0);
                        }
                        break;
                    case CONSTANTS.equipmentSlot.Quiver:
                        if (weaponAmmo.includes(item.ammoType)) { // Swapping to throwing knives / javelins
                            this.equipItem(CONSTANTS.equipmentSlot.Weapon, itemId);
                        } else if (items[this.equipmentSelected[CONSTANTS.equipmentSlot.Weapon]].equipmentSlot === CONSTANTS.equipmentSlot.Quiver) { // Swapping from throwing knives / javelins
                            this.equipItem(CONSTANTS.equipmentSlot.Weapon, 0);
                        }
                        break;
                }
                if (prevWeapon !== this.equipmentSelected[CONSTANTS.equipmentSlot.Weapon]) {
                    this.updateStyleDropdowns();
                }
                this.checkForElisAss();
                this.simulator.updateEquipmentStats();
                this.updateEquipmentStats();
                this.simulator.updateCombatStats();
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
                const item = items[this.equipmentSelected[CONSTANTS.equipmentSlot.Weapon]];
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
                if (newLevel <= 500 && newLevel >= 1) {
                    this.simulator.playerLevels[skillName] = Math.min(newLevel, 99);
                    this.simulator.virtualLevels[skillName] = newLevel;
                    // Update Spell and Prayer Button UIS, and deselect things if they become invalid
                    if (skillName === 'Magic') {
                        this.updateSpellOptions(newLevel);
                        this.checkForElisAss();
                    }
                    if (skillName === 'Prayer') {
                        this.updatePrayerOptions(newLevel);
                    }
                }
                this.simulator.updateCombatStats();
                this.updateCombatStats();
            }

            /**
             * Callback for when a combat style is changed
             * @param {Event} event The change event for a dropdown
             * @param {string} combatType The key of styles to change
             */
            styleDropdownOnChange(event, combatType) {
                const styleID = parseInt(event.currentTarget.selectedOptions[0].value);
                this.simulator.attackStyle[combatType] = styleID;
                this.simulator.updateCombatStats();
                this.updateCombatStats();
            }

            /**
             * Callback for when the import button is clicked
             * @param {number} setID Index of equipmentSets from 0-2 to import
             */
            importButtonOnClick(setID) {
                let itemID;
                const setToImport = equipmentSets[setID].equipment;
                for (let i = 0; i < this.equipmentSlotKeys.length; i++) {
                    itemID = setToImport[CONSTANTS.equipmentSlot[this.equipmentSlotKeys[i]]];
                    this.equipmentSelected[i] = itemID;
                    this.setEquipmentImage(i, itemID);
                }
                this.updateStyleDropdowns();
                // Update levels from in game levels
                this.skillKeys.forEach((key) => {
                    const skillId = CONSTANTS.skill[key];
                    const virtualLevel = Math.max(skillLevel[skillId], exp.xp_to_level(skillXP[skillId]) - 1);
                    document.getElementById(`MCS ${key} Input`).value = virtualLevel;
                    this.simulator.playerLevels[key] = Math.min(virtualLevel, 99);
                    this.simulator.virtualLevels[key] = virtualLevel;
                });
                // Set attack styles for each combat type:
                const meleeStyle = selectedAttackStyle[0];
                this.simulator.attackStyle.Melee = meleeStyle;
                document.getElementById('MCS Melee Style Dropdown').selectedIndex = meleeStyle;
                const rangedStyle = selectedAttackStyle[1];
                this.simulator.attackStyle.Ranged = rangedStyle - 3;
                document.getElementById('MCS Ranged Style Dropdown').selectedIndex = rangedStyle - 3;
                const magicStyle = selectedAttackStyle[2];
                this.simulator.attackStyle.Magic = magicStyle - 6;
                document.getElementById('MCS Magic Style Dropdown').selectedIndex = magicStyle - 6;
                // Update spells
                // Set all active spell UI to be disabled
                Object.keys(this.simulator.spells).forEach((spellType) => {
                    const spellOpts = this.simulator.spells[spellType];
                    if (spellOpts.isSelected) {
                        this.unselectButton(document.getElementById(`MCS ${spellOpts.array[spellOpts.selectedID].name} Button`));
                    }
                });
                if (isSpellAncient) {
                    this.simulator.spells.ancient.isSelected = true;
                    this.simulator.spells.ancient.selectedID = selectedAncient;
                    this.simulator.spells.standard.isSelected = false;
                    this.simulator.spells.standard.selectedID = -1;
                    this.simulator.spells.curse.isSelected = false;
                    this.simulator.spells.curse.selectedID = -1;
                } else {
                    this.simulator.spells.standard.isSelected = true;
                    this.simulator.spells.standard.selectedID = selectedSpell;
                    this.simulator.spells.ancient.isSelected = false;
                    this.simulator.spells.ancient.selectedID = -1;
                    if (selectedCurse !== null) {
                        this.simulator.spells.curse.isSelected = true;
                        this.simulator.spells.curse.selectedID = selectedCurse;
                    } else {
                        this.simulator.spells.curse.isSelected = false;
                        this.simulator.spells.curse.selectedID = -1;
                    }
                }
                if (activeAurora !== null) {
                    this.simulator.spells.aurora.isSelected = true;
                    this.simulator.spells.aurora.selectedID = activeAurora;
                } else {
                    this.simulator.spells.aurora.isSelected = false;
                    this.simulator.spells.aurora.selectedID = -1;
                }
                // Update spell UI
                Object.values(this.simulator.spells).forEach((spellOpts, i) => {
                    if (spellOpts.isSelected) {
                        this.selectButton(document.getElementById(`MCS ${spellOpts.array[spellOpts.selectedID].name} Button`));
                        this.spellTabOnClick(i);
                    }
                });
                this.updateSpellOptions(skillLevel[CONSTANTS.skill.Magic]);
                this.checkForElisAss();
                // Update prayers
                this.simulator.activePrayers = 0;
                for (let i = 0; i < PRAYER.length; i++) {
                    const prayButton = document.getElementById(`MCS ${this.getPrayerName(i)} Button`);
                    if (activePrayer[i]) {
                        this.selectButton(prayButton);
                        this.simulator.prayerSelected[i] = true;
                        this.simulator.activePrayers++;
                    } else {
                        this.unselectButton(prayButton);
                        this.simulator.prayerSelected[i] = false;
                    }
                }
                // Import Potion
                let potionID = -1;
                let potionTier = -1;
                if (herbloreBonuses[13].itemID !== 0) {
                    const itemID = herbloreBonuses[13].itemID;
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
                // Deselect potion if selected
                if (this.simulator.potionSelected) {
                    this.unselectButton(document.getElementById(`MCS ${this.getPotionName(this.simulator.potionID)} Button`));
                    this.simulator.potionSelected = false;
                    this.simulator.potionID = -1;
                }
                // Select new potion if applicable
                if (potionID !== -1) {
                    this.simulator.potionSelected = true;
                    this.simulator.potionID = potionID;
                    this.selectButton(document.getElementById(`MCS ${this.getPotionName(this.simulator.potionID)} Button`));
                }
                // Set potion tier if applicable
                if (potionTier !== -1) {
                    this.simulator.potionTier = potionTier;
                    this.updatePotionTier(potionTier);
                    // Set dropdown to correct option
                    document.getElementById('MCS Potion Tier Dropdown').selectedIndex = potionTier;
                }
                // Import PETS
                petUnlocked.forEach((owned, petID) => {
                    this.simulator.petOwned[petID] = owned;
                    if (owned && this.combatPetsIds.includes(petID)) {
                        this.selectButton(document.getElementById(`MCS ${PETS[petID].name} Button`));
                    }
                    if (petID === 4 && owned) document.getElementById('MCS Rock').style.display = '';
                });
                // Update hardcore mode
                if (currentGamemode === 1) {
                    this.simulator.isHardcore = true;
                    document.getElementById('MCS Hardcore Mode Radio Yes').checked = true;
                } else {
                    this.simulator.isHardcore = false;
                    document.getElementById('MCS Hardcore Mode Radio No').checked = true;
                }
                this.updatePrayerOptions(skillLevel[CONSTANTS.skill.Prayer]);
                this.simulator.updateEquipmentStats();
                this.updateEquipmentStats();
                this.simulator.computePotionBonus();
                this.simulator.computePrayerBonus();
                this.simulator.updateCombatStats();
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
                if (this.simulator.playerLevels.Prayer < prayer.prayerLevel) {
                    notifyPlayer(CONSTANTS.skill.Prayer, `${this.getPrayerName(prayerID)} requires level ${prayer.prayerLevel} Prayer.`, 'danger');
                    return;
                }
                let prayerChanged = false;
                if (this.simulator.prayerSelected[prayerID]) {
                    this.simulator.activePrayers--;
                    this.simulator.prayerSelected[prayerID] = false;
                    this.unselectButton(event.currentTarget);
                    prayerChanged = true;
                } else {
                    if (this.simulator.activePrayers < 2) {
                        this.simulator.activePrayers++;
                        this.simulator.prayerSelected[prayerID] = true;
                        this.selectButton(event.currentTarget);
                        prayerChanged = true;
                    } else {
                        notifyPlayer(CONSTANTS.skill.Prayer, 'You can only have 2 prayers active at once.', 'danger');
                    }
                }
                if (prayerChanged) {
                    this.simulator.computePrayerBonus();
                    this.simulator.updateCombatStats();
                    this.updateCombatStats();
                }
            }

            /**
             * Callback for when the potion tier is changed
             * @param {Event} event The change event for a dropdown
             */
            potionTierDropDownOnChange(event) {
                const potionTier = parseInt(event.currentTarget.selectedOptions[0].value);
                this.simulator.potionTier = potionTier;
                this.simulator.computePotionBonus();
                this.simulator.updateCombatStats();
                this.updateCombatStats();
                this.updatePotionTier(potionTier);
            }

            /**
             * Callback for when a potion button is clicked
             * @param {MouseEvent} event The onclick event for a button
             * @param {number} potionID The ID of the potion
             */
            potionImageButtonOnClick(event, potionID) {
                if (this.simulator.potionSelected) {
                    if (this.simulator.potionID === potionID) { // Deselect Potion
                        this.simulator.potionSelected = false;
                        this.simulator.potionID = -1;
                        this.unselectButton(event.currentTarget);
                    } else { // Change Potion
                        this.unselectButton(document.getElementById(`MCS ${this.getPotionName(this.simulator.potionID)} Button`));
                        this.simulator.potionID = potionID;
                        this.selectButton(event.currentTarget);
                    }
                } else { // Select Potion
                    this.simulator.potionSelected = true;
                    this.simulator.potionID = potionID;
                    this.selectButton(event.currentTarget);
                }
                this.simulator.computePotionBonus();
                this.simulator.updateCombatStats();
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
                const spellOpts = this.simulator.spells[spellType];
                const spell = spellOpts.array[spellID];
                // Escape for not meeting the level/item requirement
                if (this.simulator.playerLevels.Magic < spell.magicLevelRequired) {
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
                        spellOpts.selectedID = -1;
                        this.unselectButton(event.currentTarget);
                    } else {
                        this.unselectButton(document.getElementById(`MCS ${spellOpts.array[spellOpts.selectedID].name} Button`));
                        spellOpts.selectedID = spellID;
                        this.selectButton(event.currentTarget);
                    }
                } else {
                    switch (spellType) {
                        case 'ancient':
                            const standardOpts = this.simulator.spells.standard;
                            standardOpts.isSelected = false;
                            this.unselectButton(document.getElementById(`MCS ${standardOpts.array[standardOpts.selectedID].name} Button`));
                            standardOpts.selectedID = -1;
                            if (this.simulator.spells.curse.isSelected) {
                                const curseOpts = this.simulator.spells.curse;
                                curseOpts.isSelected = false;
                                this.unselectButton(document.getElementById(`MCS ${curseOpts.array[curseOpts.selectedID].name} Button`));
                                curseOpts.selectedID = -1;
                                notifyPlayer(CONSTANTS.skill.Magic, 'Curse Deselected, they cannot be used with Ancient Magicks', 'danger');
                            }
                            break;
                        case 'standard':
                            const ancientOpts = this.simulator.spells.ancient;
                            ancientOpts.isSelected = false;
                            this.unselectButton(document.getElementById(`MCS ${ancientOpts.array[ancientOpts.selectedID].name} Button`));
                            ancientOpts.selectedID = -1;
                            break;
                    }
                    // Spell of type not selected
                    if (spellType === 'curse' && this.simulator.spells.ancient.isSelected) {
                        notifyPlayer(CONSTANTS.skill.Magic, 'Curses cannot be used with Ancient Magicks', 'danger');
                    } else {
                        spellOpts.isSelected = true;
                        spellOpts.selectedID = spellID;
                        this.selectButton(event.currentTarget);
                    }
                }
                // Update combat stats for new spell
                this.simulator.updateCombatStats();
                this.updateCombatStats();
            }

            // Callback Functions for the pet select card
            /**
             *
             * @param {MouseEvent} event
             * @param {number} petID
             */
            petButtonOnClick(event, petID) {
                if (this.simulator.petOwned[petID]) {
                    this.simulator.petOwned[petID] = false;
                    this.unselectButton(event.currentTarget);
                } else {
                    this.simulator.petOwned[petID] = true;
                    this.selectButton(event.currentTarget);
                }
                this.simulator.updateCombatStats();
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
                this.simulator.selectedPlotIsTime = this.plotTypeIsTime[event.currentTarget.selectedIndex];
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
                this.simulator.petSkill = event.currentTarget.value;
                this.simulator.updatePetChance();
                if (this.plotter.plotType === 'petChance') {
                    this.updatePlotData();
                }
                document.getElementById(`MCS  Pet Chance/s Label`).textContent = this.skillShorthand[this.simulator.petSkill] + ' Pet Chance/' + this.selectedTimeShorthand;
                this.updateZoneInfoCard();
            }

            /**
             * Callback for when the simulate button is clicked
             * @param {MouseEvent} event The onclick event for a button
             */
            simulateButtonOnClick() {
                if (((items[this.equipmentSelected[CONSTANTS.equipmentSlot.Weapon]].type === 'Ranged Weapon') || items[this.equipmentSelected[CONSTANTS.equipmentSlot.Weapon]].isRanged) && (items[this.equipmentSelected[CONSTANTS.equipmentSlot.Weapon]].ammoTypeRequired !== items[this.equipmentSelected[CONSTANTS.equipmentSlot.Quiver]].ammoType)) {
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

            /**
             * Callback for when the sell bones option is changed
             * @param {Event} event The change event for a radio
             * @param {boolean} newState The new value for the option
             */
            sellBonesRadioOnChange(event, newState) {
                this.simulator.sellBones = newState;
                this.updatePlotForGP();
            }

            /**
             * Callback for when the convert shards option is changed
             * @param {Event} event The change event for a radio
             * @param {boolean} newState The new value for the option
             */
            convertShardsRadioOnChange(event, newState) {
                this.simulator.convertShards = newState;
                this.updatePlotForGP();
            }

            /**
             * Callback for when the slayer task option is changed
             * @param {Event} event The change event for a radio
             * @param {boolean} newState The new value for the option
             */
            slayerTaskRadioOnChange(event, newState) {
                this.simulator.isSlayerTask = newState;
                this.updatePlotForSlayerXP();
            }

            /**
             * Callback for when the hardcore option is changed
             * @param {boolean} newState The new value for the option
             */
            hardcoreRadioOnChange(newState) {
                this.simulator.isHardcore = newState;
            }

            /**
             * Callback for when an export data type option is changed
             * @param {Event} event The event for a radio
             * @param {boolean} newState The new value for the option
             * @param {number} exportIndex The index of the data type
             */
            exportDataTypeRadioOnChange(event, newState, exportIndex) {
                this.simulator.exportDataType[exportIndex] = newState;
            }

            /**
             * Callback for when the export name option is changed
             * @param {Event} event The event for a radio
             * @param {boolean} newState The new value for the option
             */
            exportNameRadioOnChange(event, newState) {
                this.simulator.exportName = newState;
            }

            /**
             * Callback for when the export dungeon monsters option is changed
             * @param {Event} event The event for a radio
             * @param {boolean} newState The new value for the option
             */
            exportDungeonMonsterRadioOnChange(event, newState) {
                this.simulator.exportDungeonMonsters = newState;
            }

            /**
             * Callback for when the export non simmed option is changed
             * @param {Event} event The event for a radio
             * @param {boolean} newState The new value for the option
             */
            exportNonSimmedRadioOnChange(event, newState) {
                this.simulator.exportNonSimmed = newState;
            }

            /**
             * Callback for when the sell loot dropdown is changed
             * @param {Event} event The onchange event for a dropdown
             */
            sellLootDropdownOnChange(event) {
                this.simulator.sellLoot = event.currentTarget.value;
                if (this.simulator.sellLoot === 'Subset') {
                    document.getElementById('MCS Edit Subset Button').style.display = 'block';
                } else {
                    document.getElementById('MCS Edit Subset Button').style.display = 'none';
                }
                this.updatePlotForGP();
            }

            /**
             * The callback for when the edit subset button is clicked
             */
            editSubsetButtonOnClick() {
                this.simulator.setLootListToSaleList();
                this.updateLootListRadios();
                this.gpOptionsCard.container.style.display = 'flex';
                this.gpOptionsCard.container.style.flexDirection = 'column';
            }

            // Callback Functions for the GP Options Card
            /**
             * The callback for when the set sale list to default button is clicked
             */
            setDefaultOnClick() {
                this.simulator.setLootListToDefault();
                this.updateLootListRadios();
            }

            /**
             * The callback for when the set sale list to discovered button is clicked
             */
            setDiscoveredOnClick() {
                this.simulator.setLootListToDiscovered();
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
                this.simulator.setSaleListToLootList();
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
                this.simulator.lootList[llID].sell = newState;
            }

            /**
             * The callback for when the signet farm time is changed
             * @param {Event} event The change event for an input
             */
            signetTimeInputOnChange(event) {
                const newFarmTime = parseInt(event.currentTarget.value);
                if (newFarmTime > 0 && newFarmTime <= 1000) {
                    this.simulator.signetFarmTime = newFarmTime;
                }
                this.updatePlotForSignetChance();
            }

            /**
             * The callback for when the time unit dropdown is changed
             * @param {Event} event The change event for a dropdown
             */
            timeUnitDropdownOnChange(event) {
                this.simulator.timeMultiplier = this.timeMultipliers[event.currentTarget.selectedIndex];
                this.simulator.selectedPlotIsTime = this.plotTypeIsTime[this.plotter.plotID];
                this.selectedTimeUnit = this.timeOptions[event.currentTarget.selectedIndex];
                this.selectedTimeShorthand = this.timeShorthand[event.currentTarget.selectedIndex];
                // Update zone info card time units
                this.zoneInfoNames.forEach((name, index) => {
                    let newName = '';
                    if (name === ' Pet Chance/') newName = this.skillShorthand[this.simulator.petSkill] + name + this.selectedTimeShorthand;
                    else if (this.plotTypeIsTime[index]) newName = name + this.selectedTimeShorthand;
                    if (newName) document.getElementById(`MCS ${name + this.timeShorthand[1]} Label`).textContent = newName;
                });
                // Update pet chance
                this.simulator.updatePetChance();
                // Update Plot
                this.updatePlotData();
                // Update Info Card
                this.updateZoneInfoCard();
            }

            /**
             * The callback for when the export button is clicked
             */
            exportDataOnClick() {
                navigator.clipboard.writeText(this.simulator.exportData()).then(() => {

                }, (error) => {
                    throw error;
                });
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

            // Callback Functions for Bar inspection
            /**
             * The callback for when the inspect dungeon button is clicked
             */
            inspectDungeonOnClick() {
                if (this.barSelected && this.barIsDungeon[this.selectedBar]) {
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
                if (this.barSelected && !this.isViewingDungeon && this.barIsDungeon[barID]) {
                    this.plotter.inspectButton.style.display = '';
                } else {
                    this.plotter.inspectButton.style.display = 'none';
                }
                this.updateZoneInfoCard();
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
                if (!this.isViewingDungeon) {
                    let newState;
                    if (this.barIsDungeon[imageID]) {
                        this.simulator.dungeonSimFilter[this.barMonsterIDs[imageID]] = !this.simulator.dungeonSimFilter[this.barMonsterIDs[imageID]];
                        newState = this.simulator.dungeonSimFilter[this.barMonsterIDs[imageID]];
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
            }

            /**
             * Cabllback to toggle the simulation of dungeons
             */
            toggleDungeonSims() {
                const newState = !this.dungeonToggleState;
                this.dungeonToggleState = newState;
                for (let i = 0; i < DUNGEONS.length; i++) {
                    this.simulator.dungeonSimFilter[i] = newState;
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

            /**
             * Updates the zone info card text fields
             */
            updateZoneInfoCard() {
                if (this.barSelected) {
                    this.subInfoCard.container.style.display = '';
                    this.infoPlaceholder.style.display = 'none';
                    if (!this.isViewingDungeon && this.barIsDungeon[this.selectedBar]) {
                        const dungeonID = this.barMonsterIDs[this.selectedBar];
                        document.getElementById('MCS Zone Info Title').textContent = this.getDungeonName(dungeonID);
                        document.getElementById('MCS Info Image').src = DUNGEONS[dungeonID].media;
                        const updateInfo = this.simulator.dungeonSimData[dungeonID].simSuccess;
                        for (let i = 0; i < this.plotTypeDropdownValues.length; i++) {
                            const dataKey = this.plotTypeDropdownValues[i];
                            const outElem = document.getElementById(`MCS ${dataKey} Output`);
                            let dataMultiplier = (this.plotTypeIsTime[i]) ? this.simulator.timeMultiplier : 1;
                            if (dataMultiplier === -1) dataMultiplier = this.simulator.dungeonSimData[dungeonID].killTimeS;
                            if (dataKey === 'petChance') dataMultiplier = 1;
                            outElem.textContent = ((updateInfo) ? MICSR.mcsFormatNum(this.simulator.dungeonSimData[dungeonID][dataKey] * dataMultiplier, 4) : 'N/A');
                        }
                    } else {
                        let monsterID;
                        if (this.isViewingDungeon) {
                            monsterID = DUNGEONS[this.viewedDungeonID].monsters[this.selectedBar + DUNGEONS[this.viewedDungeonID].monsters.length - this.plotter.bars.length];
                        } else {
                            monsterID = this.barMonsterIDs[this.selectedBar];
                        }
                        document.getElementById('MCS Zone Info Title').textContent = this.getMonsterName(monsterID);
                        document.getElementById('MCS Info Image').src = MONSTERS[monsterID].media;
                        const updateInfo = this.simulator.monsterSimData[monsterID].simSuccess;
                        for (let i = 0; i < this.plotTypeDropdownValues.length; i++) {
                            const dataKey = this.plotTypeDropdownValues[i];
                            const outElem = document.getElementById(`MCS ${dataKey} Output`);
                            let dataMultiplier = (this.plotTypeIsTime[i]) ? this.simulator.timeMultiplier : 1;
                            if (dataMultiplier === -1) dataMultiplier = this.simulator.monsterSimData[monsterID].killTimeS;
                            if (dataKey === 'petChance') dataMultiplier = 1;
                            outElem.textContent = ((updateInfo) ? MICSR.mcsFormatNum(this.simulator.monsterSimData[monsterID][dataKey] * dataMultiplier, 4) : 'N/A');
                        }
                    }
                } else {
                    document.getElementById('MCS Zone Info Title').textContent = 'Monster/Dungeon Info.';
                    this.subInfoCard.container.style.display = 'none';
                    this.infoPlaceholder.style.display = '';
                }
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
            updateSpellOptions(magicLevel) {
                const setSpellsPerLevel = (spell, index, type) => {
                    const spellOption = this.simulator.spells[type];
                    if (spell.magicLevelRequired > magicLevel) {
                        document.getElementById(`MCS ${spell.name} Button Image`).src = 'assets/media/main/question.svg';
                        if (spellOption.selectedID === index) {
                            spellOption.selectedID = -1;
                            spellOption.isSelected = false;
                            this.unselectButton(document.getElementById(`MCS ${spell.name} Button`));
                            if (type === 'standard' || type === 'ancient') {
                                this.simulator.spells.standard.isSelected = true;
                                this.simulator.spells.standard.selectedID = 0;
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
                const spellOption = this.simulator.spells.aurora;
                AURORAS.forEach((spell, index) => {
                    if (spell.requiredItem !== -1) {
                        if (this.equipmentSelected.includes(spell.requiredItem) && this.simulator.playerLevels.Magic >= spell.magicLevelRequired) {
                            document.getElementById(`MCS ${spell.name} Button Image`).src = spell.media;
                        } else {
                            document.getElementById(`MCS ${spell.name} Button Image`).src = 'assets/media/main/question.svg';
                            if (spellOption.selectedID === index) {
                                spellOption.selectedID = -1;
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
             * @param {number} prayerLevel The prayer level the player has
             */
            updatePrayerOptions(prayerLevel) {
                PRAYER.forEach((prayer, i) => {
                    if (prayer.prayerLevel > prayerLevel) {
                        document.getElementById(`MCS ${this.getPrayerName(i)} Button Image`).src = 'assets/media/main/question.svg';
                        if (this.simulator.prayerSelected[i]) {
                            this.simulator.prayerSelected[i] = false;
                            this.unselectButton(document.getElementById(`MCS ${this.getPrayerName(i)} Button`));
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
                let newStatValue;
                [this.equipKeys, this.requiredKeys].forEach(keys => {
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        if (Array.isArray(key)) {
                            newStatValue = this.simulator.equipmentStats[key[0]][key[1]];
                        } else {
                            newStatValue = this.simulator.equipmentStats[key];
                        }
                        document.getElementById(`MCS ${keys[i]} ES Output`).textContent = newStatValue.toLocaleString();
                    }
                });
            }

            /**
             * Updates the text fields for the computed combat stats
             */
            updateCombatStats() {
                this.combatStatKeys.forEach((key) => {
                    if (key === 'attackSpeed') {
                        document.getElementById(`MCS ${key} CS Output`).textContent = this.simulator.combatStats[key] - this.simulator.auroraBonus.attackSpeedBuff;
                    } else {
                        document.getElementById(`MCS ${key} CS Output`).textContent = this.simulator.combatStats[key].toLocaleString();
                    }
                });
            }

            /**
             * Updates the simulator display for when a gp option is changed
             */
            updatePlotForGP() {
                this.simulator.updateGPData();
                if (this.plotter.plotType === 'gpPerSecond') {
                    this.updatePlotData();
                }
                this.updateZoneInfoCard();
            }

            /**
             * Updates the simulator display for when the slayer task option is changed
             */
            updatePlotForSlayerXP() {
                this.simulator.updateSlayerXP();
                if (this.plotter.plotType === 'slayerXpPerSecond') {
                    this.updatePlotData();
                }
                this.updateZoneInfoCard();
            }

            /**
             * Updates the simulator display for when the signet time option is changed
             */
            updatePlotForSignetChance() {
                this.simulator.updateSignetChance();
                if (this.plotter.plotType === 'signetChance') {
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
                this.simulator.lootList.forEach((loot) => {
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
                this.simulator.lootList.forEach((item) => {
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
                this.simulator.updateGPData();
                this.simulator.updateSignetChance();
                this.simulator.updateSlayerXP();
                this.simulator.updateHerbloreXP();
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
                this.simulator.updateGPData();
                this.simulator.updateSignetChance();
                this.simulator.updateSlayerXP();
                this.simulator.updateHerbloreXP();

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
                    if (i === CONSTANTS.equipmentSlot.Weapon) {
                        if (items[gearID].isTwoHanded) {
                            this.equipmentSelectCard.dropDowns[CONSTANTS.equipmentSlot.Shield].selectedIndex = 0;
                            this.equipmentSelected[CONSTANTS.equipmentSlot.Shield] = 0;
                            this.equipmentSelectCard.dropDowns[CONSTANTS.equipmentSlot.Shield].disabled = true;
                        } else {
                            this.equipmentSelectCard.dropDowns[CONSTANTS.equipmentSlot.Shield].disabled = false;
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
                this.simulator.updateEquipmentStats();
                this.updateEquipmentStats();
                this.simulator.updateCombatStats();
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
            getItemName(itemID) {
                if (itemID === 0) {
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
                this.updatePlotData();
                this.updateZoneInfoCard();
                document.getElementById('MCS Simulate Button').disabled = false;
                document.getElementById('MCS Simulate Button').textContent = 'Simulate';
            }

            destroy() {
                this.simulator.simulationWorkers.forEach((worker) => worker.worker.terminate());
                this.newHeading.remove();
                this.tabDiv.remove();
                this.tippySingleton.destroy();
                this.tippyInstances.forEach(instance => instance.destroy());
                $(this.mcsModal).modal('hide');
                $(this.mcsModal).modal('dispose');
                this.mcsModal.remove();
            }
        }
    }

    MICSR.waitLoadOrder(reqs, setup, 'App')

})();