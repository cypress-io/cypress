interface ErrorConstructor {
  // Cannot use `ErrorConstructor` because it doesn't allow Error as an argument.
  new(arg?: string | Error): Error

  // Non-standard static method that only exists in Chrome
  // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#static_methods
  captureStackTrace(targetObject: object, constructorOpt?: Function): void
}

declare interface Window {
  jquery: Function
  $: JQueryStatic

  Error: ErrorConstructor
}
