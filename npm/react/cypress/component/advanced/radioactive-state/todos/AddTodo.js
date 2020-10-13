import React from 'react'
import useRS from 'radioactive-state'

const AddTodo = ({ onAdd }) => {
  const state = useRS({
    input: '',
  })

  // handle events
  const handleEnter = e => e.key === 'Enter' && handleAdd()

  const handleAdd = () => {
    if (!state.input) return // ignore empty input
    const todo = { title: state.input, completed: false } // make todo
    onAdd(todo) // add it
    state.input = '' // clear input
  }

  return (
    <div className="add-todo">
      <input {...state.$input} onKeyDown={handleEnter} />
      <button onClick={handleAdd}> Add </button>
    </div>
  )
}

export default AddTodo
