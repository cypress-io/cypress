import _ from 'lodash'

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
export const difference = (object: {[key: string]: any }, base: {[key: string]: any }) => {
  function changes (object: {[key: string]: any }, base: {[key: string]: any }) {
    return _.transform(object, (result: {[key: string]: any }, value: any, key: string) => {
      if (!_.isEqual(value, base[key])) {
        result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value
      }
    })
  }

  return changes(object, base)
}
