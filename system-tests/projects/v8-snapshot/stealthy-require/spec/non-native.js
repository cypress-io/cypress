/* eslint-disable mocha/handle-done-callback */
'use strict'

const assert = require('assert').strict
const stealthyRequire = require('stealthy-require')

const loggingAssert = {
  equal: (a, b, msg) => {
    console.log(msg)
    assert.equal(a, b, msg)
  },
  notEqual: (a, b, msg) => {
    console.log(msg)
    assert.notEqual(a, b, msg)
  },
}

function test (description, callback) {
  console.log('# %s', description)
  callback(loggingAssert)
}

try {
  test('should require a module without deps', (t) => {
    let req1 = require('../fixtures/no-deps.js')
    let req2 = stealthyRequire(require.cache, function () {
      return require('../fixtures/no-deps.js')
    })
    let req3 = require('../fixtures/no-deps.js')

    t.equal(req1, req3)
    t.notEqual(req1, req2)
  })

  test('should require a module with sync deps', (t) => {
    let req1 = require('../fixtures/sync-deps.js')
    let req2 = stealthyRequire(require.cache, function () {
      return require('../fixtures/sync-deps.js')
    })
    let req3 = require('../fixtures/sync-deps.js')

    t.equal(req1, req3)
    t.notEqual(req1, req2)
  })

  test('should require a module while keeping a dependency that was required before', (t) => {
    let req1 = require('../fixtures/sync-deps.js')
    let lenChildrenBeforeReq2 = module.children.length
    let req2 = stealthyRequire(
      require.cache,
      function () {
        return require('../fixtures/deep-sync-deps.js')
      },
      function () {
        require('../fixtures/sync-deps.js')
      },
      module,
    )
    let lenChildrenAfterReq2 = module.children.length
    let req3 = require('../fixtures/sync-deps.js')

    t.equal(req1, req3)

    t.equal(req1, req2.dep)
    t.equal(req1.dep, req2.dep.dep)

    // We aren't updating module children when snapshot is used thus len doesn't change.
    // t.equal(lenChildrenAfterReq2, lenChildrenBeforeReq2 + 1, 'len children')
    // This assertion thus also ensures that we are using modules from the snapshot
    t.equal(lenChildrenAfterReq2, lenChildrenBeforeReq2)
  })

  test('should require a module while keeping a dependency that will be required afterwards', (t) => {
    let testReq1 = require('../fixtures/sync-deps.js')
    let testReq2 = require('../fixtures/no-deps.js')

    delete require.cache[require.resolve('../fixtures/sync-deps.js')]
    delete require.cache[require.resolve('../fixtures/no-deps.js')]
    let testReq3 = require('../fixtures/sync-deps.js')
    let testReq4 = require('../fixtures/no-deps.js')

    t.notEqual(testReq1, testReq3)
    t.notEqual(testReq2, testReq4)

    delete require.cache[require.resolve('../fixtures/sync-deps.js')]
    delete require.cache[require.resolve('../fixtures/no-deps.js')]

    let lenChildrenBeforeReq2 = module.children.length
    let req2 = stealthyRequire(
      require.cache,
      function () {
        return require('../fixtures/deep-sync-deps.js')
      },
      function () {
        require('../fixtures/sync-deps.js')
      },
      module,
    )
    let lenChildrenAfterReq2 = module.children.length
    let req3 = require('../fixtures/sync-deps.js')

    t.equal(req3, req2.dep)
    t.equal(req3.dep, req2.dep.dep)

    // We aren't updating module children when snapshot is used thus len doesn't change
    // t.equal(lenChildrenAfterReq2, lenChildrenBeforeReq2 + 1, 'len children')
    // This assertion thus also ensures that we are using modules from the snapshot
    t.equal(lenChildrenAfterReq2, lenChildrenBeforeReq2, 'len children')
  })

  test('should not pollute require cache with dependencies that should be kept but are never required', (t) => {
    let testReq1 = require('../fixtures/sync-deps.js')
    let testReq2 = require('../fixtures/no-deps.js')

    delete require.cache[require.resolve('../fixtures/sync-deps.js')]
    delete require.cache[require.resolve('../fixtures/no-deps.js')]

    let testReq3 = require('../fixtures/sync-deps.js')
    let testReq4 = require('../fixtures/no-deps.js')

    t.notEqual(testReq1, testReq3)
    t.notEqual(testReq2, testReq4)

    delete require.cache[require.resolve('../fixtures/sync-deps.js')]
    delete require.cache[require.resolve('../fixtures/no-deps.js')]

    stealthyRequire(
      require.cache,
      function () {
        return require('../fixtures/no-deps.js')
      },
      function () {
        require('../fixtures/sync-deps.js')

        t.notEqual(
          require.cache[require.resolve('../fixtures/sync-deps.js')],
          undefined,
        )

        t.equal(
          Object.prototype.hasOwnProperty.call(
            require.cache,
            require.resolve('../fixtures/sync-deps.js'),
          ),
          true,
        )
      },
      module,
    )

    t.equal(
      require.cache[require.resolve('../fixtures/sync-deps.js')],
      undefined,
    )

    t.equal(
      Object.prototype.hasOwnProperty.call(
        require.cache,
        require.resolve('../fixtures/sync-deps.js'),
      ),
      false,
    )
  })

  console.log('# PASS')
} catch (err) {
  console.log('# FAIL')

  console.error('++++++++++++++++++++++++++++++++++')
  console.error('+++++++++ Test Failure +++++++++++')
  console.error('++++++++++++++++++++++++++++++++++')
  console.error(err)
}
