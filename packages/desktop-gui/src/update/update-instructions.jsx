import cs from 'classnames'
import { observer, useLocalStore } from 'mobx-react'
import React from 'react'
import { action } from 'mobx'

import appStore from '../lib/app-store'
import updateStore from './update-store'
import ipc from '../lib/ipc'
import { useLifecycle } from '../lib/use-lifecycle'

const UpgradeCommand = observer(({ packageManager, command }) => {
  const state = useLocalStore(() => ({
    wasCopied: false,
    setWasCopied: action((wasCopied) => {
      state.wasCopied = wasCopied
    }),
  }))

  let resetId

  const copyToClipboard = () => {
    if (state.wasCopied) return

    ipc.setClipboardText(command)
    state.setWasCopied(true)

    resetId = setTimeout(() => {
      state.setWasCopied(false)
    }, 5000)
  }

  useLifecycle({
    onUnmount () {
      // clear timeout when component is unmounted
      if (resetId) {
        clearTimeout(resetId)
      }
    },
  })

  const icon = state.wasCopied ? 'fas fa-check' : 'far fa-copy'

  return (
    <span className={cs({ 'was-copied': state.wasCopied })}>
      {packageManager}:
      <code>
        {command}
        <button className='copy-to-clipboard' onClick={copyToClipboard} disabled={state.wasCopied}>
          <i className={icon}></i>
        </button>
      </code>
    </span>
  )
})

const GlobalInstructions = observer(() => {
  const openDownload = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://download.cypress.io/desktop')
  }

  return (
    <div className='global-mode-instructions'>
      <p>To update:</p>
      <ol>
        <li>
          <a href='#' onClick={openDownload}>Download the new version.</a>
        </li>
        <li>
          <span>Extract the download and replace the existing app.<strong>*</strong></span>
        </li>
      </ol>
      <p><i className='fas fa-asterisk' /> Remember to <strong>close this app</strong> before replacing.</p>
    </div>
  )
})

const ProjectInstructions = observer(() => {
  const openCyOpenDoc = (e) => {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/how-to-open-cypress')
  }

  return (
    <div className='project-mode-instructions'>
      <p>To get the latest, run the following command<strong>*</strong>:</p>
      <ol>
        <li>
          <UpgradeCommand packageManager='npm' command={`npm install --save-dev cypress@${updateStore.newVersion}`} />
          <UpgradeCommand packageManager='yarn' command={`yarn upgrade cypress@${updateStore.newVersion}`} />
          <span className='footnote'><i className='fas fa-asterisk' /> Remember to <strong>close this app</strong> before installing.</span>
        </li>
        <li>
          <span>Run <a href='#' onClick={openCyOpenDoc}><code>node_modules/.bin/cypress open</code></a> to open the new version.</span>
        </li>
      </ol>
    </div>
  )
})

export const UpdateInstructions = observer(() => (
  <>
    <header>
      <h4><i className='fas fa-arrow-alt-circle-up'></i> Update to Version {updateStore.newVersion}</h4>
    </header>
    <section>
      <p>You are currently running <strong>Version {appStore.displayVersion}</strong></p>
      {appStore.isGlobalMode ? <GlobalInstructions /> : <ProjectInstructions />}
    </section>
  </>
))
