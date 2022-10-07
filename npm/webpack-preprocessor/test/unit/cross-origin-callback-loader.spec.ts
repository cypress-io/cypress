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
  const callLoader = (source, commands = ['origin']) => {
    const store = new CrossOriginCallbackStore()
    const callback = sinon.spy()
    const context = {
      callback,
      resourcePath: '/path/to/file',
      query: { commands },
    }
    const originalMap = { sourcesContent: [] }

    store.addFile = sinon.stub()
    loader.call(context, source, originalMap, null, store)

    return {
      store,
      originalMap,
      resultingSource: callback.lastCall.args[1],
      resultingMap: callback.lastCall.args[2],
    }
  }

  beforeEach(() => {
    sinon.restore()
  })

  describe('noop scenarios', () => {
    it('is a noop when parsing source fails', () => {
      const { originalMap, resultingSource, resultingMap, store } = callLoader(undefined)

      expect(resultingSource).to.be.undefined
      expect(resultingMap).to.be.equal(originalMap)
      expect(store.addFile).not.to.be.called
    })

    it('is a noop when source does not contain cy.origin()', () => {
      const source = `it('test', () => {
        cy.get('h1')
      })`
      const { originalMap, resultingSource, resultingMap, store } = callLoader(source)

      expect(resultingSource).to.be.equal(source)
      expect(resultingMap).to.be.equal(originalMap)
      expect(store.addFile).not.to.be.called
    })

    it('is a noop when cy.origin() callback does not contain Cypress.require()', () => {
      const source = `it('test', () => {
          cy.origin('http://www.foobar.com:3500', () => {})
        })`
      const { originalMap, resultingSource, resultingMap, store } = callLoader(source)

      expect(resultingSource).to.be.equal(source)
      expect(resultingMap).to.be.equal(originalMap)
      expect(store.addFile).not.to.be.called
    })

    it('is a noop when last argument to cy.origin() is not a callback', () => {
      const source = `it('test', () => {
          cy.origin('http://www.foobar.com:3500', {})
        })`
      const { originalMap, resultingSource, resultingMap, store } = callLoader(source)

      expect(resultingSource).to.be.equal(source)
      expect(resultingMap).to.be.equal(originalMap)
      expect(store.addFile).not.to.be.called
    })
  })

  describe('replacement scenarios', () => {
    beforeEach(() => {
      sinon.stub(utils, 'hash').returns('abc123')
      sinon.stub(utils, 'tmpdir').returns('/path/to/tmp')
    })

    it('replaces cy.origin() callback with an object', () => {
      const { resultingSource, resultingMap } = callLoader(stripIndent`
        it('test', () => {
          cy.origin('http://www.foobar.com:3500', () => {
            Cypress.require('../support/utils')
          })
        })`)

      expect(resultingSource).to.equal(stripIndent`
        it('test', () => {
          cy.origin('http://www.foobar.com:3500', {
            "callbackName": "__cypressCrossOriginCallback",
            "outputFilePath": "/path/to/tmp/cross-origin-cb-abc123.js"
          });
        });`)

      expect(resultingMap).to.be.undefined
    })

    it('replaces cy.other() when specified in commands', () => {
      const { resultingSource, resultingMap } = callLoader(stripIndent`
        it('test', () => {
          cy.other('http://www.foobar.com:3500', () => {
            Cypress.require('../support/utils')
          })
        })`,
      ['other'])

      expect(resultingSource).to.equal(stripIndent`
        it('test', () => {
          cy.other('http://www.foobar.com:3500', {
            "callbackName": "__cypressCrossOriginCallback",
            "outputFilePath": "/path/to/tmp/cross-origin-cb-abc123.js"
          });
        });`)

      expect(resultingMap).to.be.undefined
    })

    it('adds the file to the store, replacing Cypress.require() with require()', () => {
      const { store } = callLoader(
        `it('test', () => {
          cy.origin('http://www.foobar.com:3500', () => {
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
          cy.origin('http://www.foobar.com:3500', function () {
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
          cy.origin('http://www.foobar.com:3500', () => {
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
          cy.origin('http://www.foobar.com:3500', () => {
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
          cy.origin('http://www.foobar.com:3500', () => {
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
          .origin('http://www.foobar.com:3500', () => {
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
          cy.origin('http://www.foobar.com:3500', () => {
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

    it('works when dependencies passed into called', () => {
      const { store } = callLoader(
        `it('test', () => {
          cy.origin('http://www.foobar.com:3500', { args: { foo: 'foo'}}, ({ foo }) => {
            const result = Cypress.require('./fn')(foo)
            expect(result).to.equal('mutated someVar')
          })
        })`,
      )

      expectAddFileSource(store).to.equal(stripIndent`
        __cypressCrossOriginCallback = ({
          foo
        }) => {
          const result = require('./fn')(foo);

          expect(result).to.equal('mutated someVar');
        }`)
    })
  })
})
