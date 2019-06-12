/* eslint arrow-body-style: "off" */

const { _ } = Cypress

const events = ['keydown', 'keyup', 'keypress', 'textInput', 'input', 'focus', 'focusin', 'change']

const attachListeners = (listenerArr) => {
  return (els) => {
    _.each(els, (el, elName) => {
      return listenerArr.forEach((evtName) => {
        el[0].addEventListener(evtName, cy.stub().as(`${elName}:${evtName}`))
      })
    })
  }
}

const getAllFn = (...aliases) => {
  if (aliases.length > 1) {
    return getAllFn((_.isArray(aliases[1]) ? aliases[1] : aliases[1].split(' ')).map((alias) => {
      return `@${aliases[0]}:${alias}`
    }).join(' '))
  }

  return Cypress.Promise.all(
    aliases[0].split(' ').map((alias) => {
      return cy.now('get', alias)
    }))
}

Cypress.Commands.add('getAll', getAllFn)

const _wrapLogFalse = (obj) => {
  return cy.wrap(obj, { log: false })
}

export const attachKeyListeners = attachListeners(events)

export const shouldBeCalled = (stub) => {
  return _wrapLogFalse(stub).should('be.called')
}

export const shouldBeCalledOnce = (stub) => {
  return _wrapLogFalse(stub).should('be.calledOnce')
}

export const shouldBeCalledNth = (num) => {
  return (stub) => {
    return _wrapLogFalse(stub).should('have.callCount', num)
  }
}

export const shouldNotBeCalled = (stub) => {
  return _wrapLogFalse(stub).should('not.be.called')
}

export const shouldBeCalledWithMatch = (exp) => (stub) => {
  return expect(stub).calledWithMatch(exp)
}

//# trim new lines at the end of innerText
//# due to changing browser versions implementing
//# this differently
export const trimInnerText = ($el) => {
  return _.trimEnd($el.get(0).innerText, '\n')
}
