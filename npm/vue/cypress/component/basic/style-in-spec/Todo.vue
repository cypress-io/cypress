<template>
  <div class="todo" v-bind:class="{ done: isDone }">
    <input type="checkbox" v-model="isDone" id="checkbox">
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
        default: ''
      },
      done: {
        type: Boolean,
        required: true,
        default: false
      }
    },
    data () {
      return {
        isDone: this.done
      }
    }
  }
</script>
