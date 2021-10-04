// import App from './app/RunnerCt'
// import State from './lib/state'
// import { Container, eventManager } from '@packages/runner-shared'
// import util from './lib/util'
// import defaultEvents from '@packages/reporter/src/lib/events'
// import { autorun, action, configure } from 'mobx'
// import React from 'react'
// import { render } from 'react-dom'

// to support async/await
import 'regenerator-runtime/runtime'
import $Cypress from '@packages/driver'
import { AutIframe } from '@packages/runner-shared/src/iframe/aut-iframe'
import { eventManager } from '@packages/runner-shared/src/event-manager'
import type { FoundSpec } from '@packages/types/src/spec'
import { BaseStore } from '@packages/runner-shared/src/store'
import { automationElementId } from '@packages/runner-shared/src/automation-element'
const driverUtils = $Cypress.utils

export function getSpecUrl (namespace: string, spec: FoundSpec, prefix = '') {
  return spec ? `${prefix}/${namespace}/iframes/${spec.absolute}` : ''
}

class Store extends BaseStore {}
const randomString = `${Math.random()}`

const store = new Store()

const spec: FoundSpec = {
  absolute: '/Users/lachlan/code/work/cypress5/packages/runner-ct/cypress/component/SpecList.spec.tsx',
  name: 'SpecList.spec.tsx',
  relative: 'cypress/component/SpecList.spec.tsx',
  specType: 'component'
}

const Runner = {
  spec, 

  eventManager, 

  decodeBase64: (base64: string) => {
    return JSON.parse(driverUtils.decodeBase64Unicode(base64))
  },

  emit (evt: string, ...args: unknown[]) {
  },

  start ({ config, projectName }) {
    eventManager.addGlobalListeners(store, {
      automationElement: automationElementId,
      randomString
    })

    config.spec = spec
    console.log(config.spec)
    eventManager.setup(config)

    const specSrc = getSpecUrl(config.namespace, spec)
    const $container = document.createElement('div')
    document.querySelector('#runner-vue').appendChild($container)

    const autIframe = new AutIframe(config.projectName)
    const $autIframe: JQuery<HTMLIFrameElement> = autIframe.create().appendTo($container)
    autIframe.showInitialBlankContents()

    console.log(eventManager)

    // In mount mode we need to render something right from spec file
    // So load application tests to the aut frame
    $autIframe.prop('src', specSrc)

    eventManager.initialize($autIframe, config)
  }
}

// @ts-ignore
window.Runner = Runner

// configure({ enforceActions: 'always' })

// const Runner = {
//   emit (evt, ...args) {
//     defaultEvents.emit(evt, ...args)
//   },

//   start (el, base64Config) {
//     action('started', () => {
//       const config = JSON.parse(driverUtils.decodeBase64Unicode(base64Config))

//       const NO_COMMAND_LOG = config.env && config.env.NO_COMMAND_LOG
//       const configState = config.state || {}

//       if (NO_COMMAND_LOG) {
//         configState.reporterWidth = 0
//       }

//       configState.specs = config.specs

//       const ctRunnerSpecificDefaults = {
//         reporterWidth: config.state.ctReporterWidth,
//         isSpecsListOpen: config.state.ctIsSpecsListOpen,
//         specListWidth: config.state.ctSpecListWidth,
//       }
//       const state = new State({ ...configState, ...ctRunnerSpecificDefaults }, config ?? {})

//       const setSpecByUrlHash = () => {
//         const specPath = util.specPath()

//         if (specPath) {
//           state.updateSpecByUrl(specPath)
//         }
//       }

//       setSpecByUrlHash()

//       // anytime the hash changes, see if we need to set a new spec
//       window.addEventListener('hashchange', setSpecByUrlHash)

//       autorun(() => {
//         const { spec } = state

//         if (spec) {
//           util.updateSpecPath(spec.name)
//         }
//       })

//       Runner.state = state
//       Runner.configureMobx = configure

//       state.updateDimensions(config.viewportWidth, config.viewportHeight)

//       const container = (
//         <Container
//           config={config}
//           runner='component'
//           state={state}
//           App={App}
//           hasSpecFile={util.hasSpecFile}
//           eventManager={eventManager}
//         />
//       )

//       render(container, el)
//     })()
//   },
// }

// window.Runner = Runner
