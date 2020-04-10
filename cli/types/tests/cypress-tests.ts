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

namespace CypressSinonTests {
  Cypress.sinon // $ExpectType SinonApi
  const stub = cy.stub()
  stub(2, 'foo')
  expect(stub).to.have.been.calledWith(Cypress.sinon.match.number, Cypress.sinon.match('foo'))
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
  cy.wrap({baz: { quux: '2' }}).its('baz.quux') // $ExpectType Chainable<any>
}

namespace CypressInvokeTests {
  const returnsString = () => 'foo'
  const returnsNumber = () => 42

  cy.wrap({ a: returnsString }).invoke('a') // $ExpectType Chainable<string>
  cy.wrap({ b: returnsNumber }).invoke('b') // $ExpectType Chainable<number>
  cy.wrap({ b: returnsNumber }).invoke({ log: true }, 'b') // $ExpectType Chainable<number>

  // challenging to define a more precise return type than string | number here
  cy.wrap([returnsString, returnsNumber]).invoke(1) // $ExpectType Chainable<string | number>

  // invoke through property path results in any
  cy.wrap({ a: { fn: (x: number) => x * x }}).invoke('a.fn', 4) // $ExpectType Chainable<any>

  // examples below are from previous attempt at typing `invoke`
  // (see https://github.com/cypress-io/cypress/issues/4022)

  // call methods on arbitrary objects with reasonable return types
  cy.wrap({ fn: () => ({a: 1})}).invoke("fn") // $ExpectType Chainable<{ a: number; }>

  // call methods on dom elements with reasonable return types
  cy.get('.trigger-input-range').invoke('val', 25) // $ExpectType Chainable<string | number | string[] | undefined>
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

namespace CypressBrowserTests {
  Cypress.isBrowser('chrome')// $ExpectType boolean
  Cypress.isBrowser('firefox')// $ExpectType boolean
  Cypress.isBrowser('edge')// $ExpectType boolean
  Cypress.isBrowser('brave')// $ExpectType boolean

  // does not error to allow for user supplied browsers
  Cypress.isBrowser('safari')// $ExpectType boolean

  Cypress.isBrowser({channel: 'stable'})// $ExpectType boolean
  Cypress.isBrowser({family: 'chromium'})// $ExpectType boolean
  Cypress.isBrowser({name: 'chrome'})// $ExpectType boolean

  Cypress.isBrowser({family: 'foo'}) // $ExpectError
  Cypress.isBrowser() // $ExpectError
}

namespace CypressDomTests {
  const obj: any = {}
  const el = {} as any as HTMLElement
  const jel = {} as any as JQuery
  const doc = {} as any as Document

  Cypress.dom.wrap((x: number) => 'a') // $ExpectType JQuery<HTMLElement>
  Cypress.dom.query('foo', el) // $ExpectType JQuery<HTMLElement>
  Cypress.dom.unwrap(obj) // $ExpectType any
  Cypress.dom.isDom(obj) // $ExpectType boolean
  Cypress.dom.isType(el, 'foo') // $ExpectType boolean
  Cypress.dom.isVisible(el) // $ExpectType boolean
  Cypress.dom.isHidden(el) // $ExpectType boolean
  Cypress.dom.isFocusable(el) // $ExpectType boolean
  Cypress.dom.isTextLike(el) // $ExpectType boolean
  Cypress.dom.isScrollable(el) // $ExpectType boolean
  Cypress.dom.isFocused(el) // $ExpectType boolean
  Cypress.dom.isDetached(el) // $ExpectType boolean
  Cypress.dom.isAttached(el) // $ExpectType boolean
  Cypress.dom.isSelector(el, 'foo') // $ExpectType boolean
  Cypress.dom.isDescendent(el, el) // $ExpectType boolean
  Cypress.dom.isElement(obj) // $ExpectType boolean
  Cypress.dom.isDocument(obj) // $ExpectType boolean
  Cypress.dom.isWindow(obj) // $ExpectType boolean
  Cypress.dom.isJquery(obj) // $ExpectType boolean
  Cypress.dom.isInputType(el, 'number') // $ExpectType boolean
  Cypress.dom.stringify(el, 'foo') // $ExpectType string
  Cypress.dom.getElements(jel) // $ExpectType JQuery<HTMLElement> | HTMLElement[]
  Cypress.dom.getContainsSelector('foo', 'bar') // $ExpectType string
  Cypress.dom.getFirstDeepestElement([el], 1) // $ExpectType HTMLElement
  Cypress.dom.getWindowByElement(el) // $ExpectType HTMLElement | JQuery<HTMLElement>
  Cypress.dom.getReasonIsHidden(el) // $ExpectType string
  Cypress.dom.getFirstScrollableParent(el) // $ExpectType HTMLElement | JQuery<HTMLElement>
  Cypress.dom.getFirstFixedOrStickyPositionParent(el) // $ExpectType HTMLElement | JQuery<HTMLElement>
  Cypress.dom.getFirstStickyPositionParent(el) // $ExpectType HTMLElement | JQuery<HTMLElement>
  Cypress.dom.getCoordsByPosition(1, 2) // $ExpectType number
  Cypress.dom.getElementPositioning(el) // $ExpectType ElementPositioning
  Cypress.dom.getElementAtPointFromViewport(doc, 1, 2) // $ExpectType Element | null
  Cypress.dom.getElementCoordinatesByPosition(el, 'top') // $ExpectType ElementCoordinates
  Cypress.dom.getElementCoordinatesByPositionRelativeToXY(el, 1, 2) // $ExpectType ElementPositioning

  Cypress.dom.wrap() // $ExpectError
  Cypress.dom.query(el, 'foo') // $ExpectError
  Cypress.dom.unwrap() // $ExpectError
  Cypress.dom.isDom() // $ExpectError
  Cypress.dom.isType(el) // $ExpectError
  Cypress.dom.isVisible('') // $ExpectError
  Cypress.dom.isHidden('') // $ExpectError
  Cypress.dom.isFocusable('') // $ExpectError
  Cypress.dom.isTextLike('') // $ExpectError
  Cypress.dom.isScrollable('') // $ExpectError
  Cypress.dom.isFocused('') // $ExpectError
  Cypress.dom.isDetached('') // $ExpectError
  Cypress.dom.isAttached('') // $ExpectError
  Cypress.dom.isSelector('', 'foo') // $ExpectError
  Cypress.dom.isDescendent('', '') // $ExpectError
  Cypress.dom.isElement() // $ExpectError
  Cypress.dom.isDocument() // $ExpectError
  Cypress.dom.isWindow() // $ExpectError
  Cypress.dom.isJquery() // $ExpectError
  Cypress.dom.isInputType('', 'number') // $ExpectError
  Cypress.dom.stringify('', 'foo') // $ExpectError
  Cypress.dom.getElements(el) // $ExpectError
  Cypress.dom.getContainsSelector(el, 'bar') // $ExpectError
  Cypress.dom.getFirstDeepestElement(el, 1) // $ExpectError
  Cypress.dom.getWindowByElement('') // $ExpectError
  Cypress.dom.getReasonIsHidden('') // $ExpectError
  Cypress.dom.getFirstScrollableParent('') // $ExpectError
  Cypress.dom.getFirstFixedOrStickyPositionParent('') // $ExpectError
  Cypress.dom.getFirstStickyPositionParent('') // $ExpectError
  Cypress.dom.getCoordsByPosition(1) // $ExpectError
  Cypress.dom.getElementPositioning('') // $ExpectError
  Cypress.dom.getElementAtPointFromViewport(el, 1, 2) // $ExpectError
  Cypress.dom.getElementCoordinatesByPosition(doc, 'top') // $ExpectError
  Cypress.dom.getElementCoordinatesByPositionRelativeToXY(doc, 1, 2) // $ExpectError
}
