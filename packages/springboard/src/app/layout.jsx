import React from 'react'

import Nav from './nav'
import GlobalError from './global-error'
import Footer from '../footer/footer'
import LoginModal from '../auth/login-modal'

export default ({ children }) => {
  return (
    <>
      <Nav />
      {children}
      <Footer />
      <LoginModal />
      <GlobalError />
    </>
  )
}
