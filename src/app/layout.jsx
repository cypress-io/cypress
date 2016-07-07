import React from 'react'

import Nav from '../nav/nav'
import Footer from '../footer/footer'
// import UpdateBanner from '../update/update-banner'

export default ({ params, children }) => {
  return (
    <div>
      <Nav params={params}/>
      {children}
      {
        // <UpdateBanner />
      }
      <Footer />
    </div>
  )
}
