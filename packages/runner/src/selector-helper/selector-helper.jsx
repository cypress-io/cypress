import _ from 'lodash'
import cs from 'classnames'
import { action, autorun, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import AutosizeInput from 'react-input-autosize'

import eventManager from '../lib/event-manager'

const defaultCopyText = 'Copy to clipboard'

// mouseleave fires when entering a child element, so make sure we're
// actually leaving the button and not just hovering over a child
const fixMouseOut = (fn, getTarget) => (e) => {
  if (
    !e.relatedTarget
    || e.relatedTarget.parentNode === getTarget()
    || e.relatedTarget === getTarget()
  ) return

  fn(e)
}

@observer
class Footer extends Component {
  @observable copyText = defaultCopyText
  @observable showingMethodPicker = false

  render () {
    const { model } = this.props
    const selectorText = `cy.${model.method}('${model.selector}')`

    return (
      <div className={cs('selector-helper', `method-${model.method}`, {
        'has-selector': !!model.selector,
        'no-elements': !model.numElements,
        'invalid-selector': !model.isValid,
      })}>
        <div className='selector'>
          <button className='highlight-toggle'>
            <i className='fa fa-mouse-pointer'></i>
          </button>
          <div
            ref={(node) => this._selectorWrap = node}
            className='wrap'
            onMouseOver={this._setHighlight(true)}
            onMouseOut={fixMouseOut(this._setHighlight(false), () => this._selectorWrap)}
          >
            {this._methodSelector()}
            <span>(</span>
            <span>{'\''}</span>
            <AutosizeInput
              ref={(node) => this._input = node}
              className={cs('selector-input', {
                'empty': !model[`${model.method}Selector`],
              })}
              name={`${model.isEnabled}` /* fixes issue with not resizing when opening/closing selector helper */}
              value={model.selector}
              onChange={this._updateSelector}
            /><span>{'\''}</span>
            <span>)</span>
          </div>
          <input ref='copyText' className='copy-backer' value={selectorText} readOnly />
          <Tooltip title={model.infoHelp}>
            <span className='info num-elements'>
              {
                model.isValid ?
                  `${model.numElements}` :
                  <i className='fa fa-exclamation-triangle'></i>
              }
            </span>
          </Tooltip>
          <Tooltip title={this.copyText} updateCue={`${selectorText}${this.copyText}`}>
            <button
              ref={(node) => this._copyButton = node}
              className='copy-to-clipboard'
              onClick={this._copyToClipboard}
              onMouseOut={fixMouseOut(this._resetCopyText, () => this._copyButton)}
            >
              <i className='fa fa-copy' />
            </button>
          </Tooltip>
          <Tooltip title='Print to console'>
            <button
              ref={(node) => this._copyButton = node}
              className='print-to-console'
              onClick={this._printToConsole}
              onMouseOut={fixMouseOut(this._resetCopyText, () => this._copyButton)}
            >
              <i className='fa fa-terminal' />
            </button>
          </Tooltip>
        </div>
        <button className='close' onClick={this._toggleSelectorHelper}>x</button>
      </div>
    )
  }

  componentDidMount () {
    // focus input when user changes method
    this._disposeAutorun = autorun(() => {
      this.props.model.method
      this._input.focus()
    })

    document.body.addEventListener('click', this._onOutsideClick, false)
  }

  componentWillUnmount () {
    this._disposeAutorun()
    document.body.removeEventListener('click', this._onOutsideClick)
  }

  _methodSelector () {
    const { model } = this.props

    return (
      <span className={cs('method', {
        'is-showing': this.showingMethodPicker,
      })}>
        <button onClick={this._toggleMethodPicker}>
          <i className='fa fa-caret-down'></i>{' '}
          cy.{model.method}
        </button>
        <div className='method-picker'>
          {_.map(model.methods, (method) => (
            model.method !== method ?
              <div
                key={method}
                className={cs({ 'is-chosen': model.method === method })}
                onClick={() => this._setMethod(method)}
              >cy.{method}</div> :
              null
          ))}
        </div>
      </span>
    )
  }

  _onOutsideClick = () => {
    this._setShowingMethodPicker(false)
  }

  _toggleMethodPicker = (e) => {
    e.preventDefault()
    this._setShowingMethodPicker(!this.showingMethodPicker)
  }

  @action _setShowingMethodPicker (isShowing) {
    this.showingMethodPicker = isShowing
  }

  @action _setMethod (method) {
    if (method !== this.props.model.method) {
      this.props.model.setMethod(method)
    }
  }

  _setHighlight = (isShowing) => () => {
    this.props.model.setShowingHighlight(isShowing)
  }

  _copyToClipboard = () => {
    try {
      this.refs.copyText.select()
      const successful = document.execCommand('copy')
      this._setCopyText(successful ? 'Copied!' : 'Oops, unable to copy')
    } catch (err) {
      this._setCopyText('Oops, unable to copy')
    }
  }

  @action _setCopyText (text) {
    this.copyText = text
  }

  _resetCopyText = () => {
    this._setCopyText(defaultCopyText)
  }

  _printToConsole = () => {
    eventManager.emit('print:selector:elements:to:console')
  }

  _toggleSelectorHelper = () => {
    this.props.model.toggleEnabled()
  }

  _updateSelector = (e) => {
    const { model } = this.props
    model.setSelector(e.target.value)
    model.setShowingHighlight(true)
  }
}

export default Footer
