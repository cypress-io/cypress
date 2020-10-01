<template>
  <div>Hello, {{ greeting }}!</div>
</template>

<script>
import { greeting } from "./greeting";

export default {
  name: "Hello",
  data() {
    return {
      greeting: greeting()
    };
  }
};
</script>
