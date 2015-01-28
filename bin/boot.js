require("coffee-script/register");

var open     = require('open');
var Settings = require("../lib/util/settings");
var Server   = require("../lib/server")

// we are using boot as a forked process
if (process.send) {
  var projectRoot = process.argv[2];

  process.send({projectRoot: projectRoot})

  process.send({done:true})

} else {
  // we are using boot as a required module
  module.exports = function(projectRoot){
    var server = Server(projectRoot)

    return server.open().then(function(settings){
      // if(settings.autoOpen){
      //   open(settings.idGeneratorPath)
      // }

      return {server: server, settings: settings}
    })
  }

}


// server.open()//.then(function() {
//   return Settings.read({projectRoot: projectRoot})
// })
// .then(function(settings) {
//   debugger
//   var port = settings.port || 3000;
//   open("http://localhost:"+port+"/id_generator");
// });


// module.exports = Server