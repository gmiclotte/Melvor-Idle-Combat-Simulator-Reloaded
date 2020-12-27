// set global variable
window.MICSR = {
    /////////////
    // logging //
    /////////////
    debug: (...args) => console.log('MICSR debugging:', ...args),
    log: (...args) => console.log('MICSR:', ...args),
    warn: (...args) => console.warn('MICSR:', ...args),
    error: (...args) => console.error('MICSR:', ...args),

    /////////////
    // loading //
    /////////////
    loadedFiles: {},
    loadCounters: {},
    // used to wait for variables from MICSR across different files
    waitLoadOrder: (reqs, setup, id) => {
        if (MICSR.loadCounters[id] === undefined) {
            MICSR.loadCounters[id] = 0;
        }
        MICSR.loadCounters[id]++;
        if (MICSR.loadCounters[id] > 100) {
            MICSR.log('Failed to load ' + id);
            return;
        }
        // check requirements
        for (const req of reqs) {
            if (MICSR.loadedFiles[req]) {
                continue;
            }
            // not defined yet: try again later
            MICSR.log(id + ' is waiting for ' + req)
            setTimeout(() => MICSR.waitLoadOrder(reqs, setup, id), 50);
            return;
        }
        // requirements met
        MICSR.log('setting up ' + id)
        setup();
        // mark as loaded
        MICSR.loadedFiles[id] = true;
    }
}