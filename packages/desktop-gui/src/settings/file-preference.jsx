import _ from 'lodash'
import { action } from 'mobx'
import { EditorPicker } from '@packages/ui-components'
import { observer, useLocalStore } from 'mobx-react'
import React from 'react'

import ipc from '../lib/ipc'
import { useLifecycle } from '../lib/use-lifecycle'

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/file-opener-preference')
}

const save = _.debounce((editor) => {
  ipc.setUserEditor(editor)
  .catch(() => {}) // ignore errors
}, 500)

const FilePreference = observer(() => {
  const state = useLocalStore(() => ({
    editors: [],
    isLoadingEditor: true,
    chosenEditor: {},
    setEditors: action((editors) => {
      state.editors = editors
      state.isLoadingEditor = false
    }),
    setChosenEditor: action((editor) => {
      state.chosenEditor = editor
      save(editor)
    }),
    setOtherPath: action((otherPath) => {
      const otherOption = _.find(state.editors, { isOther: true })

      otherOption.openerId = otherPath
      save(otherOption)
    }),
  }))

  useLifecycle({
    onMount () {
      ipc.getUserEditor().then(({ preferredOpener, availableEditors }) => {
        if (preferredOpener) {
          state.setChosenEditor(preferredOpener)
        }

        state.setEditors(availableEditors)
      })
    },
  })

  return (
    <div className='file-preference'>
      <a href='#' className='learn-more' onClick={openHelp}>
        <i className='fas fa-info-circle'></i> Learn more
      </a>
      <p>Your preference is used to open files from the Test Runner <em>(e.g. when clicking links in error stack traces)</em></p>
      {state.isLoadingEditor ?
        <p className='loading-editors'>
          <i className='fas fa-spinner fa-spin'></i> Loading Editors...
        </p> :
        <EditorPicker
          chosen={state.chosenEditor}
          editors={state.editors}
          onSelect={state.setChosenEditor}
          onUpdateOtherPath={state.setOtherPath}
        />
      }
    </div>
  )
})

export default FilePreference
