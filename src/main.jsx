import React from 'react'
import { render } from 'react-dom'

import Iframes from './iframe/iframes'

render(
  <div id="aut-wrapper">
    <div id="aut-container">
      <div id="header-region"></div>
      <Iframes />
      <div id="message-region"></div>
    </div>
  </div>
, document.getElementById('app'))
