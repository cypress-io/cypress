const _ = require('lodash')

const inflection = require('@cypress/underscore.inflection')(_)

// only export exactly what we need, nothing more!
_.mixin({
  clean: require('underscore.string/clean'),
  count: require('underscore.string/count'),
  isBlank: require('underscore.string/isBlank'),
  toBoolean: require('underscore.string/toBoolean'),
  capitalize: require('underscore.string/capitalize'), // its mo' better the lodash version
  ordinalize: inflection.ordinalize,
})

export default _
