import { debug } from "./debug";

export class ToggleButton {
    /**
     * @param {DOMElement} element
     */
    constructor(element) {
        this.log = debug('toggleButton');
        this.log('ToggleButton constructor');

        // Elements
        this.root = element;
        this.elements = {};
        this.elements.linkElement = this.root.querySelector('.m-togglebutton__link');
        this.elements.linkText = this.root.querySelector('.e-link__title');

        // Handler bindings
        this.elements.linkElement.addEventListener('click', this.handleClick.bind(this));

        this.prepare();
    }


    /* Lifecycle ------------------------------------------------------------------------------- */
    prepare() {
        this.log('prepare');
        this.isActive = this.root.getAttribute('data-is-active') === 'true';
        this.activeText = this.root.getAttribute('data-text-active');
        this.inactiveText = this.root.getAttribute('data-text-inactive');
    }

    /* Eventhandler ---------------------------------------------------------------------------- */
    handleClick(event) {
        event.preventDefault();
        this.isActive = !this.isActive;
        this.log('handleClick / new active state: ', this.isActive, this.root.getAttribute('id'));
        this.elements.linkText.innerText = (this.isActive ? this.activeText : this.inactiveText);
        this.elements.linkElement.setAttribute('aria-checked', this.isActive);
        this.root.setAttribute('data-is-active', this.isActive);
    }

    /* Protected ------------------------------------------------------------------------------- */
    /* Public ---------------------------------------------------------------------------------- */
}
