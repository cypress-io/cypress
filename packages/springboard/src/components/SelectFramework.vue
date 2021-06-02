<template>
  <p>
    You chose: {{ testingType }}.
  </p>
  <p>
    To finish configuring your project
    we need to install some dependencies and create
    a few files.
  </p>
</template>

<script lang="ts">
import { useStore } from '../store'
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
    const store = useStore()

    return {
      testingType: store.getState().testingType
    }
  }
})
</script>