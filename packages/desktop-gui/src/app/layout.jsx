import React from 'react'

import Nav from './nav'
import Footer from '../footer/footer'
import UpdateBanner from '../update/update-banner'

export default ({ children }) => {
  return (
    <div>
      <Nav />
      {children}
      <UpdateBanner />
      <Footer />
    </div>
  )
}
