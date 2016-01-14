require("coffee-script/register")

// call run with the process's arguments
require("./lib/cypress.coffee")(process.argv.slice(2))