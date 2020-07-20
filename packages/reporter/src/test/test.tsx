import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, createRef, RefObject } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import appState, { AppState } from '../lib/app-state'
import Collapsible from '../collapsible/collapsible'
import { indent } from '../lib/util'
import runnablesStore, { RunnablesStore } from '../runnables/runnables-store'
import scroller, { Scroller } from '../lib/scroller'

import Hooks from '../hooks/hooks'
import Agents from '../agents/agents'
import Routes from '../routes/routes'
import TestError from '../errors/test-error'

import TestModel from './test-model'

const NoCommands = observer(() => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
))

interface Props {
  appState: AppState
  runnablesStore: RunnablesStore
  scroller: Scroller
  model: TestModel
}

@observer
class Test extends Component<Props> {
  static defaultProps = {
    appState,
    runnablesStore,
    scroller,
  }

  @observable isOpen: boolean | null = null

  containerRef: RefObject<HTMLDivElement>

  constructor (props: Props) {
    super(props)

    this.containerRef = createRef<HTMLDivElement>()
  }

  componentDidMount () {
    this._scrollIntoView()
  }

  componentDidUpdate () {
    this._scrollIntoView()

    const cb = this.props.model.callbackAfterUpdate

    if (cb) {
      cb()
    }
  }

  _scrollIntoView () {
    const { appState, model, scroller } = this.props
    const { isActive, shouldRender } = model

    if (appState.autoScrollingEnabled && appState.isRunning && shouldRender && isActive != null) {
      window.requestAnimationFrame(() => {
        // since this executes async in a RAF the ref might be null
        if (this.containerRef.current) {
          scroller.scrollIntoView(this.containerRef.current as HTMLElement)
        }
      })
    }
  }

  render () {
    const { model } = this.props

    if (!model.shouldRender) return null

    return (
      <Collapsible
        containerRef={this.containerRef}
        header={this._header()}
        headerClass='runnable-wrapper'
        headerStyle={{ paddingLeft: indent(model.level) }}
        contentClass='runnable-instruments'
        isOpen={this._shouldBeOpen()}
      >
        {this._contents()}
      </Collapsible>
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

  _contents () {
    const { model } = this.props

    return (
      <div style={{ paddingLeft: indent(model.level) }}>
        <Agents model={model} />
        <Routes model={model} />
        <div className='runnable-commands-region'>
          {model.commands.length ? <Hooks model={model} /> : <NoCommands />}
        </div>
        <TestError model={model} />
      </div>
    )
  }

  _shouldBeOpen () {
    // if this.isOpen is non-null, prefer that since the user has
    // explicity chosen to open or close the test
    if (this.isOpen !== null) return this.isOpen

    // otherwise, look at reasons to auto-open the test
    return this.props.model.state === 'failed'
           || this.props.model.isOpen
           || this.props.model.isLongRunning
           || this.props.runnablesStore.hasSingleTest
  }

  @action _toggleOpen = () => {
    if (this.isOpen === null) {
      this.isOpen = !this._shouldBeOpen()
    } else {
      this.isOpen = !this.isOpen
    }
  }
}

export { NoCommands }

export default Test
