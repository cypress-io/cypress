import React from 'react'

import Nav from '../nav/nav'
import Footer from '../footer/footer'

export default ({ children }) => (
  <div>
    <Nav />
    {children}
    <Footer />
  </div>
)
