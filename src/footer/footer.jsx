import React from 'react'
import App from '../lib/app'

const Footer = () => {
  return (
    <footer className='footer'>
      <div className='container-fluid'>
        <p className='text-center'>
          <a onClick={startAboutWindow} href=''>Version 0.16.1</a>{' '}
          |{' '}
          <a onClick={openChangelog} href='#'>Changelog</a>
        </p>
      </div>
    </footer>
  )
}

const startAboutWindow = (e) => {
  e.preventDefault()

  return App.ipc("window:open", {
    position: "center",
    width: 300,
    height: 230,
    toolbar: false,
    title: "About",
    type: "ABOUT",
  })
}

const openChangelog = (e) => {
  e.preventDefault()

  return App.ipc('external:open', 'https://on.cypress.io/changelog')
}

export default Footer
