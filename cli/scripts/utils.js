/**
 * Folder names in "node_modules/@types" that we should include
 * when we bundle Cypress NPM package. These folder have ".d.ts"
 * definition files that we will need to include with our NPM package.
 */
const includeTypes = [
  'bluebird',
  'lodash',
  'mocha',
  'minimatch',
  'sinon',
  'sinon-chai',
  'chai',
  'chai-jquery',
  'jquery',
]

module.exports = { includeTypes }
