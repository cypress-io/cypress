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
  Cypress.Commands.overwrite('newCommand', { prevSubject: true }, () => {
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

cy.wrap({ foo: [1, 2, 3] })
  .its('foo')
  .each((s: number) => {
    s
  })

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
