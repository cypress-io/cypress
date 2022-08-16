'use strict'

import chai, { expect } from 'chai'
import { stripIndent } from 'common-tags'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import utils from '../../lib/utils'
import { CrossOriginCallbackStore } from '../../lib/cross-origin-callback-store'

chai.use(sinonChai)

import loader from '../../lib/cross-origin-callback-loader'

const expectAddFileSource = (store) => {
  return expect(store.addFile.lastCall.args[1].source)
}

describe('./lib/cross-origin-callback-loader', () => {
  const callLoader = (source) => {
    const store = new CrossOriginCallbackStore()

    store.addFile = sinon.stub()

    return {
      store,
      result: loader.call({ resourcePath: '/path/to/file' }, source, null, null, store),
    }
  }

  beforeEach(() => {
    sinon.restore()
  })

  describe('noop scenarios', () => {
    it('is a noop when source does not contain cy.origin()', () => {
      const source = `it('test', () => {
        cy.get('h1')
      })`
      const { result, store } = callLoader(source)

      expect(result).to.equal(source)
      expect(store.addFile).not.to.be.called
    })

    it('is a noop when cy.origin() callback does not contain Cypress.require()', () => {
      const source = `it('test', () => {
          cy.origin('http://foobar.com:3500', () => {})
        })`
      const { result, store } = callLoader(source)

      expect(result).to.equal(source)
      expect(store.addFile).not.to.be.called
    })

    it('is a noop when last argument to cy.origin() is not a callback', () => {
      const source = `it('test', () => {
          cy.origin('http://foobar.com:3500', {})
        })`
      const { result, store } = callLoader(source)

      expect(result).to.equal(source)
      expect(store.addFile).not.to.be.called
    })
  })

  describe('replacement scenarios', () => {
    beforeEach(() => {
      sinon.stub(utils, 'hash').returns('abc123')
      sinon.stub(utils, 'tmpdir').returns('/path/to/tmp')
    })

    it('replaces cy.origin() callback with an object', () => {
      const { result } = callLoader(
        `it('test', () => {
          cy.origin('http://foobar.com:3500', () => {
            Cypress.require('../support/utils')
          })
        })`,
      )

      expect(result).to.equal(stripIndent`
        it('test', () => {
          cy.origin('http://foobar.com:3500', {
            "callbackName": "__cypressCrossOriginCallback",
            "outputFilePath": "/path/to/tmp/cross-origin-cb-abc123.js"
          });
        });`)
    })

    it('adds the file to the store, replacing Cypress.require() with require()', () => {
      const { store } = callLoader(
        `it('test', () => {
          cy.origin('http://foobar.com:3500', () => {
            Cypress.require('../support/utils')
          })
        })`,
      )

      expect(store.addFile).to.be.calledWithMatch('/path/to/file', {
        inputFileName: 'cross-origin-cb-abc123',
        outputFilePath: '/path/to/tmp/cross-origin-cb-abc123.js',
      })
    })

    // arrow expression is implicitly tested in other tests
    it('works when callback is a function expression', () => {
      const { store } = callLoader(
        `it('test', () => {
          cy.origin('http://foobar.com:3500', function () {
            Cypress.require('../support/utils')
          })
        })`,
      )

      expectAddFileSource(store).to.equal(stripIndent`
        __cypressCrossOriginCallback = function () {
          require('../support/utils');
        }`)
    })

    it('works when dep is not assigned to a variable', () => {
      const { store } = callLoader(
        `it('test', () => {
          cy.origin('http://foobar.com:3500', () => {
            Cypress.require('../support/utils')
          })
        })`,
      )

      expectAddFileSource(store).to.equal(stripIndent`
        __cypressCrossOriginCallback = () => {
          require('../support/utils');
        }`)
    })

    it('works when dep is assigned to a variable', () => {
      const { store } = callLoader(
        `it('test', () => {
          cy.origin('http://foobar.com:3500', () => {
            const utils = Cypress.require('../support/utils')
            utils.foo()
          })
        })`,
      )

      expectAddFileSource(store).to.equal(stripIndent`
        __cypressCrossOriginCallback = () => {
          const utils = require('../support/utils');

          utils.foo();
        }`)
    })

    it('works with multiple Cypress.require()s', () => {
      const { store } = callLoader(
        `it('test', () => {
          cy.origin('http://foobar.com:3500', () => {
            Cypress.require('../support/commands')
            const utils = Cypress.require('../support/utils')
            const _ = Cypress.require('lodash')
          })
        })`,
      )

      expectAddFileSource(store).to.equal(stripIndent`
        __cypressCrossOriginCallback = () => {
          require('../support/commands');

          const utils = require('../support/utils');

          const _ = require('lodash');
        }`)
    })

    it('works when .origin() is chained off another command', () => {
      const { store } = callLoader(
        `it('test', () => {
          cy
          .wrap({})
          .origin('http://foobar.com:3500', () => {
            Cypress.require('../support/commands')
          })
        })`,
      )

      expectAddFileSource(store).to.equal(stripIndent`
        __cypressCrossOriginCallback = () => {
          require('../support/commands');
        }`)
    })

    it('works when result of require() is invoked', () => {
      const { store } = callLoader(
        `it('test', () => {
          cy.origin('http://foobar.com:3500', () => {
            const someVar = 'someValue'
            const result = Cypress.require('./fn')(someVar)
            expect(result).to.equal('mutated someVar')
          })
        })`,
      )

      expectAddFileSource(store).to.equal(stripIndent`
        __cypressCrossOriginCallback = () => {
          const someVar = 'someValue';

          const result = require('./fn')(someVar);

          expect(result).to.equal('mutated someVar');
        }`)
    })
  })
})
