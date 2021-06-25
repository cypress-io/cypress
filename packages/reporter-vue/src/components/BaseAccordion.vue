<template>
  <div class="header-wrapper" @click="show = !show">
    <slot name="header"></slot>
  </div>
  <slot name="default" v-if="show"></slot>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue'

export default defineComponent({
  props: {
    initiallyOpen: {
    default: false,
    type: Boolean
  },
  },
  setup(props) {
    return {
      show: ref(props.initiallyOpen)
    }
  }
})
</script>

<style scoped>
.header-wrapper {
  cursor: pointer
}
</style>