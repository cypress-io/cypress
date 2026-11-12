interface ErrorConstructor {
  // Cannot use `ErrorConstructor` because it doesn't allow Error as an argument.
  new(arg?: string | Error): Error

  // Non-standard static method that only exists in Chrome
  // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#static_methods
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- mirrors @types/node's declaration, and class constructors passed here are not callable signatures
  captureStackTrace(targetObject: object, constructorOpt?: Function): void
}

declare interface Window {
  jquery: (...args: any[]) => unknown
  $: JQueryStatic

  Error: ErrorConstructor
}
