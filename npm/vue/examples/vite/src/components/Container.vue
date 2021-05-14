<script>
import { defineComponent } from "vue";

export default defineComponent({});
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <span class="close"></span>
      <span class="minimize"></span>
      <span class="fullscreen"></span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
div.wrapper {
  background: #333;
  color: #fff;
  border: 1px solid #333;
  overflow: hidden;
  border-radius: 10px;
  border-left: 0;
}

.close,
.minimize,
.fullscreen {
  display: inline-block;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin: 5px;
}
.close {
  background: #ed695f;
}
.minimize {
  background: #f6bd4f;
}
.fullscreen {
  background: #61c454;
}
</style>
