import _ from 'lodash'
import cs from 'classnames'
import { action, autorun, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import AutosizeInput from 'react-input-autosize'

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
    const selectorText = `cy.${model.method.name}('${model.selector || model.method.example}')`

    return (
      <div className={`selector-helper method-${model.method.name}`}>
        <div className='selector-scroll-wrap'>
          <div className='selector'>
            <div
              ref={(node) => this._selectorWrap = node}
              className='wrap'
              onMouseOver={this._setHighlight(true)}
              onMouseOut={fixMouseOut(this._setHighlight(false), () => this._selectorWrap)}
            >
              <span>cy</span>
              <span>.</span>
              {this._methodSelector()}
              <span>(</span>
              <span>{'\''}</span>
              <AutosizeInput
                ref={(node) => this._input = node}
                className={cs('selector-input', {
                  'empty': !model[`${model.method.name}Selector`],
                })}
                name={`${model.isEnabled}` /* fixes issue with not resizing when opening/closing selector helper */}
                value={model.selector}
                onChange={this._updateSelector}
                placeholder={model.method.example}
              />
              <span>{'\''}</span>
              <span>)</span>
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
            {
              selectorHelperModel.selector ?
                <Tooltip title={selectorHelperModel.playgroundInfo}>
                  <div className={`command-has-num-elements ${(!selectorHelperModel.isValid || !selectorHelperModel.numElements) ? 'command-has-no-elements' : 'command-has-multiple-elements'}`}>
                    <span className='command-num-elements'>{selectorHelperModel.playgroundText}</span>
                  </div>
                </Tooltip> :
                null
            }
          </div>
        </div>
        <button className='close' onClick={this._toggleSelectorHelper}>x</button>
      </div>
    )
  }

  componentDidMount () {
    // focuses input when user changes method
    this._disposeAutorun = autorun(() => {
      this.props.model.method.name
      this._input.focus()
    })

    document.body.addEventListener('click', this._onOutsideClick, false)
  }

  componentWillUnmount () {
    this._disposeAutorun()
    document.body.removeEventListern('click', this._onOutsideClick)
  }

  _methodSelector () {
    const { model } = this.props

    return (
      <span className={cs('method', {
        'is-showing': this.showingMethodPicker,
      })}>
        <button onClick={this._toggleMethodPicker}>
          {model.method.name}
          <i className='fa fa-caret-down fa-fw'></i>
        </button>
        <div className='method-picker'>
          {_.map(model.methods, (method) => (
            <div
              key={method.name}
              className={cs({ 'is-chosen': model.method.name === method.name })}
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

  _toggleMethodPicker = (e) => {
    e.preventDefault()
    this._setShowingMethodPicker(!this.showingMethodPicker)
  }

  @action _setShowingMethodPicker (isShowing) {
    this.showingMethodPicker = isShowing
  }

  @action _setMethod (method) {
    if (method.name !== this.props.model.method.name) {
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

  _toggleSelectorHelper = () => {
    this.props.model.toggleEnabled()
  }

  _updateSelector = (e) => {
    const { model } = this.props
    model.setShowInfo(true)
    model.setSelector(e.target.value)
    model.setShowingHighlight(true)
  }
}

export default Footer
