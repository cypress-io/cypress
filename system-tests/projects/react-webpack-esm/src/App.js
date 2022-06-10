import React from 'react'
import './App.css'

const App = (props) => {
  return (
    <div>
      <h1>My React App</h1>
      <p>{props.msg}</p>
    </div>
  )
}

export default App
