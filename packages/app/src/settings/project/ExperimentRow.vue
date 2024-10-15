<template>
  <div
    role="row"
    class="grid grid-flow-row"
  >
    <div class="inline-flex items-baseline">
      <h3
        class="inline text-indigo-500 text-md"
        role="rowheader"
        data-cy="experimentName"
      >
        {{ experiment.name }}
      </h3>
      <span
        class="rounded font-mono bg-gray-50 text-sm ml-[8px] py-[2px] px-[4px] text-purple-500"
      >{{ experiment.key }}</span>
    </div>
    <span
      role="definition"
      class="text-gray-600"
    >

      <span
        ref="descriptionRef"
        class="description children:text-sm children:leading-[24px]"
        data-cy="experimentDescription"
        v-html="markdown"
      />
    </span>
    <div
      class="ml-[20px] col-end-auto col-start-2 row-start-1 row-end-3 inline-grid items-center justify-self-end"
    >
      <StatusIndicator :type="experiment.enabled ? 'success' : 'disabled'">
        {{ experiment.enabled ? t('status.enabled') : t('status.disabled') }}
      </StatusIndicator>
    </div>
  </div>
</template>

<script lang="ts" setup>
import StatusIndicator from '@cy/components/StatusIndicator.vue'
import { useI18n } from '@cy/i18n'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'
import { ref } from 'vue'

export interface Experiment {
  key: string
  name: string
  description: string
  enabled: boolean
}

const props = defineProps<{
  experiment: Experiment
}>()

const descriptionRef = ref()
const { markdown } = useMarkdown(descriptionRef, props.experiment.description, {
  classes: {
    overwrite: true,
    code: ['text-purple-500 text-[12px] bg-gray-50 font-normal px-[4px] rounded'],
    pre: ['text-indigo-500'],
  },
})
const { t } = useI18n()
</script>

<style scoped>
.description :deep(a code) {
  @apply text-indigo-500;
}

.description :deep(a) {
  @apply outline-none text-indigo-500 hocus:underline hocus:decoration-indigo-500;
}
</style>
