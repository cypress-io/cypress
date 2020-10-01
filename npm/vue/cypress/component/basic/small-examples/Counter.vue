<template>
  <div>
    <h3>Count: {{ counter }}</h3>
    <div class="button-container">
      <button @click="increment">Add</button>
      <button @click="decrement">Subtract</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Counter',
  data() {
    return {
      counter: 0,
    };
  },
  methods: {
    increment() {
      this.counter++;
    },
    decrement() {
      this.counter--;
    },
  },
};
</script>
