import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import React from 'react'

const EditorPicker = observer(({ chosenEditor, editors, onSelect }) => {
  const defaultOption = { id: 'none', name: '--- Select an Editor ---' }
  const options = [defaultOption].concat(editors)
  const chosen = chosenEditor || defaultOption

  const onChange = (event) => {
    const id = event.target.value
    const editor = _.find(editors, { id })

    if (!editor) return

    onSelect(editor)
  }

  const updateOtherPath = (event) => {
    onSelect(_.extend({}, chosen, {
      path: event.target.value,
    }))
  }

  return (
    <div className='editor-picker'>
      <select value={chosen.id} onChange={onChange}>
        {_.map(options, ({ name, id }) => (
          <option key={id} value={id}>{name}</option>
        ))}
      </select>
      {chosen.isOther &&
        <form>
          <label>Enter the full path to the executable of the editor you would like to open files with.
            <input value={chosen.path} onChange={updateOtherPath} />
          </label>
        </form>
      }
    </div>
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
