import React from 'react'

import Nav from './nav'
import GlobalError from './global-error'
import Footer from '../footer/footer'
import LoginModal from '../auth/login-modal'
import { LayoutFragment } from '../generated/graphql'
import { gql } from '@apollo/client'

type LayoutProps = {
  data: LayoutFragment
}

gql`
fragment Layout on Query {
  ...Nav
  ...Footer
}
`

const Layout: React.FC<LayoutProps> = ({ children, data }) => {
  return (
    <>
      <Nav data={data} />
      {children}
      <Footer data={data} />
      <LoginModal />
      <GlobalError />
    </>
  )
}

export default Layout
