
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
        console.log("utag.gdpr.showConsentPreferences is not available - setting all features (CSS / JS) to true");

        // write JS-feature map
        window.tk = window.tk || {};
        window.tk.consentManager = window.tk.consentManager || {};
        window.tk.consentManager.features = { FEATURE_ANALYTICS: true, FEATURE_MULTIVARIANZTESTING: true, FEATURE_PERSONALISIERUNG: true, FEATURE_MARKETING_ANALYTICS: true, FEATURE_MAPS: true };

        // write CSS-body classes
        // polyfill for IE11
        DOMTokenList.prototype.addMany = DOMTokenList.prototype.addMany || function () {
            for (var i = 0; i < arguments.length; i++) {
                this.add(arguments[i]);
            }
        }
        const enabledFeatureClasses = ["consent-feature_analytics-true", "consent-feature_multivarianztesting-true", "consent-feature_personalisierung-true", "consent-feature_marketing_analytics-true", "consent-feature_maps-true"]
        document.querySelector('body').classList.addMany(...enabledFeatureClasses);
    }
})()