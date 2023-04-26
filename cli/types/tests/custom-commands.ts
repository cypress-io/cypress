/* eslint-disable @typescript-eslint/no-unused-vars */

import { expectType } from '.'

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      newCommand: (arg: string) => Chainable<number>
      newQuery: (arg: string) => Chainable<number>
    }
  }
}

namespace CypressCommandsTests {
  Cypress.Commands.add('newCommand', (arg) => {
    expectType<string>(arg)

    return
  })
  Cypress.Commands.add('newCommand', (arg) => {
    expectType<string>(arg)
  })
  Cypress.Commands.add('newCommand', function (arg) {
    expectType<Mocha.Context>(this)
    expectType<string>(arg)
  })
  Cypress.Commands.add('newCommand', { prevSubject: true }, (subject, arg) => {
    expectType<any>(subject)
    expectType<string>(arg)

    return
  })
  Cypress.Commands.add('newCommand', { prevSubject: false }, (arg) => {
    expectType<string>(arg)

    return
  })
  Cypress.Commands.add('newCommand', { prevSubject: 'optional' }, (subject, arg) => {
    expectType<unknown>(subject)
    expectType<string>(arg)

    return
  })
  Cypress.Commands.add('newCommand', { prevSubject: 'optional' }, (subject, arg) => {
    expectType<unknown>(subject)
    expectType<string>(arg)
  })
  Cypress.Commands.add('newCommand', { prevSubject: ['optional'] }, (subject, arg) => {
    expectType<unknown>(subject)
    expectType<string>(arg)
  })
  Cypress.Commands.add('newCommand', { prevSubject: 'document' }, (subject, arg) => {
    expectType<Document>(subject)
    expectType<string>(arg)
  })
  Cypress.Commands.add('newCommand', { prevSubject: 'window' }, (subject, arg) => {
    expectType<Window>(subject)
    expectType<string>(arg)
  })
  Cypress.Commands.add('newCommand', { prevSubject: 'element' }, (subject, arg) => {
    expectType<Cypress.JQueryWithSelector<HTMLElement>>(subject)
    expectType<string>(arg)
  })
  Cypress.Commands.add('newCommand', { prevSubject: ['element'] }, (subject, arg) => {
    expectType<Cypress.JQueryWithSelector<HTMLElement>>(subject)
    expectType<string>(arg)
  })
  Cypress.Commands.add('newCommand', { prevSubject: ['element', 'document', 'window'] }, (subject, arg) => {
    if (subject instanceof Window) {
      expectType<Window>(subject)
    } else if (subject instanceof Document) {
      expectType<Document>(subject)
    } else {
      expectType<Cypress.JQueryWithSelector<HTMLElement>>(subject)
    }

    expectType<string>(arg)
  })
  Cypress.Commands.add('newCommand', { prevSubject: ['window', 'document', 'optional', 'element'] }, (subject, arg) => {
    if (subject instanceof Window) {
      expectType<Window>(subject)
    } else if (subject instanceof Document) {
      expectType<Document>(subject)
    } else if (subject) {
      expectType<Cypress.JQueryWithSelector<HTMLElement>>(subject)
    } else {
      expectType<void>(subject)
    }

    expectType<string>(arg)
  })
  Cypress.Commands.add('newCommand', (arg) => {
    expectType<string>(arg)

    return cy.wrap(new Promise<number>((resolve) => {
      resolve(5)
    }))
  })

  Cypress.Commands.addAll({
    newCommand (arg) {
      expectType<any>(arg)
      expectType<Mocha.Context>(this)

      return
    },
    newCommand2 (arg, arg2) {
      expectType<any>(arg)
      expectType<any>(arg2)
    },
    newCommand3: (arg) => {
      expectType<any>(arg)

      return
    },
    newCommand4: (arg) => {
      expectType<any>(arg)
    },
  })
  Cypress.Commands.addAll({ prevSubject: true }, {
    newCommand: (subject, arg) => {
      expectType<any>(subject)
      expectType<any>(arg)

      return
    },
  })
  Cypress.Commands.addAll({ prevSubject: false }, {
    newCommand: (arg) => {
      expectType<any>(arg)

      return
    },
  })
  Cypress.Commands.addAll({ prevSubject: 'optional' }, {
    newCommand: (subject, arg) => {
      expectType<unknown>(subject)
      expectType<any>(arg)

      return
    },
    newCommand2: (subject, arg) => {
      expectType<unknown>(subject)
      expectType<any>(arg)
    },
  })
  Cypress.Commands.addAll({ prevSubject: ['optional'] }, {
    newCommand: (subject, arg) => {
      expectType<unknown>(subject)
      expectType<any>(arg)
    },
  })
  Cypress.Commands.addAll({ prevSubject: 'document' }, {
    newCommand: (subject, arg) => {
      expectType<Document>(subject)
      expectType<any>(arg)
    },
  })
  Cypress.Commands.addAll({ prevSubject: 'window' }, {
    newCommand: (subject, arg) => {
      expectType<Window>(subject)
      expectType<any>(arg)
    },
  })
  Cypress.Commands.addAll({ prevSubject: 'element' }, {
    newCommand: (subject, arg) => {
      expectType<Cypress.JQueryWithSelector<HTMLElement>>(subject)
      expectType<any>(arg)
    },
  })
  Cypress.Commands.addAll({ prevSubject: ['element'] }, {
    newCommand: (subject, arg) => {
      expectType<Cypress.JQueryWithSelector<HTMLElement>>(subject)
      expectType<any>(arg)
    },
  })
  Cypress.Commands.addAll({ prevSubject: ['element', 'document', 'window'] }, {
    newCommand: (subject, arg) => {
      if (subject instanceof Window) {
        expectType<Window>(subject)
      } else if (subject instanceof Document) {
        expectType<Document>(subject)
      } else {
        expectType<Cypress.JQueryWithSelector<HTMLElement>>(subject)
      }

      expectType<any>(arg)
    },
  })
  Cypress.Commands.addAll({ prevSubject: ['window', 'document', 'optional', 'element'] }, {
    newCommand: (subject, arg) => {
      if (subject instanceof Window) {
        expectType<Window>(subject)
      } else if (subject instanceof Document) {
        expectType<Document>(subject)
      } else if (subject) {
        expectType<Cypress.JQueryWithSelector<HTMLElement>>(subject)
      } else {
        // expectType<void>(subject)
      }

      expectType<any>(arg)
    },
  })
  Cypress.Commands.addAll({
    newCommand: (arg) => {
      expectType<any>(arg)

      return cy.wrap(new Promise<number>((resolve) => {
        resolve(5)
      }))
    },
  })

  Cypress.Commands.overwrite('newCommand', (originalFn, arg) => {
    expectType<string>(arg)
    originalFn // $ExpectedType Chainable['newCommand']
    expectType<Cypress.Chainable<number>>(originalFn(arg))
  })
  Cypress.Commands.overwrite('newCommand', function (originalFn, arg) {
    expectType<Mocha.Context>(this)
    expectType<string>(arg)
    originalFn // $ExpectedType Chainable['newCommand']
    expectType<Cypress.Chainable<number>>(originalFn.apply(this, [arg]))
  })

  Cypress.Commands.overwrite<'type', 'element'>('type', (originalFn, element, text, options?: Partial<Cypress.TypeOptions & {sensitive: boolean}>) => {
    expectType<Cypress.JQueryWithSelector<HTMLElement>>(element)
    expectType<string>(text)

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

  Cypress.Commands.addQuery('newQuery', function (arg) {
    expectType<Cypress.Command>(this)
    expectType<string>(arg)

    return () => 3
  })
}
