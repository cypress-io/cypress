const getQueueNames = () => {
  return cy.queue.get().map((item) => item.get('name'))
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
  allowTsModuleStubbing,
}
