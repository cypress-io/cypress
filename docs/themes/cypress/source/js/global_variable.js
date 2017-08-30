// example global variable to test if the application
// JavaScript has loaded correctly
(function addGlobalVariable () {
  'use strict';

  if (typeof window.CypressDocs === 'undefined') {
    window.CypressDocs = 'CypressDocs';
  }
})();
