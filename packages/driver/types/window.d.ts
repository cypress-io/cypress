declare interface Window {
  jquery: Function
  $: JQueryStatic
  // Cannot use `ErrorConstructor` because it doesn't allow Error as an argument. 
  Error: (new(arg?: string | Error) => Error)
}
