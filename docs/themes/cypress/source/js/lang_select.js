(function () {
  'use strict';

  /* eslint-env browser */
  function changeLang () {
    var lang = this.value;
    var canonical = this.dataset.canonical;
    if (lang === 'en') lang = '';
    if (lang) lang += '/';

    location.href = '/' + lang + canonical;
  }

  var langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', changeLang);
  }
  var mobileLangSelect = document.getElementById('mobile-lang-select');
  if (mobileLangSelect) {
    mobileLangSelect.addEventListener('change', changeLang);
  }
})();
