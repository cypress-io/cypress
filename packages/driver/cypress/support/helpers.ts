const { _ } = Cypress

// declared locally because the webpack runtime has no types; overriding `d` gives
// each export a setter so a spec can stub the exports of a TypeScript module
declare const __webpack_require__: {
  d: (...args: any[]) => void
  o: (exports: object, name: string) => boolean
}

export const getQueueNames = () => {
  return _.map(cy.queue, 'name')
}

export function allowTsModuleStubbing () {
  __webpack_require__.d = function (exports, name, getter) {
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
