import React from 'react'

// todo is a reactive prop,
// mutating it triggers re-render in parent component: Todos
const Todo = ({ todo, onRemove }) => {
  const className = todo.completed ? 'todo completed' : 'todo'

  const toggleTodo = () => {
    todo.completed = !todo.completed // 🤩
  }

  return (
    <div className={className}>
      <div className="todo_title" onClick={toggleTodo}>
        {todo.title}
      </div>
      <div className="todo_remove" onClick={onRemove}>
        x
      </div>
    </div>
  )
}

export default Todo
