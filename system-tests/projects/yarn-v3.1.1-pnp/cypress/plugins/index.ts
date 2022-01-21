import * as head from 'lodash/head'

// Default Cypress plugin function
export default (on, config) => {
  // make sure plugin can access dependencies
  head([1, 2, 3])

  return config
}
