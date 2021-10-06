const { _ } = Cypress

const getFirstSubjectByName = (name) => {
  return cy.queue.find({ name }).get('subject')
}

const getQueueNames = () => {
  return _.map(cy.queue, 'name')
}

const registerCypressConfigBackupRestore = () => {
  let originalConfig

  beforeEach(() => {
    originalConfig = _.clone(Cypress.config())
  })

  afterEach(() => {
    Cypress.config(originalConfig)
  })
}

function allowTsModuleStubbing () {
  // eslint-disable-next-line no-undef
  __webpack_require__.d = function (exports, name, getter) {
  // eslint-disable-next-line no-undef
    if (!__webpack_require__.o(exports, name)) {
      let stub

      Object.defineProperty(exports, name, { enumerable: true, configurable: true,
        get () {
          return stub !== undefined ? stub : getter()
        }, set (val) {
          stub = val
        },
      })
    }
  }
}

module.exports = {
  getQueueNames,
  getFirstSubjectByName,
  registerCypressConfigBackupRestore,
  allowTsModuleStubbing,
}
