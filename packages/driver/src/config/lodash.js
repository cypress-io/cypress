const _ = require('lodash')

// only export exactly what we need, nothing more!
_.mixin({
  clean: require('underscore.string/clean'),
  count: require('underscore.string/count'),
  isBlank: require('underscore.string/isBlank'),
  toBoolean: require('underscore.string/toBoolean'),
})

export default _
