/*  Melvor Idle Combat Simulator

    Copyright (C) <2020>  <Coolrox95>

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
/// <reference path="../typedefs.js" />

(() => {
  const version = 'v1.0.0';

  /**
   * Container Class for the Combat Simulator.
   * A single instance of this is initiated on load.
   */
  class McsApp {
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
        };
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
      this.simulator = new McsSimulator(this, urls.simulationWorker);
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
        <h3 class="block-title">Combat Simulator Reloaded ${version}</h3>
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
        this.mainTabCard = new McsCard(this.topContent, '', '150px', true);
        const mainTabNames = ['Levels', 'Spells', 'Prayers', 'Potions', 'Pets', 'Sim. Options', 'GP Options'];
        const mainTabImages = [this.media.combat, this.media.spellbook, this.media.prayer, this.media.emptyPotion, this.media.pet, this.media.settings, this.media.gp];
        const mainTabCallbacks = mainTabNames.map((_, i) => () => this.mainTabOnClick(i));
        this.mainTabIDs = mainTabNames.map((name) => toId(`${name}-tab`));
        this.mainTabContainer = this.mainTabCard.addTabMenu(mainTabNames, mainTabImages, mainTabCallbacks);
        /** @type {McsCard[]} */
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
        this.equipStatCard = new McsCard(this.topContent, '', '50px', true);
        this.equipStatCard.addSectionTitle('Equipment Stats');
        this.equipStatKeys = [
          'attackSpeed',
          'strengthBonus',
          'attBon0',
          'attBon1',
          'attBon2',
          'rangedAttackBonus',
          'rangedStrengthBonus',
          'magicAttackBonus',
          'magicDamageBonus',
          'defenceBonus',
          'damageReduction',
          'rangedDefenceBonus',
          'magicDefenceBonus',
          'attackLevelRequired',
          'defenceLevelRequired',
          'rangedLevelRequired',
          'magicLevelRequired',
        ];
        const equipStatNames = [
          'Attack Speed',
          'Strength Bonus',
          'Stab Bonus',
          'Slash Bonus',
          'Block Bonus',
          'Attack Bonus',
          'Strength Bonus',
          'Attack Bonus',
          '% Damage Bonus',
          'Defence Bonus',
          'Damage Reduction',
          'Defence Bonus',
          'Defence Bonus',
          'Level Required',
          'Level Required',
          'Level Required',
          'Level Required',
        ];
        const equipStatIcons = [
          this.media.combat,
          this.media.strength,
          this.media.attack,
          this.media.strength,
          this.media.defence,
          this.media.ranged,
          this.media.ranged,
          this.media.magic,
          this.media.magic,
          this.media.defence,
          this.media.defence,
          this.media.ranged,
          this.media.magic,
          this.media.attack,
          this.media.defence,
          this.media.ranged,
          this.media.magic,
        ];
        for (let i = 0; i < equipStatNames.length; i++) {
          this.equipStatCard.addNumberOutput(equipStatNames[i], 0, 20, equipStatIcons[i], `MCS ${this.equipStatKeys[i]} ES Output`);
        }
      }
      // Combat Stat Display Card
      {
        this.combatStatCard = new McsCard(this.topContent, '', '60px', true);
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
        this.exportOptionsCard = new McsCard(this.topContent, '', '100px', true);
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
        this.simOptionsCard = new McsCard(this.mainTabContainer, '', '150px');
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
        this.gpSelectCard = new McsCard(this.mainTabContainer, '', '150px');
        this.mainTabCards.push(this.gpSelectCard);
        this.gpSelectCard.addSectionTitle('GP/s Options');
        this.gpSelectCard.addRadio('Sell Bones', 25, 'sellBones', ['Yes', 'No'], [(e) => this.sellBonesRadioOnChange(e, true), (e) => this.sellBonesRadioOnChange(e, false)], 1);
        this.gpSelectCard.addRadio('Convert Shards', 25, 'convertShards', ['Yes', 'No'], [(e) => this.convertShardsRadioOnChange(e, true), (e) => this.convertShardsRadioOnChange(e, false)], 1);
        this.gpSelectCard.addDropdown('Sell Loot', ['All', 'Subset', 'None'], ['All', 'Subset', 'None'], (e) => this.sellLootDropdownOnChange(e));
        this.gpSelectCard.addButton('Edit Subset', (e) => this.editSubsetButtonOnClick(e));
      }
      // GP/s options card
      {
        this.gpOptionsCard = new McsCard(this.gpSelectCard.container, '', '200px');
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
        this.gpSearchResults = new McsCard(this.gpOptionsCard.container, '130px', '100px');
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
        this.zoneInfoCard = new McsCard(this.botContent, '', '100px', true);
        this.zoneInfoCard.addSectionTitle('Monster/Dungeon Info.', 'MCS Zone Info Title');
        this.infoPlaceholder = this.zoneInfoCard.addInfoText('Click on a bar for detailed information on a Monster/Dungeon!');
        this.subInfoCard = new McsCard(this.zoneInfoCard.container, '', '80px');
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
      this.plotter = new McsPlotter(this, urls.crossedOut);
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
      const tippyOptions = { allowHTML: true, animation: false, hideOnClick: false };
      this.tippyInstances = tippy('#mcsModal [data-tippy-content]', tippyOptions);
      this.plotter.bars.forEach((bar) => {
        this.tippyInstances.concat(tippy(bar, { triggerTarget: bar.parentElement, ...tippyOptions }));
      });
      this.tippySingleton = tippy.createSingleton(this.tippyInstances, { delay: [0, 200], ...tippyOptions });

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
      this.equipmentSelectCard = new McsCard(this.topContent, '', '150px', true);
      const equipmentRows = [
        [CONSTANTS.equipmentSlot.Helmet],
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
      this.levelSelectCard = new McsCard(this.mainTabContainer, '', '150px');
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
      this.spellSelectCard = new McsCard(this.mainTabContainer, '100%', '150px');
      this.mainTabCards.push(this.spellSelectCard);
      this.spellSelectCard.addSectionTitle('Spells');
      this.selectedSpellTab = 0;
      const spellTypeNames = ['Standard', 'Curses', 'Auroras', 'Ancient Magicks'];
      const spellTypeImages = [this.media.spellbook, this.media.curse, this.media.aurora, this.media.ancient];
      const spellTabCallbacks = spellTypeNames.map((_name, index) => {
        return () => this.spellTabOnClick(index);
      });
      this.spellTabIDs = spellTypeNames.map((name) => toId(`${name}-tab`));
      this.spellTabContainer = this.spellSelectCard.addTabMenu(spellTypeNames, spellTypeImages, spellTabCallbacks);
      /** @type {McsCard[]} */
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
     * @return {McsCard} The created spell select card
     */
    createSpellSelectCard(title, spellType) {
      const newCard = new McsCard(this.spellTabContainer, '', '100px');
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
      this.prayerSelectCard = new McsCard(this.mainTabContainer, '', '100px');
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
        prayerBonusAttack: { description: 'Melee Accuracy', isNumeric: true },
        prayerBonusStrength: { description: 'Melee Strength', isNumeric: true },
        prayerBonusDefence: { description: 'Melee Evasion', isNumeric: true },
        prayerBonusAttackRanged: { description: 'Ranged Accuracy', isNumeric: true },
        prayerBonusStrengthRanged: { description: 'Ranged Strength', isNumeric: true },
        prayerBonusDefenceRanged: { description: 'Ranged Evasion', isNumeric: true },
        prayerBonusAttackMagic: { description: 'Magic Accuracy', isNumeric: true },
        prayerBonusDamageMagic: { description: 'Magic Damage', isNumeric: true },
        prayerBonusDefenceMagic: { description: 'Magic Evasion', isNumeric: true },
        prayerBonusProtectItem: { description: 'Keep item on death', isNumeric: false },
        prayerBonusHitpoints: { description: '2x Restore Rate for Hitpoints', isNumeric: false },
        prayerBonusProtectFromMelee: { description: `${protectFromValue}% chance to dodge Melee Attacks`, isNumeric: false },
        prayerBonusProtectFromRanged: { description: `${protectFromValue}% chance to dodge Ranged Attacks`, isNumeric: false },
        prayerBonusProtectFromMagic: { description: `${protectFromValue}% chance to dodge Magic Attacks`, isNumeric: false },
        prayerBonusHitpointHeal: { description: 'Heal +20% HP when HP falls below 10%', isNumeric: false },
        prayerBonusDamageReduction: { description: 'Damage Reduction', isNumeric: true },
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
      this.potionSelectCard = new McsCard(this.mainTabContainer, '', '100px');
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
      this.petSelectCard = new McsCard(this.mainTabContainer, '', '100px');
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
     * @param {McsCard} card The parent card
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
      const equipmentSelectCard = new McsCard(equipmentSelectPopup, '', '600px');
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
        { description: 'Attack Level', property: 'attackLevelRequired' },
        { description: 'Defence Level', property: 'defenceLevelRequired' },
        { description: 'Ranged Level', property: 'rangedLevelRequired' },
        { description: 'Magic Level', property: 'magicLevelRequired' },
        { description: 'Slayer Level', property: 'slayerLevelRequired' },
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
        return;
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
        console.warn('How did you click this?');
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
            outElem.textContent = ((updateInfo) ? mcsFormatNum(this.simulator.dungeonSimData[dungeonID][dataKey] * dataMultiplier, 4) : 'N/A');
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
            outElem.textContent = ((updateInfo) ? mcsFormatNum(this.simulator.monsterSimData[monsterID][dataKey] * dataMultiplier, 4) : 'N/A');
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
      for (let i = 0; i < this.equipStatKeys.length; i++) {
        if (this.equipStatKeys[i] === 'attBon0') {
          newStatValue = this.simulator.equipmentStats.attackBonus[0];
        } else if (this.equipStatKeys[i] === 'attBon1') {
          newStatValue = this.simulator.equipmentStats.attackBonus[1];
        } else if (this.equipStatKeys[i] === 'attBon2') {
          newStatValue = this.simulator.equipmentStats.attackBonus[2];
        } else {
          newStatValue = this.simulator.equipmentStats[this.equipStatKeys[i]];
        }
        document.getElementById(`MCS ${this.equipStatKeys[i]} ES Output`).textContent = newStatValue.toLocaleString();
      }
    }
    /**
     * Updates the text fields for the computed combat stats
     */
    updateCombatStats() {
      this.combatStatKeys.forEach((key) => {
        document.getElementById(`MCS ${key} CS Output`).textContent = this.simulator.combatStats[key].toLocaleString();
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
  /**
   * A Card Class that creates a bar plot
   */
  class McsPlotter {
    /**
     * Consctructs an instance of the plotting class
     * @param {McsApp} parent Reference to container class
     * @param {string} crossedOutURL URL from content script
     */
    constructor(parent, crossedOutURL) {
      this.parent = parent;
      this.barWidth = 20;
      this.barGap = 1;
      this.barImageSrc = [];
      this.barNames = [];
      this.barBottomNames = [];
      this.barBottomLength = [];
      this.barBottomBrackets = [];
      this.plotType = 'xpPerSecond';
      this.plotID = 0;
      this.maskImageFile = crossedOutURL;

      let totBars = 0;

      for (let i = 0; i < combatAreas.length; i++) {
        totBars += combatAreas[i].monsters.length;
        this.barBottomNames.push(combatAreas[i].areaName);
        this.barBottomLength.push(combatAreas[i].monsters.length);
        for (let j = 0; j < combatAreas[i].monsters.length; j++) {
          this.barNames.push(this.parent.getMonsterName(combatAreas[i].monsters[j]));
          this.barImageSrc.push(MONSTERS[combatAreas[i].monsters[j]].media);
        }
      }
      for (let i = 0; i < slayerAreas.length; i++) {
        totBars += slayerAreas[i].monsters.length;
        this.barBottomNames.push(slayerAreas[i].areaName);
        this.barBottomLength.push(slayerAreas[i].monsters.length);
        for (let j = 0; j < slayerAreas[i].monsters.length; j++) {
          this.barNames.push(this.parent.getMonsterName(slayerAreas[i].monsters[j]));
          this.barImageSrc.push(MONSTERS[slayerAreas[i].monsters[j]].media);
        }
      }

      this.barBottomNames.push('Dungeons');
      this.barBottomLength.push(DUNGEONS.length);
      totBars += DUNGEONS.length;
      for (let i = 0; i < DUNGEONS.length; i++) {
        this.barNames.push(this.parent.getDungeonName(i));
        this.barImageSrc.push(DUNGEONS[i].media);
      }

      this.plotContainer = document.createElement('div');
      this.plotContainer.className = 'mcsPlotContainer mcsOuter block block-rounded border-top border-combat border-4x bg-combat-inner-dark';
      this.plotContainer.id = 'MCS Plotter';

      this.plotHeader = document.createElement('div');
      this.plotHeader.className = 'mcsPlotHeader';
      this.plotContainer.appendChild(this.plotHeader);

      const plotHeaderSelects = document.createElement('div');
      plotHeaderSelects.className = 'd-flex mr-auto';
      this.plotHeader.appendChild(plotHeaderSelects);

      // Use a dropdown menu for the plot title
      const skillTypeSelect = document.createElement('select');
      skillTypeSelect.className = 'form-control';
      this.parent.skillKeys.forEach((skillName, index) => {
        const newOption = document.createElement('option');
        newOption.textContent = skillName;
        newOption.value = skillName;
        newOption.id = `MCS ${skillName} Option`;
        skillTypeSelect.appendChild(newOption);
      });
      skillTypeSelect.onchange = (event) => this.parent.petSkillDropdownOnChange(event);
      plotHeaderSelects.appendChild(skillTypeSelect);
      this.petSkillDropdown = skillTypeSelect;

      const plotTypeSelect = document.createElement('select');
      plotTypeSelect.className = 'form-control';
      this.parent.plotTypeDropdownOptions.forEach((value, index) => {
        const newOption = document.createElement('option');
        newOption.textContent = value;
        newOption.value = this.parent.plotTypeDropdownValues[index];
        plotTypeSelect.appendChild(newOption);
      });
      plotTypeSelect.onchange = (event) => this.parent.plottypeDropdownOnChange(event);
      plotHeaderSelects.appendChild(plotTypeSelect);

      this.timeDropdown = document.createElement('select');
      this.timeDropdown.className = 'form-control';
      this.parent.timeOptions.forEach((value, index) => {
        const newOption = document.createElement('option');
        newOption.textContent = value;
        newOption.value = this.parent.timeMultipliers[index];
        this.timeDropdown.appendChild(newOption);
      });
      this.timeDropdown.onchange = (event) => this.parent.timeUnitDropdownOnChange(event);
      plotHeaderSelects.appendChild(this.timeDropdown);

      // Add inspection buttons
      this.inspectButton = document.createElement('button');
      this.inspectButton.className = 'btn btn-primary m-1';
      this.inspectButton.textContent = 'Inspect Dungeon';
      this.inspectButton.style.display = 'none';
      this.inspectButton.onclick = () => {
        this.parent.inspectDungeonOnClick();
      };
      this.plotHeader.appendChild(this.inspectButton);
      this.stopInspectButton = document.createElement('button');
      this.stopInspectButton.className = 'btn btn-primary m-1';
      this.stopInspectButton.textContent = 'Stop Inspecting';
      this.stopInspectButton.style.display = 'none';
      this.stopInspectButton.onclick = () => {
        this.parent.stopInspectOnClick();
      };
      this.plotHeader.appendChild(this.stopInspectButton);

      // Add toggle buttons
      this.toggleMonsterButton = document.createElement('button');
      this.toggleMonsterButton.className = 'btn btn-primary m-1';
      this.toggleMonsterButton.textContent = 'Toggle Monsters';
      this.toggleMonsterButton.onclick = () => {
        this.parent.toggleMonsterSims(false);
      };
      this.plotHeader.appendChild(this.toggleMonsterButton);
      this.toggleDungeonButton = document.createElement('button');
      this.toggleDungeonButton.className = 'btn btn-primary m-1';
      this.toggleDungeonButton.textContent = 'Toggle Dungeons';
      this.toggleDungeonButton.onclick = () => {
        this.parent.toggleDungeonSims(false);
      };
      this.plotHeader.appendChild(this.toggleDungeonButton);

      this.plotTopContainer = document.createElement('div');
      this.plotTopContainer.className = 'mcsPlotTopContainer';
      this.plotTopContainer.id = 'MCS Plotter Top Container';
      this.plotContainer.appendChild(this.plotTopContainer);

      this.yAxis = document.createElement('div');
      this.yAxis.id = 'MCS Plotter Y-Axis';
      this.yAxis.className = 'mcsYAxis';
      this.plotTopContainer.appendChild(this.yAxis);

      this.plotBox = document.createElement('div');
      this.plotBox.className = 'mcsPlotBox';
      this.plotTopContainer.appendChild(this.plotBox);

      this.xAxis = document.createElement('div');
      this.xAxis.className = 'mcsXAxis';
      this.xAxis.id = 'MCS Plotter X-Axis';
      this.plotContainer.appendChild(this.xAxis);

      // Do Gridlines
      this.gridLine = [];
      for (let i = 0; i < 20; i++) {
        this.gridLine.push(document.createElement('div'));
        this.gridLine[i].className = 'mcsGridline';
        this.gridLine[i].setAttribute('style', `bottom: ${(i + 1) * 5}%;`);
        this.plotBox.appendChild(this.gridLine[i]);
      }

      // Do Bars and images
      this.xAxisImages = [];
      this.xAxisCrosses = [];
      this.xAxisContainers = [];
      this.bars = [];
      for (let i = 0; i < totBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'mcsBar';
        bar.style.height = 0;
        const barContainer = document.createElement('div');
        barContainer.className = 'mcs-bar-container';
        barContainer.appendChild(bar);
        this.bars.push(bar);
        this.plotBox.appendChild(barContainer);

        const imageContainer = document.createElement('div');
        imageContainer.className = 'mcsXAxisImageContainer';
        imageContainer.onclick = () => this.parent.barImageOnClick(i);
        this.xAxisContainers.push(imageContainer);

        this.xAxisImages.push(document.createElement('img'));
        this.xAxisImages[i].className = 'mcsXAxisImage';
        this.xAxisImages[i].src = this.barImageSrc[i];

        const newCross = document.createElement('img');
        newCross.src = this.maskImageFile;
        newCross.className = 'mcsCross';
        newCross.style.display = 'none';
        this.xAxisCrosses.push(newCross);

        imageContainer.appendChild(this.xAxisImages[i]);
        imageContainer.appendChild(newCross);
        this.xAxis.appendChild(imageContainer);
      }

      // Do Second descriptions
      let botLength = 0;
      this.barBottomDivs = [];
      let divi = 0;
      for (let i = this.barBottomNames.length - 1; i > -1; i--) {
        this.barBottomDivs.push(document.createElement('div'));
        this.barBottomDivs[divi].appendChild(document.createTextNode(this.barBottomNames[i]));
        this.barBottomDivs[divi].className = 'mcsPlotLabel';
        this.barBottomDivs[divi].style.right = `${100 * botLength / totBars + 50 * this.barBottomLength[i] / totBars}%`;
        this.xAxis.appendChild(this.barBottomDivs[divi]);
        const newSect = document.createElement('div');
        newSect.className = 'mcsXAxisSection';
        newSect.style.width = `${100 * this.barBottomLength[i] / totBars}%`;
        newSect.style.right = `${100 * botLength / totBars}%`;
        if (i === 0) {
          newSect.style.borderLeftStyle = 'solid';
        }
        this.barBottomBrackets.push(newSect);
        this.xAxis.appendChild(newSect);
        botLength += this.barBottomLength[i];
        divi++;
      }

      // Do ticktext
      this.tickText = [];
      for (let i = 0; i < 21; i++) {
        this.tickText.push(document.createElement('div'));
        this.tickText[i].className = 'mcsTicktext';
        this.tickText[i].setAttribute('style', `height: 5%; bottom: ${i * 5 - 2.5}%;`);
        this.tickText[i].appendChild(document.createTextNode(mcsFormatNum(i * 0.05, 4)));
        this.yAxis.appendChild(this.tickText[i]);
      }

      this.parent.botContent.appendChild(this.plotContainer);

      // Data for displaying dungeons
      this.dungeonDisplayData = DUNGEONS.map((dungeon) =>
        dungeon.monsters.map((monster) => ({
          monsterID: monster,
          imageSource: MONSTERS[monster].media,
          name: MONSTERS[monster].name,
        }))
      );
    }

    /**
     * Toggles the display of a bar tooltip on
     * @param {number} id The ID of the bar
     */
    barOnMouseOver(id) {
      this.barTooltips[id].style.display = 'block';
    }

    /**
     * Toggles the display of a bar tooltip off
     * @param {number} id The ID of the bar
     */
    barOnMouseOut(id) {
      this.barTooltips[id].style.display = 'none';
    }

    /**
     * Changes the displayed data
     * @param {number[]} barData The new data to diplay
     */
    updateBarData(barData) {
      const enterSet = this.parent.simulator.getEnterSet();
      let barMax = 0;
      for (let i = 0; i < this.bars.length; i++) {
        this.bars[i].className = 'mcsBar';
        if (!enterSet[i]) {
          this.bars[i].classList.add('mcsBarCantEnter');
        }
        if (i < barData.length && barData[i] > barMax) {
          barMax = barData[i];
        }
      }
      if (!this.parent.isViewingDungeon) {
        for (let i = 0; i < barData.length; i++) {
          if (Math.abs(barData[i] - barMax) < 0.0000001) {
            this.bars[i].classList.add('mcs-bar-max');
          }
        }
      }

      let division;
      let Ndivs;
      let divMax;
      let divPower;
      let closestRatio;
      let divDecimals = 1;
      if (barMax !== 0) {
        const divRatio = barMax / Math.pow(10, Math.floor(Math.log10(barMax)) + 1);
        if (divRatio >= 0.5) {
          closestRatio = 0.5;
        } else if (divRatio >= 0.25) {
          closestRatio = 0.25;
          divDecimals = 2;
        } else if (divRatio >= 0.2) {
          closestRatio = 0.2;
        } else if (divRatio >= 0.1) {
          closestRatio = 0.1;
        }
        divPower = Math.floor(Math.log10(barMax));
        division = closestRatio * Math.pow(10, divPower);
        Ndivs = Math.ceil(barMax / division);
        divMax = Ndivs * division;
      } else {
        divMax = 1;
        divPower = 0;
        Ndivs = 10;
        division = 0.1;
        closestRatio = 0.1;
      }
      // Modify in reverse
      const numBars = this.bars.length;
      const numData = barData.length;
      for (let i = 0; i < numData; i++) {
        const dataIndex = numData - i - 1;
        const barIndex = numBars - i - 1;
        this.bars[barIndex].style.height = `${barData[dataIndex] / divMax * 100}%`;

        let barName = '';
        if (!this.parent.isViewingDungeon && this.parent.barIsDungeon[barIndex]) {
          barName = DUNGEONS[this.parent.barMonsterIDs[barIndex]].name;
        } else {
          if (this.parent.isViewingDungeon) {
            barName = MONSTERS[DUNGEONS[this.parent.viewedDungeonID].monsters[barIndex + DUNGEONS[this.parent.viewedDungeonID].monsters.length - this.bars.length]].name;
          } else {
            barName = MONSTERS[this.parent.barMonsterIDs[barIndex]].name;
          }
        }

        this.bars[barIndex]._tippy.setContent(`<div class="text-center">${barName}<br><span class="text-info">${mcsFormatNum(barData[dataIndex], 4)}</span></div>`);
      }
      for (let i = 0; i < 20; i++) {
        if (i < (Ndivs - 1)) {
          this.gridLine[i].style.display = 'block';
          this.gridLine[i].style.bottom = `${(i + 1) * 100 / Ndivs}%`;
        } else {
          this.gridLine[i].style.display = 'none';
        }
      }
      let formatEnd = '';
      // Use toFixed for tick marks
      if (divPower > 2) {
        formatEnd = ['k', 'M', 'B', 'T'][Math.floor(divPower / 3) - 1];
      }
      if (divPower >= 0) {
        const powerLeft = divPower % 3;
        closestRatio *= Math.pow(10, powerLeft);
      } else {
        closestRatio *= Math.pow(10, divPower);
        divDecimals -= divPower;
      }

      for (let i = 0; i < 21; i++) {
        if (i < (Ndivs + 1)) {
          this.tickText[i].style.display = 'block';
          this.tickText[i].style.bottom = `${i * 100 / Ndivs - 2.5}%`;
          this.tickText[i].textContent = `${(i * closestRatio).toLocaleString(undefined, { maximumFractionDigits: divDecimals, minimumFractionDigits: divDecimals })}${formatEnd}`;
        } else {
          this.tickText[i].style.display = 'none';
        }
      }
    }

    /**
     * Changes the plot display to non-dungeon monsters and dungeon summary
     */
    displayGeneral() {
      for (let i = 0, numBars = this.bars.length; i < numBars; i++) {
        // Change image source
        this.xAxisContainers[i].style.display = '';
        this.xAxisImages[i].setAttribute('src', this.barImageSrc[i]);
        this.bars[i].style.display = '';
      }
      this.showZoneLabels();
      this.crossImagesPerSetting();
      this.stopInspectButton.style.display = 'none';
      this.toggleDungeonButton.style.display = '';
      this.toggleMonsterButton.style.display = '';
    }
    /**
     * Changes the plot display to individual dungeon monsters
     * @param {number} dungeonID The index of DUNGEONS
     */
    displayDungeon(dungeonID) {
      // Loop through each bar and enable/disable as required
      // Change Images at bottom
      // Toggle Zone Labels
      // Toggle display of bars
      // Remove the white border stuff
      for (let i = 0; i < this.bars.length; i++) {
        if (i < DUNGEONS[dungeonID].monsters.length) {
          // Change image source
          this.xAxisContainers[i].style.display = '';
          this.xAxisImages[i].setAttribute('src', this.dungeonDisplayData[dungeonID][i].imageSource);
          this.bars[this.bars.length - i - 1].style.display = '';
        } else {
          // Disable Bar and images
          this.xAxisContainers[i].style.display = 'none';
          this.bars[this.bars.length - i - 1].style.display = 'none';
        }
      }
      this.hideZoneLabels();
      this.unCrossAllImages();
      this.inspectButton.style.display = 'none';
      this.stopInspectButton.style.display = '';
      this.toggleDungeonButton.style.display = 'none';
      this.toggleMonsterButton.style.display = 'none';
    }
    /**
     * Turns the crossout overlay on for a monster/dungeon image
     * @param {number} imageID the index of the cross
     */
    crossOutBarImage(imageID) {
      this.xAxisCrosses[imageID].style.display = '';
    }
    /**
     * Turns the crossout overlay off for a monster/dungeon image
     * @param {number} imageID The index of the cross
     */
    unCrossOutBarImage(imageID) {
      this.xAxisCrosses[imageID].style.display = 'none';
    }
    /**
     * Toggles the display of the area/dungeon labels off
     */
    hideZoneLabels() {
      this.barBottomDivs.forEach((bottomDiv) => {
        bottomDiv.style.display = 'none';
      });
      this.barBottomBrackets.forEach((bracket) => {
        bracket.style.display = 'none';
      });
    }
    /**
     * Toggles the display of the area/dungeon labels on
     */
    showZoneLabels() {
      this.barBottomDivs.forEach((bottomDiv) => {
        bottomDiv.style.display = '';
      });
      this.barBottomBrackets.forEach((bracket) => {
        bracket.style.display = '';
      });
    }
    /**
     * Toggles the crossout overlay off for all images
     */
    unCrossAllImages() {
      this.xAxisCrosses.forEach((cross) => {
        cross.style.display = 'none';
      });
    }
    /**
     * Toggles the crossout overlay on/off depending on whether it is simulated or not
     */
    crossImagesPerSetting() {
      for (let i = 0; i < this.parent.barIsDungeon.length; i++) {
        if (this.parent.barIsDungeon[i] && !this.parent.simulator.dungeonSimFilter[this.parent.barMonsterIDs[i]]) {
          this.xAxisCrosses[i].style.display = '';
        } else if (!this.parent.barIsDungeon[i] && !this.parent.simulator.monsterSimFilter[this.parent.barMonsterIDs[i]]) {
          this.xAxisCrosses[i].style.display = '';
        } else {
          this.xAxisCrosses[i].style.display = 'none';
        }
      }
    }
  }

  /**
   * Simulator class, used for all simulation work, and storing simulation results and settings
   */
  class McsSimulator {
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
      this.equipmentStats;
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
      this.petOwned = PETS.map(() => {
        return false;
      });
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
      this.maxActions = 1000;
      /** Number of enemy kills to simulate */
      this.trials = 10000;
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
          xpPerEnemy: 0,
          xpPerSecond: 0,
          xpPerHit: 0,
          hpxpPerEnemy: 0,
          hpxpPerSecond: 0,
          hpPerEnemy: 0,
          hpPerSecond: 0,
          dmgPerSecond: 0,
          avgKillTime: 0,
          attacksMade: 0,
          avgHitDmg: 0,
          killTimeS: 0,
          killsPerSecond: 0,
          gpPerKill: 0,
          gpPerSecond: 0,
          prayerXpPerEnemy: 0,
          prayerXpPerSecond: 0,
          slayerXpPerSecond: 0,
          ppConsumedPerSecond: 0,
          herbloreXPPerSecond: 0,
          signetChance: 0,
          gpFromDamage: 0,
          attacksTaken: 0,
          attacksTakenPerSecond: 0,
          attacksMadePerSecond: 0,
          simulationTime: 0,
          petRolls: [],
          petChance: 0,
        });
        this.monsterSimFilter.push(true);
      }
      this.dungeonSimData = [];
      for (let i = 0; i < DUNGEONS.length; i++) {
        this.dungeonSimData.push({
          simSuccess: false,
          xpPerSecond: 0,
          xpPerHit: 0,
          hpxpPerSecond: 0,
          hpPerEnemy: 0,
          hpPerSecond: 0,
          dmgPerSecond: 0,
          avgKillTime: 0,
          attacksMade: 0,
          avgHitDmg: 0,
          killTimeS: 0,
          gpPerKill: 0,
          gpPerSecond: 0,
          prayerXpPerSecond: 0,
          slayerXpPerSecond: 0,
          ppConsumedPerSecond: 0,
          herbloreXPPerSecond: 0,
          signetChance: 0,
          gpFromDamage: 0,
          attacksTaken: 0,
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
        gpBonus: 1,
        lootBonus: 1,
        slayerXPBonus: 0,
        canTopazDrop: false,
        herbConvertChance: 0,
        doBonesAutoBury: false,
        /** @type {PlayerStats} */
        playerStats: {
          activeItems: {},
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
              const blob = new Blob([event.currentTarget.responseText], { type: 'application/javascript' });
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
        console.log('An error occured in a simulation worker');
        console.log(event);
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
        warlockAmulet: items[CONSTANTS.item.Warlock_Amulet],
        CURSEIDS: CONSTANTS.curse,
      });
    }

    /**
    * Calculates the equipment's combined stats and stores them in `this.equipmentStats`
    */
    updateEquipmentStats() {
      /** @type {EquipmentStats} */
      const equipmentStats = {
        attackSpeed: 4000,
        strengthBonus: 0,
        attackBonus: [0, 0, 0],
        rangedAttackBonus: 0,
        rangedStrengthBonus: 0,
        magicAttackBonus: 0,
        magicDamageBonus: 0,
        defenceBonus: 0,
        damageReduction: 0,
        rangedDefenceBonus: 0,
        magicDefenceBonus: 0,
        attackLevelRequired: 1,
        defenceLevelRequired: 1,
        rangedLevelRequired: 1,
        magicLevelRequired: 1,
        slayerXPBonus: 0,
        chanceToDoubleLoot: 0,
        maxHitpointsBonus: 0,
        increasedMinSpellDmg: [0, 0, 0, 0],
      };

      for (let equipmentSlot = 0; equipmentSlot < this.parent.equipmentSlotKeys.length; equipmentSlot++) {
        const itemID = this.parent.equipmentSelected[equipmentSlot];
        if (itemID === 0) {
          continue;
        }
        const item = items[itemID];

        equipmentStats.strengthBonus += item.strengthBonus || 0;
        equipmentStats.magicAttackBonus += item.magicAttackBonus || 0;
        equipmentStats.magicDamageBonus += item.magicDamageBonus || 0;
        equipmentStats.defenceBonus += item.defenceBonus || 0;
        equipmentStats.damageReduction += item.damageReduction || 0;
        equipmentStats.magicDefenceBonus += item.magicDefenceBonus || 0;
        equipmentStats.slayerXPBonus += item.slayerBonusXP || 0;
        equipmentStats.chanceToDoubleLoot += item.chanceToDoubleLoot || 0;
        equipmentStats.maxHitpointsBonus += item.increasedMaxHitpoints || 0;
        equipmentStats.increasedMinSpellDmg[CONSTANTS.spellType.Air] += item.increasedMinAirSpellDmg || 0;
        equipmentStats.increasedMinSpellDmg[CONSTANTS.spellType.Water] += item.increasedMinWaterSpellDmg || 0;
        equipmentStats.increasedMinSpellDmg[CONSTANTS.spellType.Earth] += item.increasedMinEarthSpellDmg || 0;
        equipmentStats.increasedMinSpellDmg[CONSTANTS.spellType.Fire] += item.increasedMinFireSpellDmg || 0;

        if (item.attackBonus) {
          for (let j = 0; j < 3; j++) {
            equipmentStats.attackBonus[j] += item.attackBonus[j];
          }
        }
        if (!(equipmentSlot === CONSTANTS.equipmentSlot.Weapon && item.isAmmo)) {
          equipmentStats.rangedAttackBonus += item.rangedAttackBonus || 0;
          equipmentStats.rangedStrengthBonus += item.rangedStrengthBonus || 0;
          equipmentStats.rangedDefenceBonus += item.rangedDefenceBonus || 0;
        }
        if (equipmentSlot === CONSTANTS.equipmentSlot.Weapon) {
          equipmentStats.attackSpeed = item.attackSpeed || 4000;
        }

        if (item.attackLevelRequired > equipmentStats.attackLevelRequired) {
          equipmentStats.attackLevelRequired = item.attackLevelRequired;
        }
        if (item.rangedLevelRequired > equipmentStats.rangedLevelRequired) {
          equipmentStats.rangedLevelRequired = item.rangedLevelRequired;
        }
        if (item.magicLevelRequired > equipmentStats.magicLevelRequired) {
          equipmentStats.magicLevelRequired = item.magicLevelRequired;
        }
        if (item.defenceLevelRequired > equipmentStats.defenceLevelRequired) {
          equipmentStats.defenceLevelRequired = item.defenceLevelRequired;
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
      let attackStyleBonus = 1;
      let meleeDefenceBonus = 1;
      const weaponID = this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon];
      if ((items[weaponID].type === 'Ranged Weapon') || items[weaponID].isRanged) {
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
        effectiveAttackLevel = Math.floor(this.playerLevels.Magic + 8 + attackStyleBonus);
        this.combatStats.maxAttackRoll = Math.floor(effectiveAttackLevel * (this.equipmentStats.magicAttackBonus + 64) * (1 + (this.prayerBonus.magicAccuracy / 100)) * (1 + this.herbloreBonus.magicAccuracy / 100));
        if (this.spells.standard.isSelected) {
          this.combatStats.maxHit = Math.floor(numberMultiplier * ((SPELLS[this.spells.standard.selectedID].maxHit + SPELLS[this.spells.standard.selectedID].maxHit * (this.equipmentStats.magicDamageBonus / 100)) * (1 + (this.playerLevels.Magic + 1) / 200) * (1 + this.prayerBonus.magicDamage / 100) * (1 + this.herbloreBonus.magicDamage / 100)));
          this.combatStats.minHit = this.equipmentStats.increasedMinSpellDmg[SPELLS[this.spells.standard.selectedID].spellType];
          // Cloudburst Water Spell Bonus
          if (this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon] === CONSTANTS.item.Cloudburst_Staff && SPELLS[this.spells.standard.selectedID].spellType === CONSTANTS.spellType.Water) {
            this.combatStats.maxHit += items[CONSTANTS.item.Cloudburst_Staff].increasedWaterSpellDamage * numberMultiplier;
          }
        } else {
          this.combatStats.maxHit = ANCIENT[this.spells.ancient.selectedID].maxHit * numberMultiplier;
        }
        this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
      } else {
        // Melee
        this.combatStats.attackType = CONSTANTS.attackType.Melee;
        if (this.petOwned[12]) attackStyleBonus += 3;
        effectiveAttackLevel = Math.floor(this.playerLevels.Attack + 8 + attackStyleBonus);
        this.combatStats.maxAttackRoll = Math.floor(effectiveAttackLevel * (this.equipmentStats.attackBonus[this.attackStyle.Melee] + 64) * (1 + (this.prayerBonus.meleeAccuracy / 100)) * (1 + this.herbloreBonus.meleeAccuracy / 100));
        let strengthLevelBonus = 1;
        if (this.petOwned[13]) strengthLevelBonus += 3;
        effectiveStrengthLevel = Math.floor(this.playerLevels.Strength + 8 + strengthLevelBonus);
        this.combatStats.maxHit = Math.floor(numberMultiplier * ((1.3 + effectiveStrengthLevel / 10 + this.equipmentStats.strengthBonus / 80 + effectiveStrengthLevel * this.equipmentStats.strengthBonus / 640) * (1 + (this.prayerBonus.meleeDamage / 100)) * (1 + this.herbloreBonus.meleeStrength / 100)));
        this.combatStats.attackSpeed = this.equipmentStats.attackSpeed;
      }
      const effectiveDefenceLevel = Math.floor(this.playerLevels.Defence + 8 + meleeDefenceBonus);
      this.combatStats.maxDefRoll = Math.floor(effectiveDefenceLevel * (this.equipmentStats.defenceBonus + 64) * (1 + (this.prayerBonus.meleeEvasion) / 100) * (1 + this.herbloreBonus.meleeEvasion / 100));
      const effectiveRngDefenceLevel = Math.floor(this.playerLevels.Defence + 8 + 1);
      this.combatStats.maxRngDefRoll = Math.floor(effectiveRngDefenceLevel * (this.equipmentStats.rangedDefenceBonus + 64) * (1 + (this.prayerBonus.rangedEvasion) / 100) * (1 + this.herbloreBonus.rangedEvasion / 100));
      const effectiveMagicDefenceLevel = Math.floor(this.playerLevels.Magic * 0.7 + this.playerLevels.Defence * 0.3 + 9);
      this.combatStats.maxMagDefRoll = Math.floor(effectiveMagicDefenceLevel * (this.equipmentStats.magicDefenceBonus + 64) * (1 + (this.prayerBonus.magicEvasion / 100)) * (1 + this.herbloreBonus.magicEvasion / 100));
      // Update aurora bonuses
      this.computeAuroraBonus();
      if (this.auroraBonus.meleeEvasionBuff !== 0) this.combatStats.maxDefRoll = Math.floor(this.combatStats.maxDefRoll * (1 + this.auroraBonus.meleeEvasionBuff / 100));
      if (this.auroraBonus.rangedEvasionBuff !== 0) this.combatStats.maxRngDefRoll = Math.floor(this.combatStats.maxRngDefRoll * (1 + this.auroraBonus.rangedEvasionBuff / 100));
      if (this.auroraBonus.magicEvasionBuff !== 0) this.combatStats.maxMagDefRoll = Math.floor(this.combatStats.maxMagDefRoll * (1 + this.auroraBonus.magicEvasionBuff / 100));
      if (this.auroraBonus.increasedMaxHit !== 0 && this.spells.standard.isSelected) this.combatStats.maxHit += this.auroraBonus.increasedMaxHit;
      if (this.auroraBonus.increasedMinHit !== 0 && this.spells.standard.isSelected) this.combatStats.minHit += this.auroraBonus.increasedMinHit;
      // Calculate damage reduction
      this.combatStats.damageReduction = this.equipmentStats.damageReduction + this.herbloreBonus.damageReduction + this.prayerBonus.damageReduction;
      if (this.petOwned[14]) this.combatStats.damageReduction++;
      // Max Hitpoints
      this.combatStats.maxHitpoints = this.playerLevels.Hitpoints + this.equipmentStats.maxHitpointsBonus;
      if (this.petOwned[15]) this.combatStats.maxHitpoints++;
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
      if (this.combatStats.attackType === CONSTANTS.attackType.Magic && this.spells.aurora.isSelected) {
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
            console.error(`Unknown Potion Bonus: ${bonusID}`);
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

    /**
    * Iterate through all the combatAreas and DUNGEONS to create a set of monsterSimData and dungeonSimData
    */
    simulateCombat() {
      this.simStartTime = performance.now();
      this.simCancelled = false;
      // Start by grabbing the player stats
      const maxCape = this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Cape] === CONSTANTS.item.Max_Skillcape || this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Cape] === CONSTANTS.item.Cape_of_Completion;
      /** @type {PlayerStats} */
      const playerStats = {
        attackSpeed: this.combatStats.attackSpeed,
        attackType: this.combatStats.attackType,
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
        usingAncient: false,
        hasSpecialAttack: false,
        specialData: {},
        startingGP: 50000000,
        levels: Object.assign({}, this.playerLevels), // Shallow copy of player levels
        activeItems: {
          hitpointsSkillcape: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Cape] === CONSTANTS.item.Hitpoints_Skillcape || maxCape,
          rangedSkillcape: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Cape] === CONSTANTS.item.Ranged_Skillcape || maxCape,
          magicSkillcape: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Cape] === CONSTANTS.item.Magic_Skillcape || maxCape,
          prayerSkillcape: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Cape] === CONSTANTS.item.Prayer_Skillcape || maxCape,
          slayerSkillcape: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Cape] === CONSTANTS.item.Slayer_Skillcape || maxCape,
          firemakingSkillcape: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Cape] === CONSTANTS.item.Firemaking_Skillcape || maxCape,
          capeOfArrowPreservation: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Cape] === CONSTANTS.item.Cape_of_Arrow_Preservation,
          skullCape: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Cape] === CONSTANTS.item.Skull_Cape,
          goldRubyRing: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Ring] === CONSTANTS.item.Gold_Ruby_Ring,
          goldDiamondRing: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Ring] === CONSTANTS.item.Gold_Diamond_Ring,
          goldEmeraldRing: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Ring] === CONSTANTS.item.Gold_Emerald_Ring,
          goldSapphireRing: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Ring] === CONSTANTS.item.Gold_Sapphire_Ring,
          fighterAmulet: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Amulet] === CONSTANTS.item.Fighter_Amulet && this.combatStats.attackType === CONSTANTS.attackType.Melee,
          warlockAmulet: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Amulet] === CONSTANTS.item.Warlock_Amulet && this.combatStats.attackType === CONSTANTS.attackType.Magic,
          guardianAmulet: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Amulet] === CONSTANTS.item.Guardian_Amulet,
          deadeyeAmulet: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Amulet] === CONSTANTS.item.Deadeye_Amulet && this.combatStats.attackType === CONSTANTS.attackType.Ranged,
          confettiCrossbow: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon] === CONSTANTS.item.Confetti_Crossbow,
          stormsnap: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon] === CONSTANTS.item.Stormsnap,
          slayerCrossbow: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon] === CONSTANTS.item.Slayer_Crossbow,
          bigRon: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon] === CONSTANTS.item.Big_Ron,
          mirrorShield: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Shield] === CONSTANTS.item.Mirror_Shield,
          magicalRing: this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Ring] === CONSTANTS.item.Magical_Ring,
        },
        prayerPointsPerAttack: 0,
        prayerPointsPerEnemy: 0,
        prayerPointsPerHeal: 0,
        prayerXpPerDamage: 0,
        isProtected: false,
        hardcore: this.isHardcore,
        lifesteal: this.auroraBonus.lifesteal,
        attackSpeedDecrease: this.auroraBonus.attackSpeedBuff,
        canCurse: false,
        curseID: -1,
        curseData: {},
      };
      // Special Attack and Ancient Magicks
      if (this.combatStats.attackType === CONSTANTS.attackType.Magic && this.spells.ancient.isSelected) {
        playerStats.usingAncient = true;
        playerStats.specialData = playerSpecialAttacks[ANCIENT[this.spells.ancient.selectedID].specID];
      } else if (items[this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon]].hasSpecialAttack) {
        playerStats.hasSpecialAttack = true;
        playerStats.specialData = playerSpecialAttacks[items[this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Weapon]].specialAttackID];
      }
      // Curses
      if (this.combatStats.attackType === CONSTANTS.attackType.Magic && !this.spells.ancient.isSelected && this.spells.curse.isSelected) {
        playerStats.canCurse = true;
        playerStats.curseID = this.spells.curse.selectedID;
        playerStats.curseData = CURSES[this.spells.curse.selectedID];
      }
      // Regen Calculation
      if (!this.isHardcore) {
        playerStats.avgHPRegen = 1 + Math.floor(this.combatStats.maxHitpoints / 10 / numberMultiplier);
        if (playerStats.activeItems.hitpointsSkillcape) {
          playerStats.avgHPRegen += 1 * numberMultiplier;
        }
        if (this.prayerSelected[CONSTANTS.prayer.Rapid_Heal]) playerStats.avgHPRegen *= 2;
        playerStats.avgHPRegen *= (1 + this.herbloreBonus.hpRegen / 100);
        if (playerStats.activeItems.goldRubyRing) {
          playerStats.avgHPRegen = Math.floor(playerStats.avgHPRegen * (1 + items[CONSTANTS.item.Gold_Ruby_Ring].hpRegenBonus / 100));
        }
      }
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
      if (this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Ring] === CONSTANTS.item.Gold_Topaz_Ring) {
        this.currentSim.gpBonus = 1.15;
        this.currentSim.canTopazDrop = true;
      } else if (this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Ring] === CONSTANTS.item.Aorpheats_Signet_Ring) {
        this.currentSim.gpBonus = 2;
      } else {
        this.currentSim.gpBonus = 1;
      }
      Object.assign(this.currentSim.equipmentStats, this.equipmentStats);
      this.currentSim.lootBonus = 1 + this.equipmentStats.chanceToDoubleLoot / 100;
      if (this.petOwned[20]) this.currentSim.lootBonus += 0.01;
      this.currentSim.slayerXPBonus = this.equipmentStats.slayerXPBonus;
      this.currentSim.herbConvertChance = this.herbloreBonus.luckyHerb / 100;
      this.currentSim.doBonesAutoBury = (this.parent.equipmentSelected[CONSTANTS.equipmentSlot.Amulet] === CONSTANTS.item.Bone_Necklace);
      // Compute prayer point usage and xp gain
      const hasPrayerCape = playerStats.activeItems.prayerSkillcape;
      for (let i = 0; i < PRAYER.length; i++) {
        if (this.prayerSelected[i]) {
          // Point Usage
          if (hasPrayerCape) {
            let attQty = Math.floor(PRAYER[i].pointsPerPlayer / 2);
            if (attQty === 0 && PRAYER[i].pointsPerPlayer !== 0) {
              attQty = 1;
            }
            let enemyQty = Math.floor(PRAYER[i].pointsPerEnemy / 2);
            if (enemyQty === 0 && PRAYER[i].pointsPerEnemy !== 0) {
              enemyQty = 1;
            }
            let healQty = Math.floor(PRAYER[i].pointsPerRegen / 2);
            if (healQty === 0 && PRAYER[i].pointsPerRegen !== 0) {
              healQty = 1;
            }
            playerStats.prayerPointsPerAttack += attQty;
            playerStats.prayerPointsPerEnemy += enemyQty;
            playerStats.prayerPointsPerHeal += healQty;
          } else {
            playerStats.prayerPointsPerAttack += PRAYER[i].pointsPerPlayer;
            playerStats.prayerPointsPerEnemy += PRAYER[i].pointsPerEnemy;
            playerStats.prayerPointsPerHeal += PRAYER[i].pointsPerRegen;
          }
          // XP Gain
          playerStats.prayerXpPerDamage += 2 * PRAYER[i].pointsPerPlayer / numberMultiplier;
        }
      }
      if (this.petOwned[18]) {
        playerStats.prayerPointsPerAttack *= 0.95;
        playerStats.prayerPointsPerEnemy *= 0.95;
        playerStats.prayerPointsPerHeal *= 0.95;
      }
      playerStats.prayerPointsPerAttack *= (1 - this.herbloreBonus.divine / 100);
      playerStats.prayerPointsPerEnemy *= (1 - this.herbloreBonus.divine / 100);
      playerStats.prayerPointsPerHeal *= (1 - this.herbloreBonus.divine / 100);
      this.currentSim.options = {
        trials: this.trials,
        maxActions: this.maxActions,
      };
      this.currentSim.playerStats = playerStats;
      this.currentSim.isSlayerTask = this.isSlayerTask;
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
            this.simulationQueue.push({ monsterID: monsterID });
          }
        });
      });
      // Queue simulation of monsters in slayer areas
      slayerAreas.forEach((area) => {
        area.monsters.forEach((monsterID) => {
          if (this.monsterSimFilter[monsterID] && !this.monsterSimData[monsterID].inQueue) {
            this.monsterSimData[monsterID].inQueue = true;
            this.simulationQueue.push({ monsterID: monsterID });
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
              this.simulationQueue.push({ monsterID: monsterID });
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
      // Start simulation workers
      document.getElementById('MCS Simulate Button').textContent = `Cancel (0/${this.simulationQueue.length})`;
      this.initializeSimulationJobs();
    }

    /**
     * Gets the stats of a monster
     * @param {number} monsterID
     * @return {enemyStats}
     */
    getEnemyStats(monsterID) {
      /** @type {enemyStats} */
      const enemyStats = {
        hitpoints: 0,
        attackSpeed: 0,
        attackType: 0,
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
      // Calculate Enemy Stats
      enemyStats.hitpoints = MONSTERS[monsterID].hitpoints * numberMultiplier;
      enemyStats.attackSpeed = MONSTERS[monsterID].attackSpeed;
      const effectiveDefenceLevel = Math.floor(MONSTERS[monsterID].defenceLevel + 8 + 1);
      enemyStats.maxDefRoll = effectiveDefenceLevel * (MONSTERS[monsterID].defenceBonus + 64);

      const effectiveRangedDefenceLevel = Math.floor(MONSTERS[monsterID].defenceLevel + 8 + 1);
      enemyStats.maxRngDefRoll = effectiveRangedDefenceLevel * (MONSTERS[monsterID].defenceBonusRanged + 64);
      const effectiveMagicDefenceLevel = Math.floor((Math.floor(MONSTERS[monsterID].magicLevel * 0.7) + Math.floor(MONSTERS[monsterID].defenceLevel * 0.3)) + 8 + 1);
      enemyStats.maxMagDefRoll = effectiveMagicDefenceLevel * (MONSTERS[monsterID].defenceBonusMagic + 64);
      enemyStats.attackType = MONSTERS[monsterID].attackType;

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
      let totXp = 0;
      let totHpXp = 0;
      let totPrayXP = 0;
      let totHits = 0;
      let totHP = 0;
      let totEnemyHP = 0;
      let totTime = 0;
      let totPrayerPoints = 0;
      let totalGPFromDamage = 0;
      let totalAttacksTaken = 0;
      let totalSimTime = 0;
      for (let dungeonId = 0; dungeonId < DUNGEONS.length; dungeonId++) {
        if (this.dungeonSimFilter[dungeonId]) {
          this.dungeonSimData[dungeonId].simSuccess = true;
          totXp = 0;
          totHpXp = 0;
          totPrayXP = 0;
          totHits = 0;
          totHP = 0;
          totEnemyHP = 0;
          totPrayerPoints = 0;
          totTime = 0;
          totalGPFromDamage = 0;
          totalAttacksTaken = 0;
          totalSimTime = 0;
          for (let i = 0; i < DUNGEONS[dungeonId].monsters.length; i++) {
            const monsterId = DUNGEONS[dungeonId].monsters[i];
            totXp += this.monsterSimData[monsterId].xpPerEnemy;
            totHpXp += this.monsterSimData[monsterId].hpxpPerEnemy;
            totPrayXP += this.monsterSimData[monsterId].prayerXpPerEnemy;
            totHits += this.monsterSimData[monsterId].attacksMade;
            totHP += this.monsterSimData[monsterId].hpPerEnemy;
            totEnemyHP += MONSTERS[monsterId].hitpoints * numberMultiplier;
            totTime += this.monsterSimData[monsterId].avgKillTime;
            totPrayerPoints += this.monsterSimData[monsterId].ppConsumedPerSecond * this.monsterSimData[monsterId].killTimeS;
            totalGPFromDamage += this.monsterSimData[monsterId].gpFromDamage;
            totalAttacksTaken += this.monsterSimData[monsterId].attacksTaken;
            totalSimTime += this.monsterSimData[monsterId].simulationTime;

            if (!this.monsterSimData[monsterId].simSuccess) {
              this.dungeonSimData[dungeonId].simSuccess = false;
              break;
            }
          }
          this.dungeonSimData[dungeonId].xpPerSecond = totXp / totTime * 1000;
          this.dungeonSimData[dungeonId].xpPerHit = totXp / totHits;
          this.dungeonSimData[dungeonId].hpxpPerSecond = totHpXp / totTime * 1000;
          this.dungeonSimData[dungeonId].prayerXpPerSecond = totPrayXP / totTime * 1000;
          this.dungeonSimData[dungeonId].hpPerSecond = totHP / totTime * 1000;
          this.dungeonSimData[dungeonId].dmgPerSecond = totEnemyHP / totTime * 1000;
          this.dungeonSimData[dungeonId].avgKillTime = totTime;
          this.dungeonSimData[dungeonId].attacksMade = totHits;
          this.dungeonSimData[dungeonId].avgHitDmg = totEnemyHP / totHits;
          this.dungeonSimData[dungeonId].killTimeS = totTime / 1000;
          this.dungeonSimData[dungeonId].killsPerSecond = 1 / this.dungeonSimData[dungeonId].killTimeS;
          this.dungeonSimData[dungeonId].ppConsumedPerSecond = totPrayerPoints / this.dungeonSimData[dungeonId].killTimeS;
          this.dungeonSimData[dungeonId].gpFromDamage = totalGPFromDamage;
          this.dungeonSimData[dungeonId].attacksTaken = totalAttacksTaken;
          this.dungeonSimData[dungeonId].attacksTakenPerSecond = totalAttacksTaken / totTime * 1000;
          this.dungeonSimData[dungeonId].attacksMadePerSecond = totHits / totTime * 1000;
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
      console.log(`Elapsed Simulation Time: ${performance.now() - this.simStartTime}ms`);
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
          // console.log(this.simulationWorkers);
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
        if (this.currentSim.playerStats.activeItems.stormsnap) {
          rangedStrengthBonus += Math.floor(110 + (1 + (MONSTERS[monsterID].magicLevel * 6) / 33));
          rangedAttackBonus += Math.floor(102 * (1 + (MONSTERS[monsterID].magicLevel * 6) / 5500));
        }
        const slayerTaskMonsters = new Set(combatAreaDisplayOrder.flatMap(area => combatAreas[area].monsters).concat(slayerAreaDisplayOrder.flatMap(area => slayerAreas[area].monsters)));
        if (this.currentSim.playerStats.activeItems.slayerCrossbow && (MONSTERS[monsterID].slayerXP !== undefined || (this.currentSim.isSlayerTask && slayerTaskMonsters.has(monsterID)))) {
          rangedStrengthBonus = Math.floor(rangedStrengthBonus * items[CONSTANTS.item.Slayer_Crossbow].slayerStrengthMultiplier);
        }
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
          simWorker.worker.postMessage({ action: 'CANCEL_SIMULATION' });
        }
      });
    }

    /**
     * Processes a message received from one of the simulation workers
     * @param {MessageEvent} event The event data of the worker
     * @param {number} workerID The ID of the worker that sent the message
     */
    processWorkerMessage(event, workerID) {
      // console.log(`Received Message from worker: ${workerID}`);
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
          // console.log(event.data.simResult);
          // Attempt to add another job to the worker
          this.startJob(workerID);
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
      let targetDefRoll = 0;
      if (attacker.attackType === 0) {
        targetDefRoll = target.maxDefRoll;
      } else if (attacker.attackType === 1) {
        targetDefRoll = target.maxRngDefRoll;
      } else {
        targetDefRoll = target.maxMagDefRoll;
      }
      let accuracy = 0;
      if (attacker.maxAttackRoll < targetDefRoll) {
        accuracy = (0.5 * attacker.maxAttackRoll / targetDefRoll) * 100;
      } else {
        accuracy = (1 - 0.5 * targetDefRoll / attacker.maxAttackRoll) * 100;
      }
      return accuracy;
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
      for (let i = 0; i < slayerAreas.length; i++) {
        let canEnter = true;
        if (slayerAreas[i].slayerLevel !== undefined && this.playerLevels.Slayer < slayerAreas[i].slayerLevel) {
          canEnter = false;
        }
        if (this.currentSim.playerStats.activeItems.slayerSkillcape) {
          canEnter = true;
        } else if (slayerAreas[i].slayerItem === CONSTANTS.item.Mirror_Shield) {
          canEnter = this.currentSim.playerStats.activeItems.mirrorShield;
        } else if (slayerAreas[i].slayerItem === CONSTANTS.item.Magical_Ring) {
          canEnter = this.currentSim.playerStats.activeItems.magicalRing;
        }
        for (let j = 0; j < slayerAreas[i].monsters.length; j++) {
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
      return (MONSTERS[monsterID].dropCoins[1] + MONSTERS[monsterID].dropCoins[0] - 1) * this.currentSim.gpBonus / 2;
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
      console.log(outStr);
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
          if (this.monsterSimData[monsterId].simSuccess) {
            this.monsterSimData[monsterId].gpPerKill = this.monsterSimData[monsterId].gpFromDamage;
            if (godDungeonID.includes(this.parent.viewedDungeonID)) {
              const boneQty = MONSTERS[monsterId].boneQty || 1;
              const shardID = MONSTERS[monsterId].bones;
              if (this.convertShards) {
                const chestID = items[shardID].trimmedItemID;
                this.monsterSimData[monsterId].gpPerKill += boneQty * this.currentSim.lootBonus / items[chestID].itemsRequired[0][1] * this.computeChestOpenValue(chestID);
              } else if (this.shouldSell(shardID)) {
                this.monsterSimData[monsterId].gpPerKill += items[shardID].sellsFor * this.currentSim.lootBonus * boneQty;
              }
            }
            this.monsterSimData[monsterId].gpPerSecond = this.monsterSimData[monsterId].gpPerKill / this.monsterSimData[monsterId].killTimeS;
          } else {
            this.monsterSimData[monsterId].gpPerKill = 0;
            this.monsterSimData[monsterId].gpPerSecond = 0;
          }
        });
      } else {
        combatAreas.forEach((area) => {
          area.monsters.forEach((monster) => {
            if (this.monsterSimData[monster].simSuccess) {
              this.monsterSimData[monster].gpPerKill = this.computeMonsterValue(monster) + this.monsterSimData[monster].gpFromDamage;
              this.monsterSimData[monster].gpPerSecond = this.monsterSimData[monster].gpPerKill / this.monsterSimData[monster].killTimeS;
            } else {
              this.monsterSimData[monster].gpPerKill = 0;
              this.monsterSimData[monster].gpPerSecond = 0;
            }
          });
        });
        slayerAreas.forEach((area) => {
          area.monsters.forEach((monster) => {
            if (this.monsterSimData[monster].simSuccess) {
              this.monsterSimData[monster].gpPerKill = this.computeMonsterValue(monster) + this.monsterSimData[monster].gpFromDamage;
              this.monsterSimData[monster].gpPerSecond = this.monsterSimData[monster].gpPerKill / this.monsterSimData[monster].killTimeS;
            } else {
              this.monsterSimData[monster].gpPerKill = 0;
              this.monsterSimData[monster].gpPerSecond = 0;
            }
          });
        });
        // Set data for dungeons
        for (let i = 0; i < DUNGEONS.length; i++) {
          if (this.dungeonSimData[i].simSuccess) {
            this.dungeonSimData[i].gpPerKill = this.computeDungeonValue(i) + this.dungeonSimData[i].gpFromDamage;
            this.dungeonSimData[i].gpPerSecond = this.dungeonSimData[i].gpPerKill / this.dungeonSimData[i].killTimeS;
          } else {
            this.dungeonSimData[i].gpPerKill = 0;
            this.dungeonSimData[i].gpPerSecond = 0;
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
            if (this.monsterSimData[monster].simSuccess) {
              this.monsterSimData[monster].herbloreXPPerSecond = this.computeMonsterHerbXP(monster, this.currentSim.herbConvertChance) / this.monsterSimData[monster].killTimeS;
            } else {
              this.monsterSimData[monster].herbloreXPPerSecond = 0;
            }
          });
        });
        slayerAreas.forEach((area) => {
          area.monsters.forEach((monster) => {
            if (this.monsterSimData[monster].simSuccess) {
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
            if (this.monsterSimData[monster].simSuccess) {
              let monsterXP = 0;
              monsterXP += Math.floor(((MONSTERS[monster].slayerXP !== undefined) ? MONSTERS[monster].slayerXP : 0) * (1 + this.currentSim.slayerXPBonus / 100));
              if (this.isSlayerTask) {
                monsterXP += Math.floor(MONSTERS[monster].hitpoints * (1 + this.currentSim.slayerXPBonus / 100));
              }
              this.monsterSimData[monster].slayerXpPerSecond = monsterXP * this.currentSim.playerStats.globalXPMult / this.monsterSimData[monster].killTimeS;
            } else {
              this.monsterSimData[monster].slayerXpPerSecond = 0;
            }
          });
        });
        slayerAreas.forEach((area) => {
          area.monsters.forEach((monster) => {
            if (this.monsterSimData[monster].simSuccess) {
              let monsterXP = 0;
              monsterXP += Math.floor(((MONSTERS[monster].slayerXP !== undefined) ? MONSTERS[monster].slayerXP : 0) * (1 + this.currentSim.slayerXPBonus / 100));
              if (this.isSlayerTask) {
                monsterXP += Math.floor(MONSTERS[monster].hitpoints * (1 + this.currentSim.slayerXPBonus / 100));
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
          simResult.petChance = 1 - simResult.petRolls.reduce((chanceToNotGet, petRoll) => {
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
            const chanceToNotGet = monsterResult.petRolls.reduce((product, petRoll) => {
              return product * Math.pow((1 - petRoll.speed * petSkillLevel / 25000000000), timePeriod * timeRatio * petRoll.rollsPerSecond);
            }, 1);
            return cumChanceToNotGet * chanceToNotGet;
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

  /**
   * Class for the cards in the bottom of the ui
   */
  class McsCard {
    /**
     * Constructs an instance of McsCard
     * @param {HTMLElement} parentElement The parent element the card should be appended to
     * @param {string} height The height of the card
     * @param {string} inputWidth The width of inputs for the card's ui elements
     * @param {boolean} outer This card is an outside card
     */
    constructor(parentElement, height, inputWidth, outer = false) {
      this.outerContainer = document.createElement('div');
      this.outerContainer.className = `mcsCardContainer${outer ? ' mcsOuter block block-rounded border-top border-combat border-4x bg-combat-inner-dark' : ''}`;
      if (height !== '') {
        this.outerContainer.style.height = height;
      }
      this.container = document.createElement('div');
      this.container.className = 'mcsCardContentContainer';
      this.outerContainer.appendChild(this.container);
      parentElement.appendChild(this.outerContainer);
      this.inputWidth = inputWidth;
      this.dropDowns = [];
      this.numOutputs = [];
    }

    /**
    * Creates a new button and appends it to the container. Autoadds callbacks to change colour
    * @param {string} buttonText Text to display on button
    * @param {Function} onclickCallback Callback to excute when pressed
    * @param {string} idTag Optional ID Tag
    */
    addButton(buttonText, onclickCallback) {
      const newButton = document.createElement('button');
      newButton.type = 'button';
      newButton.id = `MCS ${buttonText} Button`;
      newButton.className = 'btn btn-primary m-1';
      newButton.style.width = `100%`;
      newButton.textContent = buttonText;
      newButton.onclick = onclickCallback;
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'd-flex';
      buttonContainer.appendChild(newButton);
      this.container.appendChild(buttonContainer);
    }

    /**
     * Adds an image to the card
     * @param {string} imageSource Source of image file
     * @param {number} imageSize size of image in pixels
     * @param {string} imageID Element ID
     * @return {HTMLImageElement}
     */
    addImage(imageSource, imageSize, imageID = '') {
      const newImage = document.createElement('img');
      newImage.style.width = `${imageSize}px`;
      newImage.style.height = `${imageSize}px`;
      newImage.id = imageID;
      newImage.src = imageSource;
      const div = document.createElement('div');
      div.className = 'mb-1';
      div.style.textAlign = 'center';
      div.appendChild(newImage);
      this.container.appendChild(div);
      return newImage;
    }
    /**
    * Creates a button displaying an image with a tooltip
    * @param {string} imageSource Source of the image on the button
    * @param {string} idText Text to put in the id of the button
    * @param {Function} onclickCallback Callback when clicking the button
    * @param {string} size Image size
    * @param {string} tooltip The tooltip content
    * @return {HTMLButtonElement} The created button element
    */
    createImageButton(imageSource, idText, onclickCallback, size, tooltip) {
      const newButton = document.createElement('button');
      newButton.type = 'button';
      newButton.id = `MCS ${idText} Button`;
      newButton.className = 'btn btn-outline-dark';
      newButton.onclick = onclickCallback;
      if (tooltip) newButton.dataset.tippyContent = tooltip;
      const newImage = document.createElement('img');
      newImage.className = `mcsButtonImage mcsImage${size}`;
      newImage.id = `MCS ${idText} Button Image`;
      newImage.src = imageSource;
      newButton.appendChild(newImage);
      return newButton;
    }

    /**
     * Adds a tab menu to the card, the tab elements will have their display toggled on and off when the tab is clicked
     * @param {string[]} tabNames
     * @param {string[]} tabImages
     * @param {Function[]} tabCallbacks
     * @return {HTMLDivElement}
     */
    addTabMenu(tabNames, tabImages, tabCallbacks) {
      const newCCContainer = document.createElement('div');
      newCCContainer.className = 'mcsTabButtonContainer';
      tabNames.forEach((name, index) => {
        const newTab = document.createElement('button');
        newTab.type = 'button';
        newTab.id = toId(`${name}-tab`);
        newTab.className = 'mcsTabButton';
        newTab.dataset.tippyContent = name;
        newTab.onclick = tabCallbacks[index];
        const newImage = document.createElement('img');
        newImage.className = 'mcsButtonImage';
        newImage.id = toId(`${name}-tab-image`);
        newImage.src = tabImages[index];
        newTab.appendChild(newImage);
        newCCContainer.appendChild(newTab);
      });
      this.container.appendChild(newCCContainer);
      const tabContainer = document.createElement('div');
      tabContainer.className = 'mcsTabContainer';
      this.container.appendChild(tabContainer);
      return tabContainer;
    }
    /**
     * Creates multiple image buttons in a single container
     * @param {string[]} sources The image source paths
     * @param {string[]} idtexts The ids for the buttons
     * @param {string} size The size of the buttons: Small, Medium
     * @param {Function[]} onclickCallbacks The callbacks for the buttons
     * @param {string[]} tooltips The tooltip contents
     * @param {string} containerWidth container width
     * @return {HTMLDivElement[]} The image buttons
     */
    addImageButtons(sources, idtexts, size, onclickCallbacks, tooltips = [], containerWidth) {
      const deleteMe = [];
      const newCCContainer = document.createElement('div');
      newCCContainer.className = 'mcsMultiImageButtonContainer';
      for (let i = 0; i < sources.length; i++) {
        const newButton = this.createImageButton(sources[i], idtexts[i], onclickCallbacks[i], size, tooltips[i]);
        deleteMe.push(this.addTooltip(newButton));
        newCCContainer.appendChild(newButton);
      }
      if (containerWidth) {
        newCCContainer.style.width = containerWidth;
      }
      this.container.appendChild(newCCContainer);
      return deleteMe;
    }
    /**
     * Assigns the onclick event to a popupmenu
     * @param {HTMLElement} showElement Element that should show the popup when clicked
     * @param {HTMLElement} popupMenuElement Element that should be displayed when the showElement is clicked
     */
    registerPopupMenu(showElement, popupMenuElement) {
      showElement.addEventListener('click', () => {
        let firstClick = true;
        if (popupMenuElement.style.display === 'none') {
          const outsideClickListener = (event) => {
            if (firstClick) {
              firstClick = false;
              return;
            }
            if (popupMenuElement.style.display === '') {
              popupMenuElement.style.display = 'none';
              document.body.removeEventListener('click', outsideClickListener);
            }
          };
          document.body.addEventListener('click', outsideClickListener);
          popupMenuElement.style.display = '';
        }
      });
    }
    /**
     * Creates a multiple button popup menu (Equip grid)
     * @param {string[]} sources
     * @param {string[]} elIds
     * @param {HTMLElement} popups
     * @param {string[]} tooltips The tooltip contents
     */
    addMultiPopupMenu(sources, elIds, popups, tooltips) {
      const newCCContainer = document.createElement('div');
      newCCContainer.className = 'mcsEquipmentImageContainer';
      for (let i = 0; i < sources.length; i++) {
        const containerDiv = document.createElement('div');
        containerDiv.style.position = 'relative';
        containerDiv.style.cursor = 'pointer';
        const newImage = document.createElement('img');
        newImage.id = elIds[i];
        newImage.src = sources[i];
        newImage.className = 'combat-equip-img border border-2x border-rounded-equip border-combat-outline p-1';
        newImage.dataset.tippyContent = tooltips[i];
        newImage.dataset.tippyHideonclick = 'true';
        containerDiv.appendChild(newImage);
        containerDiv.appendChild(popups[i]);
        newCCContainer.appendChild(containerDiv);
        popups[i].style.display = 'none';
        this.registerPopupMenu(containerDiv, popups[i]);
      }
      this.container.appendChild(newCCContainer);
    }
    /**
    * Adds a dropdown to the card
    * @param {string} labelText The text to label the dropdown with
    * @param {string[]} optionText The text of the dropdown's options
    * @param {Array} optionValues The values of the dropdown's options
    * @param {Function} onChangeCallback The callback for when the option is changed
    */
    addDropdown(labelText, optionText, optionValues, onChangeCallback) {
      const dropDownID = `MCS ${labelText} Dropdown`;
      const newCCContainer = this.createCCContainer();
      newCCContainer.id = `${dropDownID} Container`;
      const label = this.createLabel(labelText, dropDownID);
      label.classList.add('mb-1');
      newCCContainer.appendChild(label);
      const newDropdown = this.createDropdown(optionText, optionValues, dropDownID, onChangeCallback);
      newCCContainer.appendChild(newDropdown);
      this.container.appendChild(newCCContainer);
    }
    /**
     * Adds a dropdown to the card, but also returns a reference to it
     * @param {string[]} optionText The text of the dropdown's options
     * @param {Array} optionValues The values of the dropdown's options
     * @param {string} dropDownID The id of the dropdown
     * @param {Function} onChangeCallback The callback for when the option is changed
     * @return {HTMLSelectElement}
     */
    createDropdown(optionText, optionValues, dropDownID, onChangeCallback) {
      const newDropdown = document.createElement('select');
      newDropdown.className = 'form-control mb-1';
      newDropdown.id = dropDownID;
      for (let i = 0; i < optionText.length; i++) {
        const newOption = document.createElement('option');
        newOption.text = optionText[i];
        newOption.value = optionValues[i];
        newDropdown.add(newOption);
      }
      newDropdown.addEventListener('change', onChangeCallback);
      this.dropDowns.push(newDropdown);
      return newDropdown;
    }
    /**
     * Adds an input to the card for a number
     * @param {string} labelText The text for the input's label
     * @param {number} startValue The initial value
     * @param {number} min The minimum value of the input
     * @param {number} max The maximum value of the input
     * @param {Function} onChangeCallback The callback for when the input changes
     */
    addNumberInput(labelText, startValue, min, max, onChangeCallback) {
      const inputID = `MCS ${labelText} Input`;
      const newCCContainer = this.createCCContainer();
      const label = this.createLabel(labelText, inputID);
      label.classList.add('mb-1');
      newCCContainer.appendChild(label);
      const newInput = document.createElement('input');
      newInput.id = inputID;
      newInput.type = 'number';
      newInput.min = min;
      newInput.max = max;
      newInput.value = startValue;
      newInput.className = 'form-control mb-1';
      newInput.addEventListener('change', onChangeCallback);
      newCCContainer.appendChild(newInput);
      this.container.appendChild(newCCContainer);
    }
    /**
     * Adds an input to the card for text
     * @param {string} labelText The text for the input's label
     * @param {string} startValue The iniial text in the input
     * @param {Function} onInputCallback The callback for when the input changes
     */
    addTextInput(labelText, startValue, onInputCallback) {
      const inputID = `MCS ${labelText} TextInput`;
      const newCCContainer = this.createCCContainer();
      const label = this.createLabel(labelText, inputID);
      label.classList.add('mb-1');
      newCCContainer.appendChild(label);
      const newInput = document.createElement('input');
      newInput.id = inputID;
      newInput.type = 'text';
      newInput.value = startValue;
      newInput.className = 'form-control mb-1';
      newInput.style.width = this.inputWidth;
      newInput.addEventListener('input', onInputCallback);
      newCCContainer.appendChild(newInput);
      this.container.appendChild(newCCContainer);
    }

    /**
     * Adds info text
     * @param {string} textToDisplay
     * @return {HTMLDivElement}
     */
    addInfoText(textToDisplay) {
      const textDiv = document.createElement('div');
      textDiv.textContent = textToDisplay;
      textDiv.className = 'mcsInfoText';
      this.container.appendChild(textDiv);
      return textDiv;
    }
    /**
     * Adds a number output to the card
     * @param {string} labelText The text for the output's label
     * @param {string} initialValue The intial text of the output
     * @param {number} height The height of the output in pixels
     * @param {string} imageSrc An optional source for an image, if left as '', an image will not be added
     * @param {string} outputID The id of the output field
     * @param {boolean} setLabelID Whether or not to assign an ID to the label
     */
    addNumberOutput(labelText, initialValue, height, imageSrc, outputID, setLabelID = false) {
      if (!outputID) {
        outputID = `MCS ${labelText} Output`;
      }
      const newCCContainer = this.createCCContainer();
      if (imageSrc && imageSrc !== '') {
        newCCContainer.appendChild(this.createImage(imageSrc, height));
      }
      const newLabel = this.createLabel(labelText, outputID, setLabelID);
      if (setLabelID) {
        newLabel.id = `MCS ${labelText} Label`;
      }
      newCCContainer.appendChild(newLabel);
      const newOutput = document.createElement('span');
      newOutput.className = 'mcsNumberOutput';
      newOutput.style.width = this.inputWidth;
      newOutput.textContent = initialValue;
      newOutput.id = outputID;
      newCCContainer.appendChild(newOutput);

      this.container.appendChild(newCCContainer);
      this.numOutputs.push(newOutput);
    }
    /**
     * Adds a title to the card
     * @param {string} titleText The text for the title
     * @param {string} titleID An optional id for the title, if left as '' an ID will not be assigned
     */
    addSectionTitle(titleText, titleID) {
      const newSectionTitle = document.createElement('div');
      if (titleID) {
        newSectionTitle.id = titleID;
      }
      newSectionTitle.textContent = titleText;
      newSectionTitle.className = 'mcsSectionTitle';
      const titleContainer = document.createElement('div');
      titleContainer.className = 'd-flex justify-content-center';
      titleContainer.appendChild(newSectionTitle);
      this.container.appendChild(titleContainer);
    }
    /**
     * Adds an array of buttons to the card
     * @param {string[]} buttonText The text to put on the buttons
     * @param {number} height The height of the buttons in pixels
     * @param {number} width The width of the buttons in pixels
     * @param {Function[]} buttonCallbacks The callback function for when the buttons are clicked
     */
    addMultiButton(buttonText, buttonCallbacks, container = this.container) {
      let newButton;
      const newCCContainer = document.createElement('div');
      newCCContainer.className = 'mcsMultiButtonContainer';
      for (let i = 0; i < buttonText.length; i++) {
        newButton = document.createElement('button');
        newButton.type = 'button';
        newButton.id = `MCS ${buttonText[i]} Button`;
        newButton.className = 'btn btn-primary m-1';
        newButton.style.width = '100%';
        newButton.textContent = buttonText[i];
        newButton.onclick = buttonCallbacks[i];
        newCCContainer.appendChild(newButton);
      }
      container.appendChild(newCCContainer);
    }
    /**
     * Adds a radio option to the card
     * @param {string} labelText The text for the option's label
     * @param {number} height The height of the radios in pixels
     * @param {string} radioName The name of the radio
     * @param {string[]} radioLabels The labels for the individual radio buttons
     * @param {Function[]} radioCallbacks The callbacks for the individual radio buttons
     * @param {number} initialRadio The intial radio that is on
     * @param {string} imageSrc An optional string to specify the source of a label image, if '' an image is not added
     */
    addRadio(labelText, height, radioName, radioLabels, radioCallbacks, initialRadio, imageSrc) {
      const newCCContainer = this.createCCContainer();
      if (imageSrc && imageSrc !== '') {
        newCCContainer.appendChild(this.createImage(imageSrc, height));
      }
      newCCContainer.appendChild(this.createLabel(labelText, ''));
      newCCContainer.id = `MCS ${labelText} Radio Container`;
      const radioContainer = document.createElement('div');
      radioContainer.className = 'mcsRadioContainer';
      newCCContainer.appendChild(radioContainer);
      // Create Radio elements with labels
      for (let i = 0; i < radioLabels.length; i++) {
        radioContainer.appendChild(this.createRadio(radioName, radioLabels[i], `MCS ${labelText} Radio ${radioLabels[i]}`, initialRadio === i, radioCallbacks[i]));
      }
      this.container.appendChild(newCCContainer);
    }
    /**
     * Creates a radio input element
     * @param {string} radioName The name of the radio collection
     * @param {string} radioLabel The text of the radio
     * @param {string} radioID The id of the radio
     * @param {boolean} checked If the radio is checked or not
     * @param {Function} radioCallback Callback for when the radio is clicked
     * @return {HTMLDivElement}
     */
    createRadio(radioName, radioLabel, radioID, checked, radioCallback) {
      const newDiv = document.createElement('div');
      newDiv.className = 'custom-control custom-radio custom-control-inline';
      const newRadio = document.createElement('input');
      newRadio.type = 'radio';
      newRadio.id = radioID;
      newRadio.name = radioName;
      newRadio.className = 'custom-control-input';
      if (checked) {
        newRadio.checked = true;
      }
      newRadio.addEventListener('change', radioCallback);
      newDiv.appendChild(newRadio);
      const label = this.createLabel(radioLabel, radioID);
      label.className = 'custom-control-label';
      label.setAttribute('for', radioID);
      newDiv.appendChild(label);
      return newDiv;
    }

    /**
     * Creates a Card Container Container div
     * @return {HTMLDivElement}
     */
    createCCContainer() {
      const newCCContainer = document.createElement('div');
      newCCContainer.className = 'mcsCCContainer';
      return newCCContainer;
    }
    /**
     * Creates a label element
     * @param {string} labelText The text of the label
     * @param {string} referenceID The element the label references
     * @return {HTMLLabelElement}
     */
    createLabel(labelText, referenceID) {
      const newLabel = document.createElement('label');
      newLabel.className = 'mcsLabel';
      newLabel.textContent = labelText;
      newLabel.for = referenceID;
      return newLabel;
    }
    /**
    * Creates an image element
    * @param {string} imageSrc source of image
    * @param {number} height in pixels
    * @return {HTMLImageElement} The newly created image element
    */
    createImage(imageSrc, height) {
      const newImage = document.createElement('img');
      newImage.style.height = `${height}px`;
      newImage.src = imageSrc;
      return newImage;
    }
    /**
     * Adds a tooltip to an element
     * @param {HTMLElement} parent The parent element to attach the tooltip to
     * @return {HTMLDivElement} The newly created tooltip
     */
    addTooltip(parent) {
      const newTooltip = document.createElement('div');
      newTooltip.className = 'mcsTooltip';
      newTooltip.style.display = 'none';
      parent.addEventListener('mouseenter', (e) => this.showTooltip(e, newTooltip));
      parent.addEventListener('mouseleave', (e) => this.hideTooltip(e, newTooltip));
      parent.appendChild(newTooltip);
      return newTooltip;
    }
    // Prebaked functions for tooltips
    /**
     * Toggles the display of a tooltip off
     * @param {MouseEvent} e The mouseleave event
     * @param {HTMLDivElement} tooltip The tooltip element
     */
    hideTooltip(e, tooltip) {
      tooltip.style.display = 'none';
    }
    /**
     * Toggles the display of a tooltip on
     * @param {MouseEvent} e The mouseenter event
     * @param {HTMLDivElement} tooltip The tooltip element
     */
    showTooltip(e, tooltip) {
      tooltip.style.display = '';
    }
  }

  /**
   * Formats a number with the specified number of sigfigs, Addings suffixes as required
   * @param {number} number Number
   * @param {number} digits Number of significant digits
   * @return {string}
   */
  function mcsFormatNum(number, digits) {
    let output = number.toPrecision(digits);
    let end = '';
    if (output.includes('e+')) {
      const power = parseInt(output.match(/\d*?$/));
      const powerCount = Math.floor(power / 3);
      output = `${output.match(/^[\d,\.]*/)}e+${power % 3}`;
      const formatEnd = ['', 'k', 'M', 'B', 'T'];
      if (powerCount < formatEnd.length) {
        end = formatEnd[powerCount];
      } else {
        end = `e${powerCount * 3}`;
      }
    }
    return `${+parseFloat(output).toFixed(6).toLocaleString(undefined, { minimumSignificantDigits: digits })}${end}`;
  }

  /**
   * Creates an id for an element from a name
   * @param {string} name The name describing the element
   * @returns An id starting with "mcs-" and ending with the name in lowercase with spaces replaced by "-"
   */
  function toId(name) {
    return `mcs-${name.toLowerCase().replace(/ /g, '-')}`;
  }

  /** @type {McsApp} */
  let melvorCombatSim;
  // Define the message listeners from the content script
  function onMessage(event) {
    // We only accept messages from ourselves
    if (event.source !== window) {
      return;
    }
    if (event.data.type && (event.data.type === 'MCS_FROM_CONTENT')) {
      // console.log('Message received from content script');
      switch (event.data.action) {
        case 'RECEIVE_URLS':
          // console.log('Loading sim with provided URLS');
          let tryLoad = true;
          let wrongVersion = false;
          if (gameVersion !== 'Alpha v0.16.3') {
            wrongVersion = true;
            tryLoad = window.confirm('Combat Simulator Reloaded\nA different game version was detected. Loading the combat sim may cause unexpected behaviour or result in inaccurate simulation results.\n Try loading it anyways?');
          }
          if (tryLoad) {
            try {
              melvorCombatSim = new McsApp(event.data.urls);
              if (wrongVersion) {
                console.log(`Melvor Combat Sim ${version} Loaded, but simulation results may be inaccurate.`);
              } else {
                console.log(`Melvor Combat Sim ${version} Loaded`);
              }
            } catch (error) {
              console.warn('Melvor Combat Sim was not properly loaded due to the following error:');
              console.error(error);
            }
          } else {
            console.warn('Melvor Combat Sim was not Loaded due to game version incompatability.');
          }
          break;
        case 'UNLOAD':
          window.removeEventListener('message', onMessage);
          if (melvorCombatSim) {
            melvorCombatSim.destroy();
            melvorCombatSim = undefined;
          }
          break;
      }
    }
  };
  window.addEventListener('message', onMessage, false);

  // Wait for page to finish loading, then create an instance of the combat sim
  if (typeof confirmedLoaded !== 'undefined' && typeof currentlyCatchingUp !== 'undefined') {
    const melvorCombatSimLoader = setInterval(() => {
      if (confirmedLoaded && !currentlyCatchingUp) {
        clearInterval(melvorCombatSimLoader);
        window.postMessage({ type: 'MCS_FROM_PAGE', action: 'REQUEST_URLS' });
      }
    }, 200);
  }
})();
