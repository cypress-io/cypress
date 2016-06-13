import React from 'react'

import Nav from '../nav/nav'
import FilesList from '../files/files-list'
import Footer from '../footer/footer'

export default ({ children }) => (
  <div>
    <Nav />
    {children}
    <FilesList />
    <Footer />
  </div>
)
