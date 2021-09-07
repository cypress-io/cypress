import _ from 'lodash'
import { clean, count, isBlank, toBoolean } from 'underscore.string'

// only export exactly what we need, nothing more!
_.mixin({
  clean,
  count,
  isBlank,
  toBoolean,
})

export default _
