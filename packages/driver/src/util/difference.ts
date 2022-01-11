import _ from 'lodash'

/**
 * Deep diff between two objects. Do NOT use with circular objects.
 * @param  {Object} obj Object compared
 * @param  {Object} comparedToObj   Object to compare with
 * @return {Object} an object that contains the keys that are different between both objects, containing the values of the compared to object
 */
export const difference = (obj: {[key: string]: any }, comparedToObj: {[key: string]: any }) => {
  return _.transform(obj, (result: {[key: string]: any }, value: any, key: string) => {
    if (!_.isEqual(value, comparedToObj[key])) {
      result[key] = (_.isObject(value) && _.isObject(comparedToObj[key])) ? difference(value, comparedToObj[key]) : value
    }
  })
}
