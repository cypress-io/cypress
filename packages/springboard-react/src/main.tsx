import ReactDOM from 'react-dom'
import * as React from 'react'
import './main.scss'

import { SpringboardApp } from './SpringboardApp'

declare global {
  interface Window {
    App: any
  }
}

window.App = {
  start() {
    ReactDOM.render(<SpringboardApp />, document.getElementById('app'))
  },
}

export {}
