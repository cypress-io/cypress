import React from 'react'
import ReactDOM from 'react-dom'

window.process.browser = true
window.global = window.globalThis
window.Buffer = (await import('buffer')).Buffer
window.__Cypress__ = true

const config = await (await fetch('/__/api')).json()

const $Cypress = (await import('@packages/driver')).default

// const { eventManager } = await import('@packages/runner-shared/src/event-manager')
const { Runner } = await import('@packages/runner-ct/src/main.jsx')

export async function renderReact (target = document.getElementById('root')) {
  const base64Config = JSON.parse($Cypress.utils.decodeBase64Unicode(config.base64Config))

  Runner.start(target, config.base64Config)
  
}
