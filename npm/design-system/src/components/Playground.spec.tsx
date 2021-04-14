import React from 'react'
import { CypressLogo } from './CypressLogo/CypressLogo'
import { mount } from '@cypress/react'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas)
library.add(fab)

describe('Playground', () => {
  it('cypress logo', () => {
    mount(
      <>
        <CypressLogo size="small" />
        <br />
        <CypressLogo size="medium" />
        <br />
        <CypressLogo size="large" />
      </>,
    )
  })
})
