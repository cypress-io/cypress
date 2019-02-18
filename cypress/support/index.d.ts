declare namespace Cypress {
  interface Cypress {
    stylesCache: any
    React: string
    ReactDOM: string
    Styles: string
  }
  // NOTE: By default, avoiding React.Component/Element typings
  // for many cases, we don't want to import @types/react
  interface Chainable<Subject = any> {
    injectReactDOM: () => Chainable<void>
    copyComponentStyles: (component: Symbol) => Chainable<void>
    mount: (component: Symbol, alias?: string) => Chainable<void>
    get<S = any>(alias: string | symbol | Function, options?: Partial<Loggable & Timeoutable>): Chainable<any>
  }
}
