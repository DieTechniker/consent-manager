/***************************************************************************
	MODIFYING THE CODE BELOW THIS WILL AFFECT THE CONSENT MANAGEMENT.
	  PLEASE CONTACT SUPPORT FOR ASSISTANCE IF YOU NEED TO MODIFY.
***************************************************************************/
(function consent_prompt() {
  var $el = document.getElementById('consent_prompt_submit'),
    $modal = document.getElementById('__tealiumGDPRecModal'),
    $closeBtn = $modal.getElementsByClassName('close_btn_thick')[0],
    $privacy_pref_optin = document.getElementById('privacy_pref_optin'),
    $privacy_pref_optout = document.getElementById('privacy_pref_optout'),
    $documentElement = document.querySelector('html');

  $documentElement.classList.add('tealium-modal-open');

  var consentState = utag.gdpr.getConsentState();
  if (typeof consentState === 'number') {
    if (consentState === 1) {
      $privacy_pref_optin.checked = true;
    } else if (consentState === -1) {
      $privacy_pref_optout.checked = true;
    }
  } else {
    $privacy_pref_optin.checked = true;
  }

  var callBack = function() {
    if ($privacy_pref_optin.checked) {
      utag.gdpr.setConsentValue(1);

      setTimeout(function() {
        if ((window.utag && window.utag.udoname) || window.utag_data) {
          utag.view(window[(window.utag && window.utag.udoname) || 'utag_data']);
        }
      }, 0);
    } else if ($privacy_pref_optout.checked) {
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
