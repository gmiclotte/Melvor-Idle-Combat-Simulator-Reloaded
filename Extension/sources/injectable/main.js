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

    const MICSR = window.MICSR;

    const reqs = [
        'util',
        'App',
    ];

    const setup = () => {

        /** @type {MICSR.App} */
        let melvorCombatSim;

        // Define the message listeners from the content script
        function onMessage(event) {
            // We only accept messages from ourselves
            if (event.source !== window) {
                return;
            }
            if (event.data.type && (event.data.type === 'MCS_FROM_CONTENT')) {
                // MICSR.log('Message received from content script');
                switch (event.data.action) {
                    case 'RECEIVE_URLS':
                        // MICSR.log('Loading sim with provided URLS');
                        let tryLoad = true;
                        let wrongVersion = false;
                        if (gameVersion !== 'Alpha v0.18') {
                            wrongVersion = true;
                            tryLoad = window.confirm('Combat Simulator Reloaded\nA different game version was detected. Loading the combat sim may cause unexpected behaviour or result in inaccurate simulation results.\n Try loading it anyways?');
                        }
                        if (tryLoad) {
                            try {
                                melvorCombatSim = new MICSR.App(event.data.urls);
                                if (wrongVersion) {
                                    MICSR.log(`Melvor Combat Sim ${MICSR.version} Loaded, but simulation results may be inaccurate.`);
                                } else {
                                    MICSR.log(`Melvor Combat Sim ${MICSR.version} Loaded`);
                                }
                            } catch (error) {
                                MICSR.warn('Melvor Combat Sim was not properly loaded due to the following error:');
                                MICSR.error(error);
                            }
                        } else {
                            MICSR.warn('Melvor Combat Sim was not Loaded due to game version incompatibility.');
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
        }

        window.addEventListener('message', onMessage, false);

        // Wait for page to finish loading, then create an instance of the combat sim
        if (typeof confirmedLoaded !== 'undefined' && typeof currentlyCatchingUp !== 'undefined') {
            const melvorCombatSimLoader = setInterval(() => {
                if (confirmedLoaded && !currentlyCatchingUp) {
                    clearInterval(melvorCombatSimLoader);
                    window.postMessage({type: 'MCS_FROM_PAGE', action: 'REQUEST_URLS'});
                }
            }, 200);
        }
    }

    MICSR.waitLoadOrder(reqs, setup, 'main');

})();
