namespace CypressLodashTests {
  Cypress._ // $ExpectType LoDashStatic
  Cypress._.each([1], item => {
    item // $ExpectType number
  })
}

namespace CypressMomentTests {
  Cypress.moment() // $ExpectType Moment
  Cypress.moment('1982-08-23') // $ExpectType Moment
  Cypress.moment(Date()) // $ExpectType Moment
  Cypress.moment(Date()).format() // $ExpectType string
  Cypress.moment().startOf('week') // $ExpectType Moment
}

namespace CypressJqueryTests {
  Cypress.$ // $ExpectType JQueryStatic
  Cypress.$('selector') // $ExpectType JQuery<HTMLElement>
  Cypress.$('selector').click() // $ExpectType JQuery<HTMLElement>
}

namespace CypressConfigTests {
  // getters
  Cypress.config('baseUrl') // $ExpectType string | null
  Cypress.config().baseUrl // $ExpectType string | null

  // setters
  Cypress.config('baseUrl', '.') // $ExpectType void
  Cypress.config('baseUrl', null) // $ExpectType void
  Cypress.config({ baseUrl: '.', }) // $ExpectType void
}

namespace CypressEnvTests {
  // Just making sure these are valid - no real type safety
  Cypress.env('foo')
  Cypress.env('foo', 'bar')
  Cypress.env().foo
  Cypress.env({
    foo: 'bar'
  })
}

namespace CypressIsCyTests {
  Cypress.isCy(cy) // $ExpectType boolean
  Cypress.isCy(undefined) // $ExpectType boolean

  const chainer = cy.wrap("foo").then(function() {
    if (Cypress.isCy(chainer)) {
      chainer // $ExpectType Chainable<string>
    }
  })
}

namespace CypressCommandsTests {
  Cypress.Commands.add('newCommand', () => {
    return
  })
  Cypress.Commands.add('newCommand', { prevSubject: true }, () => {
    return
  })
  Cypress.Commands.overwrite('newCommand', () => {
    return
  })
}

namespace CypressLogsTest {
  const log = Cypress.log({
    $el: Cypress.$('body'),
    name: 'MyCommand',
    displayName: 'My Command',
    message: ['foo', 'bar'],
    consoleProps: () => {
      return {
        foo: 'bar',
      }
    },
  })
    .set('$el', Cypress.$('body'))
    .set({ name: 'MyCommand' })
    .snapshot()
    .snapshot('before')
    .snapshot('before', { next: 'after' })

  log.get() // $ExpectType LogConfig
  log.get('name') // $ExpectType string
  log.get('$el') // $ExpectType JQuery<HTMLElement>
}

namespace CypressLocalStorageTest {
  Cypress.LocalStorage.clear = function(keys) {
    keys // $ExpectType string[] | undefined
  }
}

namespace CypressItsTests {
  cy.wrap({ foo: [1, 2, 3] })
    .its('foo')
    .each((s: number) => {
      s
    })

  cy.wrap({foo: 'bar'}).its('foo') // $ExpectType Chainable<string>
  cy.wrap([1, 2]).its(1) // $ExpectType Chainable<number>
  cy.wrap(['foo', 'bar']).its(1) // $ExpectType Chainable<string>
  .then((s: string) => {
    s
  })
}

namespace CypressInvokeTests {
  const returnsString = () => 'foo'
  const returnsNumber = () => 42

  // unfortunately could not define more precise type
  // in this case it should have been "number", but so far no luck
  cy.wrap([returnsString, returnsNumber]).invoke(1) // $ExpectType Chainable<any>

  class TestClass {
    foo(s: string, b: number): string | number
    foo(s: string): string
    foo(n: number): number
    foo(o: string | number): string | number {
      return typeof(o) === 'string' ? o + '1' : o + 1
    }
    bar(): number {
      return 1
    }
  }

  const instance = new TestClass()
  cy.wrap(instance).invoke('foo', 'a', 1) // $ExpectType Chainable<string | number>
  cy.wrap(instance).invoke('foo', 'a') // $ExpectType Chainable<string>
  cy.wrap(instance).invoke('foo', 1) // $ExpectType Chainable<number>
  cy.wrap(instance).invoke('foo') // $ExpectError
  cy.wrap(instance).invoke('bar') // $ExpectType Chainable<number>
  cy.wrap(instance).invoke('bar', 1) // $ExpectError
  cy.wrap(instance).invoke('foo', 1, 1) // $ExpectError

  const obj = {
    foo: (value: number, name = 'n') => `${ name } = ${ value + 1 }`,
    bar: { baz: (a: number) => a + 1 },
    bam: () => 1
  }
  cy.wrap(obj).invoke('foo', 1).should('equal', 'n = 2') // $ExpectType Chainable<string>
  cy.wrap(obj).invoke('foo', 5, 'b').should('equal', 'b = 6') // $ExpectType Chainable<string>
  cy.wrap(obj).its('bar').invoke('baz', 2).should('equal', 3) // $ExpectType Chainable<number>
  cy.wrap(obj).invoke('bam') // $ExpectType Chainable<number>
  cy.wrap(obj).invoke('bam', 1) // $ExpectError
  cy.wrap(obj).invoke('bar', 2) // $ExpectError
  cy.wrap(obj).invoke('bar.baz', 2).should('equal', 3) // $ExpectError
  cy.wrap(obj).invoke('foo', 5, 1) // $ExpectError
  cy.wrap(obj).invoke('foo', 5, 'b', 1) // $ExpectError
  cy.get('input').then(it => it[0]).invoke('checkValidity') // $ExpectError
  cy.get('input').invoke('val', 25, 12) // $ExpectError
  cy.get('input').invoke('val', 25) // $ExpectType Chainable<JQuery<HTMLInputElement>>
  cy.get('input').invoke('val') // $ExpectType Chainable<string | number | string[] | undefined>
  cy.get('input').invoke('css', '') // $ExpectType Chainable<string>
  cy.get('input').invoke('css') // $ExpectError
}

cy.wrap({ foo: ['bar', 'baz'] })
  .its('foo')
  .then(([first, second]) => {
    first // $ExpectType string
  })
  .spread((first: string, second: string) => {
    first // $ExpectType string
    // return first as string
  })
  .each((s: string) => {
    s // $ExpectType string
  })
  .then(s => {
    s // $ExpectType string[]
  })

cy.get('.someSelector')
  .each(($el, index, list) => {
    $el // $ExpectType JQuery<HTMLElement>
    index // $ExpectType number
    list // $ExpectType HTMLElement[]
  })

cy.wrap(['bar', 'baz'])
  .spread((first, second) => {
    first // $ExpectType any
  })

describe('then', () => {
  it('should have the correct type signature', () => {
    cy.wrap({ foo: 'bar' })
      .then(s => {
        s // $ExpectType { foo: string; }
        return s
      })
      .then(s => {
        s // $ExpectType { foo: string; }
      })
      .then(s => s.foo)
      .then(s => {
        s // $ExpectType string
      })
  })

  it('should have the correct type signature with options', () => {
    cy.wrap({ foo: 'bar' })
      .then({ timeout: 5000 }, s => {
        s // $ExpectType { foo: string; }
        return s
      })
      .then({ timeout: 5000 }, s => {
        s // $ExpectType { foo: string; }
      })
      .then({ timeout: 5000 }, s => s.foo)
      .then({ timeout: 5000 }, s => {
        s // $ExpectType string
      })
  })
})

cy.wait(['@foo', '@bar'])
  .then(([first, second]) => {
    first // $ExpectType WaitXHR
  })

cy.wrap([{ foo: 'bar' }, { foo: 'baz' }])
  .then(subject => {
    subject // $ExpectType { foo: string; }[]
  })
  .then(([first, second]) => {
    first // $ExpectType { foo: string; }
  })
  .then(subject => {
    subject // $ExpectType { foo: string; }[]
  })
  .then(([first, second]) => {
    return first.foo + second.foo
  })
  .then(subject => {
    subject // $ExpectType string
  })

  cy.wrap([1, 2, 3]).each((num: number, i, array) => {
    return new Cypress.Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, num * 100)
    })
  })

cy.get('something').should('have.length', 1)

cy.stub().withArgs('').log(false).as('foo')

cy.spy().withArgs('').log(false).as('foo')

cy.wrap('foo').then(subject => {
  subject // $ExpectType string
  return cy.wrap(subject)
}).then(subject => {
  subject // $ExpectType string
})

cy.wrap('foo').then(subject => {
  subject // $ExpectType string
  return Cypress.Promise.resolve(subject)
}).then(subject => {
  subject // $ExpectType string
})

cy.get('body').within(body => {
  body // $ExpectType JQuery<HTMLBodyElement>
})

cy.get('body').within({ log: false }, body => {
  body // $ExpectType JQuery<HTMLBodyElement>
})

cy.get('body').within(() => {
  cy.get('body', { withinSubject: null }).then(body => {
    body // $ExpectType JQuery<HTMLBodyElement>
  })
})

cy
  .get('body')
  .then(() => {
    return cy.wrap(undefined)
  })
  .then(subject => {
    subject // $ExpectType undefined
  })

namespace CypressOnTests {
  Cypress.on('uncaught:exception', (error, runnable) => {
    error // $ExpectType Error
    runnable // $ExpectType IRunnable
  })

  cy.on('uncaught:exception', (error, runnable) => {
    error // $ExpectType Error
    runnable // $ExpectType IRunnable
  })
}

namespace CypressOnceTests {
  Cypress.once('uncaught:exception', (error, runnable) => {
    error // $ExpectType Error
    runnable // $ExpectType IRunnable
  })

  cy.once('uncaught:exception', (error, runnable) => {
    error // $ExpectType Error
    runnable // $ExpectType IRunnable
  })
}

namespace CypressOffTests {
  Cypress.off('uncaught:exception', (error, runnable) => {
    error // $ExpectType Error
    runnable // $ExpectType IRunnable
  })

  cy.off('uncaught:exception', (error, runnable) => {
    error // $ExpectType Error
    runnable // $ExpectType IRunnable
  })
}

namespace CypressFilterTests {
  cy.get<HTMLDivElement>('#id')
    .filter((index: number, element: HTMLDivElement) => {
      index // $ExpectType number
      element // $ExpectType HTMLDivElement
      return true
    })
}

cy.screenshot('example-name')
cy.screenshot('example', {log: false})
cy.screenshot({log: false})
cy.screenshot({
  log: true,
  blackout: []
})
cy.screenshot('example', {
  log: true,
  blackout: []
})

namespace CypressTriggerTests {
  cy.get('something')
    .trigger('click') // .trigger(eventName)
    .trigger('click', 'center') // .trigger(eventName, position)
    .trigger('click', { // .trigger(eventName, options)
      arbitraryProperty: 0
    })
    .trigger('click', 0, 0) // .trigger(eventName, x, y)
    .trigger('click', 'center', { // .trigger(eventName, position, options)
      arbitraryProperty: 0
    })
    .trigger('click', 0, 0, { // .trigger(eventName, x, y, options)
      arbitraryProperty: 0
    })
}

const now = new Date(2019, 3, 2).getTime()
cy.clock(now, ['Date'])

namespace CypressContainsTests {
  cy.contains('#app')
  cy.contains('my text to find')
  cy.contains('#app', 'my text to find')
  cy.contains('#app', 'my text to find', {log: false, timeout: 100})
  cy.contains('my text to find', {log: false, timeout: 100})
}

// https://github.com/cypress-io/cypress/pull/5574
namespace CypressLocationTests {
  cy.location('path') // $ExpectError
  cy.location('pathname') // $ExpectType Chainable<string>
}
