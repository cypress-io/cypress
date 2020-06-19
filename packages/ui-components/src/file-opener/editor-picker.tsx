import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { ChangeEvent } from 'react'

import { Editor } from './file-model'
import { Select, SelectItem } from '../select'

interface Props {
  chosen?: Partial<Editor>
  editors: Editor[]
  onSelect: (editor: Editor) => any
  onUpdateOtherPath: (path: string) => any
}

const EditorPicker = observer(({ chosen = {}, editors, onSelect, onUpdateOtherPath }: Props) => {
  const editorOptions = _.reject(editors, { isOther: true })
  const otherOption = _.find(editors, { isOther: true })

  const onChange = (id: string) => {
    const editor = _.find(editors, { id })

    editor && onSelect(editor)
  }

  const updateOtherPath = (event: ChangeEvent<HTMLInputElement>) => {
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
    <Select value={chosen.id || ''} className='editor-picker' name='editor-picker' onChange={onChange}>
      {_.map(editorOptions, (editor) => (
        <SelectItem key={editor.id} value={editor.id}>
          {editor.name}
        </SelectItem>
      ))}
      {otherOption && (
        <SelectItem value={otherOption.id}>
          {otherOption.name}: {otherInput}
          {chosen.isOther && <span className='description'>Enter the full path to your editor's executable</span>}
        </SelectItem>
      )}
    </Select>
  )
})

export default EditorPicker
