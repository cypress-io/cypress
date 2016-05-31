import React, { Component } from 'react'

import Cypress from '../lib/cypress'

export default class Header extends Component {
  constructor (props) {
    super(props)

    this.state = {
      url: '',
      loading: false,
    }
  }

  componentWillMount () {
    Cypress.on('url:changed', (url) => {
      this.setState({ url })
    })

    Cypress.on('page:loading', (loading) => {
      this.setState({ loading })
    })
  }

  render () {
    const [viewportWidth, viewportHeight, viewportScale] = [1000, 660, 100]

    // TODO: style url to look like input
    return (
      <header>
        <div id="url-container" className="pull-left">
          <div id="url-wrapper" className={this.state.loading ? 'loading' : ''}>
            <div className="url">{this.state.url}</div>
            <span className="loading-wrapper">
              <span className="loading-content">...loading</span>
              <i className="fa fa-spinner fa-spin"></i>
            </span>
          </div>
        </div>
        <ul className="iframe-menu">
          <li>
            <div className="dropdown pull-left">
              <button data-toggle="dropdown" className="btn btn-link">
                <span id="current-viewport-sizes">
                  <span id="viewport-width">{viewportWidth}</span>
                  x
                  <span id="viewport-height">{viewportHeight}</span>
                  <span id="viewport-scale-container">
                    (<span id="viewport-scale">{viewportScale}</span>%)
                  </span>
                </span>
              </button>
              <div id="viewport-wrapper" className="dropdown-menu dropdown-menu-right">
                <p>The <strong>viewport</strong> determines the width and height of your application. By default the viewport will be <strong>1000px</strong> by <strong>660px</strong> unless specified by a <code>cy.viewport</code> command.</p>
                <p>Additionally you can override the default viewport dimensions by specifying these values in your <code>cypress.json</code>.</p>
                <pre>
{`{
  viewportWidth: 1000,
  viewportHeight: 660
}`}
                </pre>
                <p id="viewport-link">
                  <a href="https://on.cypress.io/api/viewport" target="_blank">
                    <i className="fa fa-info-circle"></i>
                    Read more about viewport here.
                  </a>
                </p>
              </div>
            </div>
          </li>
        </ul>
      </header>
    )
  }
}
