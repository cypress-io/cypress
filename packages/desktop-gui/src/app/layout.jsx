import React from 'react'

import Nav from './nav'
import GlobalError from './global-error'
import Footer from '../footer/footer'
import LoginModal from '../auth/login-modal'
import UpdateBanner from '../update/update-banner'
import UiBlocker from './ui-blocker'

export default ({ children }) => {
  return (
    <div>
      <Nav />
      {children}
      <UpdateBanner />
      <Footer />
      <LoginModal />
      <GlobalError />
      <UiBlocker />
    </div>
  )
}
