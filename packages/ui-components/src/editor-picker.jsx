import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import React from 'react'

import { Select, SelectItem } from './select'

const EditorPicker = observer(({ chosen = {}, editors, onSelect, onUpdateOtherPath }) => {
  const editorOptions = _.reject(editors, { isOther: true })
  const otherOption = _.find(editors, { isOther: true })

  const onChange = (id) => {
    const editor = _.find(editors, { id })

    onSelect(editor)
  }

  const updateOtherPath = (event) => {
    onUpdateOtherPath(_.trim(event.target.value || ''))
  }

  // TODO: handle no editors besides 'Other' as a special case

  return (
    <Select value={chosen.id} name='editor-picker' onChange={onChange}>
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
            {otherOption.name}:
            <input type='text'
              value={otherOption.openerId || ''}
              onFocus={_.partial(onChange, 'other')}
              onChange={updateOtherPath}
            />
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
  openerId: PropTypes.string.isRequired,
  isOther: PropTypes.bool.isRequired,
})

EditorPicker.propTypes = {
  chosenEditor: editorType,
  editors: MobxPropTypes.observableArrayOf(editorType).isRequired,
  onSelect: PropTypes.func.isRequired,
  onUpdateOtherPath: PropTypes.func.isRequired,
}

export default EditorPicker
