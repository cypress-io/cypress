(function(){
  'use strict';

  var body = document.getElementsByTagName('body')[0];
  var navToggle = document.getElementById('mobile-nav-toggle');
  var container = document.getElementById('container');
  var dimmer = document.getElementById('mobile-nav-dimmer');
  var CLASS_NAME = 'mobile-nav-on';
  if (!navToggle) return;

  navToggle.addEventListener('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    body.classList.toggle(CLASS_NAME);
  });

  dimmer.addEventListener('click', function(e){
    if (!body.classList.contains(CLASS_NAME)) return;

    e.preventDefault();
    body.classList.remove(CLASS_NAME);
  });
})();