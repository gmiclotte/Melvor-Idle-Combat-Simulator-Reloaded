(() => {

    const MICSR = window.MICSR;

    const reqs = [
        'util',
        'Card',
    ];

    const setup = () => {

        /**
         * Class for cards with tabs
         */
        MICSR.TabCard = class  extends MICSR.Card {

            constructor(idPrefix, init, ...args) {
                super(...args);
                this.selectedTab = 0;
                this.tabCount = 0;
                this.idPrefix = idPrefix;
                this.tabIDs = [];
                this.tabCards = [];
                if (init) {
                    this.addTabMenu();
                }
            }

            addPremadeTab = (name, img, card) => {
                return this.addTab(name, img, null, null, card);
            }

            addTab = (title, img, height, inputWidth, card = null) => {
                // update tab count
                const index = this.tabCount;
                this.tabCount++;
                // create tab id
                const tabID = MICSR.toId(`${this.idPrefix}-${title}-tab`);
                // set header
                this.addTabHeader(tabID, title, img, () => this.onTabClick(index));
                // create, insert and return card
                card = card ? card : new MICSR.Card(this.tabContainer, height, inputWidth);
                this.tabIDs.push(tabID);
                this.tabCards.push(card);
                if (index !== this.selectedTab) {
                    card.container.style.display = 'none';
                    card.className = 'mcsTabButton';
                } else {
                    card.className = 'mcsTabButton mcsTabButtonSelected';
                }
                console.log(card)
                return card;
            }

            onTabClick = (tabID) => {
                if (this.selectedTab === tabID) {
                    return;
                }
                this.tabCards[this.selectedTab].container.style.display = 'none';
                this.setTabIDToUnSelected(this.tabIDs[this.selectedTab]);
                this.tabCards[tabID].container.style.display = '';
                this.setTabIDToSelected(this.tabIDs[tabID]);
                this.selectedTab = tabID;
            };

            setTabIDToSelected(tabID) {
                document.getElementById(tabID).className = 'mcsTabButton mcsTabButtonSelected';
            }

            setTabIDToUnSelected(tabID) {
                document.getElementById(tabID).className = 'mcsTabButton';
            }

            /**
             * Adds a tab menu to the card, the tab elements will have their display toggled on and off when the tab is clicked
             * @return {HTMLDivElement}
             */
            addTabMenu() {
                this.header = document.createElement('div');
                this.header.className = 'mcsTabButtonContainer';
                this.container.appendChild(this.header);
                this.tabContainer = document.createElement('div');
                this.tabContainer.className = 'mcsTabContainer';
                this.container.appendChild(this.tabContainer);
            }

            addTabHeader(tabID, title, img, callBack) {
                // create img element
                const newImage = document.createElement('img');
                newImage.className = 'mcsButtonImage';
                newImage.id = `${tabID}-image`;
                newImage.src = img;
                // create tab element
                const newTab = document.createElement('button');
                newTab.type = 'button';
                newTab.id = tabID;
                newTab.className = 'mcsTabButton';
                newTab.dataset.tippyContent = title;
                newTab.onclick = callBack;
                newTab.appendChild(newImage);
                // attach tab to header
                this.header.appendChild(newTab);
            }
        }
    }

    MICSR.waitLoadOrder(reqs, setup, 'TabCard')

})();