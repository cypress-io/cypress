<template>
  <StandardModal
    model-value
    title="Connect project manually"
    @update:model-value="emit('cancel')"
  >
    <Alert
      status="warning"
      title="We couldn't add the projectId to your cypress.config.js file automatically."
      :icon="WarningIcon"
      icon-classes="icon-dark-orange-400"
    />
    <p class="mt-[24px] mb-[16px] text-[16px] leading-[24px]">
      Manually add the <code class="border rounded border-gray-200 m-[2px] py-[2px] px-[3px] text-purple-500 text-[16px]">projectId</code> to the root of the config object in your <span class="text-indigo-500">cypress.config.js</span> file.
    </p>
    <ShikiHighlight
      class="rounded border border-gray-200"
      lang="javascript"
      :code="helpCode"
      line-numbers
      copy-button
    />
    <template #footer>
      <div class="flex gap-[16px]">
        <Button
          size="lg"
          variant="pending"
        >
          <template #prefix>
            <i-cy-loading_x16
              class="animate-spin icon-dark-white icon-light-gray-400"
            />
          </template>
          Waiting for you to add the projectId...
        </Button>
        <Button
          variant="outline"
          size="lg"
          @click="emit('cancel')"
        >
          Cancel
        </Button>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
import Alert from '@cy/components/Alert.vue'
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'
import WarningIcon from '~icons/cy/warning_x16.svg'
import type { NeedManualUpdateModalFragment } from '../../generated/graphql'

const emit = defineEmits<{
  (event: 'cancel'): void
}>()

gql`
fragment NeedManualUpdateModal on CurrentProject {
  id
  projectId
}`

const props = defineProps<{
  gql: NeedManualUpdateModalFragment
  newProjectId: string
}>()

const projectIdCode = computed(() => `projectId: '${props.newProjectId}'`)

const helpCode = computed(() => {
  return `
export ${'default'} {
  ${projectIdCode.value}, // <- add this line
}`
})

</script>
