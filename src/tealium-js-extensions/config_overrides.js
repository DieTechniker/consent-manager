// target profiles: tk.de / external
// The content of this file needs to be configured as a JS-extension with scope "Pre Loader".

// We override the cookie domain in order to reduce the scope of the Tealium cookies (i.e. CONSENTMGR) to the current subdomain.
// See: https://docs.tealium.com/platforms/javascript/settings/#domain
window.utag_cfg_ovrd = window.utag_cfg_ovrd || {};
window.utag_cfg_ovrd.domain = location.hostname; // location.hostname includes the subdomain (e.g. www.tk.de)

// Adjust the lifetime of the CONSENTMGR cookie to match the cookies written by our custom consent-manager
window.utag_cfg_ovrd.consentPeriod = 365 * 5; // ~5 years