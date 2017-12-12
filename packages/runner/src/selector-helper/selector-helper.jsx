import _ from 'lodash'
import cs from 'classnames'
import { action, autorun, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import AutosizeInput from 'react-input-autosize'

import selectorHelperModel from './selector-helper-model'

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
    const selectorText = `cy.${selectorHelperModel.method.name}('${selectorHelperModel.selector || selectorHelperModel.method.example}')`

    return (
      <div className={`selector-helper method-${selectorHelperModel.method.name}`}>
        <p>Click on an element to view its selector or type in a selector to view the elements it matches</p>
        <div className='selector-scroll-wrap'>
          <div className='selector'>
            <div
              ref={(node) => this._selectorWrap = node}
              className='wrap'
              onMouseOver={this._setHighlight(true)}
              onMouseOut={fixMouseOut(this._setHighlight(false), () => this._selectorWrap)}
            >
              <span className='syntax-object'>cy</span>
              <span className='syntax-operator'>.</span>
              {this._methodSelector()}
              <span className='syntax-operator'>(</span>
              <span className='syntax-string'>{'\''}</span>
              <AutosizeInput
                ref={(node) => this._input = node}
                className={cs('selector-input', {
                  'empty': !selectorHelperModel[`${selectorHelperModel.method.name}Selector`],
                })}
                name={`${selectorHelperModel.isEnabled}` /* fixes issue with not resizing when opening/closing selector helper */}
                value={selectorHelperModel.selector}
                onChange={this._updateSelector}
                placeholder={selectorHelperModel.method.example}
              />
              <span className='syntax-string'>{'\''}</span>
              <span className='syntax-operator'>)</span>
            </div>
            <input ref='copyText' className='copy-backer' value={selectorText} readOnly />
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
          </div>
          <div className={cs('info', {
            'is-invalid': !selectorHelperModel.isValid || !selectorHelperModel.numElements,
          })}>
            <div className='spacer'>cy.{selectorHelperModel.method.name}({'\''}</div>
            {selectorHelperModel.playgroundInfo}
          </div>
        </div>
        <button className='close' onClick={this._toggleSelectorHelper}>
          <i className='fa fa-remove' />
        </button>
      </div>
    )
  }

  componentDidMount () {
    // focuses input when user changes method
    this._disposeAutorun = autorun(() => {
      selectorHelperModel.method.name
      this._input.focus()
    })

    document.body.addEventListener('click', this._onOutsideClick, false)
  }

  componentWillUnmount () {
    this._disposeAutorun()
    document.body.removeEventListern('click', this._onOutsideClick)
  }

  _methodSelector () {
    return (
      <span className={cs('method', {
        'is-showing': this.showingMethodPicker,
      })}>
        <span className='syntax-method' onClick={this._toggleMethodPicker}>{selectorHelperModel.method.name}</span>
        <div className='method-picker'>
          {_.map(selectorHelperModel.methods, (method) => (
            <div
              key={method.name}
              className={cs({ 'is-chosen': selectorHelperModel.method.name === method.name })}
              onClick={() => this._setMethod(method)}
            >{method.name}</div>
          ))}
        </div>
      </span>
    )
  }

  _onOutsideClick = () => {
    this._setShowingMethodPicker(false)
  }

  _toggleMethodPicker = () => {
    this._setShowingMethodPicker(!this.showingMethodPicker)
  }

  @action _setShowingMethodPicker (isShowing) {
    this.showingMethodPicker = isShowing
  }

  @action _setMethod (method) {
    if (method.name !== selectorHelperModel.method.name) {
      selectorHelperModel.setMethod(method)
    }
  }

  _setHighlight = (isShowing) => () => {
    selectorHelperModel.setShowingHighlight(isShowing)
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

  _toggleSelectorHelper = () => {
    selectorHelperModel.toggleEnabled()
  }

  _updateSelector = (e) => {
    selectorHelperModel.setShowInfo(true)
    selectorHelperModel.setSelector(e.target.value)
    selectorHelperModel.setShowingHighlight(true)
  }
}

export default Footer
