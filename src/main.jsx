import React from 'react'
import { render } from 'react-dom'

import Header from './header/header'
import Iframes from './iframe/iframes'

render(
  <div id="aut-wrapper">
    <div id="aut-container">
      <Header />
      <Iframes />
      <div id="message-region"></div>
    </div>
  </div>
, document.getElementById('app'))
