import _ from 'lodash'

export const add = (a, b) => a + b

export default (string) => {
  return _.snakeCase(string)
}
