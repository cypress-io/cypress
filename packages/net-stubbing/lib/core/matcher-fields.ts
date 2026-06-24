import _ from 'lodash'
import type { RouteMatcherOptionsGeneric } from '@packages/network-interception'
import { DICT_STRING_MATCHER_FIELDS, STRING_MATCHER_FIELDS } from '@packages/network-interception'

export function getAllStringMatcherFields (options: RouteMatcherOptionsGeneric<any>) {
  return _.concat(
    _.filter(STRING_MATCHER_FIELDS, _.partial(_.has, options)),
    _.flatten(
      _.filter(
        DICT_STRING_MATCHER_FIELDS.map((field) => {
          const value = options[field]

          if (value) {
            return _.keys(value).map((key) => {
              return `${field}.${key}`
            })
          }

          return ''
        }),
      ),
    ),
  )
}
