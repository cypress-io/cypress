_ = require("lodash")

## if we have SecretSauce as a global use that, else require it
## as a module
SS = global.SecretSauce ? require("../secret_sauce")

## provide lodash if it doesnt already exist as a property
SS._ ?= _

module.exports = SS