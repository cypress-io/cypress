import cs from 'classnames'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import AutosizeInput from 'react-input-autosize'

import selectorHelperModel from './selector-helper-model'

const defaultCopyText = 'Copy to clipboard'

@observer
class Footer extends Component {
  @observable copyText = defaultCopyText

  render () {
    const selectorText = `cy.get('${selectorHelperModel.selector}')`

    return (
      <div className='selector-helper'>
        <p>Click on an element to view its selector or type in a selector to view the elements it matches</p>
        <div className='selector'>
          <div
            className='wrap'
            onMouseOver={selectorHelperModel.setShowingHighlight.bind(selectorHelperModel, true)}
            onMouseOut={selectorHelperModel.setShowingHighlight.bind(selectorHelperModel, false)}
          >
            <span className='syntax-object'>cy</span>
            <span className='syntax-operator'>.</span>
            <span className='syntax-method'>get</span>
            <span className='syntax-operator'>(</span>
            <span className='syntax-string'>{'\''}</span>
            <AutosizeInput
              className='selector-input'
              value={selectorHelperModel.selector}
              onChange={this._updateSelector}
              placeholder='.foo'
            />
            <span className='syntax-string'>{'\''}</span>
            <span className='syntax-operator'>)</span>
          </div>
          <input ref='copyText' className='copy-backer' value={selectorText} readOnly />
          <Tooltip placement='top' title={this.copyText} updateCue={`${selectorText}${this.copyText}`}>
            <button
              ref={(node) => this._copyButton = node}
              className='copy-to-clipboard'
              onClick={this._copyToClipboard}
              onMouseOut={this._resetCopyText}
            >
              <i className='fa fa-copy' />
            </button>
          </Tooltip>
        </div>
        <div className={cs('info', {
          'is-invalid': !selectorHelperModel.isValid || !selectorHelperModel.numElements,
        })}>
          <div className='spacer'>cy.get({'\''}</div>
          {selectorHelperModel.playgroundInfo}
        </div>
        <button className='close' onClick={this._toggleSelectorHelper}>
          <i className='fa fa-remove' />
        </button>
      </div>
    )
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

  _resetCopyText = (e) => {
    // mouseleave fires when entering a child element, so make sure we're
    // actually leaving the button and not just hovering over a child
    if (
      !e.relatedTarget
      || e.relatedTarget.parentNode === this._copyButton
      || e.relatedTarget === this._copyButton
    ) return

    this._setCopyText(defaultCopyText)
  }

  _toggleSelectorHelper = () => {
    selectorHelperModel.toggleEnabled()
  }

  _updateSelector = (e) => {
    selectorHelperModel.setSelector(e.target.value)
    selectorHelperModel.setShowingHighlight(true)
  }
}

export default Footer
