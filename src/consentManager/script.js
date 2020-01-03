import { ConsentManager } from "../js/ConsentManager";

import '@babel/polyfill';

// get the mounted element
const consentManagerElement = document.getElementById('tkConsentmanager')
if (!!consentManagerElement) {
    console.log('initialize the TK consent manager on the element', consentManagerElement);
    new ConsentManager(consentManagerElement);
} else {
    console.error("could not find element #tkConsentmanager in order to initialize the TK consent-manager")
}
