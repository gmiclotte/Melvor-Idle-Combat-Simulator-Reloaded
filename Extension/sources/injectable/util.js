(() => {

    const MICSR = window.MICSR;

    MICSR.version = 'v1.2.4-1';
    MICSR.gameVersion = 'Alpha v0.18.2';
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
     * @returns An id starting with "mcs-" and ending with the name in lowercase with spaces replaced by "-"
     */
    MICSR.toId = (name) => {
        return `mcs-${name.toLowerCase().replace(/ /g, '-')}`;
    }

    MICSR.checkImplemented = (stats, tag) => {
        Object.getOwnPropertyNames(stats).forEach(stat => {
            if (Array.isArray(stats[stat])) {
                for (const substat of stats[stat]) {
                    if (!substat.implemented) {
                        MICSR.log(tag + " stat not yet implemented: " + stat);
                    }
                }
            } else if (!stats[stat].implemented) {
                MICSR.log(tag + " stat not yet implemented: " + stat);
            }
        })
    }

    MICSR.checkUnknown = (set, tag, elementType, knownSets, broken) => {
        // construct a list of stats that are not in any of the previous categories
        const unknownStatNames = {};
        set.forEach(element => {
            Object.getOwnPropertyNames(element).forEach(stat => {
                // check if any bugged stats are still present
                if (broken[stat] !== undefined) {
                    MICSR.log(tag + " stat " + stat + " is bugged for " + element.name + "!")
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
            MICSR.log('Unknown stat ' + stat + ' for ' + elementType + ': ', unknownStatNames[stat]);
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

    MICSR.loadedFiles.util = true;

})();