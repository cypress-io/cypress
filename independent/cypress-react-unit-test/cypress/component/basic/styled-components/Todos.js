import React, { Component } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import Todo from './Todo'

const TodosContainer = styled.div`
  padding: 30px;
`

class Todos extends Component {
  static propTypes = {
    todos: PropTypes.array.isRequired,
  }

  state = {
    todos: this.props.todos,
  }

  handleChecked = todo => {
    const newTodos = this.state.todos.map(t => {
      if (t.id === todo.id) {
        return { ...t, done: !t.done }
      }
      return t
    })

    this.setState({
      todos: newTodos,
    })
  }

  render() {
    return (
      <TodosContainer>
        <h2>Todos</h2>
        {this.state.todos.map(todo => (
          <Todo todo={todo} key={todo.id} handleChecked={this.handleChecked} />
        ))}
      </TodosContainer>
    )
  }
}

export default Todos
