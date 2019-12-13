# Tealium GDPR Code
Master für den in Tealium für die GDPR-relevanten Pop-Ups gespeicherten Code-Fragmente.

## Vorarbeiten
https://my.tealiumiq.com
* Client Side Tools > Consent Management
* Explicit Consent Prompt 
  *  Toggle auf 'on'
  *  Display Rule anlegen -> Query String contains 'open-consent-manager'

* Consent Preferences Dialog 
  *  Toggle auf 'on'
  *  


# Öffnen der Preferences
Man kann die Preferences wie folgt öffnen:

```utag.gdpr.showConsentPreferences();```
bzw.
```utag && utag.gdpr && utag.gdpr.showConsentPreferences();```

# Notwendige Tags
Diese können in den Settings zum "Consent Preferences Dialog" > "Options" als 'omitted' (ausgelassen) deklariert werden. 
Solche Tags werden dann in jedem Fall geladen - auch wenn der Nutzer den Consent Manager noch nicht bestätigt hat.

# Vermischtes

* In Tealium gepflegte Texte können per JS hier ausgelesen werden:
  * utag.gdpr.preferences_prompt.languages.de.common_tokens
  * utag.gdpr.preferences_prompt.languages.de.custom_tokens
* Zu beachten: Pagetracking der ersten Seite von Erstbesuchern geht verloren, wenn Webtrekk NICHT als erforderlich eingestuft werden sollte. Auch wenn der Benutzer WT auswählt, wird es erst beim zweiten Pageview geladen.
* 
