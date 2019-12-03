import _ from 'lodash'
import React from 'react'

import Dropdown from '../dropdown/dropdown'

const displayName = (name) => _.capitalize(name)

const icon = (browser) => {
  switch (browser) {
    case 'chrome':
    case 'chromium':
    case 'canary':
    case 'electron':
      return 'fab fa-chrome'
    default:
      return 'fas fa-globe'
  }
}

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
    <i className={icon(browser.name)}></i>
    <span>Run {displayName(browser.name)} {browser.majorVersion}</span>
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
        onSelect={onLaunchBrowser}
        renderItem={browser}
      />
    </div>
  )
}

export default ({ browsers, onLaunchBrowser }) => (
  <div className='runner automation-failure'>
    <div className='automation-message'>
      <p>Whoops, we can't run your tests.</p>
      {browsers.length ? browserPicker(browsers, onLaunchBrowser) : noBrowsers()}
      <div className='helper-line'>
        <a className='helper-docs-link' href='https://on.cypress.io/launching-browsers' target='_blank'>
          <i className='fas fa-question-circle'></i> Why am I seeing this message?
        </a>
      </div>
    </div>
  </div>
)
