import { observer } from 'mobx-react'
import React from 'react'

import statsStore from './stats-store'

import Controls from './controls'
import Stats from './stats'

const Header = observer(() => (
  <header>
    <Stats stats={statsStore} />
    <Controls stats={statsStore} />
  </header>
))

export default Header
