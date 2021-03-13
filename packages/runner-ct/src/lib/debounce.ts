export const debounce = (callback) => {
  let timeout

  // Return a function to run debounced
  return function (...args: any[]) {
    // If there's a timer, cancel it
    if (timeout) {
      window.cancelAnimationFrame(timeout)
    }

    // Setup the new requestAnimationFrame()
    timeout = window.requestAnimationFrame(() => {
      callback.apply({}, args)
    })
  }
}
