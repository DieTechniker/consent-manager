
(function initializeConsentManager() {
    if (utag && utag.gdpr && utag.gdpr.showConsentPreferences) {
        console.log('initializeConsentManager');
        // initialize the tealium consent manager - this will perform the following steps: 
        // * replace placeholders within the markup with custom texts defined in the tealium admin panel
        // * mount the markup into the DOM
        // * render the corresponding CSS-feature-classes on the <body>-element
        // * write the corresponding JS-feature-map in window.tk.consentManager.features
        // * this will not(!) show any consent manager to the user
        utag.gdpr.showConsentPreferences();
    } else {
        console.error("could not find function utag.gdpr.showConsentPreferences() in order to initialize the tealium consent-manager")
    }
})()