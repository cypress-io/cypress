<template>
  <div class="header-wrapper" @click="show = !show">
    <slot name="header"></slot>
  </div>
  <slot name="default" v-if="show"></slot>
</template>

<script lang="ts">
import { ref, defineProps, defineComponent } from 'vue'

export default defineComponent({
  props: {
    initialShow: {
    default: false,
    type: Boolean
  },
  },
  setup(props) {
    return {
      show: ref(props.initialShow)
    }
  }
})
</script>

<style scoped>
.header-wrapper {
  cursor: pointer;
}
</style>