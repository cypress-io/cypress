import React from 'react'

import Nav from '../nav/nav'
import Footer from '../footer/footer'

export default ({ params, children }) => {
  return (
    <div>
      <Nav params={params}/>
      {children}
      <Footer />
    </div>
  )
}
