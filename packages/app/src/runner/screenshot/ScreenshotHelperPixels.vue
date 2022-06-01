<template>
  <div
    :class="{
      'screenshot-helper-pixels': true,
      'hidden': screenshotStore.isScreenshotting
    }"
  >
    <div /><div /><div /><div /><div /><div />
  </div>
</template>

<script lang="ts" setup>
import { getEventManager } from '..'
import { useScreenshotStore } from '../../store/screenshot-store'

const screenshotStore = useScreenshotStore()

getEventManager()
</script>

<style scoped lang="scss">
.screenshot-helper-pixels {
  div {
    height: 1px;
    width: 1px;
    position: fixed;
    z-index: 10;
  }

  div:nth-child(1) {
    background: #ccc;
    left: 0;
    top: 0;
  }

  div:nth-child(2) {
    background: white;
    left: 1px;
    top: 0;
  }

  div:nth-child(3) {
    background: white;
    left: 0;
    top: 1px;
  }

  div:nth-child(4) {
    background: white;
    right: 0;
    top: 0;
  }

  div:nth-child(5) {
    background: white;
    bottom: 0;
    left: 0;
  }

  div:nth-child(6) {
    background: black;
    bottom: 0;
    right: 0;
  }
}
</style>
