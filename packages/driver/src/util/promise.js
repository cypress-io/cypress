class TimeoutError extends Error {}

const timeout = function (timeoutMillis, promise) {
  return new Promise((resolve, reject) => {
    let timeout = _setTimeout(() => {
      reject(new TimeoutError)
    }, timeoutMillis)

    promise()
    .then((val) => {
      clearTimeout(timeout)

      resolve(val)
    })
    .catch((err) => {
      clearTimeout(timeout)

      reject(err)
    })
  })
}

function _setTimeout (callback, time) {
  return setTimeout(callback, time)
}

module.exports = {
  _setTimeout,
  timeout,
  TimeoutError,
}
