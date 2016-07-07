import { observer } from 'mobx-react'
import React from 'react'

import Controls from './controls'
import Stats from './stats'

const Header = observer((props) => (
  <header>
    <Stats stats={props.statsStore} />
    <Controls stats={props.statsStore} />
  </header>
))

export default Header
