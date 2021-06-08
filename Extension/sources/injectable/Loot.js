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

    const reqs = [];

    const setup = () => {

        const MICSR = window.MICSR;

        /**
         * Loot class, used for all loot related work
         */
        MICSR.Loot = class {

            constructor(app, simulator) {
                this.app = app;
                this.simulator = simulator;

                // TODO: set some default values ?
                this.currentSim = {};
                this.monsterSimData = {};
                this.dungeonSimData = {};
                this.slayerSimData = {};
                this.slayerTaskMonsters = [];

                // Pet Settings
                this.petSkill = 'Attack';
                // Options for GP/s calculations
                this.sellBones = false; // True or false
                this.sellLoot = 'All'; // Options 'All','Subset','None'
                this.saleList = this.getSaleList();
                this.lootList = this.getLootList(); // List of items with id: X and sell: true/false
                this.defaultSaleKeep = [403, 247, 248, 366, 249, 383, 368, 246, 367, 348, 443, 350, 349, 351, 347, 430, 429, 427, 428, 137, 136, 139, 314, 313, 312, 134, 296, 138, 141, 140, 434, 142, 135, 426, 425, 423, 424, 418, 417, 415, 416, 340, 405, 344, 406, 361, 414, 413, 411, 412, 372, 378, 371, 374, 369, 373, 380, 376, 375, 377, 379, 370, 407, 341, 365, 364, 422, 421, 419, 420, 120, 404];
                this.convertShards = false;
                this.setSaleListToDefault();


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
                /** Number of hours to farm for signet ring */
                this.signetFarmTime = 1;
            }


            /**
             * Computes the average number of coins that a monster drops
             * @param {number} monsterID Index of MONSTERS
             * @return {number}
             */
            computeAverageCoins(monsterID) {
                return Math.max(0, ((MONSTERS[monsterID].dropCoins[1] + MONSTERS[monsterID].dropCoins[0] - 1) / 2 + this.currentSim.increasedGP)) * this.currentSim.gpBonus;
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
                        name: this.app.getItemName(i),
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
                const getLoot = (lootTable) => {
                    lootTable.forEach(loot => {
                        const lootID = loot[0] || loot;
                        if (items[lootID].canOpen) {
                            items[lootID].dropTable.forEach((loot2) => {
                                if (!this.saleList[loot2[0]].onLootList) {
                                    lootList.push({
                                        id: loot2[0],
                                        name: this.app.getItemName(loot2[0]),
                                        sell: false,
                                    });
                                    this.saleList[loot2[0]].onLootList = true;
                                }
                            });
                        } else {
                            if (!this.saleList[lootID].onLootList) {
                                lootList.push({
                                    id: lootID,
                                    name: this.app.getItemName(lootID),
                                    sell: false,
                                });
                                this.saleList[lootID].onLootList = true;
                            }
                            // TODO: what does this do
                            if (items[lootID].tier === 'Herb' && items[lootID].type === 'Seeds') {
                                const herbItem = items[lootID].grownItemID;
                                if (!this.saleList[herbItem].onLootList) {
                                    lootList.push({
                                        id: herbItem,
                                        name: this.app.getItemName(herbItem),
                                        sell: false,
                                    });
                                    this.saleList[herbItem].onLootList = true;
                                }
                            }
                        }
                    });
                }
                const lootList = [];
                const specialDrops = [CONSTANTS.item.Signet_Ring_Half_B, CONSTANTS.item.Air_Shard, CONSTANTS.item.Water_Shard, CONSTANTS.item.Earth_Shard, CONSTANTS.item.Fire_Shard];
                specialDrops.forEach((itemID) => {
                    lootList.push({
                        id: itemID,
                        name: this.app.getItemName(itemID),
                        sell: false,
                    });
                });
                this.saleList[CONSTANTS.item.Signet_Ring_Half_B].onLootList = true;
                // normal monster loot
                combatAreas.forEach(area => area.monsters.forEach(monsterID => getLoot(MONSTERS[monsterID].lootTable)));
                // wandering bard
                const bardID = 139;
                getLoot(MONSTERS[bardID].lootTable);
                // slayer loot
                slayerAreas.forEach(area => area.monsters.forEach(monsterID => getLoot(MONSTERS[monsterID].lootTable)));
                // dungeon loot
                DUNGEONS.forEach(dungeon => getLoot(dungeon.rewards));
                const elementalChests = [CONSTANTS.item.Air_Chest, CONSTANTS.item.Water_Chest, CONSTANTS.item.Earth_Chest, CONSTANTS.item.Fire_Chest];
                elementalChests.forEach((chest) => {
                    items[chest].dropTable.forEach((loot2) => {
                        if (!this.saleList[loot2[0]].onLootList) {
                            lootList.push({
                                id: loot2[0],
                                name: this.app.getItemName(loot2[0]),
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
                MICSR.log(outStr);
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

                // loot and signet are affected by loot chance
                monsterValue += this.computeDropTableValue(monsterID);
                if (this.currentSim.canTopazDrop && this.shouldSell(CONSTANTS.item.Signet_Ring_Half_B)) {
                    monsterValue += items[CONSTANTS.item.Signet_Ring_Half_B].sellsFor * MICSR.getMonsterCombatLevel(monsterID) / 500000;
                }
                monsterValue *= this.computeLootChance(monsterID);

                // coin and bones drops are not affected by loot chance
                monsterValue += this.computeAverageCoins(monsterID);
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
                    // TODO: should double everything that appears in the droptable of the boss monster, not just chests
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
                        DUNGEONS[dungeonID].monsters.forEach((monsterID) => {
                            shardCount += MONSTERS[monsterID].boneQty || 1;
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
                    dungeonValue += items[CONSTANTS.item.Signet_Ring_Half_B].sellsFor * MICSR.getMonsterCombatLevel(DUNGEONS[dungeonID].monsters[DUNGEONS[dungeonID].monsters.length - 1]) / 500000;
                }
                dungeonValue += this.computeAverageCoins(DUNGEONS[dungeonID].monsters[DUNGEONS[dungeonID].monsters.length - 1]);
                return dungeonValue;
            }

            /**
             * Update all loot related statistics
             */
            update(currentSim, monsterSimData, dungeonSimData, slayerSimData, slayerTaskMonsters) {
                if (currentSim !== undefined) {
                    this.currentSim = currentSim;
                    this.monsterSimData = monsterSimData;
                    this.dungeonSimData = dungeonSimData;
                    this.slayerSimData = slayerSimData;
                    this.slayerTaskMonsters = slayerTaskMonsters;
                }
                this.updateGPData();
                this.updateHerbloreXP();
                this.updateSignetChance();
                this.updateDropChance();
                this.updateSlayerXP();
                this.updateSlayerCoins();
                this.updatePetChance();
            }

            /**
             * Computes the gp/kill and gp/s data for monsters and dungeons and sets those values.
             */
            updateGPData() {
                // Set data for monsters in combat zones
                if (this.app.isViewingDungeon && this.app.viewedDungeonID < DUNGEONS.length) {
                    DUNGEONS[this.app.viewedDungeonID].monsters.forEach((monsterID) => {
                        if (!this.monsterSimData[monsterID]) {
                            return;
                        }
                        if (this.monsterSimData[monsterID].simSuccess && this.monsterSimData[monsterID].tooManyActions === 0) {
                            let gpPerKill = 0;
                            if (godDungeonID.includes(this.app.viewedDungeonID)) {
                                const boneQty = MONSTERS[monsterID].boneQty || 1;
                                const shardID = MONSTERS[monsterID].bones;
                                if (this.convertShards) {
                                    const chestID = items[shardID].trimmedItemID;
                                    gpPerKill += boneQty * this.currentSim.lootBonus / items[chestID].itemsRequired[0][1] * this.computeChestOpenValue(chestID);
                                } else if (this.shouldSell(shardID)) {
                                    gpPerKill += boneQty * this.currentSim.lootBonus * items[shardID].sellsFor;
                                }
                            }
                            this.monsterSimData[monsterID].gpPerSecond = this.monsterSimData[monsterID].gpFromDamagePerSecond + gpPerKill / this.monsterSimData[monsterID].killTimeS;
                        } else {
                            this.monsterSimData[monsterID].gpPerSecond = 0;
                        }
                    });
                } else {
                    const updateMonsterGP = (monsterID) => {
                        if (!this.monsterSimData[monsterID]) {
                            return;
                        }
                        this.monsterSimData[monsterID].gpPerSecond = this.monsterSimData[monsterID].gpFromDamagePerSecond;
                        if (this.monsterSimData[monsterID].simSuccess && this.monsterSimData[monsterID].tooManyActions === 0) {
                            this.monsterSimData[monsterID].gpPerSecond += this.computeMonsterValue(monsterID) / this.monsterSimData[monsterID].killTimeS;
                        }
                    };
                    // Combat areas
                    combatAreas.forEach(area => {
                        area.monsters.forEach(monsterID => updateMonsterGP(monsterID));
                    });
                    // Wandering Bard
                    const bardID = 139;
                    updateMonsterGP(bardID);
                    // Slayer areas
                    slayerAreas.forEach(area => {
                        area.monsters.forEach(monsterID => updateMonsterGP(monsterID));
                    });
                    // Dungeons
                    for (let i = 0; i < DUNGEONS.length; i++) {
                        if (!this.dungeonSimData[i]) {
                            return;
                        }
                        if (this.dungeonSimData[i].simSuccess) {
                            this.dungeonSimData[i].gpPerSecond = this.dungeonSimData[i].gpFromDamagePerSecond;
                            this.dungeonSimData[i].gpPerSecond += this.computeDungeonValue(i) / this.dungeonSimData[i].killTimeS;
                        }
                    }
                    // slayer tasks
                    for (let i = 0; i < this.slayerTaskMonsters.length; i++) {
                        if (this.slayerSimData[i].simSuccess) {
                            let sum = 0;
                            for (const monsterID of this.slayerTaskMonsters[i]) {
                                sum += this.monsterSimData[monsterID].gpPerSecond;
                            }
                            this.slayerSimData[i].gpPerSecond = sum / this.slayerTaskMonsters[i].length;
                        }
                    }
                }
            }

            /**
             * Updates the amount of slayer xp earned when killing monsters
             */
            updateSlayerXP() {
                if (this.app.isViewingDungeon && this.app.viewedDungeonID < DUNGEONS.length) {
                    DUNGEONS[this.app.viewedDungeonID].monsters.forEach((monsterID) => {
                        if (!this.monsterSimData[monsterID]) {
                            return;
                        }
                        this.monsterSimData[monsterID].slayerXpPerSecond = 0;
                    });
                    return;
                }

                const updateMonsterSlayerXP = (monsterID) => {
                    if (!this.monsterSimData[monsterID]) {
                        return;
                    }
                    if (this.monsterSimData[monsterID].simSuccess && this.monsterSimData[monsterID].killTimeS) {
                        let monsterXP = 0;
                        monsterXP += (MONSTERS[monsterID].slayerXP !== undefined) ? MONSTERS[monsterID].slayerXP : 0;
                        if (this.currentSim.isSlayerTask) {
                            monsterXP += MONSTERS[monsterID].hitpoints;
                        }
                        this.monsterSimData[monsterID].slayerXpPerSecond = monsterXP * (1 + this.currentSim.playerStats.slayerXpBonus / 100) / this.monsterSimData[monsterID].killTimeS;
                    } else {
                        this.monsterSimData[monsterID].slayerXpPerSecond = 0;
                    }
                };

                // combat zones
                combatAreas.forEach(area => {
                    area.monsters.forEach(monsterID => updateMonsterSlayerXP(monsterID));
                });
                const bardID = 139;
                updateMonsterSlayerXP(bardID);
                // slayer areas
                slayerAreas.forEach((area) => {
                    area.monsters.forEach(monsterID => updateMonsterSlayerXP(monsterID));
                });
                // auto slayer
                for (let i = 0; i < this.slayerTaskMonsters.length; i++) {
                    let sum = 0;
                    let time = 0;
                    for (const monsterID of this.slayerTaskMonsters[i]) {
                        sum += this.monsterSimData[monsterID].slayerXpPerSecond * this.monsterSimData[monsterID].killTimeS;
                        time += this.monsterSimData[monsterID].killTimeS;
                    }
                    this.slayerSimData[i].slayerXpPerSecond = sum / time;
                }
            }

            /**
             * Updates the amount of slayer coins earned when killing monsters
             */
            updateSlayerCoins() {
                if (this.app.isViewingDungeon && this.app.viewedDungeonID < DUNGEONS.length) {
                    DUNGEONS[this.app.viewedDungeonID].monsters.forEach((monsterID) => {
                        if (!this.monsterSimData[monsterID]) {
                            return;
                        }
                        this.monsterSimData[monsterID].slayerXpPerSecond = 0;
                    });
                    return;
                }

                const updateMonsterSlayerCoins = (monsterID) => {
                    if (!this.monsterSimData[monsterID]) {
                        return;
                    }
                    this.monsterSimData[monsterID].slayerCoinsPerSecond = 0;
                    if (!this.currentSim.isSlayerTask) {
                        return;
                    }
                    if (!this.monsterSimData[monsterID].simSuccess) {
                        return;
                    }
                    if (!this.monsterSimData[monsterID].killTimeS) {
                        return;
                    }
                    const sc = applyModifier(
                        MONSTERS[monsterID].hitpoints,
                        MICSR.getModifierValue(this.currentSim.combatData.modifiers, 'SlayerCoins')
                    );
                    this.monsterSimData[monsterID].slayerCoinsPerSecond = sc / this.monsterSimData[monsterID].killTimeS;
                };

                // combat zones
                combatAreas.forEach(area => {
                    area.monsters.forEach(monsterID => updateMonsterSlayerCoins(monsterID));
                });
                const bardID = 139;
                updateMonsterSlayerCoins(bardID);
                // slayer areas
                slayerAreas.forEach((area) => {
                    area.monsters.forEach(monsterID => updateMonsterSlayerCoins(monsterID));
                });
                // auto slayer
                for (let i = 0; i < this.slayerTaskMonsters.length; i++) {
                    let sum = 0;
                    let time = 0
                    for (const monsterID of this.slayerTaskMonsters[i]) {
                        sum += this.monsterSimData[monsterID].slayerCoinsPerSecond * this.monsterSimData[monsterID].killTimeS;
                        time += this.monsterSimData[monsterID].killTimeS;
                    }
                    this.slayerSimData[i].slayerCoinsPerSecond = sum / time;
                }
            }

            /**
             * Updates the potential herblore xp for all monsters
             */
            updateHerbloreXP() {
                if (this.app.isViewingDungeon && this.app.viewedDungeonID < DUNGEONS.length) {
                    DUNGEONS[this.app.viewedDungeonID].monsters.forEach((monsterID) => {
                        if (!this.monsterSimData[monsterID]) {
                            return;
                        }
                        this.monsterSimData[monsterID].herbloreXPPerSecond = 0;
                    });
                } else {
                    const updateMonsterHerbloreXP = (monsterID) => {
                        if (!this.monsterSimData[monsterID]) {
                            return;
                        }
                        if (this.monsterSimData[monsterID].simSuccess && this.monsterSimData[monsterID].tooManyActions === 0) {
                            this.monsterSimData[monsterID].herbloreXPPerSecond = this.computeMonsterHerbXP(monsterID, this.currentSim.herbConvertChance) / this.monsterSimData[monsterID].killTimeS;
                        } else {
                            this.monsterSimData[monsterID].herbloreXPPerSecond = 0;
                        }
                    };
                    // Set data for monsters in combat zones
                    combatAreas.forEach((area) => {
                        area.monsters.forEach((monsterID) => updateMonsterHerbloreXP(monsterID));
                    });
                    const bardID = 139;
                    updateMonsterHerbloreXP(bardID);
                    slayerAreas.forEach((area) => {
                        area.monsters.forEach((monsterID) => updateMonsterHerbloreXP(monsterID));
                    });
                    for (let i = 0; i < this.slayerTaskMonsters.length; i++) {
                        let sum = 0;
                        for (const monsterID of this.slayerTaskMonsters[i]) {
                            sum += this.monsterSimData[monsterID].herbloreXPPerSecond;
                        }
                        this.slayerSimData[i].herbloreXPPerSecond = sum / this.slayerTaskMonsters[i].length;
                    }
                }
            }

            /**
             * Updates the chance to receive your selected loot when killing monsters
             */
            updateDropChance() {
                if (this.app.isViewingDungeon && this.app.viewedDungeonID < DUNGEONS.length) {
                    DUNGEONS[this.app.viewedDungeonID].monsters.forEach((monsterID) => {
                        if (!this.monsterSimData[monsterID]) {
                            return;
                        }
                        this.monsterSimData[monsterID].updateDropChance = 0;
                    });
                } else {
                    const updateMonsterDropChance = (monsterID, data) => {
                        if (!data) {
                            return;
                        }
                        const dropRateResult = this.getDropRate(monsterID)
                        const dropRate = dropRateResult[0]
                        // TODO: This does not take item doubling into account, AT ALL
                        // On average, an item with 1-10 drops will drop items
                        const dropCount = Math.max((dropRateResult[1] / 2), 1) 

                        const itemDoubleChance = this.currentSim.lootBonus
                        data.dropChance =  (dropRate * dropCount * itemDoubleChance) / this.monsterSimData[monsterID].killTimeS;
                    };

                    // Set data for monsters in combat zones
                    combatAreas.forEach((area) => {
                        area.monsters.forEach(monsterID => updateMonsterDropChance(monsterID, this.monsterSimData[monsterID]));
                    });
                    const bardID = 139;
                    updateMonsterDropChance(bardID, this.monsterSimData[bardID]);
                    slayerAreas.forEach((area) => {
                        area.monsters.forEach(monsterID => updateMonsterDropChance(monsterID, this.monsterSimData[monsterID]));
                    });
                    for (let i = 0; i < DUNGEONS.length; i++) {
                        const monsterID = DUNGEONS[i].monsters[DUNGEONS[i].monsters.length - 1];
                        updateMonsterDropChance(monsterID, this.dungeonSimData[i]);
                    }
                    for (let i = 0; i < this.slayerTaskMonsters.length; i++) {
                        // TODO: drop chance rolls for auto slayer
                        this.slayerSimData[i].dropChance = undefined;
                    }
                }
            }

            getDropRate(monsterId) {
                const monsterData = MONSTERS[monsterId]
                if(monsterData.lootChance) {
                    // Grab the sole loot object
                    const item = monsterData.lootTable[0]
                    const lootChance = item[0] == this.app.combatData.dropSelected ? (monsterData.lootChance / 100) : 0
                    return [lootChance, item[2]]
                } else {
                    let totalChances = 0
                    let selectedChance = 0
                    let selectedCount = 0
                    monsterData.lootTable.forEach((drop) => {
                        const itemId = drop[0]
                        totalChances += drop[1]

                        if (itemId == this.app.combatData.dropSelected) {
                            selectedChance = drop[1]
                            selectedCount = drop[2]
                        }
                    })

                    return [selectedChance / totalChances, selectedCount];
                }
            }

            /**
             * Updates the chance to receive signet when killing monsters
             */
            updateSignetChance() {
                if (this.app.isViewingDungeon && this.app.viewedDungeonID < DUNGEONS.length) {
                    DUNGEONS[this.app.viewedDungeonID].monsters.forEach((monsterID) => {
                        if (!this.monsterSimData[monsterID]) {
                            return;
                        }
                        this.monsterSimData[monsterID].signetChance = 0;
                    });
                } else {
                    const updateMonsterSignetChance = (monsterID, data) => {
                        if (!data) {
                            return;
                        }
                        if (this.currentSim.canTopazDrop && data.simSuccess) {
                            data.signetChance = (1 - Math.pow(1 - this.getSignetDropRate(monsterID), Math.floor(this.signetFarmTime * 3600 / data.killTimeS))) * 100;
                        } else {
                            data.signetChance = 0;
                        }
                    };
                    // Set data for monsters in combat zones
                    combatAreas.forEach((area) => {
                        area.monsters.forEach(monsterID => updateMonsterSignetChance(monsterID, this.monsterSimData[monsterID]));
                    });
                    const bardID = 139;
                    updateMonsterSignetChance(bardID, this.monsterSimData[bardID]);
                    slayerAreas.forEach((area) => {
                        area.monsters.forEach(monsterID => updateMonsterSignetChance(monsterID, this.monsterSimData[monsterID]));
                    });
                    for (let i = 0; i < DUNGEONS.length; i++) {
                        const monsterID = DUNGEONS[i].monsters[DUNGEONS[i].monsters.length - 1];
                        updateMonsterSignetChance(monsterID, this.dungeonSimData[i]);
                    }
                    for (let i = 0; i < this.slayerTaskMonsters.length; i++) {
                        // TODO: signet rolls for auto slayer
                        this.slayerSimData[i].signetChance = undefined;
                    }
                }
            }

            /**
             * Calculates the drop chance of a signet half from a monster
             * @param {number} monsterID The index of MONSTERS
             * @return {number}
             */
            getSignetDropRate(monsterID) {
                return MICSR.getMonsterCombatLevel(monsterID) * this.computeLootChance(monsterID) / 500000;
            }

            /** Updates the chance to get a pet for the given skill*/
            updatePetChance() {
                const petSkills = ['Hitpoints', 'Prayer'];
                if (this.currentSim.isSlayerTask) {
                    petSkills.push('Slayer');
                }
                if (!this.currentSim.playerStats) {
                    return;
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
                        const timePeriod = (this.app.timeMultiplier === -1) ? simResult.killTimeS : this.app.timeMultiplier;
                        const petRolls = simResult.petRolls[this.petSkill] || simResult.petRolls.other;
                        simResult.petChance = 1 - petRolls.reduce((chanceToNotGet, petRoll) => {
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
                        const timePeriod = (this.app.timeMultiplier === -1) ? dungeonResult.killTimeS : this.app.timeMultiplier;
                        dungeonResult.petChance = 1 - DUNGEONS[dungeonId].monsters.reduce((cumChanceToNotGet, monsterID) => {
                            const monsterResult = this.monsterSimData[monsterID];
                            const timeRatio = monsterResult.killTimeS / dungeonResult.killTimeS;
                            const petRolls = monsterResult.petRolls[this.petSkill] || monsterResult.petRolls.other;
                            const monsterChanceToNotGet = petRolls.reduce((chanceToNotGet, petRoll) => {
                                return chanceToNotGet * Math.pow((1 - petRoll.speed * petSkillLevel / 25000000000), timePeriod * timeRatio * petRoll.rollsPerSecond);
                            }, 1);
                            return cumChanceToNotGet * monsterChanceToNotGet;
                        }, 1);
                        dungeonResult.petChance *= 100;
                    });
                    // TODO: pet rolls for auto slayer
                } else {
                    this.monsterSimData.forEach((simResult) => {
                        simResult.petChance = 0;
                    });
                    this.dungeonSimData.forEach((simResult) => {
                        simResult.petChance = 0;
                    });
                    this.slayerSimData.forEach((simResult) => {
                        simResult.petChance = 0;
                    });
                }
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
    waitLoadOrder(reqs, setup, 'Loot');

})();