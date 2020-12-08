import { observer } from 'mobx-react'
import React, { Component, createRef, RefObject, MouseEvent } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'
import { Dialog } from '@reach/dialog'
import VisuallyHidden from '@reach/visually-hidden'

import events, { Events } from '../lib/events'
import appState, { AppState } from '../lib/app-state'
import Collapsible from '../collapsible/collapsible'
import { indent } from '../lib/util'
import runnablesStore, { RunnablesStore } from '../runnables/runnables-store'
import TestModel from './test-model'

import { ReactComponent as EllipsesIcon } from '../../static/icons/ellipses.svg'
import { ReactComponent as KeyboardIcon } from '../../static/icons/keyboard.svg'
import { ReactComponent as PointerIcon } from '../../static/icons/pointer.svg'

import scroller, { Scroller } from '../lib/scroller'
import Attempts from '../attempts/attempts'

interface Props {
  events: Events
  appState: AppState
  runnablesStore: RunnablesStore
  scroller: Scroller
  model: TestModel
}

interface State {
  extendingModalOpen: boolean
}

@observer
class Test extends Component<Props, State> {
  static defaultProps = {
    events,
    appState,
    runnablesStore,
    scroller,
  }

  containerRef: RefObject<HTMLDivElement>

  constructor (props: Props) {
    super(props)

    this.state = { extendingModalOpen: false }

    this.containerRef = createRef<HTMLDivElement>()
  }

  componentDidMount () {
    this._scrollIntoView()
  }

  componentDidUpdate () {
    this._scrollIntoView()
    this.props.model.callbackAfterUpdate()
  }

  _scrollIntoView () {
    const { appState, model, scroller } = this.props
    const { state, shouldRender } = model

    if (appState.autoScrollingEnabled && appState.isRunning && shouldRender && state !== 'processing') {
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

    return (<>
      <Collapsible
        containerRef={this.containerRef}
        header={this._header()}
        headerClass='runnable-wrapper'
        headerExtras={this._addToTest()}
        headerStyle={{ paddingLeft: indent(model.level) }}
        contentClass='runnable-instruments'
        isOpen={model.isOpen}
      >
        {this._contents()}
      </Collapsible>
      {this._extendingModal()}
    </>)
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
          <i className='fas fa-exclamation-triangle runnable-controls-status' />
        </Tooltip>
      </span>
    </>)
  }

  _addToTest () {
    return (
      <a onClick={this._openExtendingModal} className='collapsible-header-extras-button'>
        <i className='fas fa-plus' /> <span>Extend Test</span>
      </a>
    )
  }

  _openExtendingModal = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    this.setState({ extendingModalOpen: true })
  }

  _startExtendingTest = () => {
    const { model } = this.props

    events.emit('start:extending:test', model.id)
  }

  _closeExtendingModal = () => {
    this.setState({ extendingModalOpen: false })
  }

  _extendingModal = () => {
    const { extendingModalOpen } = this.state

    return (
      <Dialog
        className='extending-test-modal'
        aria-label='Start extending a test'
        isOpen={extendingModalOpen}
        onDismiss={this._closeExtendingModal}
      >
        <div className='body'>
          <h1 className='title'>
            <i className='fas fa-magic icon' /> Cypress Studio <span className='beta'>BETA</span>
          </h1>
          <div className='diagram'>
            <EllipsesIcon />
            <PointerIcon />
            <EllipsesIcon />
            <KeyboardIcon />
            <EllipsesIcon />
            <PointerIcon />
            <EllipsesIcon />
          </div>
          <div className='center'>
            <div className='text'>
              Interact with your site (click, type, etc.) to generate commands.
            </div>
            <button className='get-started' onClick={this._startExtendingTest}>
              Get Started
            </button>
          </div>
        </div>
        <button className='close-button' onClick={this._closeExtendingModal}>
          <VisuallyHidden>Close</VisuallyHidden>
          <span aria-hidden>
            <i className='fas fa-times' />
          </span>
        </button>
      </Dialog>
    )
  }

  _contents () {
    const { model } = this.props

    return (
      <div style={{ paddingLeft: indent(model.level) }}>
        <Attempts test={model} scrollIntoView={() => this._scrollIntoView()} />
      </div>
    )
  }
}

export default Test
