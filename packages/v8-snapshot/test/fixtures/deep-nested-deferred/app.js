// @ts-check
'use strict'

const getErrnameJSON = require('./entry')

// Using invalid err number in order to get same result on all platforms
console.log(getErrnameJSON(-666))
