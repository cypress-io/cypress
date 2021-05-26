import _ from 'lodash'
import ipc from './ipc'

const handleGlobalErrors = () => {
  const sendErr = (err) => {
    if (err) {
      ipc.guiError(_.pick(err, 'name', 'message', 'stack'))
    }

    if (window.env === 'development' || window.env === 'test') {
      console.error(err) // eslint-disable-line no-console
      debugger // eslint-disable-line no-debugger
    }
  }

  window.onerror = (message, source, lineno, colno, err) => {
    sendErr(err)
  }

  window.onunhandledrejection = (event) => {
    const reason = event && event.reason

    sendErr(reason || event)
  }
}

export default handleGlobalErrors
