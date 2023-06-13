<template>
  <TerminalPrompt
    :command="recordCommand"
    class="bg-white max-w-[900px]"
  />
</template>

<script setup lang="ts">
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import { computed } from 'vue'

const props = defineProps<{
  recordKey?: string | null
  currentTestingType?: string | null
}>()

const firstRecordKey = computed(() => {
  return props.recordKey ?? '<record-key>'
})

const recordCommand = computed(() => {
  const componentFlagOrSpace = props.currentTestingType === 'component' ? ' --component ' : ' '

  return `npx cypress run${componentFlagOrSpace}--record --key ${firstRecordKey.value}`
})

</script>
