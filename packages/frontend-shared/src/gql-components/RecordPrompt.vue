<template>
  <p class="mb-24px">
    {{ t('specPage.banners.record.content') }}
  </p>
  <TerminalPrompt
    :command="recordCommand"
    class="bg-white max-w-900px"
  />
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import { computed } from 'vue'

const { t } = useI18n()

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
