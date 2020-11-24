import { observer } from 'mobx-react'
import React, { Component } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import events, { Events } from '../lib/events'
import appState, { AppState } from '../lib/app-state'
import Collapsible from '../collapsible/collapsible'
import { indent } from '../lib/util'
import runnablesStore, { RunnablesStore } from '../runnables/runnables-store'
import TestModel from '../test/test-model'

import scroller, { Scroller } from '../lib/scroller'
import Attempts from '../attempts/attempts'
import StudioCommand from './studio-command'

interface Props {
  events: Events
  appState: AppState
  runnablesStore: RunnablesStore
  scroller: Scroller
  model: TestModel
}

@observer
class Studio extends Component<Props> {
  static defaultProps = {
    events,
    appState,
    runnablesStore,
    scroller,
  }

  render () {
    const { model } = this.props

    return (
      <div className='wrap'>
        <div className='runnables'>
          <div className={`${model.type} runnable runnable-${model.state}`}>
            <Collapsible
              header={this._header()}
              headerClass='runnable-wrapper'
              headerStyle={{ paddingLeft: indent(model.level) }}
              contentClass='runnable-instruments'
              isOpen={true}
            >
              <Attempts test={model} scrollIntoView={() => {}} />
              <ul className='commands-container'>
                {model.studioCommands.map((command, index) => <StudioCommand key={command.id} index={index} model={command} />)}
              </ul>
            </Collapsible>
          </div>
        </div>
      </div>
    )
  }

  _header () {
    const { model } = this.props

    return (<>
      <i aria-hidden='true' className='runnable-state fas' />
      <span className='runnable-title'>
        <span>{model.title}</span>
        <span className='visually-hidden'>{model.state}</span>
      </span>
      <span className='runnable-controls'>
        <Tooltip placement='top' title='One or more commands failed' className='cy-tooltip'>
          <i className='fas fa-exclamation-triangle' />
        </Tooltip>
      </span>
    </>)
  }
}

export default Studio
