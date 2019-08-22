/***************************************************************************
	MODIFYING THE CODE BELOW THIS WILL AFFECT THE CONSENT MANAGEMENT.
	  PLEASE CONTACT SUPPORT FOR ASSISTANCE IF YOU NEED TO MODIFY.
***************************************************************************/
(function consent_prompt() {
  var $consentPromptSubmit = document.getElementById('consent_prompt_submit');
  var $modal = document.getElementById('__tealiumGDPRecModal');
  var $closeBtn = $modal.getElementsByClassName('close_btn_thick')[0];
  var $privacyPrefOptin = document.getElementById('privacy_pref_optin');
  var $privacyPrefOptout = document.getElementById('privacy_pref_optout');
  var $documentElement = document.querySelector('html');
  var $advancedOptions = document.getElementById('advanced_consent_options');

  $documentElement.classList.add('tealium-modal-open');

  var consentState = utag.gdpr.getConsentState();
  if (typeof consentState === 'number') {
    if (consentState === 1) {
      $privacyPrefOptin.checked = true;
    } else if (consentState === -1) {
      $privacyPrefOptout.checked = true;
    }
  } else {
    $privacyPrefOptin.checked = true;
  }

  var handleSubmit = function() {
    if ($privacyPrefOptin.checked) {
      utag.gdpr.setConsentValue(1);

      setTimeout(function() {
        if ((window.utag && window.utag.udoname) || window.utag_data) {
          utag.view(window[(window.utag && window.utag.udoname) || 'utag_data']);
        }
      }, 0);
    } else if ($privacyPrefOptout.checked) {
      utag.gdpr.setConsentValue(0);
    } else {
      return;
    }
    closePrompt();
  };

  var closePrompt = function() {
    $modal.style.display = 'none';
    $documentElement.classList.remove('tealium-modal-open');
  };

  var showAdvancedOptions = function() {
    closePrompt();
    utag.gdpr.showConsentPreferences();
  };

  if (document.addEventListener) {
    $consentPromptSubmit.addEventListener('click', handleSubmit, false);
    $closeBtn.addEventListener('click', closePrompt, false);
    if ($advancedOptions) {
      $advancedOptions.addEventListener('click', showAdvancedOptions, false);
    }
  } else if (document.attachEvent) {
    $consentPromptSubmit.attachEvent('click', handleSubmit);
    $closeBtn.attachEvent('click', closePrompt);
    if ($advancedOptions) {
      $advancedOptions.attachEvent('click', showAdvancedOptions);
    }
  } else {
    $consentPromptSubmit.onclick = handleSubmit;
    $closeBtn.onclick = closePrompt;
    $advancedOptions.onclick = showAdvancedOptions;
  }
})();
