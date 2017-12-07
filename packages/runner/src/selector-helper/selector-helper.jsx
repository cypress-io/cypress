import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

import selectorHelperModel from './selector-helper-model'

const defaultCopyText = 'Copy to clipboard'

@observer
class Footer extends Component {
  @observable copyText = defaultCopyText

  render () {
    return (
      <div className='selector-helper'>
        <p>Click on an element to view its selector</p>
        {this._selector()}
        <button className='close' onClick={this._toggleSelectorHelper}>
          <i className='fa fa-remove' />
        </button>
      </div>
    )
  }

  _selector () {
    if (!selectorHelperModel.cssSelector) return null

    const selectorText = `cy.get('${selectorHelperModel.cssSelector}')`

    return (
      <div className='selector'>
        <input ref='copyText' value={selectorText} readOnly />
        <code
          onMouseOver={selectorHelperModel.setShowingHighlight.bind(selectorHelperModel, true)}
          onMouseOut={selectorHelperModel.setShowingHighlight.bind(selectorHelperModel, false)}
        >
          {selectorText}
        </code>

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
      e.relatedTarget.parentNode === this._copyButton
      || e.relatedTarget === this._copyButton
    ) return

    this._setCopyText(defaultCopyText)
  }

  _toggleSelectorHelper = () => {
    selectorHelperModel.toggleEnabled()
  }
}

export default Footer
