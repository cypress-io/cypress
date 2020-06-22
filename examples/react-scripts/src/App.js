import React from 'react'
// this CSS will be inlined ✅
import './App.css'
import logo from './logo.svg' // => "/__root/src/logo.svg"
import cypressLogo from './cypress-logo-dark.png' // => "/__root/src/cypress-logo-dark.png"
import { getRandomNumber } from './calc'
import Child from './Child'

// large image will be transformed into
// a different url static/media/vans.25e5784d.jpg
// import giantImage from './vans.jpg'

// we cannot load the image from direct url
// import giantImage from '/__root/src/vans.jpg'
// <img src={giantImage} alt="cypress-logo" />

function App() {
  return (
    <div className="App">
      <img src={cypressLogo} className="Cypress-log" alt="Logo" />

      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <p className="random">This is a random number {getRandomNumber()}</p>
        <Child />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <p>
          <code>.env</code> variable is{' '}
          <span id="env-var">{process.env.REACT_APP_NOT_SECRET_CODE}</span>
        </p>
      </header>
    </div>
  )
}

export default App
