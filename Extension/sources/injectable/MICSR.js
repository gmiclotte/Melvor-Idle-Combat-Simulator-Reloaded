// set global variable
window.MICSR = {
    isDev: false,
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
}


// set itemID for each item
items.forEach((x, i) => {
    x.itemID = i;
});