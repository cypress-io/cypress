import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'

import { Editor } from './file-model'
import { Select, SelectItem } from '../select'

interface Props {
  chosen?: Editor
  editors: Editor[]
  onSelect: (editor?: Editor) => any
  onUpdateOtherPath: (path: string) => any
}

const EditorPicker = observer(({ chosen, editors, onSelect, onUpdateOtherPath }: Props) => {
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
      value={otherOption?.openerId || ''}
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

EditorPicker.defaultProps = {
  chosen: {},
}

export default EditorPicker
