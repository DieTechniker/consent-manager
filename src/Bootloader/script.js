
(function initializeConsentManager() {
    if (utag && utag.gdpr && utag.gdpr.showConsentPreferences) {
        console.log('initializeConsentManager');
        // initialize the tealium consent manager 
        // although the name of the function is `showConsentPreferences` this will NOT(!) show any consent manager to the user yet - we are simply using it to bootstrap and prepare the consent manager
        // this function call will perform the following steps: 
        // * tealium will replace placeholders within the markup with custom texts defined in the tealium admin panel
        // * tealium will mount the markup into the DOM
        // * initialize a new instance of the ConsentManager class which in turn will: 
        //      - render the corresponding CSS-category-classes on the <body>-element
        //      - write the corresponding JS-category-map in window.tk.consentManager.categories
        utag.gdpr.showConsentPreferences();
    } else {
        console.log("utag.gdpr.showConsentPreferences is not available - defaulting all categories (CSS / JS) to true");

        // write JS-category map
        window.tk = window.tk || {};
        window.tk.consentManager = window.tk.consentManager || {};
        window.tk.consentManager.categories = { CATEGORY_NUTZERGERECHTE_GESTALTUNG: true, CATEGORY_WIRTSCHAFTLICHER_WERBEEINSATZ: true, CATEGORY_DIENSTE_VON_DRITTANBIETERN: true };

        // write CSS-body classes
        // polyfill for IE11
        DOMTokenList.prototype.addMany = DOMTokenList.prototype.addMany || function () {
            for (var i = 0; i < arguments.length; i++) {
                this.add(arguments[i]);
            }
        }
        const enabledCategoryClasses = ["consent-category_nutzergerechte_gestaltung-true", "consent-category_wirtschaftlicher_werbeeinsatz-true", "consent-category_dienste_von_drittanbietern-true"]
        document.querySelector('body').classList.addMany(...enabledCategoryClasses);
    }
})()