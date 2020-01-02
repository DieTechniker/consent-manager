import { tkDebug } from "./debug";
import { getCookie } from "./getCookie";
import { handleError } from "./handleError";
import { removeUrlHash } from './removeUrlHash';
import { setCookie as setCookieUtil } from "./setCookie";
import { outerHeight } from "./outerHeight";
import { ToggleButton } from "./ToggleButton";

export class ConsentManager {
    /* Constants ------------------------------------------------------------------------------- */
    /**
     * @property {String}
     */
    static get CLASSES() {
        return {
            "BODYDISPLAYCONSENTMANAGER": "is-display-consentmanager",
            "ROOTSHOWDETAILS": "g-consentmanager--show-details"
        };
    }

    static get OPENTRIGGERHASH() {
        return 'openconsentmanager';
    }

    static get ROOTCLASSDISPLAYCONSENTMANAGER() {
        return 'is-display-consentmanager';
    }

    static get TABBABLE_ELEMENT_SELECTORS() {
        return 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, [contenteditable]';
    }

    static get FOCUSABLE_ELEMENT_SELECTORS() {
        return `${this.TABBABLE_ELEMENT_SELECTORS}, [tabindex="-1"]`;
    }

    static get COOKIEVALIDITY() {
        return '2147483647'; // maximum cookie-validity in days compatible with 32-bit systems 2147483647 = 2^31 = ~year 2038
    }

    static get ACTIONTRACKING_PREFIX() {
        return 'consentmanager_';
    }

    static get DELAY() {
        return {
            INITIAL: 50,
            ITEM: 200,
            FINAL: 100
        };
    }


    /**
     * @param {DOMElement} $element
     */
    constructor(element) {
        this.handleError = handleError;
        this.log = tkDebug('consentManager');
        this.log('ConsentManager constructor');

        // Elements
        this.root = element;
        this.elements = {};
        this.elements.consentSettingCheckboxes = this.root.querySelectorAll('.g-consentmanager__setting input[data-optional="true"]');
        this.elements.btnConfirmSelection = this.root.querySelectorAll('.g-consentmanager__confirm-selection');
        this.elements.btnConfirmAll = this.root.querySelectorAll('.g-consentmanager__confirm-all');
        this.elements.toggleDetails = this.root.querySelectorAll('.g-consentmanager__toggle-details');
        this.elements.categoryDescriptionWrappers = this.root.querySelectorAll('.g-consentmanager__setting-description-wrapper');
        this.elements.content = this.root.querySelectorAll('.g-consentmanager__content');
        this.elements.toggleButton = this.root.querySelectorAll('.m-togglebutton');

        // Handler bindings
        this.elements.btnConfirmSelection.forEach(button => button.addEventListener('click', this.handleClickConfirmSelection.bind(this)));
        this.elements.btnConfirmAll.forEach(button => button.addEventListener('click', this.handleClickConfirmAll.bind(this)));
        this.elements.toggleDetails.forEach(button => {
            new ToggleButton(button);
            button.addEventListener('click', this.handleClickToggleDetails.bind(this))
        });

        this.prepare();
    }


    /* Lifecycle ------------------------------------------------------------------------------- */
    prepare() {
        window.addEventListener('resize', this.handleResize.bind(this), true);

        this.onConsentManagerConfirmedCookieName = this.root.getAttribute('data-consent-settings-saved-cookie-name');

        if (window.utag && window.utag.gdpr) {
            this.categoryMap = {};
            this.featureMap = {
                'enabled': [],
                'disabled': []
            };
            const tealiumCategoryArray = window.utag.gdpr.getCategories();
            this.log('prepare / read tealium categories:', tealiumCategoryArray);
            this.delayedSelectionEnabled = !!this.root.getAttribute('data-delayedselectionenabled');
            this.log('prepare / delayedselectionenabled:', this.delayedSelectionEnabled);
            // build categoryMap
            this.elements.consentSettingCheckboxes.forEach((item) => {
                const tealiumCategoryName = item.getAttribute('data-tealiumcategoryname');
                // use the tealiumCategoryName originally configured in the CMSettings to resolve the index of the category based on the (current) categories array
                // before persisting we will be checking if a valid category was actually found
                const tealiumCategoryIndex = tealiumCategoryArray.indexOf(tealiumCategoryName);
                const consentCookieName = item.getAttribute('data-consentcookiename');
                const tkFeatures = item.getAttribute('data-tkfeatures') || '';
                const tkFeaturesArray = tkFeatures.split(',');
                const consentGiven = getCookie(consentCookieName) === '1';
                this.log(`prepare / cookie: ${consentCookieName} -> ${getCookie(consentCookieName)}`);
                this.categoryMap[tealiumCategoryName] = {
                    tealiumCategoryIndex,
                    consentCookieName,
                    consentGiven,
                    'tkFeatures': tkFeaturesArray
                };
                // add the features for the current category to the corresponding featureMap-entry
                this.featureMap[(consentGiven ? 'enabled' : 'disabled')] = this.featureMap[(consentGiven ? 'enabled' : 'disabled')].concat(tkFeaturesArray);
            });
            this.log('prepare / categoryMap:', this.categoryMap);
            this.log('prepare / featureMap:', this.featureMap);
            this.writeCssFeatures();
            this.writeJsFeatures();

            this.setGlobalOpenHandler();
            this.registerUrlHashChangeListener();
            this.enableTabTrapping();

            // open if there is the url-hash or if there was no according cookie set previously
            if (this.isUrlHashPresent() || !this.isConsentManagerConfirmedCookiePresent()) {
                this.openConsentManager();
            }
        } else {
            // log error to graylog
            this.handleError('prepare / error: utag.gdpr not found');
            this.closeConsentManager();
        }
    }

    /* Eventhandler ---------------------------------------------------------------------------- */
    handleClickConfirmSelection(e) {
        e && e.preventDefault();
        this.log('handleClickConfirmSelection clicked');
        this.persistSelection();
        this.createConsentManagerConfirmedCookie();
        this.closeConsentManager();
        this.reloadPage();
    }

    handleClickConfirmAll(e) {
        e.preventDefault();
        const unselectedCheckboxes = this.root.querySelectorAll('.g-consentmanager__setting input[data-optional="true"]:not(:checked)');
        let totalTimeout = 0;
        this.log('handleClickConfirmAll / unselected checkboxes:', unselectedCheckboxes);
        unselectedCheckboxes.forEach((checkbox, index) => {
            const itemTimeout = index * ConsentManager.DELAY.ITEM + (index === 0 ? ConsentManager.DELAY.INITIAL : 0);
            totalTimeout += itemTimeout;
            setTimeout(() => {
                checkbox.checked = true;
                this.log('handleClickConfirmAll / setting checkbox to true', checkbox);
            }, this.delayedSelectionEnabled ? itemTimeout : 0)
        });
        setTimeout(() => {
            this.persistSelection();
            this.createConsentManagerConfirmedCookie();
            this.closeConsentManager();
            this.reloadPage();
        }, this.delayedSelectionEnabled ? totalTimeout + ConsentManager.DELAY.FINAL : 0);
    }

    handleClickToggleDetails(e) {
        e.preventDefault();
        const currentState = this.root.classList.contains(ConsentManager.CLASSES.ROOTSHOWDETAILS);
        this.log('handleClickToggleDetails / currentState:', currentState);

        // TODO: IE11 polyfill
        this.root.classList.toggle(ConsentManager.CLASSES.ROOTSHOWDETAILS);

        // wait for the 'unhiding' to take effect so we can measure and set the 'real' content height
        requestAnimationFrame(() => {
            this.elements.categoryDescriptionWrappers.forEach((categoryDescriptionWrapper) => {
                const categoryDescription = categoryDescriptionWrapper.querySelector('.g-consentmanager__setting-description');
                const targetHeight = outerHeight(categoryDescription);
                if (this.root.classList.contains(ConsentManager.CLASSES.ROOTSHOWDETAILS)) {
                    categoryDescriptionWrapper.style.height = targetHeight + 'px';
                } else {
                    // reset the height if the details are to be hidden
                    categoryDescriptionWrapper.style.height = '0';
                }
            });
        });
    }

    /**
     * Handles resizes and and re-set height of content element if it is open
     * @return {void}
     */
    handleResize() {
        this.log('handleResize');
        if (this.root.classList.contains(ConsentManager.CLASSES.ROOTSHOWDETAILS)) {
            requestAnimationFrame(() => {
                this.elements.categoryDescriptionWrappers.forEach((categoryDescriptionWrapper) => {
                    const categoryDescription = categoryDescriptionWrapper.querySelector('.g-consentmanager__setting-description');
                    const targetHeight = categoryDescription.outerHeight;
                    categoryDescriptionWrapper.style.height = targetHeight + 'px';
                });
            });
        }
    }

    /**
     * Prevent the user from tabbing outside of the consent-manager overlay
     * @param keyDownEvent
     */
    handleKeyDownAndTrapTabbing(keyDownEvent) {
        const KEY_TAB = 9;

        if (keyDownEvent.keyCode === KEY_TAB) {
            const tabbableElementsWithinDialog = this.root.querySelectorAll(ConsentManager.TABBABLE_ELEMENT_SELECTORS);
            const firstTabbableElementWithinDialog = tabbableElementsWithinDialog[0];
            const lastTabbableElementWithinDialog = tabbableElementsWithinDialog[tabbableElementsWithinDialog.length - 1];
            const firstFocusableElementWithinDialog = this.root.querySelector(ConsentManager.FOCUSABLE_ELEMENT_SELECTORS);

            this.log('handleKeyDownAndTrapTabbing / activeElement:', document.activeElement, firstFocusableElementWithinDialog);

            if (keyDownEvent.shiftKey && document.activeElement === firstTabbableElementWithinDialog || keyDownEvent.shiftKey && document.activeElement === firstFocusableElementWithinDialog) {
                keyDownEvent.preventDefault();
                lastTabbableElementWithinDialog.focus();
                this.log('enableTabTrapping: set focus to lastFocusableElementWithinDialog');
            } else if (!keyDownEvent.shiftKey && document.activeElement === lastTabbableElementWithinDialog) {
                keyDownEvent.preventDefault();
                firstTabbableElementWithinDialog.focus();
                this.log('enableTabTrapping: set focus to firstFocusableElementWithinDialog');
            }
        }
    }

    /**
     * Performs actions required after the template HTML was added to the DOM via Tealium-JS
     */
    handlePostRender() {
        this.log('handlePostRender');
        this.setFocus();
    }

    /* Protected ------------------------------------------------------------------------------- */

    /**
     * Simple delegate function for the utility function in order to add logging and a maximum validity
     * @param name
     * @param value
     */
    setCookie(name, value) {
        this.log(`setCookie / name: ${name}, value: ${value}`);
        setCookieUtil(name, value, ConsentManager.COOKIEVALIDITY);
    }

    /**
     * Sets the focus to the first focusable element within the consent-manager overlay
     */
    setFocus() {
        const firstFocusableElement = this.root.querySelector(ConsentManager.FOCUSABLE_ELEMENT_SELECTORS);
        this.log(`setFocus / firstFocusableElement: `, firstFocusableElement);
        firstFocusableElement.focus();
        this.log('setFocus / document.activeElement', document.activeElement);
    }

    /**
     * Creates the cookie preventing the consent manager to be rendered on subsequent page requests
     */
    createConsentManagerConfirmedCookie() {
        this.log('createConsentManagerConfirmedCookie');
        this.setCookie(this.onConsentManagerConfirmedCookieName, 'true');
    }

    /**
     * Creates a mapping between the selected state and the categories
     */
    getSelectionMap() {
        const selectionMap = {};
        this.elements.consentSettingCheckboxes.forEach((item) => {
            selectionMap[item.getAttribute('data-tealiumcategoryname')] = item.checked;
        });
        this.log('getSelectionMap', selectionMap);
        return selectionMap;
    }

    /**
     * Writes the tk-consent-cookies and uses utag-functionality to save the corresponding Tealium cookie
     */
    persistSelection() {
        const selectionMap = this.getSelectionMap();
        const tealiumSettings = {};
        Object.keys(selectionMap).forEach((categoryName) => {
            const categorySetting = this.categoryMap[categoryName] || null;
            // set TK Cookie - but only if the tealium category is actually available (safety check for the rather edgy case that Tealium updates their category names)
            // in that case the index will be set to -1 by the indexOf function while building the categoryMap
            if (categorySetting && categorySetting.tealiumCategoryIndex >= 0) {
                // Tealium expects the category index to starting with 1 (therefore NOT 0-based) so we need to add one at this point
                const categoryIndexToBeSaved = categorySetting.tealiumCategoryIndex + 1;
                const valueToBeSaved = selectionMap[categoryName] ? 1 : 0;
                tealiumSettings[categoryIndexToBeSaved] = valueToBeSaved;
                this.setCookie(categorySetting.consentCookieName, valueToBeSaved);
                this.log(`persistSelection / wrote cookie '${categorySetting.consentCookieName}' and tealium index '${categoryIndexToBeSaved}' with value '${valueToBeSaved}'`);
            } else {
                // send error to graylog
                this.handleError(`persistSelection / error: there was no matching category "${categoryName}" within the available tealium categories `, utag.gdpr.getCategories());
            }
        });

        // write tealiumSettings
        this.log('persistSelection / tealiumSettings: ', tealiumSettings);
        window.utag.gdpr.setPreferencesValues(tealiumSettings);
    }

    /**
     * Removes the body-class which is causing the component to display
     */
    closeConsentManager() {
        this.log('closeConsentManager');
        // remove the potentionally present URL hash trigger in order to allow re-opening
        let wasOpenConsentManagerRequested = window.location.hash.substr(1).toLowerCase() === ConsentManager.OPENTRIGGERHASH.toLowerCase();
        if (wasOpenConsentManagerRequested) {
            this.log('closeConsentManager / removing hash that triggered opening');
            removeUrlHash();
        }

        document.querySelector('body').classList.remove(ConsentManager.CLASSES.BODYDISPLAYCONSENTMANAGER);
        this.disableTabTrapping();
    }

    /**
     * Reloads the page
     */
    reloadPage() {
        // Lade die Seite neu, um die serverseitig gerenderten Body-Klassen und consentManagementFeaturesJson zu aktualisieren und ggfs. Anwendungen deren Rechte bislang nicht vorhanden waren nun anzeigen zu können
        // TODO: auf reload verzichten und Anwendungen dynamisch initialisieren
        location.reload();
    }

    /**
     * Adds the body-class which is causing the component to display
     */
    openConsentManager() {
        this.log('openConsentManager');
        this.preselectCheckboxes();
        document.querySelector('body').classList.add(ConsentManager.CLASSES.BODYDISPLAYCONSENTMANAGER);
        this.handlePostRender();
    }

    /**
     * registers a listener URL hash and triggers opening in case of a match
     */
    registerUrlHashChangeListener() {
        this.log('registerUrlHashChangeListener');
        window.addEventListener("hashchange", (event) => {
            if (this.isUrlHashPresent()) {
                event.preventDefault();
                this.openConsentManager();
            }
        });
    }

    /**
     * checks if the current url contains the hash-value to open the consent manager
     * @returns {boolean}
     */
    isUrlHashPresent() {
        const isOpenCosentManagerRequested = window.location.hash.substr(1).toLowerCase() === ConsentManager.OPENTRIGGERHASH.toLowerCase();
        this.log('isOpenCosentManagerRequested: ', isOpenCosentManagerRequested);
        return isOpenCosentManagerRequested;
    }

    /**
     * checks if the tk consent manager cookie is set in the user's client, meaning the consent manager has been confirmed previously  
     * @returns {boolean}    
     */
    isConsentManagerConfirmedCookiePresent() {
        const consentManagerConfirmedCookieValue = getCookie(this.onConsentManagerConfirmedCookieName);
        this.log('isConsentManagerConfirmedCookie: ', consentManagerConfirmedCookieValue);
        return consentManagerConfirmedCookieValue !== '';
    }

    /**
     * provide the global handler to open the consent manager programatically
     */
    setGlobalOpenHandler() {
        this.log('setGlobalOpenHandler');
        window.tk = window.tk || {};
        window.tk.consentManager = window.tk.consentManager || {};
        window.tk.consentManager.openConsentManager = () => {
            this.openConsentManager();
        }
    }

    enableTabTrapping() {
        this.log('enableTabTrapping');
        document.addEventListener('keydown', this.handleKeyDownAndTrapTabbing.bind(this));
    }

    disableTabTrapping() {
        this.log('disableTabTrapping');
        document.removeEventListener('keydown', this.handleKeyDownAndTrapTabbing);
    }

    writeCssFeatures() {
        this.log('writeCssFeatures');
        const enabledFeatureClasses = this.featureMap.enabled.map(enabledFeature => `consent-feature_${enabledFeature.trim().toLowerCase()}-true`);
        const disabledFeatureClasses = this.featureMap.disabled.map(disabledFeature => `consent-feature_${disabledFeature.trim().toLowerCase()}-false`);
        document.querySelector('body').classList.add(...enabledFeatureClasses);
        document.querySelector('body').classList.add(...disabledFeatureClasses);
    }

    writeJsFeatures() {
        this.log('writeJsFeatures');
        window.tk = window.tk || {};
        window.tk.consentManager = window.tk.consentManager || {};
        window.tk.consentManager.features = {};
        this.featureMap.enabled.forEach(enabledFeature => {
            window.tk.consentManager.features[`FEATURE_${enabledFeature.trim().toUpperCase()}`] = true;
        });
        this.featureMap.disabled.forEach(disabledFeature => {
            window.tk.consentManager.features[`FEATURE_${disabledFeature.trim().toUpperCase()}`] = false;
        })
    }

    /**
     * Mark checkboxes as checked based on the cookies that are already set or if the consent-manager was never confirmed before make sure the pre-selected categories are visualized as checked.
     */
    preselectCheckboxes() {
        if (!this.isConsentManagerConfirmedCookiePresent()) {
            // Make sure the preset checked-state as defined in the utag-html is reflected in the frontend. This seems not to be the case in the default tealium implementation (where the detokenized content (dtc) is appended to the body).
            this.root.querySelectorAll('.g-consentmanager__setting input[checked]').forEach((checkbox) => {
                this.log('preselectCheckboxes / forcing checkbox to appear as "checked"', checkbox);
                checkbox.checked = true;
            });
        }
        else {
            // If the consent manager was previously closed we only want to reflect the consent cookies currently being present instead.
            this.elements.consentSettingCheckboxes.forEach((item) => {
                const cookieName = item.getAttribute('data-consentcookiename');
                const cookieValue = getCookie(cookieName);
                item.checked = parseInt(cookieValue) === 1;
            });
        }
    }


    /* Public ---------------------------------------------------------------------------------- */
}
