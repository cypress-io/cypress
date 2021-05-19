export const animationFrameDebounce = <T extends Array<unknown>>(callback: (...args: T) => void) => {
  let timeout

  // Return a function to run debounced
  return (...args: T) => {
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
