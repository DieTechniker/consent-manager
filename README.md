# TK Consent Manager (for external websites)

## Installation
After checking out the project, run `yarn install` once in order to install all needed dependencies.

## Starting the server for local development 
By running the command `yarn start` parcel will start a local dev-server (https://localhost:1234). Updates to the current codebase will be reflected immediately thanks to Parcel's [Hot Module Replacement](https://parceljs.org/hmr.html). Placeholders used in the templates will NOT be replaced in this mode of operation.

## Testing the currently deployed TK 'dev'-profile 
By running the command `yarn start` parcel will start a local dev-server (https://localhost:1234). It will display an empty page containing the TK consent manager as defined in the currently published  'dev'-profile of the TK Tealium account. This is helpful for testing the resulting Consent Manager as it will be distributed to external websites. Placeholders used in the templates will be replaced with the final texts in this mode of operation.

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
