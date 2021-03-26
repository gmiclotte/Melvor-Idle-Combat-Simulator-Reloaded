(() => {

    const reqs = [];

    const setup = () => {

        const MICSR = window.MICSR;

        MICSR.version = 'v1.3.7';
        MICSR.gameVersion = 'Alpha v0.19.1';
        MICSR.maxActions = 300;
        MICSR.trials = 10000;

        /**
         }
         * Formats a number with the specified number of sigfigs, Addings suffixes as required
         * @param {number} number Number
         * @param {number} digits Number of significant digits
         * @return {string}
         */
        MICSR.mcsFormatNum = (number, digits) => {
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
            return `${+parseFloat(output).toFixed(6).toLocaleString(undefined, {minimumSignificantDigits: digits})}${end}`;
        }

        /**
         * Creates an id for an element from a name
         * @param {string} name The name describing the element
         * @returns An id starting with 'mcs-' and ending with the name in lowercase with spaces replaced by '-'
         */
        MICSR.toId = (name) => {
            return `mcs-${name.toLowerCase().replace(/ /g, '-')}`;
        }

        MICSR.checkImplemented = (stats, tag) => {
            if(!MICSR.isDev) {
                return;
            }
            Object.getOwnPropertyNames(stats).forEach(stat => {
                if (Array.isArray(stats[stat])) {
                    for (const substat of stats[stat]) {
                        if (!substat.implemented) {
                            MICSR.warn(tag + ' not yet implemented: ' + stat);
                        }
                    }
                } else if (!stats[stat].implemented) {
                    MICSR.warn(tag + ' stat not yet implemented: ' + stat);
                }
            })
        }

        MICSR.checkUnknown = (set, tag, elementType, knownSets, broken) => {
            if(!MICSR.isDev) {
                return;
            }
            // construct a list of stats that are not in any of the previous categories
            const unknownStatNames = {};
            set.forEach(element => {
                Object.getOwnPropertyNames(element).forEach(stat => {
                    // check if any bugged stats are still present
                    if (broken[stat] !== undefined) {
                        MICSR.warn(tag + ' stat ' + stat + ' is bugged for ' + element.name + '!')
                        return;
                    }
                    // check if we already know this stat
                    for (const known of knownSets) {
                        if (known[stat] !== undefined) {
                            return;
                        }
                    }
                    // unknown stat found !
                    if (unknownStatNames[stat] === undefined) {
                        unknownStatNames[stat] = [];
                    }
                    unknownStatNames[stat].push(element.name);
                })
            })

            Object.getOwnPropertyNames(unknownStatNames).forEach(stat => {
                MICSR.warn('Unknown stat ' + stat + ' for ' + elementType + ': ', unknownStatNames[stat]);
            });
        }

        /**
         * Calculates the combat level of a monster
         * @param {number} monsterID The index of MONSTERS
         * @return {number}
         */
        MICSR.getMonsterCombatLevel = (monsterID) => {
            const prayer = 1;
            const base = 0.25 * (MONSTERS[monsterID].defenceLevel + MONSTERS[monsterID].hitpoints + Math.floor(prayer / 2));
            const melee = 0.325 * (MONSTERS[monsterID].attackLevel + MONSTERS[monsterID].strengthLevel);
            const range = 0.325 * (Math.floor(3 * MONSTERS[monsterID].rangedLevel / 2));
            const magic = 0.325 * (Math.floor(3 * MONSTERS[monsterID].magicLevel / 2));
            const levels = [melee, range, magic];
            return Math.floor(base + Math.max(...levels));
        }

        /**
         * Get the appropriate value from an array of skill modifiers
         */
        MICSR.arrayModifierToSkill = (array, skillID) => {
            const result = array.filter(x => {
                return x.id === skillID || x[0] === skillID
            });
            if (result.length === 0) {
                return 0;
            }
            return result[0].value | result[0][1];
        }

        /**
         * Get the combined modifier value
         */
        MICSR.getModifierValue = (modifiers, modifier, skillID = undefined) => {
            const increased = modifiers['increased' + modifier];
            const decreased = modifiers['decreased' + modifier];
            if (increased.length !== undefined) {
                const increasedEntry = MICSR.arrayModifierToSkill(increased, skillID);
                const decreasedEntry = MICSR.arrayModifierToSkill(decreased, skillID);
                return increasedEntry - decreasedEntry;
            }
            return increased - decreased;
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
    waitLoadOrder(reqs, setup, 'util');

})();