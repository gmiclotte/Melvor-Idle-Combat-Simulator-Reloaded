/*  Melvor Combat Simulator v0.10.1: Adds a combat simulator to Melvor Idle

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
        const urls = {crossedOut: chrome.runtime.getURL('icons/crossedOut.svg'),
          simulationWorker: chrome.runtime.getURL('sources/workers/simulator.js')};
        window.postMessage({type: 'MCS_FROM_CONTENT', action: 'RECIEVE_URLS', urls: urls});
        break;
    }
  }
}, false);
// Perform script injection
const injectableNames = ['main'];
for (let i = 0; i < injectableNames.length; i++) {
  injectScript(injectableNames[i]);
}
/**
 * @description Injects a script onto the page of the
 * @param {string} scriptName
 */
function injectScript(scriptName) {
  const scriptID = `MCS ${scriptName}`;
  // Check if script already exists, if so delete it
  if (document.contains(document.getElementById(scriptID))) {
    document.getElementById(scriptID).remove();
  }
  // Inject script
  const scriptPath = chrome.runtime.getURL(`sources/injectable/${scriptName}.js`);
  const newScript = document.createElement('script');
  newScript.setAttribute('id', scriptID);
  newScript.src = scriptPath;
  document.body.appendChild(newScript);
}