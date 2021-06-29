<template>  
  <button>Copy</button>
</template>

<script>
import { defineComponent, watch, watchEffect } from 'vue'
import { useMagicKeys } from './composables/core'
const { shift, space, a /* keys you want to monitor */ } = useMagicKeys()

watch(space, (v) => {
  if (v)
    console.log('space has been pressed')
})

watchEffect(() => {
  if (shift.value && a.value)
    console.log('Shift + A have been pressed')
})

export default defineComponent({
  setup() {

  }
})
</script>