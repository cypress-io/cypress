<template>
  <div>
    {{ runnable }}
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
export default defineComponent({
  props: ['runnable']
})
</script>