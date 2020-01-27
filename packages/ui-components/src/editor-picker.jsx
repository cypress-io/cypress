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

  const otherInput = (
    <input
      type='text'
      className='other-input'
      value={otherOption.openerId || ''}
      onFocus={_.partial(onChange, 'other')}
      onChange={updateOtherPath}
    />
  )

  return (
    <Select value={chosen.id} className='editor-picker' name='editor-picker' onChange={onChange}>
      {_.map(editorOptions, (editor) => (
        <SelectItem key={editor.id} value={editor.id}>
          {editor.name}
        </SelectItem>
      ))}
      <SelectItem value={otherOption.id}>
        {otherOption.name}: {otherInput}
        {chosen.isOther && <span className='description'>Enter the full path to your editor's executable</span>}
      </SelectItem>
    </Select>
  )
})

const editorType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  openerId: PropTypes.string.isRequired,
  isOther: PropTypes.bool.isRequired,
  description: PropTypes.string,
})

EditorPicker.propTypes = {
  chosenEditor: editorType,
  editors: MobxPropTypes.observableArrayOf(editorType).isRequired,
  onSelect: PropTypes.func.isRequired,
  onUpdateOtherPath: PropTypes.func.isRequired,
}

export default EditorPicker
