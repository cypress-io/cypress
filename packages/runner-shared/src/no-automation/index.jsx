import _ from 'lodash'
import React from 'react'
import { BrowserIcon, Dropdown } from '@packages/ui-components'

const displayName = (name) => _.capitalize(name)

const noBrowsers = () => (
  <div>
    <p className='muted'>
      <small>
        We couldn't find any supported browsers capable of running Cypress on your machine.
      </small>
    </p>
    <a href='https://www.google.com/chrome/browser/desktop' className='btn btn-primary btn-lg' target='_blank' rel='noopener noreferrer'>
      <i className='fas fa-chrome'></i>
      Download Chrome
    </a>
  </div>
)

const browser = (browser) => (
  <span>
    <BrowserIcon browserName={browser.displayName} />
    <span>
      {`Run ${displayName(browser.displayName)} ${browser.majorVersion}`}
    </span>
  </span>
)

const browserPicker = (browsers, onLaunchBrowser) => {
  const chosenBrowser = _.find(browsers, { default: true }) || browsers[0]
  const otherBrowsers = _(browsers)
  .without(chosenBrowser)
  .map((browser) => _.extend({}, browser, { key: browser.name + browser.version }))
  .value()

  return (
    <div>
      <p className='muted'>This browser was not launched through Cypress. Tests cannot run.</p>
      <Dropdown
        chosen={chosenBrowser}
        others={otherBrowsers}
        renderItem={browser}
        keyProperty='key'
        onSelect={onLaunchBrowser}
      />
    </div>
  )
}

export const NoAutomation = ({ browsers, onLaunchBrowser }) => (
  <div className='runner automation-failure'>
    <div className="automation-message">
      <p>Whoops, we can't run your tests.</p>
      {browsers.length ? browserPicker(browsers, onLaunchBrowser) : noBrowsers()}
      <div>
        <p className="muted">Either the browser was launched by Cypress and your organization has a ProxyMode group policy set or you visited the Cypress HTTP proxy port outside of a Cypress browser.</p>
      </div>
      <div className='helper-line'>
        <a className='helper-docs-link' href='https://on.cypress.io/error-messages#Whoops-we-can-t-run-your-tests' target='_blank' rel='noreferrer'>
          <i className='fas fa-question-circle'></i>
          {' Why am I seeing this message?'}
        </a>
      </div>
    </div>
  </div>
)
