import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const TodoContainer = styled.div`
  box-shadow: 0 0 5px gray;
  padding: 30px;
  margin-bottom: 10px;
`

const Todo = ({ todo, handleChecked }) => (
  <TodoContainer key={todo.id} data-cy="todo">
    <input
      type="checkbox"
      onChange={() => handleChecked(todo)}
      checked={todo.done}
    />
    {todo.title}
  </TodoContainer>
)

Todo.propTypes = {
  todo: PropTypes.shape({
    title: PropTypes.string,
    done: PropTypes.bool,
    id: PropTypes.number,
  }),
  handleChecked: PropTypes.func,
}

export default Todo
