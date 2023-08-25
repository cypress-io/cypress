import React from 'react'
import './Mars.module.css'

export default class HelloMars extends React.Component {
  render () {
    return (
      <div>
        <h1>Hello Mars</h1>
        <input type="text" id="mars-text" />
      </div>
    )
  }
}
