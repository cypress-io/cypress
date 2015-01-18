require("coffee-script/register");

require('../lib/server')({
  projectRoot: process.argv[2]
})
