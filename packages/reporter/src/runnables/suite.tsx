import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { Component, MouseEvent } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import { indent } from '../lib/util'

import appState, { AppState } from '../lib/app-state'
import events, { Events } from '../lib/events'
import Test from '../test/test'
import Collapsible from '../collapsible/collapsible'

import SuiteModel from './suite-model'
import TestModel from '../test/test-model'

import WandIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/object-magic-wand-dark-mode_x16.svg'

interface SuiteProps {
  eventManager?: Events
  model: SuiteModel
}

const Suite = observer(({ eventManager = events, model }: SuiteProps) => {
  const _launchStudio = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    eventManager.emit('studio:init:suite', model.id)
  }

  const _header = () => (
    <>
      <span className='runnable-title'>{model.title}</span>
      <span className='runnable-controls'>
        <Tooltip placement='right' title='Add New Test' className='cy-tooltip'>
          <a onClick={_launchStudio} className='runnable-controls-studio'>
            <WandIcon />
          </a>
        </Tooltip>
      </span>
    </>
  )

  return (
    <Collapsible
      header={_header()}
      headerClass='runnable-wrapper'
      headerStyle={{ paddingLeft: indent(model.level) }}
      contentClass='runnables-region'
      isOpen={true}
    >
      <ul className='runnables'>
        {_.map(model.children, (runnable) => <Runnable key={runnable.id} model={runnable} />)}
      </ul>
    </Collapsible>
  )
})

export default Suite
