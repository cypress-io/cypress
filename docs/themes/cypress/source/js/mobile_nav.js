(function () {
  'use strict';

  /* eslint-env browser */
  var body = document.getElementsByTagName('body')[0];
  var navToggle = document.getElementById('mobile-nav-toggle');
  var dimmer = document.getElementById('mobile-nav-dimmer');
  var CLASS_NAME = 'mobile-nav-on';

  if (navToggle) {
    navToggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      body.classList.toggle(CLASS_NAME);
    });
  }

  if (dimmer) {
    dimmer.addEventListener('click', function (e) {
      if (!body.classList.contains(CLASS_NAME)) return;

      e.preventDefault();
      body.classList.remove(CLASS_NAME);
    });
  }
})();
