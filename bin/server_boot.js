require("coffee-script/register");

open = require('open');
settings = require("../lib/util/settings");

projectRoot = process.argv[2];

require('../lib/server')({
  projectRoot: projectRoot
}).open().then(function() {
  return settings.read({projectRoot: projectRoot})
})
.then(function(settings) {
  var port = settings.eclectus.port || 3000;
  open("http://localhost:"+port+"/id_generator");
});
