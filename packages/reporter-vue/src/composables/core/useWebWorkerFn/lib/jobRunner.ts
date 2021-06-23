
/**
 * This function accepts as a parameter a function "userFunc"
 * And as a result returns an anonymous function.
 * This anonymous function, accepts as arguments,
 * the parameters to pass to the function "useArgs" and returns a Promise
 * This function can be used as a wrapper, only inside a Worker
 * because it depends by "postMessage".
 *
 * @param {Function} userFunc {Function} fn the function to run with web worker
 *
 * @returns {Function} returns a function that accepts the parameters
 * to be passed to the "userFunc" function
 */
const jobRunner = (userFunc: Function) => (e: MessageEvent) => {
  const userFuncArgs = e.data[0]

  // eslint-disable-next-line prefer-spread
  return Promise.resolve(userFunc.apply(undefined, userFuncArgs))
    .then((result) => {
      // @ts-ignore
      postMessage(['SUCCESS', result])
    })
    .catch((error) => {
      // @ts-ignore
      postMessage(['ERROR', error])
    })
}

export default jobRunner
