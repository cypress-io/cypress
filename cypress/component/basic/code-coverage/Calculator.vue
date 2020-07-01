<template>
  <div>
    <input v-model="a" type="number" data-cy="a" /> +
    <input v-model="b" type="number" data-cy="b" />
    = {{ sum }}
  </div>
</template>

<script>
import { add } from "./calc";

export default {
  name: "Calculator",
  data() {
    return {
      a: 0,
      b: 0
    };
  },

  computed: {
    sum() {
      return add(parseFloat(this.a), parseFloat(this.b));
    }
  }
};
</script>
