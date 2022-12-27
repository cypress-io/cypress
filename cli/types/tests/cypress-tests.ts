namespace CypressLodashTests {
  Cypress._ // $ExpectType LoDashStatic
  Cypress._.each([1], item => {
    item // $ExpectType number
  })
}

namespace CypressSinonTests {
  Cypress.sinon // $ExpectType SinonStatic

  const stub = cy.stub()
  stub(2, 'foo')
  expect(stub).to.have.been.calledWith(Cypress.sinon.match.number, Cypress.sinon.match('foo'))

  const stub2 = Cypress.sinon.stub()
  stub2(2, 'foo')
  expect(stub2).to.have.been.calledWith(Cypress.sinon.match.number, Cypress.sinon.match('foo'))
}

namespace CypressJqueryTests {
  Cypress.$ // $ExpectType JQueryStatic
  Cypress.$('selector') // $ExpectType JQuery<HTMLElement>
  Cypress.$('selector').click() // $ExpectType JQuery<HTMLElement>
}

namespace CypressAutomationTests {
  Cypress.automation('hello') // $ExpectType Promise<any>
}

namespace CypressConfigTests {
  // getters
  Cypress.config('baseUrl') // $ExpectType string | null
  Cypress.config().baseUrl // $ExpectType string | null

  // setters
  Cypress.config('baseUrl', '.') // $ExpectType void
  Cypress.config({ e2e: { baseUrl: '.' }}) // $ExpectError
  Cypress.config({ e2e: { baseUrl: null }}) // $ExpectError
  Cypress.config({ e2e: { baseUrl: '.', }}) // $ExpectError
  Cypress.config({ component: { baseUrl: '.', devServer: () => ({} as any) } }) // $ExpectError
  Cypress.config({ e2e: { indexHtmlFile: 'index.html' } }) // $ExpectError
  Cypress.config({ testIsolation: false }) // $ExpectError

  Cypress.config('taskTimeout') // $ExpectType number
  Cypress.config('includeShadowDom') // $ExpectType boolean
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

declare namespace Cypress {
  interface Chainable {
    newCommand: (arg: string) => Chainable<number>
    newQuery: (arg: string) => Chainable<number>
  }
}

namespace CypressCommandsTests {
  Cypress.Commands.add('newCommand', (arg) => {
    // $ExpectType string
    arg
    return
  })
  Cypress.Commands.add('newCommand', (arg) => {
    // $ExpectType string
    arg
  })
  Cypress.Commands.add('newCommand', function(arg) {
    this // $ExpectType Context
    arg // $ExpectType string
  })
  Cypress.Commands.add('newCommand', { prevSubject: true }, (subject, arg) => {
    subject // $ExpectType any
    arg // $ExpectType string
    return
  })
  Cypress.Commands.add('newCommand', { prevSubject: false }, (arg) => {
    arg // $ExpectType string
    return
  })
  Cypress.Commands.add('newCommand', { prevSubject: 'optional' }, (subject, arg) => {
    subject // $ExpectType unknown
    arg // $ExpectType string
    return
  })
  Cypress.Commands.add('newCommand', { prevSubject: 'optional' }, (subject, arg) => {
    subject // $ExpectType unknown
    arg // $ExpectType string
  })
  Cypress.Commands.add('newCommand', { prevSubject: ['optional'] }, (subject, arg) => {
    subject // $ExpectType unknown
    arg // $ExpectType string
  })
  Cypress.Commands.add('newCommand', { prevSubject: 'document' }, (subject, arg) => {
    subject // $ExpectType Document
    arg // $ExpectType string
  })
  Cypress.Commands.add('newCommand', { prevSubject: 'window' }, (subject, arg) => {
    subject // $ExpectType Window
    arg // $ExpectType string
  })
  Cypress.Commands.add('newCommand', { prevSubject: 'element' }, (subject, arg) => {
    subject // $ExpectType JQueryWithSelector<HTMLElement>
    arg // $ExpectType string
  })
  Cypress.Commands.add('newCommand', { prevSubject: ['element'] }, (subject, arg) => {
    subject // $ExpectType JQueryWithSelector<HTMLElement>
    arg // $ExpectType string
  })
  Cypress.Commands.add('newCommand', { prevSubject: ['element', 'document', 'window'] }, (subject, arg) => {
    if (subject instanceof Window) {
      subject // $ExpectType Window
    } else if (subject instanceof Document) {
      subject // $ExpectType Document
    } else {
      subject // $ExpectType JQueryWithSelector<HTMLElement>
    }
    arg // $ExpectType string
  })
  Cypress.Commands.add('newCommand', { prevSubject: ['window', 'document', 'optional', 'element'] }, (subject, arg) => {
    if (subject instanceof Window) {
      subject // $ExpectType Window
    } else if (subject instanceof Document) {
      subject // $ExpectType Document
    } else if (subject) {
      subject // $ExpectType JQueryWithSelector<HTMLElement>
    } else {
      subject // $ExpectType void
    }
    arg // $ExpectType string
  })
  Cypress.Commands.add('newCommand', (arg) => {
    // $ExpectType string
    arg
    return cy.wrap(new Promise<number>((resolve) => { resolve(5) }))
  })

  Cypress.Commands.addAll({
    newCommand(arg) {
      // $ExpectType any
      arg
      this // $ExpectType Context
      return
    },
    newCommand2(arg, arg2) {
      // $ExpectType any
      arg
      // $ExpectType any
      arg2
    },
    newCommand3: (arg) => {
      // $ExpectType any
      arg
      return
    },
    newCommand4: (arg) => {
      // $ExpectType any
      arg
    },
  })
  Cypress.Commands.addAll({ prevSubject: true }, {
    newCommand: (subject, arg) => {
      subject // $ExpectType any
      arg // $ExpectType any
      return
    },
  })
  Cypress.Commands.addAll({ prevSubject: false }, {
    newCommand: (arg) => {
      arg // $ExpectType any
      return
    },
  })
  Cypress.Commands.addAll({ prevSubject: 'optional' }, {
    newCommand: (subject, arg) => {
      subject // $ExpectType unknown
      arg // $ExpectType any
      return
    },
    newCommand2: (subject, arg) => {
      subject // $ExpectType unknown
      arg // $ExpectType any
    },
  })
  Cypress.Commands.addAll({ prevSubject: ['optional'] }, {
    newCommand: (subject, arg) => {
      subject // $ExpectType unknown
      arg // $ExpectType any
    },
  })
  Cypress.Commands.addAll({ prevSubject: 'document' }, {
    newCommand: (subject, arg) => {
      subject // $ExpectType Document
      arg // $ExpectType any
    },
  })
  Cypress.Commands.addAll({ prevSubject: 'window' }, {
    newCommand: (subject, arg) => {
      subject // $ExpectType Window
      arg // $ExpectType any
    },
  })
  Cypress.Commands.addAll({ prevSubject: 'element' }, {
    newCommand: (subject, arg) => {
      subject // $ExpectType JQueryWithSelector<HTMLElement>
      arg // $ExpectType any
    }
  })
  Cypress.Commands.addAll({ prevSubject: ['element'] }, {
    newCommand: (subject, arg) => {
      subject // $ExpectType JQueryWithSelector<HTMLElement>
      arg // $ExpectType any
    }
  })
  Cypress.Commands.addAll({ prevSubject: ['element', 'document', 'window'] }, {
    newCommand: (subject, arg) => {
      if (subject instanceof Window) {
        subject // $ExpectType Window
      } else if (subject instanceof Document) {
        subject // $ExpectType Document
      } else {
        subject // $ExpectType JQueryWithSelector<HTMLElement>
      }
      arg // $ExpectType any
    }
  })
  Cypress.Commands.addAll({ prevSubject: ['window', 'document', 'optional', 'element'] }, {
    newCommand: (subject, arg) => {
      if (subject instanceof Window) {
        subject // $ExpectType Window
      } else if (subject instanceof Document) {
        subject // $ExpectType Document
      } else if (subject) {
        subject // $ExpectType JQueryWithSelector<HTMLElement>
      } else {
        subject // $ExpectType void
      }
      arg // $ExpectType any
    }
  })
  Cypress.Commands.addAll({
    newCommand: (arg) => {
      // $ExpectType any
      arg
      return cy.wrap(new Promise<number>((resolve) => { resolve(5) }))
    }
  })

  Cypress.Commands.overwrite('newCommand', (originalFn, arg) => {
    arg // $ExpectType string
    originalFn // $ExpectedType Chainable['newCommand']
    originalFn(arg) // $ExpectType Chainable<number>
  })
  Cypress.Commands.overwrite('newCommand', function(originalFn, arg) {
    this // $ExpectType Context
    arg // $ExpectType string
    originalFn // $ExpectedType Chainable['newCommand']
    originalFn.apply(this, [arg]) // $ExpectType Chainable<number>
  })
  Cypress.Commands.overwrite<'type', 'element'>('type', (originalFn, element, text, options?: Partial<Cypress.TypeOptions & {sensitive: boolean}>) => {
    element // $ExpectType JQueryWithSelector<HTMLElement>
    text // $ExpectType string

    if (options && options.sensitive) {
      // turn off original log
      options.log = false
      // create our own log with masked message
      Cypress.log({
        $el: element,
        name: 'type',
        message: '*'.repeat(text.length),
      })
    }

    return originalFn(element, text, options)
  })

  Cypress.Commands.addQuery('newQuery', function(arg) {
    this // $ExpectType Command
    arg // $ExpectType string
    return () => 3
  })
}

namespace CypressNowTest {
  cy.now('get') // $ExpectType Promise<any> | ((subject: any) => any)
}

namespace CypressEnsuresTest {
  Cypress.ensure.isType('', ['optional', 'element'], 'newQuery', cy) // $ExpectType void
  Cypress.ensure.isElement('', 'newQuery', cy) // $ExpectType void
  Cypress.ensure.isWindow('', 'newQuery', cy) // $ExpectType void
  Cypress.ensure.isDocument('', 'newQuery', cy) // $ExpectType void

  Cypress.ensure.isAttached('', 'newQuery', cy) // $ExpectType void
  Cypress.ensure.isNotDisabled('', 'newQuery') // $ExpectType void
  Cypress.ensure.isVisible('', 'newQuery') // $ExpectType void
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
  cy.wrap({foo: 'bar'}).its('foo', { log: true }) // $ExpectType Chainable<string>
  cy.wrap({foo: 'bar'}).its('foo', { timeout: 100 }) // $ExpectType Chainable<string>
  cy.wrap({foo: 'bar'}).its('foo', { log: true, timeout: 100 }) // $ExpectType Chainable<string>
}

namespace CypressInvokeTests {
  const returnsString = () => 'foo'
  const returnsNumber = () => 42

  cy.wrap({ a: returnsString }).invoke('a') // $ExpectType Chainable<string>
  cy.wrap({ b: returnsNumber }).invoke('b') // $ExpectType Chainable<number>
  cy.wrap({ b: returnsNumber }).invoke({ log: true }, 'b') // $ExpectType Chainable<number>
  cy.wrap({ b: returnsNumber }).invoke({ timeout: 100 }, 'b') // $ExpectType Chainable<number>
  cy.wrap({ b: returnsNumber }).invoke({ log: true, timeout: 100 }, 'b') // $ExpectType Chainable<number>

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
  // https://github.com/cypress-io/cypress/issues/5575
  it('should respect the return type of callback', () => {
    // Expected type is verbose here because the function below matches 2 declarations.
    // * then<S extends object | any[] | string | number | boolean>(fn: (this: ObjectLike, currentSubject: Subject) => S): Chainable<S>
    // * then<S>(fn: (this: ObjectLike, currentSubject: Subject) => S): ThenReturn<Subject, S>
    // For our purpose, it doesn't matter.
    const result = cy.get('foo').then(el => el.attr('foo'))
    result // $ExpectType Chainable<JQuery<HTMLElement>> | Chainable<string | JQuery<HTMLElement>>

    const result2 = cy.get('foo').then(el => `${el}`)
    result2 // $ExpectType Chainable<string>

    const result3 = cy.get('foo').then({ timeout: 1234 }, el => el.attr('foo'))
    result3 // $ExpectType Chainable<JQuery<HTMLElement>> | Chainable<string | JQuery<HTMLElement>>

    const result4 = cy.get('foo').then({ timeout: 1234 }, el => `${el}`)
    result4 // $ExpectType Chainable<string>
  })

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

  it('HTMLElement', () => {
    cy.get('div')
    .then(($div) => {
      $div // $ExpectType JQuery<HTMLDivElement>
      return $div[0]
    })
    .then(($div) => {
      $div // $ExpectType JQuery<HTMLDivElement>
    })

    cy.get('div')
    .then(($div) => {
      $div // $ExpectType JQuery<HTMLDivElement>
      return [$div[0]]
    })
    .then(($div) => {
      $div // $ExpectType JQuery<HTMLDivElement>
    })

    cy.get('p')
    .then(($p) => {
      $p // $ExpectType JQuery<HTMLParagraphElement>
      return $p[0]
    })
    .then({timeout: 3000}, ($p) => {
      $p // $ExpectType JQuery<HTMLParagraphElement>
    })
  })

  // https://github.com/cypress-io/cypress/issues/16669
  it('any as default', () => {
    cy.get('body')
    .then(() => ({} as any))
    .then(v => {
      v // $ExpectType any
    })
  })
})

cy.wait(['@foo', '@bar'])
  .then(([first, second]) => {
    first // $ExpectType Interception
  })

cy.wait(1234) // $ExpectType Chainable<undefined>

cy.wrap('foo').wait(1234) // $ExpectType Chainable<string>

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

namespace CypressAUTWindowTests {
  cy.go(2).then((win) => {
    win // $ExpectType AUTWindow
  })

  cy.reload().then((win) => {
    win // $ExpectType AUTWindow
  })

  cy.visit('https://google.com').then(win => {
    win // $ExpectType AUTWindow
  })

  cy.window().then(win => {
    win // $ExpectType AUTWindow
  })
}

namespace CypressOnTests {
  Cypress.on('uncaught:exception', (error, runnable, promise) => {
    error // $ExpectType Error
    runnable // $ExpectType Runnable
    promise // $ExpectType Promise<any> | undefined
  })

  cy.on('uncaught:exception', (error, runnable, promise) => {
    error // $ExpectType Error
    runnable // $ExpectType Runnable
    promise // $ExpectType Promise<any> | undefined
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
    error // $ExpectType Error
    runnable // $ExpectType Runnable
  })

  cy.once('uncaught:exception', (error, runnable) => {
    error // $ExpectType Error
    runnable // $ExpectType Runnable
  })
}

namespace CypressOffTests {
  Cypress.off('uncaught:exception', (error, runnable) => {
    error // $ExpectType Error
    runnable // $ExpectType Runnable
  })

  cy.off('uncaught:exception', (error, runnable) => {
    error // $ExpectType Error
    runnable // $ExpectType Runnable
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

namespace CypressScreenshotTests {
  cy.screenshot('example-name')
  cy.screenshot('example', { log: false })
  cy.screenshot({ log: false })
  cy.screenshot({
    log: true,
    blackout: []
  })
  cy.screenshot('example', {
    log: true,
    blackout: []
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

namespace CypressClockTests {
  // timestamp
  cy.clock(new Date(2019, 3, 2).getTime(), ['Date'])
  // timestamp shortcut
  cy.clock(+ new Date(), ['Date'])
  // Date object
  cy.clock(new Date(2019, 3, 2))
  // restoring the clock
  cy.clock().then(clock => {
    clock.restore()
  })
  // restoring the clock shortcut
  cy.clock().invoke('restore')
  // setting system time with no argument
  cy.clock().then(clock => {
    clock.setSystemTime()
  })
  // setting system time with timestamp
  cy.clock().then(clock => {
    clock.setSystemTime(1000)
  })
  // setting system time with date object
  cy.clock().then(clock => {
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
  cy.location('path') // $ExpectError
  cy.location('pathname') // $ExpectType Chainable<string>
}

// https://github.com/cypress-io/cypress/issues/17399
namespace CypressUrlTests {
  cy.url({decode: true}).should('contain', '사랑')
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

namespace CypressTestConfigOverridesTests {
  // set config on a per-test basis
  it('test', {
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
    waitForAnimations: false
  }, () => { })
  it('test', {
    browser: {name: 'firefox'}
  }, () => {})
  it('test', {
    browser: [{name: 'firefox'}, {name: 'chrome'}]
  }, () => {})
  it('test', {
    browser: 'firefox',
    keystrokeDelay: 0
  }, () => {})
  it('test', {
    browser: {foo: 'bar'}, // $ExpectError
  }, () => {})
  it('test', {
    retries: null,
    keystrokeDelay: 0
  }, () => { })
  it('test', {
    retries: 3,
    keystrokeDelay: false, // $ExpectError
  }, () => { })
  it('test', {
    retries: {
      runMode: 3,
      openMode: null
    }
  }, () => { })
  it('test', {
    retries: {
      runMode: 3,
    }
  }, () => { })
  it('test', {
    retries: { run: 3 } // $ExpectError
  }, () => { })
  it('test', {
    testIsolation: false, // $ExpectError
  }, () => { })

  it.skip('test', {}, () => {})
  it.only('test', {}, () => {})
  xit('test', {}, () => {})

  specify('test', {}, () => {})
  specify.only('test', {}, () => {})
  specify.skip('test', {}, () => {})
  xspecify('test', {}, () => {})

  // set config on a per-suite basis
  describe('suite', {
    browser: {family: 'firefox'},
    keystrokeDelay: 0
  }, () => {})

  describe('suite', {
    testIsolation: false,
  }, () => {})

  context('suite', {}, () => {})

  describe('suite', {
    browser: {family: 'firefox'},
    keystrokeDelay: false // $ExpectError
    foo: 'foo' // $ExpectError
  }, () => {})

  describe.only('suite', {}, () => {})
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
  .find('.bar', {includeShadowDom: true})
}

namespace CypressTaskTests {
  cy.task<number>('foo') // $ExpectType Chainable<number>
  cy.task<number>('foo').then((val) => {
    val // $ExpectType number
  })

  cy.task('foo') // $ExpectType Chainable<unknown>
  cy.task('foo').then((val) => {
    val // $ExpectType unknown
  })
}

namespace CypressSessionsTests {
  cy.session('user', () => {})
  cy.session({ name: 'bob' }, () => {})
  cy.session('user', () => {}, {})
  cy.session('user', () => {}, {
    validate: () => {}
  })

  cy.session() // $ExpectError
  cy.session('user') // $ExpectError
  cy.session(null) // $ExpectError
  cy.session('user', () => {}, {
    validate: { foo: true } // $ExpectError
  })
}

namespace CypressCurrentTest {
  Cypress.currentTest.title // $ExpectType string
  Cypress.currentTest.titlePath // $ExpectType string[]
  Cypress.currentTest() // $ExpectError
}

namespace CypressKeyboardTests {
  Cypress.Keyboard.defaults({
    keystrokeDelay: 0
  })
  Cypress.Keyboard.defaults({
    keystrokeDelay: 500
  })
  Cypress.Keyboard.defaults({
    keystrokeDelay: false // $ExpectError
  })
  Cypress.Keyboard.defaults({
    delay: 500 // $ExpectError
  })
}

namespace CypressOriginTests {
  cy.origin('example.com', () => {})
  cy.origin('example.com', { args: {}}, (value: object) => {})
  cy.origin('example.com', { args: { one: 1, key: 'value', bool: true } }, (value: { one: number, key: string, bool: boolean}) => {})
  cy.origin('example.com', { args: [1, 'value', true ] }, (value: Array<(number | string | boolean)>) => {})
  cy.origin('example.com', { args : 'value'}, (value: string) => {})
  cy.origin('example.com', { args: 1 }, (value: number) => {})
  cy.origin('example.com', { args: true }, (value: boolean) => {})

  cy.origin() // $ExpectError
  cy.origin('example.com') // $ExpectError
  cy.origin(true) // $ExpectError
  cy.origin('example.com', {}) // $ExpectError
  cy.origin('example.com', {}, {}) // $ExpectError
  cy.origin('example.com', { args: ['value'] }, (value: boolean[]) => {}) // $ExpectError
  cy.origin('example.com', {}, (value: undefined) => {}) // $ExpectError
}

namespace CypressGetCookiesTests {
  cy.getCookies().then((cookies) => {
    cookies // $ExpectType Cookie[]
  })
  cy.getCookies({ log: true })
  cy.getCookies({ timeout: 10 })
  cy.getCookies({ domain: 'localhost' })
  cy.getCookies({ log: true, timeout: 10, domain: 'localhost' })

  cy.getCookies({ log: 'true' }) // $ExpectError
  cy.getCookies({ timeout: '10' }) // $ExpectError
  cy.getCookies({ domain: false }) // $ExpectError
}

namespace CypressGetAllCookiesTests {
  cy.getAllCookies().then((cookies) => {
    cookies // $ExpectType Cookie[]
  })
  cy.getAllCookies({ log: true })
  cy.getAllCookies({ timeout: 10 })
  cy.getAllCookies({ log: true, timeout: 10 })

  cy.getAllCookies({ log: 'true' }) // $ExpectError
  cy.getAllCookies({ timeout: '10' }) // $ExpectError
  cy.getAllCookies({ other: true }) // $ExpectError
}

namespace CypressGetCookieTests {
  cy.getCookie('name').then((cookie) => {
    cookie // $ExpectType Cookie | null
  })
  cy.getCookie('name', { log: true })
  cy.getCookie('name', { timeout: 10 })
  cy.getCookie('name', { domain: 'localhost' })
  cy.getCookie('name', { log: true, timeout: 10, domain: 'localhost' })

  cy.getCookie('name', { log: 'true' }) // $ExpectError
  cy.getCookie('name', { timeout: '10' }) // $ExpectError
  cy.getCookie('name', { domain: false }) // $ExpectError
}

namespace CypressSetCookieTests {
  cy.setCookie('name', 'value').then((cookie) => {
    cookie // $ExpectType Cookie
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
  cy.setCookie('name', 'value', { log: true, timeout: 10, domain: 'localhost' })

  cy.setCookie('name') // $ExpectError
  cy.setCookie('name', 'value', { log: 'true' }) // $ExpectError
  cy.setCookie('name', 'value', { timeout: '10' }) // $ExpectError
  cy.setCookie('name', 'value', { domain: false }) // $ExpectError
  cy.setCookie('name', 'value', { foo: 'bar' }) // $ExpectError
}

namespace CypressClearCookieTests {
  cy.clearCookie('name').then((result) => {
    result // $ExpectType null
  })
  cy.clearCookie('name', { log: true })
  cy.clearCookie('name', { timeout: 10 })
  cy.clearCookie('name', { domain: 'localhost' })
  cy.clearCookie('name', { log: true, timeout: 10, domain: 'localhost' })

  cy.clearCookie('name', { log: 'true' }) // $ExpectError
  cy.clearCookie('name', { timeout: '10' }) // $ExpectError
  cy.clearCookie('name', { domain: false }) // $ExpectError
}

namespace CypressClearCookiesTests {
  cy.clearCookies().then((result) => {
    result // $ExpectType null
  })
  cy.clearCookies({ log: true })
  cy.clearCookies({ timeout: 10 })
  cy.clearCookies({ domain: 'localhost' })
  cy.clearCookies({ log: true, timeout: 10, domain: 'localhost' })

  cy.clearCookies({ log: 'true' }) // $ExpectError
  cy.clearCookies({ timeout: '10' }) // $ExpectError
  cy.clearCookies({ domain: false }) // $ExpectError
}

namespace CypressClearAllCookiesTests {
  cy.clearAllCookies().then((cookies) => {
    cookies // $ExpectType null
  })
  cy.clearAllCookies({ log: true })
  cy.clearAllCookies({ timeout: 10 })
  cy.clearAllCookies({ log: true, timeout: 10 })

  cy.clearAllCookies({ log: 'true' }) // $ExpectError
  cy.clearAllCookies({ timeout: '10' }) // $ExpectError
  cy.clearAllCookies({ other: true }) // $ExpectError
}

namespace CypressLocalStorageTests {
  cy.getAllLocalStorage().then((result) => {
    result // $ExpectType StorageByOrigin
  })
  cy.getAllLocalStorage({ log: false })
  cy.getAllLocalStorage({ log: 'true' }) // $ExpectError

  cy.clearAllLocalStorage().then((result) => {
    result // $ExpectType null
  })
  cy.clearAllLocalStorage({ log: false })
  cy.clearAllLocalStorage({ log: 'true' }) // $ExpectError

  cy.getAllSessionStorage().then((result) => {
    result // $ExpectType StorageByOrigin
  })
  cy.getAllSessionStorage({ log: false })
  cy.getAllSessionStorage({ log: 'true' }) // $ExpectError

  cy.clearAllSessionStorage().then((result) => {
    result // $ExpectType null
  })
  cy.clearAllSessionStorage({ log: false })
  cy.clearAllSessionStorage({ log: 'true' }) // $ExpectError
}

namespace CypressTraversalTests {
  cy.wrap({}).prevUntil('a') // $ExpectType Chainable<JQuery<HTMLAnchorElement>>
  cy.wrap({}).prevUntil('#myItem') // $ExpectType Chainable<JQuery<HTMLElement>>
  cy.wrap({}).prevUntil('span', 'a') // $ExpectType Chainable<JQuery<HTMLSpanElement>>
  cy.wrap({}).prevUntil('#myItem', 'a') // $ExpectType Chainable<JQuery<HTMLElement>>
  cy.wrap({}).prevUntil('div', 'a', { log: false, timeout: 100 }) // $ExpectType Chainable<JQuery<HTMLDivElement>>
  cy.wrap({}).prevUntil('#myItem', 'a', { log: false, timeout: 100 }) // $ExpectType Chainable<JQuery<HTMLElement>>
  cy.wrap({}).prevUntil('#myItem', 'a', { log: 'true' }) // $ExpectError

  cy.wrap({}).nextUntil('a') // $ExpectType Chainable<JQuery<HTMLAnchorElement>>
  cy.wrap({}).nextUntil('#myItem') // $ExpectType Chainable<JQuery<HTMLElement>>
  cy.wrap({}).nextUntil('span', 'a') // $ExpectType Chainable<JQuery<HTMLSpanElement>>
  cy.wrap({}).nextUntil('#myItem', 'a') // $ExpectType Chainable<JQuery<HTMLElement>>
  cy.wrap({}).nextUntil('div', 'a', { log: false, timeout: 100 }) // $ExpectType Chainable<JQuery<HTMLDivElement>>
  cy.wrap({}).nextUntil('#myItem', 'a', { log: false, timeout: 100 }) // $ExpectType Chainable<JQuery<HTMLElement>>
  cy.wrap({}).nextUntil('#myItem', 'a', { log: 'true' }) // $ExpectError

  cy.wrap({}).parentsUntil('a') // $ExpectType Chainable<JQuery<HTMLAnchorElement>>
  cy.wrap({}).parentsUntil('#myItem') // $ExpectType Chainable<JQuery<HTMLElement>>
  cy.wrap({}).parentsUntil('span', 'a') // $ExpectType Chainable<JQuery<HTMLSpanElement>>
  cy.wrap({}).parentsUntil('#myItem', 'a') // $ExpectType Chainable<JQuery<HTMLElement>>
  cy.wrap({}).parentsUntil('div', 'a', { log: false, timeout: 100 }) // $ExpectType Chainable<JQuery<HTMLDivElement>>
  cy.wrap({}).parentsUntil('#myItem', 'a', { log: false, timeout: 100 }) // $ExpectType Chainable<JQuery<HTMLElement>>
  cy.wrap({}).parentsUntil('#myItem', 'a', { log: 'true' }) // $ExpectError
}
