import React, { useState, useEffect } from 'react'
import './App.css'
import logo from './logo.svg'
import LoadingIndicator from './LoadingIndicator'

function App () {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const _timer = setTimeout(() => setIsLoading(false), 2000)

    return () => {
      clearTimeout(_timer)
    }
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1 className="App-title">Welcome to React</h1>
      </header>
      <pre>isLoading: {String(isLoading)}</pre>
      <LoadingIndicator isLoading={isLoading}>
        <div>ahoy!</div>
      </LoadingIndicator>
    </div>
  )
}

export default App
