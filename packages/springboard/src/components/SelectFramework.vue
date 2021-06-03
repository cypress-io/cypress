<template>
  <p>
    <select data-cy="select-framework">
      <option>
        React
      </option>
      <option>
        Vue
      </option>
    </select>
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
      state: store.getState()
    }
  }
})
</script>