/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable mocha/no-exclusive-tests */

import { SinonStatic } from 'sinon'
import { expectType } from '.'
import type { Interception } from '../net-stubbing'

namespace CypressLodashTests {
  // expectType<LoDashStatic>(Cypress._)
  Cypress._.each([1], (item) => {
    expectType<number>(item)
  })
}

namespace CypressSinonTests {
  expectType<SinonStatic>(Cypress.sinon)

  const stub = cy.stub()
  stub(2, 'foo')
  expect(stub).to.have.been.calledWith(Cypress.sinon.match.number, Cypress.sinon.match('foo'))

  const stub2 = Cypress.sinon.stub()
  stub2(2, 'foo')
  expect(stub2).to.have.been.calledWith(Cypress.sinon.match.number, Cypress.sinon.match('foo'))
}

namespace CypressJqueryTests {
  expectType<JQueryStatic>(Cypress.$)
  expectType<JQuery<HTMLElement>>(Cypress.$('selector'))
  expectType<JQuery<HTMLElement>>(Cypress.$('selector').click())
}

namespace CypressAutomationTests {
  expectType<Promise<any>>(Cypress.automation('hello'))
}

namespace CypressConfigTests {
  // getters
  expectType<string | null>(Cypress.config('baseUrl'))
  expectType<string | null>(Cypress.config().baseUrl)

  // setters
  expectType<void>(Cypress.config('baseUrl', '.'))
  // @ts-expect-error
  Cypress.config({ e2e: { baseUrl: '.' } })
  // @ts-expect-error
  Cypress.config({ e2e: { baseUrl: null } })
  // @ts-expect-error
  Cypress.config({ e2e: { baseUrl: '.' } })
  // @ts-expect-error
  Cypress.config({ component: { baseUrl: '.', devServer: () => ({} as any) } })
  // @ts-expect-error
  Cypress.config({ e2e: { indexHtmlFile: 'index.html' } })
  // @ts-expect-error
  Cypress.config({ testIsolation: false })

  expectType<number>(Cypress.config('taskTimeout'))
  expectType<boolean>(Cypress.config('includeShadowDom'))
}

namespace CypressEnvTests {
  // Just making sure these are valid - no real type safety
  Cypress.env('foo')
  Cypress.env('foo', 'bar')
  Cypress.env().foo
  Cypress.env({
    foo: 'bar',
  })
}

namespace CypressIsCyTests {
  expectType<boolean>(Cypress.isCy(cy))
  expectType<boolean>(Cypress.isCy(undefined))

  const chainer = cy.wrap('foo').then(function () {
    if (Cypress.isCy(chainer)) {
      expectType<Cypress.Chainable<string>>(chainer)
    }
  })
}

namespace CypressNowMocha.Mocha.Test {
  expectType<Promise<any> |((subject: any) => any)>(cy.now('get'))
}

namespace CypressEnsuresMocha.Mocha.Test {
  expectType<void>(Cypress.ensure.isType('', ['optional', 'element'], 'newQuery', cy))
  expectType<void>(Cypress.ensure.isElement('', 'newQuery', cy))
  expectType<void>(Cypress.ensure.isWindow('', 'newQuery', cy))
  expectType<void>(Cypress.ensure.isDocument('', 'newQuery', cy))

  expectType<void>(Cypress.ensure.isAttached('', 'newQuery', cy))
  expectType<void>(Cypress.ensure.isNotDisabled('', 'newQuery'))
  expectType<void>(Cypress.ensure.isVisible('', 'newQuery'))
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

  expectType<Cypress.LogConfig>(log.get())
  expectType<string>(log.get('name'))
  expectType<JQuery<HTMLElement>>(log.get('$el'))
}

namespace CypressLocalStorageMocha.Mocha.Test {
  Cypress.LocalStorage.clear = function (keys) {
    // expectType<string[] |expectType<$2>($1)>(    keys)
  }
}

namespace CypressItsTests {
  cy.wrap({ foo: [1, 2, 3] })
  .its('foo')
  .each((s: number) => {
    s
  })

  expectType<Cypress.Chainable<string>>(cy.wrap({ foo: 'bar' }).its('foo'))
  expectType<Cypress.Chainable<number>>(cy.wrap([1, 2]).its(1))
  expectType<Cypress.Chainable<string>>(cy.wrap(['foo', 'bar']).its(1)
  .then((s: string) => {
    s
  }))
  expectType<Cypress.Chainable<any>>(cy.wrap({ baz: { quux: '2' } }).its('baz.quux'))
  expectType<Cypress.Chainable<string>>(cy.wrap({ foo: 'bar' }).its('foo', { log: true }))
  expectType<Cypress.Chainable<string>>(cy.wrap({ foo: 'bar' }).its('foo', { timeout: 100 }))
  expectType<Cypress.Chainable<string>>(cy.wrap({ foo: 'bar' }).its('foo', { log: true, timeout: 100 }))
}

namespace CypressInvoke.Tests {
  const returnsString = () => 'foo'
  const returnsNumber = () => 42

  expectType<Cypress.Chainable<string>>(cy.wrap({ a: returnsString }).invoke('a'))
  expectType<Cypress.Chainable<number>>(cy.wrap({ b: returnsNumber }).invoke('b'))
  expectType<Cypress.Chainable<number>>(cy.wrap({ b: returnsNumber }).invoke({ log: true }, 'b'))
  expectType<Cypress.Chainable<number>>(cy.wrap({ b: returnsNumber }).invoke({ timeout: 100 }, 'b'))
  expectType<Cypress.Chainable<number>>(cy.wrap({ b: returnsNumber }).invoke({ log: true, timeout: 100 }, 'b'))

  // challenging to define a more precise return type than string | number here
  expectType<Cypress.Chainable<string | number>>(cy.wrap([returnsString, returnsNumber]).invoke(1))

  // invoke through property path results in any
  expectType<Cypress.Chainable<any>>(cy.wrap({ a: { fn: (x: number) => x * x } }).invoke('a.fn', 4))

  // examples below are from previous attempt at typing `invoke`
  // (see https://github.com/cypress-io/cypress/issues/4022)

  // call methods on arbitrary objects with reasonable return types
  expectType<Cypress.Chainable<{ a: number }>>(cy.wrap({ fn: () => ({ a: 1 }) }).invoke('fn'))

  // call methods on dom elements with reasonable return types
  expectType<Cypress.Chainable<string | number | string[] | undefined>>(cy.get('.trigger-input-range').invoke('val', 25))

}

cy.wrap({ foo: ['bar', 'baz'] })
.its('foo')
.then(([first, second]) => {
  expectType<string>(first)
})
.spread((first: string, second: string) => {
  expectType<string>(first)
  // return first as string
})
.each((s: string) => {
  expectType<string>(s)
})
.then((s) => {
  expectType<string[]>(s)
})

cy.get('.someSelector')
.each(($el, index, list) => {
  expectType<JQuery<HTMLElement>>($el)
  expectType<number>(index)
  expectType<HTMLElement[]>(list)
})

cy.wrap(['bar', 'baz'])
.spread((first, second) => {
  expectType<any>(first)
})

describe('then', () => {
  // https://github.com/cypress-io/cypress/issues/5575
  it('should respect the return type of callback', () => {
    // Expected type is verbose here because the function below matches 2 declarations.
    // * then<S extends object | any[] | string | number | boolean>(fn: (this: Cypress.ObjectLike, currentSubject: Subject) => S): Chainable<S>
    // * then<S>(fn: (this: Cypress.ObjectLike, currentSubject: Subject) => S): ThenReturn<Subject, S>
    // For our purpose, it doesn't matter.
    const result = cy.get('foo').then((el) => el.attr('foo'))

    expectType<Cypress.Chainable<JQuery<HTMLElement>> | Cypress.Chainable<string | JQuery<HTMLElement>>>(result)

    const result2 = cy.get('foo').then((el) => `${el}`)

    expectType<Cypress.Chainable<string>>(result2)

    const result3 = cy.get('foo').then({ timeout: 1234 }, (el) => el.attr('foo'))

    expectType<Cypress.Chainable<JQuery<HTMLElement>> | Cypress.Chainable<string | JQuery<HTMLElement>>>(result3)

    const result4 = cy.get('foo').then({ timeout: 1234 }, (el) => `${el}`)

    expectType<Cypress.Chainable<string>>(result4)
  })

  it('should have the correct type signature', () => {
    cy.wrap({ foo: 'bar' })
    .then((s) => {
      expectType<{ foo: string }>(s)

      return s
    })
    .then((s) => {
      expectType<{ foo: string }>(s)
    })
    .then((s) => s.foo)
    .then((s) => {
      expectType<string>(s)
    })
  })

  it('should have the correct type signature with options', () => {
    cy.wrap({ foo: 'bar' })
    .then({ timeout: 5000 }, (s) => {
      expectType<{ foo: string }>(s)

      return s
    })
    .then({ timeout: 5000 }, (s) => {
      expectType<{ foo: string }>(s)
    })
    .then({ timeout: 5000 }, (s) => s.foo)
    .then({ timeout: 5000 }, (s) => {
      expectType<string>(s)
    })
  })

  it('HTMLElement', () => {
    cy.get('div')
    .then(($div) => {
      expectType<JQuery<HTMLDivElement>>($div)

      return $div[0]
    })
    .then(($div) => {
      expectType<JQuery<HTMLDivElement>>($div)
    })

    cy.get('div')
    .then(($div) => {
      expectType<JQuery<HTMLDivElement>>($div)

      return [$div[0]]
    })
    .then(($div) => {
      expectType<JQuery<HTMLDivElement>>($div)
    })

    cy.get('p')
    .then(($p) => {
      expectType<JQuery<HTMLParagraphElement>>($p)

      return $p[0]
    })
    .then({ timeout: 3000 }, ($p) => {
      expectType<JQuery<HTMLParagraphElement>>($p)
    })
  })

  // https://github.com/cypress-io/cypress/issues/16669
  it('any as default', () => {
    cy.get('body')
    .then(() => ({} as any))
    .then((v) => {
      expectType<any>(v)
    })
  })
})

cy.wait(['@foo', '@bar'])
.then(([first, second]) => {
  expectType<Interception>(first)
})

expectType<Cypress.Chainable<undefined>>(cy.wait(1234))

expectType<Cypress.Chainable<string>>(cy.wrap('foo').wait(1234))

cy.wrap([{ foo: 'bar' }, { foo: 'baz' }])
.then((subject) => {
  expectType<{ foo: string }[]>(subject)
})
.then(([first, second]) => {
  expectType<{ foo: string }>(first)
})
.then((subject) => {
  expectType<{ foo: string }[]>(subject)
})
.then(([first, second]) => {
  return first.foo + second.foo
})
.then((subject) => {
  expectType<string>(subject)
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

cy.get('something').as('foo', { type: 'static' })

cy.wrap('foo').then((subject) => {
  expectType<string>(subject)

  return cy.wrap(subject)
}).then((subject) => {
  expectType<string>(subject)
})

cy.wrap('foo').then((subject) => {
  expectType<string>(subject)

  return Cypress.Promise.resolve(subject)
}).then((subject) => {
  expectType<string>(subject)
})

cy.get('body').within((body) => {
  expectType<JQuery<HTMLBodyElement>>(body)
})

cy.get('body').within({ log: false }, (body) => {
  expectType<JQuery<HTMLBodyElement>>(body)
})

cy.get('body').within(() => {
  cy.get('body', { withinSubject: null }).then((body) => {
    expectType<JQuery<HTMLBodyElement>>(body)
  })
})

cy
.get('body')
.then(() => {
  return cy.wrap(undefined)
})
.then((subject) => {
  subject // $ExpectTypeexpectType<$2>($1)
})

namespace CypressOnTests1 {
  cy.go(2).then((win) => {
    expectType<Cypress.AUTWindow>(win)
  })

  cy.reload().then((win) => {
    expectType<Cypress.AUTWindow>(win)
  })

  cy.visit('https://google.com').then((win) => {
    expectType<Cypress.AUTWindow>(win)
  })

  cy.window().then((win) => {
    expectType<Cypress.AUTWindow>(win)
  })
}

namespace CypressOnTests2 {
  Cypress.on('uncaught:exception', (error, runnable, promise) => {
    expectType<Error>(error)
    // expectType<Runnable>(runnable)
    expectType<Promise<any> | undefined>(promise)
  })

  cy.on('uncaught:exception', (error, runnable, promise) => {
    expectType<Error>(error),
    // expectType<Mocha.Runnable>(runnable),
    expectType<Promise<any> |undefined>(promise)
  })

  // you can chain multiple callbacks
  Cypress
  .on('test:before:run', () => { })
  .on('test:after:run', () => { })
  .on('test:before:run:async', () => { })

  cy
  .on('window:before:load', () => { })
  .on('command:start', () => { })
}

namespace CypressOnceTests {
  Cypress.once('uncaught:exception', (error, runnable) => {
    expectType<Error>(error)
    runnable
  })

  cy.once('uncaught:exception', (error, runnable) => {
    expectType<Error>(error)
    runnable
  })
}

namespace CypressOffTests {
  Cypress.off('uncaught:exception', (error, runnable) => {
    expectType<Error>(error)
    runnable
  })

  cy.off('uncaught:exception', (error, runnable) => {
    expectType<Error>(error)
    runnable
  })
}

namespace CypressFilterTests {
  cy.get<HTMLDivElement>('#id')
  .filter((index: number, element: HTMLDivElement) => {
    expectType<number>(index)
    expectType<HTMLDivElement>(element)

    return true
  })
}

namespace CypressScreenshotTests {
  cy.screenshot('example-name')
  cy.screenshot('example', { log: false })
  cy.screenshot({ log: false })
  cy.screenshot({
    log: true,
    blackout: [],
  })
  cy.screenshot('example', {
    log: true,
    blackout: [],
  })
}

namespace CypressShadowDomTests {
  cy.get('my-component').shadow()
}

namespace CypressTriggerTests {
  cy.get('something')
  .trigger('click') // .trigger(eventName)
  .trigger('click', 'center') // .trigger(eventName, position)
  .trigger('click', { // .trigger(eventName, options)
    arbitraryProperty: 0,
  })
  .trigger('click', 0, 0) // .trigger(eventName, x, y)
  .trigger('click', 'center', { // .trigger(eventName, position, options)
    arbitraryProperty: 0,
  })
  .trigger('click', 0, 0, { // .trigger(eventName, x, y, options)
    arbitraryProperty: 0,
  })
}

namespace CypressClockTests {
  // timestamp
  cy.clock(new Date(2019, 3, 2).getTime(), ['Date'])
  // timestamp shortcut
  cy.clock(+new Date(), ['Date'])
  // Date object
  cy.clock(new Date(2019, 3, 2))
  // restoring the clock
  cy.clock().then((clock) => {
    clock.restore()
  })
  // restoring the clock shortcut
  cy.clock().invoke('restore')
  // setting system time with no argument
  cy.clock().then((clock) => {
    clock.setSystemTime()
  })
  // setting system time with timestamp
  cy.clock().then((clock) => {
    clock.setSystemTime(1000)
  })
  // setting system time with date object
  cy.clock().then((clock) => {
    clock.setSystemTime(new Date(2019, 3, 2))
  })
  // setting system time with no argument and shortcut
  cy.clock().invoke('setSystemTime')
  // setting system time with timestamp and shortcut
  cy.clock().invoke('setSystemTime', 1000)
  // setting system time with date object and shortcut
  cy.clock().invoke('setSystemTime', new Date(2019, 3, 2))
}

namespace CypressContainsTests {
  cy.contains('#app')
  cy.contains('my text to find')
  cy.contains('#app', 'my text to find')
  cy.contains('#app', 'my text to find', { log: false, timeout: 100, matchCase: false, includeShadowDom: true })
  cy.contains('my text to find', { log: false, timeout: 100, matchCase: false, includeShadowDom: true })
}

// https://github.com/cypress-io/cypress/pull/5574
namespace CypressLocationTests {
// @ts-expect-error
  cy.location('path')
  expectType<Cypress.Chainable<string>>(cy.location('pathname'))
}

// https://github.com/cypress-io/cypress/issues/17399
namespace CypressUrlTests {
  cy.url({ decode: true }).should('contain', '사랑')
}

namespace CypressBrowserTests {
  Cypress.isBrowser('chrome')// $ExpectType boolean
  Cypress.isBrowser('firefox')// $ExpectType boolean
  Cypress.isBrowser('edge')// $ExpectType boolean
  Cypress.isBrowser('brave')// $ExpectType boolean

  // does not error to allow for user supplied browsers
  Cypress.isBrowser('safari')// $ExpectType boolean

  Cypress.isBrowser({ channel: 'stable' })// $ExpectType boolean
  Cypress.isBrowser({ family: 'chromium' })// $ExpectType boolean
  Cypress.isBrowser({ name: 'chrome' })// $ExpectType boolean

  // @ts-expect-error
  Cypress.isBrowser({ family: 'foo' })
  // @ts-expect-error
  Cypress.isBrowser()
}

namespace CypressDomTests {
  const obj: any = {}
  const el = {} as any as HTMLElement
  const jel = {} as any as JQuery
  const doc = {} as any as Document

  expectType<JQuery<HTMLElement>>(Cypress.dom.wrap((x: number) => 'a'))
  expectType<JQuery<HTMLElement>>(Cypress.dom.query('foo', el))
  expectType<any>(Cypress.dom.unwrap(obj))
  expectType<boolean>(Cypress.dom.isDom(obj))
  expectType<boolean>(Cypress.dom.isType(el, 'foo'))
  expectType<boolean>(Cypress.dom.isVisible(el))
  expectType<boolean>(Cypress.dom.isHidden(el))
  expectType<boolean>(Cypress.dom.isFocusable(el))
  expectType<boolean>(Cypress.dom.isTextLike(el))
  expectType<boolean>(Cypress.dom.isScrollable(el))
  expectType<boolean>(Cypress.dom.isFocused(el))
  expectType<boolean>(Cypress.dom.isDetached(el))
  expectType<boolean>(Cypress.dom.isAttached(el))
  expectType<boolean>(Cypress.dom.isSelector(el, 'foo'))
  expectType<boolean>(Cypress.dom.isDescendent(el, el))
  expectType<boolean>(Cypress.dom.isElement(obj))
  expectType<boolean>(Cypress.dom.isDocument(obj))
  expectType<boolean>(Cypress.dom.isWindow(obj))
  expectType<boolean>(Cypress.dom.isJquery(obj))
  expectType<boolean>(Cypress.dom.isInputType(el, 'number'))
  expectType<string>(Cypress.dom.stringify(el, 'foo'))
  expectType<JQuery<HTMLElement> | HTMLElement[]>(Cypress.dom.getElements(jel))
  expectType<string>(Cypress.dom.getContainsSelector('foo', 'bar'))
  expectType<HTMLElement>(Cypress.dom.getFirstDeepestElement([el], 1))
  expectType<HTMLElement | JQuery<HTMLElement>>(Cypress.dom.getWindowByElement(el))
  expectType<string>(Cypress.dom.getReasonIsHidden(el))
  expectType<HTMLElement | JQuery<HTMLElement>>(Cypress.dom.getFirstScrollableParent(el))
  expectType<HTMLElement | JQuery<HTMLElement>>(Cypress.dom.getFirstFixedOrStickyPositionParent(el))
  expectType<HTMLElement | JQuery<HTMLElement>>(Cypress.dom.getFirstStickyPositionParent(el))
  expectType<number>(Cypress.dom.getCoordsByPosition(1, 2))
  expectType<Cypress.ElementPositioning>(Cypress.dom.getElementPositioning(el))
  expectType<Element | null>(Cypress.dom.getElementAtPointFromViewport(doc, 1, 2))
  expectType<Cypress.ElementCoordinates>(Cypress.dom.getElementCoordinatesByPosition(el, 'top'))
  expectType<Cypress.ElementPositioning>(Cypress.dom.getElementCoordinatesByPositionRelativeToXY(el, 1, 2))

  // @ts-expect-error
  Cypress.dom.wrap()
  // @ts-expect-error
  Cypress.dom.query(el, 'foo')
  // @ts-expect-error
  Cypress.dom.unwrap()
  // @ts-expect-error
  Cypress.dom.isDom()
  // @ts-expect-error
  Cypress.dom.isType(el)
  // @ts-expect-error
  Cypress.dom.isVisible('')
  // @ts-expect-error
  Cypress.dom.isHidden('')
  // @ts-expect-error
  Cypress.dom.isFocusable('')
  // @ts-expect-error
  Cypress.dom.isTextLike('')
  // @ts-expect-error
  Cypress.dom.isScrollable('')
  // @ts-expect-error
  Cypress.dom.isFocused('')
  // @ts-expect-error
  Cypress.dom.isDetached('')
  // @ts-expect-error
  Cypress.dom.isAttached('')
  // @ts-expect-error
  Cypress.dom.isSelector('', 'foo')
  // @ts-expect-error
  Cypress.dom.isDescendent('', '')
  // @ts-expect-error
  Cypress.dom.isElement()
  // @ts-expect-error
  Cypress.dom.isDocument()
  // @ts-expect-error
  Cypress.dom.isWindow()
  // @ts-expect-error
  Cypress.dom.isJquery()
  // @ts-expect-error
  Cypress.dom.isInputType('', 'number')
  // @ts-expect-error
  Cypress.dom.stringify('', 'foo')
  // @ts-expect-error
  Cypress.dom.getElements(el)
  // @ts-expect-error
  Cypress.dom.getContainsSelector(el, 'bar')
  // @ts-expect-error
  Cypress.dom.getFirstDeepestElement(el, 1)
  // @ts-expect-error
  Cypress.dom.getWindowByElement('')
  // @ts-expect-error
  Cypress.dom.getReasonIsHidden('')
  // @ts-expect-error
  Cypress.dom.getFirstScrollableParent('')
  // @ts-expect-error
  Cypress.dom.getFirstFixedOrStickyPositionParent('')
  // @ts-expect-error
  Cypress.dom.getFirstStickyPositionParent('')
  // @ts-expect-error
  Cypress.dom.getCoordsByPosition(1)
  // @ts-expect-error
  Cypress.dom.getElementPositioning('')
  // @ts-expect-error
  Cypress.dom.getElementAtPointFromViewport(el, 1, 2)
  // @ts-expect-error
  Cypress.dom.getElementCoordinatesByPosition(doc, 'top')
  // @ts-expect-error
  Cypress.dom.getElementCoordinatesByPositionRelativeToXY(doc, 1, 2)
}

namespace CypressMocha.Mocha.TestConfigOverridesTests {
  // set config on a per-Mocha.Mocha.Test basis
  it('Mocha.Mocha.Test', {
    animationDistanceThreshold: 10,
    defaultCommandTimeout: 6000,
    env: {},
    execTimeout: 6000,
    includeShadowDom: true,
    requestTimeout: 6000,
    responseTimeout: 6000,
    scrollBehavior: 'center',
    taskTimeout: 6000,
    viewportHeight: 200,
    viewportWidth: 200,
    waitForAnimations: false,
  }, () => { })
  it('Mocha.Mocha.Test', {
    browser: { name: 'firefox' },
  }, () => {})
  it('Mocha.Mocha.Test', {
    browser: [{ name: 'firefox' }, { name: 'chrome' }],
  }, () => {})
  it('Mocha.Mocha.Test', {
    browser: 'firefox',
    keystrokeDelay: 0,
  }, () => {})
  it('Mocha.Mocha.Test', {
    // @ts-expect-error
    browser: { foo: 'bar' },
  }, () => {})
  it('Mocha.Mocha.Test', {
    retries: null,
    keystrokeDelay: 0,
  }, () => { })
  it('Mocha.Mocha.Test', {
    retries: 3,
    // @ts-expect-error
    keystrokeDelay: false,
  }, () => { })
  it('Mocha.Mocha.Test', {
    retries: {
      runMode: 3,
      openMode: null,
    },
  }, () => { })
  it('Mocha.Mocha.Test', {
    retries: {
      runMode: 3,
    },
  }, () => { })
  it('Mocha.Mocha.Test', {
    // @ts-expect-error
    retries: { run: 3 },
  }, () => { })
  it('Mocha.Mocha.Test', {
    // @ts-expect-error
    testIsolation: false,
  }, () => { })

  // NOTE: .skip is okay here - we are just testing the types.
  it.skip('Mocha.Mocha.Test', {}, () => {})
  it.only('Mocha.Mocha.Test', {}, () => {})
  xit('Mocha.Mocha.Test', {}, () => {})

  specify('Mocha.Mocha.Test', {}, () => {})
  specify.only('Mocha.Mocha.Test', {}, () => {})
  specify.skip('Mocha.Mocha.Test', {}, () => {})
  xspecify('Mocha.Mocha.Test', {}, () => {})

  // set config on a per-suite basis
  describe('suite', {
    browser: { family: 'firefox' },
    keystrokeDelay: 0,
  }, () => {})

  describe('suite', {
    testIsolation: false,
  }, () => {})

  context('suite', {}, () => {})

  describe('suite', {
    browser: { family: 'firefox' },
    // @ts-expect-error
    keystrokeDelay: false,
    foo: 'foo',
  }, () => {})

  describe.only('suite', {}, () => {})
  // NOTE: .skip is okay here - we are just testing the types.
  describe.skip('suite', {}, () => {})
  xdescribe('suite', {}, () => {})
}

namespace CypressShadowTests {
  cy
  .get('.foo')
  .shadow()
  .find('.bar')
  .click()

  cy.get('.foo', { includeShadowDom: true }).click()

  cy
  .get('.foo')
  .find('.bar', { includeShadowDom: true })
}

namespace CypressTaskTests {
  expectType<Cypress.Chainable<number>>(cy.task<number>('foo'))
  cy.task<number>('foo').then((val) => {
    expectType<number>(val)
  })

  expectType<Cypress.Chainable<unknown>>(cy.task('foo'))
  cy.task('foo').then((val) => {
    expectType<unknown>(val)
  })
}

namespace CypressSessionsTests {
  cy.session('user', () => {})
  cy.session({ name: 'bob' }, () => {})
  cy.session('user', () => {}, {})
  cy.session('user', () => {}, {
    validate: () => {},
  })

  // @ts-expect-error
  cy.session()
  // @ts-expect-error
  cy.session('user')
  // @ts-expect-error
  cy.session(null)
  cy.session('user', () => {}, {
    // @ts-expect-error
    validate: { foo: true },
  })
}

namespace CypressCurrentMocha.Mocha.Test {
  expectType<string>(Cypress.currentTest.title)
  expectType<string[]>(Cypress.currentTest.titlePath)
  // @ts-expect-error
  Cypress.currentMocha.Mocha.Test()
}

namespace CypressKeyboardTests {
  Cypress.Keyboard.defaults({
    keystrokeDelay: 0,
  })
  Cypress.Keyboard.defaults({
    keystrokeDelay: 500,
  })
  Cypress.Keyboard.defaults({
    // @ts-expect-error
    keystrokeDelay: false,
  })
  Cypress.Keyboard.defaults({
    // @ts-expect-error
    delay: 500,
  })
}

namespace CypressOriginTests {
  cy.origin('example.com', () => {})
  cy.origin('example.com', { args: {} }, (value: object) => {})
  cy.origin('example.com', { args: { one: 1, key: 'value', bool: true } }, (value: { one: number, key: string, bool: boolean}) => {})
  cy.origin('example.com', { args: [1, 'value', true] }, (value: Array<(number | string | boolean)>) => {})
  cy.origin('example.com', { args: 'value' }, (value: string) => {})
  cy.origin('example.com', { args: 1 }, (value: number) => {})
  cy.origin('example.com', { args: true }, (value: boolean) => {})

  // @ts-expect-error
  cy.origin()
  // @ts-expect-error
  cy.origin('example.com')
  // @ts-expect-error
  cy.origin(true)
  // @ts-expect-error
  cy.origin('example.com', {})
  // @ts-expect-error
  cy.origin('example.com', {}, {})
  // @ts-expect-error
  cy.origin('example.com', { args: ['value'] }, (value: boolean[]) => {})
  // @ts-expect-error
  cy.origin('example.com', {}, (value: undefined) => {})
}

namespace CypressGetCookiesTests {
  cy.getCookies().then((cookies) => {
    expectType<Cypress.Cookie[]>(cookies)
  })
  cy.getCookies({ log: true })
  cy.getCookies({ timeout: 10 })
  cy.getCookies({ domain: 'localhost' })
  cy.getCookies({ log: true, timeout: 10, domain: 'localhost' })

  // @ts-expect-error
  cy.getCookies({ log: 'true' })
  // @ts-expect-error
  cy.getCookies({ timeout: '10' })
  // @ts-expect-error
  cy.getCookies({ domain: false })
}

namespace CypressGetAllCookiesTests {
  cy.getAllCookies().then((cookies) => {
    expectType<Cypress.Cookie[]>(cookies)
  })
  cy.getAllCookies({ log: true })
  cy.getAllCookies({ timeout: 10 })
  cy.getAllCookies({ log: true, timeout: 10 })

  // @ts-expect-error
  cy.getAllCookies({ log: 'true' })
  // @ts-expect-error
  cy.getAllCookies({ timeout: '10' })
  // @ts-expect-error
  cy.getAllCookies({ other: true })
}

namespace CypressGetCookieTests {
  cy.getCookie('name').then((cookie) => {
    expectType<Cypress.Cookie | null>(cookie)
  })
  cy.getCookie('name', { log: true })
  cy.getCookie('name', { timeout: 10 })
  cy.getCookie('name', { domain: 'localhost' })
  cy.getCookie('name', { log: true, timeout: 10, domain: 'localhost' })

  // @ts-expect-error
  cy.getCookie('name', { log: 'true' })
  // @ts-expect-error
  cy.getCookie('name', { timeout: '10' })
  // @ts-expect-error
  cy.getCookie('name', { domain: false })
}

namespace CypressSetCookieTests {
  cy.setCookie('name', 'value').then((cookie) => {
    expectType<Cypress.Cookie>(cookie)
  })
  cy.setCookie('name', 'value', { log: true })
  cy.setCookie('name', 'value', { timeout: 10 })
  cy.setCookie('name', 'value', {
    domain: 'localhost',
    path: '/',
    secure: true,
    httpOnly: false,
    expiry: 12345,
    sameSite: 'lax',
  })
  cy.setCookie('name', 'value', {
    domain: 'www.foobar.com',
    path: '/',
    secure: false,
    httpOnly: false,
    hostOnly: true,
    sameSite: 'lax',
  })
  cy.setCookie('name', 'value', { log: true, timeout: 10, domain: 'localhost' })

  // @ts-expect-error
  cy.setCookie('name')
  // @ts-expect-error
  cy.setCookie('name', 'value', { log: 'true' })
  // @ts-expect-error
  cy.setCookie('name', 'value', { timeout: '10' })
  // @ts-expect-error
  cy.setCookie('name', 'value', { domain: false })
  // @ts-expect-error
  cy.setCookie('name', 'value', { foo: 'bar' })
}

namespace CypressClearCookieTests {
  cy.clearCookie('name').then((result) => {
    expectType<null>(result)
  })
  cy.clearCookie('name', { log: true })
  cy.clearCookie('name', { timeout: 10 })
  cy.clearCookie('name', { domain: 'localhost' })
  cy.clearCookie('name', { log: true, timeout: 10, domain: 'localhost' })

  // @ts-expect-error
  cy.clearCookie('name', { log: 'true' })
  // @ts-expect-error
  cy.clearCookie('name', { timeout: '10' })
  // @ts-expect-error
  cy.clearCookie('name', { domain: false })
}

namespace CypressClearCookiesTests {
  cy.clearCookies().then((result) => {
    expectType<null>(result)
  })
  cy.clearCookies({ log: true })
  cy.clearCookies({ timeout: 10 })
  cy.clearCookies({ domain: 'localhost' })
  cy.clearCookies({ log: true, timeout: 10, domain: 'localhost' })

  // @ts-expect-error
  cy.clearCookies({ log: 'true' })
  // @ts-expect-error
  cy.clearCookies({ timeout: '10' })
  // @ts-expect-error
  cy.clearCookies({ domain: false })
}

namespace CypressClearAllCookiesTests {
  cy.clearAllCookies().then((cookies) => {
    expectType<null>(cookies)
  })
  cy.clearAllCookies({ log: true })
  cy.clearAllCookies({ timeout: 10 })
  cy.clearAllCookies({ log: true, timeout: 10 })

  // @ts-expect-error
  cy.clearAllCookies({ log: 'true' })
  // @ts-expect-error
  cy.clearAllCookies({ timeout: '10' })
  // @ts-expect-error
  cy.clearAllCookies({ other: true })
}

namespace CypressLocalStorageTests{
  cy.getAllLocalStorage().then((result) => {
    expectType<Cypress.StorageByOrigin>(result)
  })
  cy.getAllLocalStorage({ log: false })
  // @ts-expect-error
  cy.getAllLocalStorage({ log: 'true' })

  cy.clearAllLocalStorage().then((result) => {
    expectType<null>(result)
  })
  cy.clearAllLocalStorage({ log: false })
  // @ts-expect-error
  cy.clearAllLocalStorage({ log: 'true' })

  cy.getAllSessionStorage().then((result) => {
    expectType<Cypress.StorageByOrigin>(result)
  })
  cy.getAllSessionStorage({ log: false })
  // @ts-expect-error
  cy.getAllSessionStorage({ log: 'true' })

  cy.clearAllSessionStorage().then((result) => {
    expectType<null>(result)
  })
  cy.clearAllSessionStorage({ log: false })
  // @ts-expect-error
  cy.clearAllSessionStorage({ log: 'true' })
}

namespace CypressTraversalTests {
  expectType<Cypress.Chainable<JQuery<HTMLAnchorElement>>>(cy.wrap({}).prevUntil('a'))
  expectType<Cypress.Chainable<JQuery<HTMLElement>>>(cy.wrap({}).prevUntil('#myItem'))
  expectType<Cypress.Chainable<JQuery<HTMLSpanElement>>>(cy.wrap({}).prevUntil('span', 'a'))
  expectType<Cypress.Chainable<JQuery<HTMLElement>>>(cy.wrap({}).prevUntil('#myItem', 'a'))
  expectType<Cypress.Chainable<JQuery<HTMLDivElement>>>(cy.wrap({}).prevUntil('div', 'a', { log: false, timeout: 100 }))
  expectType<Cypress.Chainable<JQuery<HTMLElement>>>(cy.wrap({}).prevUntil('#myItem', 'a', { log: false, timeout: 100 }))
  // @ts-expect-error
  cy.wrap({}).prevUntil('#myItem', 'a', { log: 'true' })

  expectType<Cypress.Chainable<JQuery<HTMLAnchorElement>>>(cy.wrap({}).nextUntil('a'))
  expectType<Cypress.Chainable<JQuery<HTMLElement>>>(cy.wrap({}).nextUntil('#myItem'))
  expectType<Cypress.Chainable<JQuery<HTMLSpanElement>>>(cy.wrap({}).nextUntil('span', 'a'))
  expectType<Cypress.Chainable<JQuery<HTMLElement>>>(cy.wrap({}).nextUntil('#myItem', 'a'))
  expectType<Cypress.Chainable<JQuery<HTMLDivElement>>>(cy.wrap({}).nextUntil('div', 'a', { log: false, timeout: 100 }))
  expectType<Cypress.Chainable<JQuery<HTMLElement>>>(cy.wrap({}).nextUntil('#myItem', 'a', { log: false, timeout: 100 }))
  // @ts-expect-error
  cy.wrap({}).nextUntil('#myItem', 'a', { log: 'true' })

  expectType<Cypress.Chainable<JQuery<HTMLAnchorElement>>>(cy.wrap({}).parentsUntil('a'))
  expectType<Cypress.Chainable<JQuery<HTMLElement>>>(cy.wrap({}).parentsUntil('#myItem'))
  expectType<Cypress.Chainable<JQuery<HTMLSpanElement>>>(cy.wrap({}).parentsUntil('span', 'a'))
  expectType<Cypress.Chainable<JQuery<HTMLElement>>>(cy.wrap({}).parentsUntil('#myItem', 'a'))
  expectType<Cypress.Chainable<JQuery<HTMLDivElement>>>(cy.wrap({}).parentsUntil('div', 'a', { log: false, timeout: 100 }))
  expectType<Cypress.Chainable<JQuery<HTMLElement>>>(cy.wrap({}).parentsUntil('#myItem', 'a', { log: false, timeout: 100 }))
  // @ts-expect-error
  cy.wrap({}).parentsUntil('#myItem', 'a', { log: 'true' })
}

namespace CypressRequireTests {
  Cypress.require('lodash')

  const anydep = Cypress.require('anydep')
  expectType<any>(anydep)

  const sinon = Cypress.require<sinon.SinonStatic>('sinon') as typeof import('sinon')
  expectType<SinonStatic>(sinon)

  const lodash = Cypress.require<_.LoDashStatic>('lodash')
  // expectType<LoDashStatic>(lodash)

  // @ts-expect-error
  Cypress.require()
  // @ts-expect-error
  Cypress.require({})
  // @ts-expect-error
  Cypress.require(123)
}
