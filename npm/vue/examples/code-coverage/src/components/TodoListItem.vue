<template>
  <li data-cy="todo">
    {{ todo.text }}
    <button data-cy="remove" @click="$emit('remove', todo.id)">X</button>
  </li>
</template>

<script>
export default {
  props: {
    todo: {
      type: Object,
      required: true,
    },
  },
}
</script>
