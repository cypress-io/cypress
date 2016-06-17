import React from 'react'
import App from '../lib/app'

const Footer = () => {
  return (
    <footer className='footer'>
      <div className='container-fluid'>
        <p className='text-center'>
          <a href=''>Version 0.16.1</a>{' '}
          |{' '}
          <a onClick={openChangelog} href='#'>Changelog</a>
        </p>
      </div>
    </footer>
  )
}

const openChangelog = () => (
  App.ipc('external:open', 'https://on.cypress.io/changelog')
)

export default Footer
