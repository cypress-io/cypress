import './test-entry.scss'

import React from 'react'
import { render } from 'react-dom'

import { Dropdown, EditorPicker } from '../../src/index'

window.renderDropdown = (props) => {
  render(<Dropdown {...props} />, document.getElementById('app'))
}

window.renderEditorPicker = (props) => {
  render(<EditorPicker {...props} />, document.getElementById('app'))
}
