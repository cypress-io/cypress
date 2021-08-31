import React from 'react'
import ReactDOM from 'react-dom'
// import 'core-js/proposals/global-this'

window.process.browser = true
window.global = window.globalThis
window.Buffer = await import('buffer')

// const Mocha = await import('mocha')
const { Runner } = await import('@packages/runner-ct/src/main.jsx')
// const { eventManager } = await import('@packages/runner-shared/src/event-manager')
// const { Reporter } = await import('@packages/reporter')

// debugger

window.__Cypress__ = true

export async function renderReact (target = document.getElementById('root')) {
  Runner.start(target, 'eyJzdGF0ZSI6e319')
  // debugger
  // eventManager
  // Reporter

  // ReactDOM.render((<Runner/>, target))
  // const error = {
  //   title: 'Error',
  //   link: 'https://on.cypress.io/docs',
  //   callout: 'not really sure',
  //   message: 'lots of stuff to say',
  // }

  // const spec = {
  //   name: 'MySpecName',
  //   relative: './src/components/MySpecName.spec.tsx',
  //   absolute: '/Users/jess/cy/cypress/src/components/MySpecName.spec.tsx',
  // }

  // ReactDOM.render((<Reporter
  //   runner={eventManager.reporterBus}
  //   spec={spec}
  //   error={error}
  //   experimentalStudioEnabled={false}
  // />), target)

  // debugger
  // Mocha
  // debugger
  // driver
  // chrome
  // Runner
  // RunnablesList
  // debugger

  // console.log(Burger)
  // debugger;
  // const result = await import('../../runner-ct/src/main') // Styles only load when the method is called.

  // debugger;

  // config: {
  //   browsers: [],
  //   integrationFolder: '',
  //   numTestsKeptInMemory: 1,
  //   projectName: '',
  //   viewportHeight: 800,
  //   viewportWidth: 500,
  //   reporterWidth,
  //   state: {},
  //   spec: {
  //     name: 'foo.js',
  //     relative: 'relative/path/to/foo.js',
  //     absolute: '/absolute/path/to/foo.js',
  //   },
  //   // },
  // runner={this.props.eventManager.reporterBus}
  //             spec={spec}
  //             autoScrollingEnabled={this.props.config.state.autoScrollingEnabled}
  //             error={errorMessages.reporterError(this.props.state.scriptError, spec.relative)}
  //             experimentalStudioEnabled={this.props.config.experimentalStudio}

  // const props = {
  //   spec: {
  //     name: 'foo.js',
  //     relative: 'relative/path/to/foo.js',
  //     absolute: '/absolute/path/to/foo.js',
  //   },
  //   eventManager: {
  //     notifyRunningSpec: () => { },
  //     saveState: () => { },
  //     reporterBus: {
  //       emit: () => { },
  //       on: () => { },
  //     },
  //   },
  // }

  //   title: string
  // link?: string | null
  // callout?: string | null
  // message: string
  // debugger;
  // const error = {
  //   title: 'My error',
  //   message: 'My message',
  // }

  // return ReactDOM.render(
  //   <RunnablesList runnables={[]}/>
  //   ,
  //   target,
  // )
}
