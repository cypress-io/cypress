<template>
  <div class="loadingAnimation">
    <div />
    <div />
    <div />
    <div />
  </div>
  <div class="loadingTitle">Your tests are loading...</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  setup() {},
});
</script>


<style lang="scss" scoped>
.loadingTitle {
  font-size: 20px;
  text-align: center;
}
.loadingAnimation {
  display: flex;
  margin: 3.5rem auto 1.5rem;
  padding: 0 5px;
  width: 160px;

  div {
    animation: scaling 1.65s ease-in-out infinite;
    border-radius: 50%;
    height: 40px;
    margin: 0 -5px;
    transform: scale(0.5);
    width: 40px;
  }

  div:nth-child(1) {
    animation-delay:0.1s;
    background: #56b790;
  }

  div:nth-child(2) {
    animation-delay:0.2s;
    background: #4a88cc;
  }

  div:nth-child(3) {
    animation-delay:0.3s;
    background: #b96162;
  }

  div:nth-child(4) {
    animation-delay:0.4s;
    background: #e3b065;
  }

  div:nth-child(5) {
    animation-delay:0.5s;
    background: #a9abad;
  }
}


@keyframes scaling {
  0%, 20%, 80%, 100% {
    opacity: 100%;
    transform: scale(0.5);
  }

  50% {
    opacity: 50%;
    transform: scale(1);
  }
}
</style>