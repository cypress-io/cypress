// const _ = require('lodash')
import _ from 'lodash'
import underscoreInflection from '@cypress/underscore.inflection'

import clean from 'underscore.string/clean'
import count from 'underscore.string/count'
import isBlank from 'underscore.string/isBlank'
import toBoolean from 'underscore.string/toBoolean'
import capitalize from 'underscore.string/capitalize'

const inflection = underscoreInflection(_)

// only export exactly what we need, nothing more!
_.mixin({
  clean,
  count,
  isBlank,
  toBoolean,
  capitalize, // its mo' better the lodash version
  ordinalize: inflection.ordinalize,
})

declare module 'lodash' {
  export interface LoDashExplicitWrapper<TValue> {
    clean(...args): LoDashExplicitWrapper<TValue>
    count(...args): LoDashExplicitWrapper<TValue>
    isBlank(...args): LoDashExplicitWrapper<TValue>
    toBoolean(...args): LoDashExplicitWrapper<TValue>
    capitalize(...args): LoDashExplicitWrapper<TValue>
    ordinalize(...args): LoDashExplicitWrapper<TValue>
  }

  export interface LodashStatic<TValue> {
    clean(...args): LoDashExplicitWrapper<TValue>
    count(...args): LoDashExplicitWrapper<TValue>
    isBlank(...args): LoDashExplicitWrapper<TValue>
    toBoolean(...args): LoDashExplicitWrapper<TValue>
    capitalize(...args): LoDashExplicitWrapper<TValue>
    ordinalize(...args): LoDashExplicitWrapper<TValue>
  }
}

export default _
