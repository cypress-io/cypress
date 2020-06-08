// const _ = require('lodash')
import _ from 'lodash'

import clean from 'underscore.string/clean'
import count from 'underscore.string/count'
import isBlank from 'underscore.string/isBlank'
import toBoolean from 'underscore.string/toBoolean'

// only export exactly what we need, nothing more!
_.mixin({
  clean,
  count,
  isBlank,
  toBoolean,
})

declare module 'lodash' {
  export interface LoDashExplicitWrapper<TValue> {
    clean(...args): LoDashExplicitWrapper<TValue>
    count(...args): LoDashExplicitWrapper<TValue>
    isBlank(...args): LoDashExplicitWrapper<TValue>
    toBoolean(...args): LoDashExplicitWrapper<TValue>
  }

  export interface LodashStatic<TValue> {
    clean(...args): LoDashExplicitWrapper<TValue>
    count(...args): LoDashExplicitWrapper<TValue>
    isBlank(...args): LoDashExplicitWrapper<TValue>
    toBoolean(...args): LoDashExplicitWrapper<TValue>
  }
}

export default _
