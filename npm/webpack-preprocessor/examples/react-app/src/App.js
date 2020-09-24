import React, { useState } from 'react'
import './App.css'

export function Todo ({ todo, index, toggleTodo, removeTodo }) {
  const toggleText = todo.isCompleted ? 'Redo' : 'Complete'

  return (
    <div
      className="todo"
      style={{ textDecoration: todo.isCompleted ? 'line-through' : '' }}
    >
      {todo.text}

      <div>
        <button onClick={() => toggleTodo(index)}>{toggleText}</button>
        <button data-cy="remove" onClick={() => removeTodo(index)}>x</button>
      </div>
    </div>
  )
}

function TodoForm ({ addTodo }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value) return

    addTodo(value)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        className="input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </form>
  )
}

export const toggleOneTodo = (todos, index) => {
  const newTodos = [...todos]
  const todoToFlip = newTodos[index]

  if (todoToFlip) {
    todoToFlip.isCompleted = !todoToFlip.isCompleted
  }

  return newTodos
}

function App () {
  const [todos, setTodos] = useState([
    {
      text: 'Learn about React',
      isCompleted: false,
    },
    {
      text: 'Meet friend for lunch',
      isCompleted: false,
    },
    {
      text: 'Build really cool todo app',
      isCompleted: false,
    },
  ])

  if (window.Cypress) {
    window.todos = todos
  }

  const addTodo = (text) => {
    const newTodos = [...todos, { text }]

    setTodos(newTodos)
  }

  const toggleTodo = (index) => {
    const newTodos = toggleOneTodo(todos, index)

    setTodos(newTodos)
  }

  const removeTodo = (index) => {
    const newTodos = [...todos]

    newTodos.splice(index, 1)
    setTodos(newTodos)
  }

  return (
    <div className="app">
      <div className="todo-list">
        {todos.map((todo, index) => {
          return (
            <Todo
              key={index}
              index={index}
              todo={todo}
              toggleTodo={toggleTodo}
              removeTodo={removeTodo}
            />
          )
        })}
        <TodoForm addTodo={addTodo} />
      </div>
    </div>
  )
}

export default App
