const { expect } = require('chai')

const { flattenNodeModulesPath, restoreNodeModulesPath } = require('../circle-cache')

describe('scripts/circle-cache', () => {
  ;[
    ['a package node_modules from the glob', '/root/cypress/npm/react/node_modules/', '/root/cypress/npm/react_node_modules/'],
    ['a scoped workspace path', '/root/cypress/packages/server/node_modules/', '/root/cypress/packages/server_node_modules/'],
    ['a Windows path with forward slashes', 'C:/Users/circleci/project/packages/app/node_modules/', 'C:/Users/circleci/project/packages/app_node_modules/'],
    ['nested node_modules, renaming only the first', '/root/cypress/npm/vue/node_modules/foo/node_modules/', '/root/cypress/npm/vue_node_modules/foo/node_modules/'],
    ['a path without node_modules', '/root/cypress/npm/react/', '/root/cypress/npm/react/'],
    ['an empty string', '', ''],
  ].forEach(([label, src, flattened]) => {
    it(`flattens ${label} like the lazy regex`, () => {
      expect(flattenNodeModulesPath(src)).to.equal(flattened)
      expect(flattenNodeModulesPath(src)).to.equal(src.replace(/(.*?)\/node_modules/, '$1_node_modules'))
    })

    it(`restores ${label} like the lazy regex`, () => {
      expect(restoreNodeModulesPath(flattened)).to.equal(flattened.replace(/(.*?)_node_modules/, '$1/node_modules'))
    })
  })

  it('round-trips a globbed package path', () => {
    const src = '/root/cypress/npm/webpack-dev-server/node_modules/'

    expect(restoreNodeModulesPath(flattenNodeModulesPath(src))).to.equal(src)
  })

  it('handles a 50,000-character path without node_modules in linear time', () => {
    const src = '/a'.repeat(25_000)
    const start = performance.now()

    expect(flattenNodeModulesPath(src)).to.equal(src)
    expect(restoreNodeModulesPath(src)).to.equal(src)
    expect(performance.now() - start).to.be.lessThan(200)
  })
})
