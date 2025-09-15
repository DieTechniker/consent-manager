# TK Consent Manager (for external websites)

## Installation

After checking out the project, run `yarn install` once in order to install all needed dependencies.

## Starting the server for local development

By running the command `yarn start` parcel will start a local dev-server (https://localhost:1234). Updates to the
current codebase will be reflected immediately thanks to
Parcel's [Hot Module Replacement](https://parceljs.org/hmr.html). Placeholders used in the templates will NOT be
replaced in this mode of operation.

## Testing the currently deployed TK 'dev'-profile

By running the command `yarn start` parcel will start a local dev-server (https://localhost:1234). It will display an
empty page containing the TK consent manager as defined in the currently published  'dev'-profile of the TK Tealium
account. This is helpful for testing the resulting Consent Manager as it will be distributed to external websites.
Placeholders used in the templates will be replaced with the final texts in this mode of operation.

## Integrating the Consent Manager on an External Website

### Steps:

1. **Basic Integration of TK Tag Management**:
    - Implement a `<script>` block on all pages, placed directly before the closing `</body>` tag.
    - The integration works via `<script>` tag, e.g.:
        ```html
        <!-- Dev environment -->
        <script src="https://www.tk.de/tk-tag-manager/delivery/tealium-external-dev/utag.js"></script>
        <!-- Prod environment -->
        <script src="https://www.tk.de/tk-tag-manager/delivery/tealium-external/utag.js"></script>
        ```
    - For different environments, use the following script URLs:

      | Website environment | Tealium environment | Script-URL                                                             |
      |---------------------|---------------------|------------------------------------------------------------------------|
      | Development         | dev                 | https://www.tk.de/tk-tag-manager/delivery/tealium-external-dev/utag.js |
      | Production          | prod                | https://www.tk.de/tk-tag-manager/delivery/tealium-external/utag.js     |
    - You can also use the following snippet for the integration:
       ```html
       <script type="text/javascript">
           (function(a,b,c,d,tkTagManagementMode){
               tkTagManagementMode = 'dev'; // 'dev' or 'prod'
               a='https://www.tk.de/tk-tag-manager/delivery/'+ (tkTagManagementMode === 'dev' ? 'tealium-external-dev' : 'tealium-external') + '/utag.js';
               b=document;c='script';d=b.createElement(c);d.src=a;d.type='text/java'+c;d.async=true;
               a=b.getElementsByTagName(c)[0];a.parentNode.insertBefore(d,a);
           })();
       </script>
       ```
      - Note: set the variable `tkTagManagementMode` to 'prod' before going live.

2. **Configuration of the Data Layer**:
    - Define a JSON object `tkWebAnalyticsData` before embedding TK Tag Management.
        - Example:
          ```javascript
          window.tkWebAnalyticsData = {
            contentName: "homepage",
            navigationLevel1: "expo",
            navigationLevel2: document.domain,
            navigationLevel3: "article",
            navigationLevel4: "archive",
            navigationLevel5: "2023-09",
            isOnePager: false
          };
          ```

3. **Consent Manager Integration**:
    - The Consent Manager is deployed via the Tealium Tag Manager and should appear as an overlay on the first visit.
    - Ensure no element on the website has a CSS `z-index` greater than 2999.
    - Implement a link to reopen the Consent Manager via JS:
      ```html
      <a href="javascript:tk.consentManager.openConsentManager()">Open Privacy Settings</a>
      ```
      or via href:
      ```html
      <a href="#openConsentManager">Open Privacy settings</a>
      ```
      This could be used inside the footer or privacy policy section.

4. **Behavior of Consent-Dependent Content**:
    - Third-party content requiring consent should only be embedded after explicit user consent.
    - Example placeholder:
      ```html
      <div class="maps-container">
        <p>To view the map, please adjust your privacy settings.</p>
        <button onclick="tk.consentManager.openConsentManager({ requestCategories: ['category_dienste_von_drittanbietern'] })">Open Privacy Settings</button>
      </div>
      ```

5. **Requesting Missing Consent Categories**:
    - If required user consent is missing, request it via JavaScript:
      ```javascript
      tk.consentManager.openConsentManager({
        requestCategories: ['category_wirtschaftlicher_werbeeinsatz', 'category_dienste_von_drittanbietern']
      });
      ```

6. **Requirements for External Websites**:
    - Support URLs `/impressum` and `/datenschutzbestimmungen`.
    - Privacy policy should include a clear explanation of stored data and its usage.

By following these steps, the Consent Manager will be correctly integrated into the external website, ensuring
compliance with privacy regulations.

## Changelog

### Release 1.0.3 (2022-06-09)

* updated dependencies and checkbox style to avoid overrides from f.E. wpforms

### Release 1.0.2 (2021-09-16)

* fixed A11y issue where sticky buttons were not accessible with >= 400% page-zoom (on desktop browsers)

### Release 1.0.1 (2020-07-22)

* fix dependabot findings

### Release 1.0.0 (2020-06-30)

* improved responsiveness for IE11
* hiding TK logo for IE11

--- 
