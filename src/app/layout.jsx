import React from 'react'

import Nav from '../nav/nav'
import Footer from '../footer/footer'
import Update from '../update/update'

export default ({ params, children }) => {
  return (
    <div>
      <Nav params={params}/>
      {children}
      <Update />
      <Footer />
    </div>
  )
}
