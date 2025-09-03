/**
 * Folder names in "node_modules/@types" that we should include
 * when we bundle Cypress NPM package. These folder have ".d.ts"
 * definition files that we will need to include with our NPM package.
 */
export const includeTypes: string[] = [
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
