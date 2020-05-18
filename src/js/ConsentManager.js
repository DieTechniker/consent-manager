import { debug } from "./debug";
import { getCookie } from "./getCookie";
import { handleError } from "./handleError";
import { outerHeight } from "./outerHeight";
import { removeUrlHash } from "./removeUrlHash";
import { setCookie as setCookieUtil } from "./setCookie";
import { ToggleButton } from "./ToggleButton";

export class ConsentManager {
  /* Constants ------------------------------------------------------------------------------- */
  static get CLASSES() {
    return {
      BODYDISPLAYCONSENTMANAGER: "is-display-consentmanager",
      ROOTSHOWDETAILS: "g-consentmanager--show-details",
      SETTING: "g-consentmanager__setting",
      SETTINGHIGHLIGHT: "g-consentmanager__setting--highlight",
      COMPONENTHASHIGHLIGHT: "g-consentmanager--has-highlighted-elements"
    };
  }

  static get OPENTRIGGERHASH() {
    return "openconsentmanager";
  }

  static get ROOTCLASSDISPLAYCONSENTMANAGER() {
    return "is-display-consentmanager";
  }

  static get TABBABLE_ELEMENT_SELECTORS() {
    return "a[href]:not([aria-hidden=true]), area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, [contenteditable]";
  }

  static get FOCUSABLE_ELEMENT_SELECTORS() {
    return `${this.TABBABLE_ELEMENT_SELECTORS}, [tabindex="-1"]`;
  }

  static get COOKIEVALIDITY() {
    return 365 * 5; // ~5 years
  }

  static get ACTIONTRACKING_PREFIX() {
    return "consentmanager_";
  }

  static get DELAY() {
    return {
      INITIAL: 50,
      ITEM: 200,
      FINAL: 100
    };
  }

  /**
   * @param {DOMElement} $element
   */
  constructor(element) {
    this.handleError = handleError;
    this.log = debug("consentManager");
    this.log("ConsentManager constructor");

    // Elements
    this.root = element;
    this.elements = {};
    this.elements.consentSettingCheckboxes = Array.from(
      this.root.querySelectorAll('.e-checkbox__input[data-optional="true"]')
    );
    this.elements.settingItems = Array.from(
      this.root.querySelectorAll(".g-consentmanager__setting")
    );
    this.elements.categoryDescriptionWrappers = Array.from(
      this.root.querySelectorAll(
        ".g-consentmanager__setting-description-wrapper"
      )
    );
    this.elements.btnConfirmSelection = this.root.querySelector(
      ".g-consentmanager__confirm-selection"
    );
    this.elements.btnConfirmAll = this.root.querySelector(
      ".g-consentmanager__confirm-all"
    );
    this.elements.btnClose = this.root.querySelector(
      ".g-consentmanager__close"
    );
    this.elements.toggleDetails = this.root.querySelector(
      ".g-consentmanager__toggle-details"
    );

    // Handler bindings
    this.elements.btnConfirmSelection.addEventListener(
      "click",
      this.handleClickConfirmSelection.bind(this)
    );
    this.elements.btnConfirmAll.addEventListener(
      "click",
      this.handleClickConfirmAll.bind(this)
    );
    this.elements.btnClose.addEventListener(
      "click",
      this.handleClickClose.bind(this)
    );
    this.elements.toggleDetails.addEventListener(
      "click",
      this.handleClickToggleDetails.bind(this)
    );

    // Initialize other UI-components
    new ToggleButton(this.elements.toggleDetails);

    this.prepare();
  }

  /* Lifecycle ------------------------------------------------------------------------------- */
  prepare() {
    window.addEventListener("resize", this.handleResize.bind(this), true);

    this.onConsentManagerConfirmedCookieName = this.root.getAttribute(
      "data-consentsettingssavedcookiename"
    );
    this.vanityUrlWhitelistCsv = this.root.getAttribute(
      "data-vanityurlwhitelistcsv"
    );

    if (window.utag && window.utag.gdpr) {
      this.categoryMap = {
        enabled: [],
        disabled: []
      };
      const tealiumCategoryArray = window.utag.gdpr.getCategories();
      this.log("prepare / read tealium categories:", tealiumCategoryArray);
      this.delayedSelectionEnabled = !!this.root.getAttribute(
        "data-delayedselectionenabled"
      );
      this.log(
        "prepare / delayedselectionenabled:",
        this.delayedSelectionEnabled
      );
      // build categoryMap
      this.elements.consentSettingCheckboxes.forEach(item => {
        const tealiumCategoryName = item.getAttribute(
          "data-tealiumcategoryname"
        );
        const tkCategoryName = item.getAttribute("data-tkcategoryname");
        // use the tealiumCategoryName originally configured in the CMSettings to resolve the index of the category based on the (current) categories array
        // before persisting we will be checking if a valid category was actually found
        const tealiumCategoryIndex = tealiumCategoryArray.indexOf(
          tealiumCategoryName
        );
        const consentCookieName = item.getAttribute("data-consentcookiename");
        const consentGiven = getCookie(consentCookieName) === "1";
        this.log(
          `prepare / cookie: ${consentCookieName} -> ${getCookie(
            consentCookieName
          )}`
        );
        this.categoryMap[tealiumCategoryName] = {
          tealiumCategoryIndex,
          consentCookieName,
          consentGiven
        };
        // add the enabled/disabled state for the current category to the categoryMap-entry
        this.categoryMap[
          consentGiven ? "enabled" : "disabled"
        ] = this.categoryMap[consentGiven ? "enabled" : "disabled"].concat(
          tkCategoryName
        );
      });
      this.log("prepare / categoryMap:", this.categoryMap);
      this.writeCssCategories();
      this.writeJsCategories();

      this.setGlobalOpenHandler();
      this.registerUrlHashChangeListener();

      // open if there is the url-hash or if there was no according cookie set previously and the page is not whitelisted
      if (
        this.isUrlHashPresent() ||
        (!this.isConsentManagerConfirmedCookiePresent() &&
          !this.currentPageIsWhitelisted())
      ) {
        this.openConsentManager();
      }
    } else {
      // log error to graylog
      this.handleError("prepare / error: utag.gdpr not found");
      this.closeConsentManager();
    }
  }

  /* Eventhandler ---------------------------------------------------------------------------- */
  handleClickConfirmSelection(e) {
    e && e.preventDefault();
    this.log("handleClickConfirmSelection clicked");
    this.persistSelection();
    this.createConsentManagerConfirmedCookie();
    this.closeConsentManager();
    this.reloadPage();
  }

  handleClickConfirmAll(e) {
    e.preventDefault();
    const unselectedCheckboxes = Array.from(
      this.root.querySelectorAll(
        '.g-consentmanager__setting input[data-optional="true"]:not(:checked)'
      )
    );
    let totalTimeout = 0;
    this.log(
      "handleClickConfirmAll / unselected checkboxes:",
      unselectedCheckboxes
    );
    unselectedCheckboxes.forEach((checkbox, index) => {
      const itemTimeout =
        index * ConsentManager.DELAY.ITEM +
        (index === 0 ? ConsentManager.DELAY.INITIAL : 0);
      totalTimeout += itemTimeout;
      setTimeout(
        () => {
          checkbox.checked = true;
          this.log(
            "handleClickConfirmAll / setting checkbox to true",
            checkbox
          );
        },
        this.delayedSelectionEnabled ? itemTimeout : 0
      );
    });
    setTimeout(
      () => {
        this.persistSelection();
        this.createConsentManagerConfirmedCookie();
        this.closeConsentManager();
        this.reloadPage();
      },
      this.delayedSelectionEnabled
        ? totalTimeout + ConsentManager.DELAY.FINAL
        : 0
    );
  }

  handleClickClose(e) {
    e.preventDefault();
    this.log("handleClickClose");
    this.closeConsentManager();
  }

  handleClickToggleDetails(e) {
    e.preventDefault();
    const currentState = this.root.classList.contains(
      ConsentManager.CLASSES.ROOTSHOWDETAILS
    );
    this.log("handleClickToggleDetails / currentState:", currentState);

    // TODO: IE11 polyfill
    this.root.classList.toggle(ConsentManager.CLASSES.ROOTSHOWDETAILS);

    // wait for the 'unhiding' to take effect so we can measure and set the 'real' content height
    requestAnimationFrame(() => {
      this.elements.categoryDescriptionWrappers.forEach(
        categoryDescriptionWrapper => {
          const categoryDescription = categoryDescriptionWrapper.querySelector(
            ".g-consentmanager__setting-description"
          );
          const targetHeight = outerHeight(categoryDescription);
          if (
            this.root.classList.contains(ConsentManager.CLASSES.ROOTSHOWDETAILS)
          ) {
            categoryDescriptionWrapper.style.height = targetHeight + "px";
          } else {
            // reset the height if the details are to be hidden
            categoryDescriptionWrapper.style.height = "0";
          }
        }
      );
    });
  }

  /**
   * Handles resizes and and re-set height of content element if it is open
   * @return {void}
   */
  handleResize() {
    this.log("handleResize");
    if (this.root.classList.contains(ConsentManager.CLASSES.ROOTSHOWDETAILS)) {
      requestAnimationFrame(() => {
        this.elements.categoryDescriptionWrappers.forEach(
          categoryDescriptionWrapper => {
            const categoryDescription = categoryDescriptionWrapper.querySelector(
              ".g-consentmanager__setting-description"
            );
            const targetHeight = categoryDescription.outerHeight;
            categoryDescriptionWrapper.style.height = targetHeight + "px";
          }
        );
      });
    }
  }

  /**
   * Prevent the user from tabbing outside of the consent-manager overlay
   * @param keyDownEvent
   */
  handleKeyDownAndTrapTabbing(keyDownEvent) {
    const KEY_TAB = 9;
    this.log("handleKeyDownAndTrapTabbing");
    if (keyDownEvent.keyCode === KEY_TAB) {
      const tabbableElementsWithinDialog = Array.from(
        this.root.querySelectorAll(ConsentManager.TABBABLE_ELEMENT_SELECTORS)
      );
      const firstTabbableElementWithinDialog = tabbableElementsWithinDialog[0];
      const lastTabbableElementWithinDialog =
        tabbableElementsWithinDialog[tabbableElementsWithinDialog.length - 1];
      const firstFocusableElementWithinDialog = this.root.querySelector(
        ConsentManager.FOCUSABLE_ELEMENT_SELECTORS
      );

      this.log(
        "handleKeyDownAndTrapTabbing / activeElement:",
        document.activeElement
      );
      this.log(
        "handleKeyDownAndTrapTabbing / firstFocusableElementWithinDialog:",
        firstFocusableElementWithinDialog
      );
      this.log(
        "handleKeyDownAndTrapTabbing / lastTabbableElementWithinDialog:",
        lastTabbableElementWithinDialog
      );
      this.log(
        "handleKeyDownAndTrapTabbing / tabbableElementsWithinDialog:",
        tabbableElementsWithinDialog
      );

      if (
        (keyDownEvent.shiftKey &&
          document.activeElement === firstTabbableElementWithinDialog) ||
        (keyDownEvent.shiftKey &&
          document.activeElement === firstFocusableElementWithinDialog)
      ) {
        keyDownEvent.preventDefault();
        lastTabbableElementWithinDialog.focus();
        this.log(
          "enableTabTrapping: set focus to lastFocusableElementWithinDialog"
        );
      } else if (
        !keyDownEvent.shiftKey &&
        document.activeElement === lastTabbableElementWithinDialog
      ) {
        keyDownEvent.preventDefault();
        firstTabbableElementWithinDialog.focus();
        this.log(
          "enableTabTrapping: set focus to firstFocusableElementWithinDialog"
        );
      }
    }
  }

  /**
   * Performs actions required after the template HTML was added to the DOM via Tealium-JS
   */
  handlePostRender() {
    this.log("handlePostRender");
    this.focusFirstElement();
  }

  /* Protected ------------------------------------------------------------------------------- */

  /**
   * Simple delegate function for the utility function in order to add logging and a maximum validity
   * @param name
   * @param value
   */
  setCookie(name, value) {
    this.log(`setCookie / name: ${name}, value: ${value}`);
    setCookieUtil(name, value, ConsentManager.COOKIEVALIDITY, true, false);
  }

  /**
   * Sets the focus to the first focusable element within the consent-manager overlay
   */
  focusFirstElement() {
    const firstFocusableElement = this.root.querySelector(
      ConsentManager.FOCUSABLE_ELEMENT_SELECTORS
    );
    this.log(`setFocus / firstFocusableElement: `, firstFocusableElement);
    firstFocusableElement.focus();
    this.log("setFocus / document.activeElement", document.activeElement);
  }

  /**
   * Creates the cookie preventing the consent manager to be rendered on subsequent page requests
   */
  createConsentManagerConfirmedCookie() {
    this.log("createConsentManagerConfirmedCookie");
    this.setCookie(this.onConsentManagerConfirmedCookieName, "true");
  }

  /**
   * Creates a mapping between the selected state and the categories
   */
  getSelectionMap() {
    const selectionMap = {};
    this.elements.consentSettingCheckboxes.forEach(item => {
      selectionMap[item.getAttribute("data-tealiumcategoryname")] =
        item.checked;
    });
    this.log("getSelectionMap", selectionMap);
    return selectionMap;
  }

  /**
   * Writes the tk-consent-cookies and uses utag-functionality to save the corresponding Tealium cookie
   */
  persistSelection() {
    const selectionMap = this.getSelectionMap();
    const tealiumSettings = {};
    Object.keys(selectionMap).forEach(categoryName => {
      const categorySetting = this.categoryMap[categoryName] || null;
      // set TK Cookie - but only if the tealium category is actually available (safety check for the rather edgy case that Tealium updates their category names)
      // in that case the index will be set to -1 by the indexOf function while building the categoryMap
      if (categorySetting && categorySetting.tealiumCategoryIndex >= 0) {
        // Tealium expects the category index to starting with 1 (therefore NOT 0-based) so we need to add one at this point
        const categoryIndexToBeSaved = categorySetting.tealiumCategoryIndex + 1;
        const valueToBeSaved = selectionMap[categoryName] ? 1 : 0;
        tealiumSettings[categoryIndexToBeSaved] = valueToBeSaved;
        this.setCookie(categorySetting.consentCookieName, valueToBeSaved);
        this.log(
          `persistSelection / wrote cookie '${categorySetting.consentCookieName}' and tealium index '${categoryIndexToBeSaved}' with value '${valueToBeSaved}'`
        );
      } else {
        // send error to graylog
        this.handleError(
          `persistSelection / error: there was no matching category "${categoryName}" within the available tealium categories `,
          utag.gdpr.getCategories()
        );
      }
    });

    // write tealiumSettings
    this.log("persistSelection / tealiumSettings: ", tealiumSettings);
    window.utag.gdpr.setPreferencesValues(tealiumSettings);
  }

  /**
   * Removes the body-class which is causing the component to display
   */
  closeConsentManager() {
    this.log("closeConsentManager");
    // remove the potentionally present URL hash trigger in order to allow re-opening
    let wasOpenConsentManagerRequested =
      window.location.hash.substr(1).toLowerCase() ===
      ConsentManager.OPENTRIGGERHASH.toLowerCase();
    if (wasOpenConsentManagerRequested) {
      this.log("closeConsentManager / removing hash that triggered opening");
      removeUrlHash();
    }
    document
      .querySelector("body")
      .classList.remove(ConsentManager.CLASSES.BODYDISPLAYCONSENTMANAGER);
    this.disableTabTrapping();
    this.disableHighlighting();
    this.disableCloseButton();
  }

  /**
   * Reloads the page
   */
  reloadPage() {
    // Lade die Seite neu, um die serverseitig gerenderten Body-Klassen und consentManagementFeaturesJson zu aktualisieren und ggfs. Anwendungen deren Rechte bislang nicht vorhanden waren nun anzeigen zu können
    // TODO: auf reload verzichten und Anwendungen dynamisch initialisieren
    location.reload();
  }

  /**
   * Adds the body-class which is causing the component to display
   * Example for querying categories:
   * openConsentManager({requestCategories = ['category_nutzergerechte_gestaltung', 'category_wirtschaftlicher_werbeeinsatz']})
   */
  openConsentManager(params = { requestCategories: [] }) {
    this.log(`openConsentManager / params: `, params);
    this.handleAdditionalFeatureAndCategoryRequests(params);
    // the additional features must be done before the focussing takes place - the close button might not always be present
    this.focusFirstElement();
    this.enableTabTrapping();

    // pre-select checkboxes based on the cookies that are already set
    this.preselectCheckboxes();
    document
      .querySelector("body")
      .classList.add(ConsentManager.CLASSES.BODYDISPLAYCONSENTMANAGER);
    this.handlePostRender();
  }

  /**
   * Highlights the requested (optional) categories. If requested categories were found:
   * - the 'select all' button will be hidden
   * - a close button will be made visible
   * - there will be no reload if the close-button is used
   * see: https://jira-spu.tk-online.net/browse/KANUK-69
   * @param {requestCategories: [*]} params
   */
  handleAdditionalFeatureAndCategoryRequests(
    params = { requestCategories: [] }
  ) {
    this.log(`highlightRequestedElements / params: `, params);
    let categoriesSelectorArray = [];
    if (params.requestCategories && params.requestCategories.length > 0) {
      categoriesSelectorArray = params.requestCategories.map(
        category => `[data-tkcategoryname=${category.toLowerCase()}]`
      );
    }
    const selector = categoriesSelectorArray.join(", ");
    this.log(`highlightRequestedElements / selector: `, selector);
    if (selector) {
      const elementsToBeHighlighted = Array.from(
        this.root.querySelectorAll(selector)
      );
      if (elementsToBeHighlighted.length > 0) {
        this.log(
          `highlightRequestedElements / elementsToBeHighlighted: `,
          elementsToBeHighlighted
        );
        elementsToBeHighlighted.forEach(item => {
          item.parentElement.classList.add(
            ConsentManager.CLASSES.SETTINGHIGHLIGHT
          );
        });
        this.enableHighlighting();
        this.enableCloseButton();
      } else {
        this.log(
          `highlightRequestedElements / no elements found to be highlighted`
        );
      }
    }
  }

  /**
   * registers a listener URL hash and triggers opening in case of a match
   */
  registerUrlHashChangeListener() {
    this.log("registerUrlHashChangeListener");
    window.addEventListener("hashchange", event => {
      if (this.isUrlHashPresent()) {
        event.preventDefault();
        this.openConsentManager();
      }
    });
  }

  /**
   * checks if the current url contains the hash-value to open the consent manager
   * @returns {boolean}
   */
  isUrlHashPresent() {
    const isOpenCosentManagerRequested =
      window.location.hash.substr(1).toLowerCase() ===
      ConsentManager.OPENTRIGGERHASH.toLowerCase();
    this.log("isOpenCosentManagerRequested: ", isOpenCosentManagerRequested);
    return isOpenCosentManagerRequested;
  }

  /**
   * checks if the tk consent manager cookie is set in the user's client, meaning the consent manager has been confirmed previously
   * @returns {boolean}
   */
  isConsentManagerConfirmedCookiePresent() {
    const consentManagerConfirmedCookieValue = getCookie(
      this.onConsentManagerConfirmedCookieName
    );
    this.log(
      "isConsentManagerConfirmedCookie: ",
      consentManagerConfirmedCookieValue
    );
    return consentManagerConfirmedCookieValue !== "";
  }

  /**
   * checks if the current URL is explicitly marked for NOT automatically displaying the consent-manager for users
   * that have not already consented
   */
  currentPageIsWhitelisted() {
    const vanityUrlWhitelistArray = this.vanityUrlWhitelistCsv
      .split(",")
      .map(item => item.toLowerCase().trim());
    const currentUrlFirstSegment = window.location.pathname
      .split("/")[1]
      .toLowerCase();
    return vanityUrlWhitelistArray.includes(currentUrlFirstSegment);
  }

  /**
   * provide the global handler to open the consent manager programatically
   */
  setGlobalOpenHandler() {
    this.log("setGlobalOpenHandler");
    window.tk = window.tk || {};
    window.tk.consentManager = window.tk.consentManager || {};
    window.tk.consentManager.openConsentManager = params => {
      this.openConsentManager(params);
    };
  }

  enableTabTrapping() {
    this.log("enableTabTrapping");
    document.addEventListener(
      "keydown",
      this.handleKeyDownAndTrapTabbing.bind(this)
    );
  }

  disableTabTrapping() {
    this.log("disableTabTrapping");
    document.removeEventListener("keydown", this.handleKeyDownAndTrapTabbing);
  }

  writeCssCategories() {
    this.log("writeCssCategories");

    // polyfill for IE11
    DOMTokenList.prototype.addMany =
      DOMTokenList.prototype.addMany ||
      function(classesArray) {
        for (var i = 0; i < classesArray.length; i++) {
          this.add(classesArray[i]);
        }
      };

    const enabledCategoryClasses = this.categoryMap.enabled.map(
      enabledCategory =>
        `consent-category_${enabledCategory.trim().toLowerCase()}-true`
    );
    const disabledCategoryClasses = this.categoryMap.disabled.map(
      disabledCategory =>
        `consent-category_${disabledCategory.trim().toLowerCase()}-false`
    );
    document.querySelector("body").classList.addMany(enabledCategoryClasses);
    document.querySelector("body").classList.addMany(disabledCategoryClasses);
  }

  writeJsCategories() {
    this.log("writeJsCategories");
    window.tk = window.tk || {};
    window.tk.consentManager = window.tk.consentManager || {};
    window.tk.consentManager.categories = {};
    this.categoryMap.enabled.forEach(enabledCategory => {
      window.tk.consentManager.categories[
        `${enabledCategory.trim().toUpperCase()}`
      ] = true;
    });
    this.categoryMap.disabled.forEach(disabledCategory => {
      window.tk.consentManager.categories[
        `${disabledCategory.trim().toUpperCase()}`
      ] = false;
    });
  }

  /**
   * Mark checkboxes as checked based on the cookies that are already set or if the consent-manager was never confirmed before make sure the pre-selected categories are visualized as checked.
   */
  preselectCheckboxes() {
    if (!this.isConsentManagerConfirmedCookiePresent()) {
      // Make sure the preset checked-state as defined in the utag-html is reflected in the frontend. This seems not to be the case in the default tealium implementation (where the detokenized content (dtc) is appended to the body).
      Array.from(
        this.root.querySelectorAll(".g-consentmanager__setting input[checked]")
      ).forEach(checkbox => {
        this.log(
          'preselectCheckboxes / forcing checkbox to appear as "checked"',
          checkbox
        );
        checkbox.checked = true;
      });
    } else {
      // If the consent manager was previously closed we only want to reflect the consent cookies currently being present instead.
      this.elements.consentSettingCheckboxes.forEach(item => {
        const cookieName = item.getAttribute("data-consentcookiename");
        const cookieValue = getCookie(cookieName);
        item.checked = parseInt(cookieValue) === 1;
      });
    }
  }

  enableHighlighting() {
    this.log("enableHighlighting");
    this.root.classList.add(ConsentManager.CLASSES.COMPONENTHASHIGHLIGHT);
  }

  disableHighlighting() {
    this.log("disableHighlighting");
    this.elements.settingItems.forEach(settingItem => {
      settingItem.classList.remove(
        ConsentManager.CLASSES.COMPONENTHASHIGHLIGHT
      );
    });
    this.root.classList.remove(ConsentManager.CLASSES.COMPONENTHASHIGHLIGHT);
  }

  enableCloseButton() {
    this.log("enableCloseButton");
    this.elements.btnClose.setAttribute("aria-hidden", false);
  }

  disableCloseButton() {
    this.log("disableCloseButton");
    this.elements.btnClose.setAttribute("aria-hidden", true);
  }

  /* Public ---------------------------------------------------------------------------------- */
}
