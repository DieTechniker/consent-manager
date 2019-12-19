/**
 * Removes the location hash fragment from the current URL
 */
export function removeUrlHash() {
    history.pushState("", document.title, window.location.pathname
        + window.location.search);
}
