import React, { Component } from 'react'
import Cypress from '../lib/cypress'

export default class AutIframe extends Component {
  constructor (props) {
    super(props)

    // todo move this to state management
    this.state = {
      width: 1000,
      height: 660,
    }
  }

  componentDidMount () {
    const contents = `
      <link rel='stylesheet' href='/__cypress/aut/blank.css' />
      <div class='container'>
        <div class='jumbotron text-center'>
          <h1><i class='fa fa-home'></i></h1>
          <p class='lead'>This is the default blank page.</p>
          <p>To test your web application:</p>
          <ul class='list-unstyled'>
            <li>Start your app's server</li>
            <li>
              <kbd>
                <a href='https://on.cypress.io/api/visit' target='_blank'>cy.visit()</a>
              </kbd>
              your app
            </li>
            <li>Begin writing tests</li>
          </ul>
        </div>
      </div>
    `

    this.refs.iframe.contentDocument.body.innerHTML = contents

    Cypress.on('viewport', (viewport) => {
      this.setState({
        width: viewport.viewportWidth,
        height: viewport.viewportHeight,
      })
    })
  }

  render () {
    const name = 'foobar' //App.config.get('projectName')
    const { width, height } = this.state

    return (
      <div ref='sizeContainer' id='aut-size-container' style={{ width: `${width}px`, height: `${height}px` }}>
        <iframe ref='iframe' id={`Your App: '${name}'`} className='iframe-aut' />
      </div>
    )
  }

  getIframe () {
    return this.refs.iframe
  }
}
