import React from 'react'
import MobxDevTools, { setLogEnabled, setUpdatesEnabled, setGraphEnabled } from 'mobx-react-devtools'

const DevTools = () => {
  if (
    (window.env === 'development' || window.env === 'test') &&
    !localStorage.noDevtools
  ) {
    setLogEnabled(true)
    setUpdatesEnabled(true)
    setGraphEnabled(false)

    return <MobxDevTools position={{ bottom: 0, left: 20 }}/>
  }
}

export default DevTools
