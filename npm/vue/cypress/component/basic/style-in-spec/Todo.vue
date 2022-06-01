<template>
  <div
    class="todo"
    :class="{ done: isDone }"
  >
    <input
      id="checkbox"
      v-model="isDone"
      type="checkbox"
    >
    <label for="checkbox">{{ title }}</label>
  </div>
</template>

<script>
export default {
  name: 'Todo',
  props: {
    title: {
      type: String,
      required: true,
      default: '',
    },
    done: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  data () {
    return {
      isDone: this.done,
    }
  },
}
</script>
