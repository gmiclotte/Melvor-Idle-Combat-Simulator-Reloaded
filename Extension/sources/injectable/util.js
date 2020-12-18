(() => {

    MICSR.version = 'v1.1.3';

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

    MICSR.loadedFiles.util = true;

})();