// target profiles: external (, possibly tk.de)
// The content of this file needs to be configured as a JS-extension with scope "All Tags - Before Load Rules".
//
// NOTE: in order to debug in IE11 delete the CONSENTMGR cookie using the following command:
// document.cookie = 'CONSENTMGR=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; domain=' + location.hostname;

/**
 * List of cookies created by the TK-consent manager
 * @type {string[]}
 */
var TK_CONSENT_MASTER_COOKIE = "tkConsentSettingsSaved";
var TK_CONSENT_COOKIES = [
    TK_CONSENT_MASTER_COOKIE,
    "tkConsentDiensteVonDrittanbietern",
    "tkConsentNutzergerechteGestaltung",
    "tkConsentWirtschaftlicherWerbeeinsatz"
];

/**
 * gets the value of a cookie of the specified name
 * @param cname - name of the cookie
 * @returns {string} value of the cookie (or empty string if not found)
 */
function getCookie(cname) {
    var name = cname + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(';');
    for (var i = 0; i < cookieArray.length; i++) {
        var cookie = cookieArray[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return '';
}

/**
 * deletes the cookie of the specified name
 * @param name
 */
function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
}

/**
 * If no tealium consent manager cookie is found all tk consent cookies must be deleted.
 * The tealium consent manager cookie might have been deleted or had a shorter TTL than the TK consent cookies.
 */
(function handleConsentCookies() {
    var tealiumConsentCookie = getCookie("CONSENTMGR");
    if (!!!tealiumConsentCookie) {
        // If no tealium consent manager cookie is found all tk consent cookies must be deleted.
        for (var i = 0; i < TK_CONSENT_COOKIES.length; i++) {
            var tkCookieName = TK_CONSENT_COOKIES[i];
            if (!!getCookie(tkCookieName)) {
                // tk consent cookie was found
                deleteCookie(tkCookieName);
            }
        }
    }
})()