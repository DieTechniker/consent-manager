/***************************************************************************
	MODIFYING THE CODE BELOW THIS WILL AFFECT THE CONSENT MANAGEMENT.
	  PLEASE CONTACT SUPPORT FOR ASSISTANCE IF YOU NEED TO MODIFY.
***************************************************************************/
(function preferences_prompt() {
  var $el = document.getElementById('preferences_prompt_submit'),
    $modal = document.getElementById('__tealiumGDPRcpPrefs'),
    $closeBtn = $modal.getElementsByClassName('close_btn_thick')[0],
    $body = $modal.getElementsByClassName('consent_preferences')[0],
    reg_match = /\d+$/,
    i;

  var callBack = function() {
    var inputs = $body.getElementsByClassName('toggle'),
      cats = {};

    for (var i = 0; i < inputs.length; i++) {
      var obj = inputs[i];
      cats[obj.id.match(reg_match)[0]] = obj.checked ? 1 : 0;
    }
    closePrompt();

    utag.gdpr.setPreferencesValues(cats);
    /**** Kommentar entfernen, um nach dem Festlegen der Einstellungen ein Anzeigeereignis zuzulassen
       setTimeout(function (){if (window.utag && window.utag.udoname || window.utag_data) {utag.view(window[window.utag && window.utag.udoname || "utag_data"]);}},0);
       ****/
  };
  var closePrompt = function() {
    $modal.style.display = 'none';
  };

  var consentState = utag.gdpr.getConsentState();
  if (typeof consentState === 'number') {
    var _state = false;
    if (consentState === 1 || consentState === -1) {
      _state = consentState === 1;
    } else {
      _state = !!utag.gdpr.preferences_prompt.defaultState;
    }
    for (i = 0; i < utag.gdpr.getCategories().length; i++) {
      document.getElementById('toggle_cat' + (i + 1)).checked = _state;
    }
  } else {
    for (i = 0; i < consentState.length; i++) {
      if (consentState[i].ct !== '1') {
        continue;
      }
      document.getElementById('toggle_cat' + (i + 1)).checked = true;
    }
  }

  if (document.addEventListener) {
    $el.addEventListener('click', callBack, false);
    $closeBtn.addEventListener('click', closePrompt, false);
  } else if (document.attachEvent) {
    $el.attachEvent('click', callBack);
    $closeBtn.attachEvent('click', closePrompt);
  } else {
    $el.onclick = callBack;
    $closeBtn.onclick = closePrompt;
  }
})();
