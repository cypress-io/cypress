<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-container">
      <slot name="default">
        <CloseButton @click="$emit('close')" class="top-right" />
        <div class="modal-header"><slot name="header" /></div>
        <div class="modal-body"><slot name="body" /></div>
        <div class="modal-footer"><slot name="footer" /></div>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CloseButton from "./CloseButton.vue";

export default defineComponent({
  emits: ["close"],
  components: { CloseButton },
});
</script>

<style lang="scss" scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: grid;
  place-content: center center;
}

.modal-container {
  width: 300px;
  margin: 0px auto 80% auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  position: relative;
}

.modal-body {
  margin: 20px 0;
}

.modal-default-button {
  display: block;
  margin-top: 1rem;
}

.top-right {
  position: absolute;
  top: 20px;
  right: 20px;
}
</style>