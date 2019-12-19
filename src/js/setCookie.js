/**
 * writes a cookie with the given value and the specified expriration in days
 * @param cname - name of the cookie to be written
 * @param cvalue - value of the cookie to be written
 * @param exdays - expiration of the cookie in days
 */
export function setCookie(cname, cvalue, exdays, secure = true) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    // allow access on all subdomains by prepending the domain with a dot e.g. '.tk.de' - except on localhost
    const domain = ';domain=' + (getCurrentDomainWithoutSubdomains() === 'localhost' ? 'localhost' : '.' + getCurrentDomainWithoutSubdomains());
    const path = ';path=/';
    const expires = ';expires=' + d.toUTCString();
    const secureStr = secure ? ';secure' : '';
    document.cookie = cname + '=' + cvalue + domain + path + expires + secureStr;
}

/**
 * Extracts just the domain (without any subdomains) from the current location
 * http://localhost:3000/folder/page.html?q=1 -> localhost
 * http://subdomain.test.com/folder/page.html?q=1 -> test.com
 * http://www2.test.com/folder/page.html?q=1 -> test.com
 * @returns {string}
 */
function getCurrentDomainWithoutSubdomains() {
    const domain = document.domain;
    const parts = domain.split('.').reverse();
    if (parts != null && parts.length > 1) {
        return parts[1] + '.' + parts[0];
    }
    return domain;
}
