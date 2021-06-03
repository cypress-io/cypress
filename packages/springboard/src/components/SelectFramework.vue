<template>
  <p>
    <select
     data-cy="select-framework"
     v-model="selectedFramework"
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
import { useStore } from '../store'
import { computed, markRaw, onMounted } from 'vue'
import { frameworks } from '../supportedFrameworks'
import { defineWizardStep } from '../wizards/shared'

export default defineWizardStep({
  setup(props, ctx) {
    const store = useStore()

    onMounted(() => {
      // we should detect the user's framework if possible
      // detectUserFramework().then(result => {
      //   ... set default framework
      //   ... ctx.emit('setNextStepStatus', true) // allow to proceed 
      // })
      ctx.emit('setNextStepStatus', false)
    })

    const selectedFramework = computed({
      get() {
        return store.getState().component.framework
          ? store.getState().component.framework!.id
          : 'none'
      },
      set(id: string) {
        store.setComponentFramework(frameworks.find(x => x.id === id)!)
        ctx.emit('setNextStepStatus', true)
      }
    })

    return {
      selectedFramework,
      state: store.getState(),
      frameworks: markRaw(frameworks)
    }
  }
})
</script>