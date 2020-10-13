import React from 'react'
import useRS from 'radioactive-state'
import Todo from './Todo'
import AddTodo from './AddTodo'

const Todos = () => {
  const state = useRS({
    todos: [],
  })

  const removeTodo = i => state.todos.splice(i, 1)
  const addTodo = todo => state.todos.push(todo)

  return (
    <div className="container">
      <AddTodo onAdd={addTodo} />

      {!state.todos.length && <div className="no-todos"> No Todos added </div>}

      <div className="todos">
        {state.todos.map((todo, i) => (
          <Todo todo={todo} key={i} onRemove={() => removeTodo(i)} />
        ))}
      </div>
    </div>
  )
}

export default Todos
