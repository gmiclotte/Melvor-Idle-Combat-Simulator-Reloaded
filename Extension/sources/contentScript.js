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

// Set up listener from page
window.addEventListener('message', (event) => {
    // We only accept messages from ourselves
    if (event.source !== window) {
        return;
    }
    if (event.data.type && (event.data.type === 'MCS_FROM_PAGE')) {
        switch (event.data.action) {
            case 'REQUEST_URLS':
                // Send URLS of web accessible resources to page
                const urls = {
                    crossedOut: chrome.runtime.getURL('icons/crossedOut.svg'),
                    simulationWorker: chrome.runtime.getURL('sources/workers/simulator.js'),
                };
                window.postMessage({type: 'MCS_FROM_CONTENT', action: 'RECEIVE_URLS', urls: urls});
                break;
        }
    }
}, false);


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
    // used to wait for variables from MICSR across different files
    waitLoadOrder: (reqs, setup, id) => {
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

// Perform script injection
// Order of scripts shouldn't matter, `loadRequiredVariables` takes care of appropriate loading order
const injectableNames = [
    // independent definitions
    'util',
    'statNames',
    // class files
    'Card',
    'Plotter',
    'Simulator',
    // uses the other classes
    'App',
    // should be last
    'main',
];
for (let i = 0; i < injectableNames.length; i++) {
    injectScript(injectableNames[i]);
}

/**
 * Injects a script onto the page of the
 * @param {string} scriptName
 */
function injectScript(scriptName) {
    const scriptID = `mcs-${scriptName}`;
    // Check if script already exists, if so delete it
    if (document.getElementById(scriptID)) {
        window.postMessage({type: 'MCS_FROM_CONTENT', action: 'UNLOAD'});
        document.getElementById(scriptID).remove();
    }
    // Inject script
    const scriptPath = chrome.runtime.getURL(`sources/injectable/${scriptName}.js`);
    const newScript = document.createElement('script');
    newScript.setAttribute('id', scriptID);
    newScript.src = scriptPath;
    document.body.appendChild(newScript);
}
