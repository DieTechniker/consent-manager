var TK_COOKIES = [
    "tkConsentSettingsSaved",
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

function deleteCookie(name) {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

(function handleConsentCookies() {
    var tealiumConsentCookie = getCookie("CONSENTMGR");
    if (!!tealiumConsentCookie) {
        for (var i = 0; i < TK_COOKIES.length; i++) {
            var cookieName = TK_COOKIES[i];
            deleteCookie(cookieName);
        }
    }
})()