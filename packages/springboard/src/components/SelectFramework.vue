<template>
  <p>
    <select
     data-cy="select-framework"
     v-model="selectedFrameworkId"
    >
      <option 
        v-for="framework of frameworks"
        :key="framework.displayName"
        :value="framework.id"
      >
        {{ framework.displayName }}
      </option>
      <option value="none" disabled>Select framework</option>
    </select>
  </p>
  <p>
    To finish configuring your project
    we need to install some dependencies and create
    a few files.
  </p>
</template>

<script lang="ts">
import { computed, defineComponent, markRaw } from 'vue'
import { useStore } from '../store'
import { frameworks } from '../supportedFrameworks'

export default defineComponent({
  setup(props, ctx) {
    const store = useStore()

    const selectedFramework = computed(() => store.getState().component.framework)

    const selectedFrameworkId = computed({
      get() {
        return selectedFramework.value ? selectedFramework.value.id : 'none'
      },
      set(id: string) {
        store.setComponentFramework(frameworks.find(x => x.id === id)!)
      }
    })

    return {
      selectedFrameworkId,
      frameworks: markRaw(frameworks),
    }
  }
})
</script>