const windowAlert = (Cypress, str) => {
  Cypress.log({
    type: 'parent',
    name: 'alert',
    message: str,
    event: true,
    end: true,
    snapshot: true,
    consoleProps () {
      return {
        'Alerted': str,
      }
    },
  })
}

const windowConfirmed = (Cypress, str, ret) => {
  Cypress.log({
    type: 'parent',
    name: 'confirm',
    message: str,
    event: true,
    end: true,
    snapshot: true,
    consoleProps () {
      return {
        'Prompted': str,
        'Confirmed': ret,
      }
    },
  })
}

module.exports = (Commands, Cypress) => {
  Cypress.on('window:alert', (str) => {
    windowAlert(Cypress, str)
  })

  Cypress.on('window:confirmed', (str, ret) => {
    windowConfirmed(Cypress, str, ret)
  })
}
