import React from 'react'

import Controls from './controls'
import Stats from './stats'

export default (props) => (
  <header>
    <Stats {...props} />
    <Controls {...props} />
  </header>
)
