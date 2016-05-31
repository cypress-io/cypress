import React, { Component } from 'react'

export default class AutIframe extends Component {
  componentDidMount () {
    const contents = `
      <link rel="stylesheet" href="/__cypress/static/css/remote.css" />
      <div className="container">
        <div className="jumbotron text-center">
          <h1><i className="fa fa-home"></i></h1>
          <p className="lead">This is the default blank page.</p>
          <p>To test your web application:</p>
          <ul className="list-unstyled">
            <li>Start your app's server</li>
            <li>
              <kbd>
                <a href="https://on.cypress.io/api/visit" target="_blank">cy.visit()</a>
              </kbd>
              your app
            </li>
            <li>Begin writing tests</li>
          </ul>
        </div>
      </div>
    `

    this.refs.iframe.contentDocument.body.innerHTML = contents
  }

  shouldComponentUpdate () {
    return false
  }

  render () {
    const name = 'foobar' //App.config.get("projectName")

    return (
      <iframe ref="iframe" id={`Your App: '${name}'`} className='iframe-remote' />
    )
  }

  getIframe () {
    return this.refs.iframe
  }
}
