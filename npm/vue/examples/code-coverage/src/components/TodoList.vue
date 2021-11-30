<script>
import BaseInputText from './BaseInputText.vue'
import TodoListItem from './TodoListItem.vue'
let nextTodoId = 1

export default {
  components: {
    BaseInputText,
    TodoListItem,
  },
  data () {
    return {
      newTodoText: '',
      // empty list at first, each item like with "id" and "text"
      todos: [],
    }
  },
  methods: {
    addTodo () {
      const trimmedText = this.newTodoText.trim()

      if (trimmedText) {
        this.todos.push({
          id: nextTodoId++,
          text: trimmedText,
        })

        this.newTodoText = ''
      }
    },
    removeTodo (idToRemove) {
      this.todos = this.todos.filter((todo) => {
        return todo.id !== idToRemove
      })
    },
  },
}
</script>

<template>
  <div>
    <BaseInputText
      data-cy="input"
      v-model="newTodoText"
      placeholder="New todo"
      @keydown.enter="addTodo"
    />
    <ul v-if="todos.length">
      <TodoListItem v-for="todo in todos" :key="todo.id" :todo="todo" @remove="removeTodo"/>
    </ul>
    <p v-else>Nothing left in the list. Add a new todo in the input above.</p>
  </div>
</template>
