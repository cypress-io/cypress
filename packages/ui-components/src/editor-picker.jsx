import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import React from 'react'

import { Select, SelectItem } from './select'

const EditorPicker = observer(({ chosen = {}, editors, onSelect }) => {
  const editorOptions = _.reject(editors, { isOther: true })
  const otherOption = _.find(editors, { isOther: true })

  const onChange = (e, id) => {
    const editor = _.find(editors, { id })

    onSelect(editor)
  }

  const updateOtherPath = (event) => {
    onSelect(_.extend({}, chosen, {
      path: event.target.value,
    }))
  }

  return (
    <Select value={chosen.id} onChange={onChange}>
      <ul>
        {_.map(editorOptions, (editor) => (
          <li key={editor.id}>
            <label>
              <SelectItem value={editor.id} /> {editor.name}
            </label>
          </li>
        ))}
        <li>
          <label>
            <SelectItem value={otherOption.id} />
            {otherOption.name}: <input type='text' value={otherOption.path || ''} onChange={updateOtherPath} />
          </label>
          {chosen.isOther && <label>Enter the full path to the executable of the editor</label>}
        </li>
      </ul>
    </Select>
  )
})

const editorType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
})

EditorPicker.propTypes = {
  chosenEditor: PropTypes.object,
  editors: PropTypes.arrayOf(editorType).isRequired,
  onSelect: PropTypes.func.isRequired,
}

export default EditorPicker
