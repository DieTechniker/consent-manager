/***************************************************************************
	MODIFYING THE CODE BELOW THIS WILL AFFECT THE CONSENT MANAGEMENT.
	  PLEASE CONTACT SUPPORT FOR ASSISTANCE IF YOU NEED TO MODIFY.
***************************************************************************/
(function preferences_prompt() {
  var $preferencesPromptSubmit = document.getElementById('preferences_prompt_submit');
  var $modal = document.getElementById('__tealiumGDPRcpPrefs');
  var $closeBtn = $modal.getElementsByClassName('close_btn_thick')[0];
  var $body = $modal.getElementsByClassName('consent_preferences')[0];
  var regMatch = /\d+$/;
  var i;
  var $documentElement = document.querySelector('html');

  $documentElement.classList.add('tealium-modal-open');

  var handleSubmit = function() {
    var inputs = $body.getElementsByClassName('toggle');
    var cats = {};

    for (var i = 0; i < inputs.length; i++) {
      var obj = inputs[i];
      cats[obj.id.match(regMatch)[0]] = obj.checked ? 1 : 0;
    }
    closePrompt();

    utag.gdpr.setPreferencesValues(cats);
    /**** Kommentar entfernen, um nach dem Festlegen der Einstellungen ein Anzeigeereignis zuzulassen
       setTimeout(function (){if (window.utag && window.utag.udoname || window.utag_data) {utag.view(window[window.utag && window.utag.udoname || "utag_data"]);}},0);
       ****/
  };
  var closePrompt = function() {
    $modal.style.display = 'none';
    $documentElement.classList.remove('tealium-modal-open');
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
    $preferencesPromptSubmit.addEventListener('click', handleSubmit, false);
    $closeBtn.addEventListener('click', closePrompt, false);
  } else if (document.attachEvent) {
    $preferencesPromptSubmit.attachEvent('click', handleSubmit);
    $closeBtn.attachEvent('click', closePrompt);
  } else {
    $preferencesPromptSubmit.onclick = handleSubmit;
    $closeBtn.onclick = closePrompt;
  }
})();
