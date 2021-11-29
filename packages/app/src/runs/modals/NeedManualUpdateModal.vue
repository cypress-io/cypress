<template>
  <StandardModal
    :model-value="show"
    title="Manual action required"
    @update:model-value="emit('close')"
  >
    <div class="w-640px mr-24px">
      <p class="mb-8px">
        Cypress was unable to configure your project automatically.
      </p>
      <h4>Add the projectId manually and try again</h4>
      <ol class="flex flex-col w-full text-gray-600 list-decimal ml-16px gap-16px p-24px">
        <li>
          Copy the projectId:
          <ShikiHighlight
            :code="projectIdCode"
            lang="yaml"
            class="border border-gray-300 rounded -ml-16px mt-16px"
            copy-button
          />
        </li>
        <li>
          Open your
          <ExternalLink href="#">
            config file
          </ExternalLink>
        </li>
        <li>
          Add the projectId to the root of the config object:
          <ShikiHighlight
            :code="helpCode"
            lang="ts"
            class="border border-gray-300 rounded -ml-16px mt-16px"
            line-numbers
          />
        </li>
        <li>
          Save and click the "Try again" button below.
        </li>
      </ol>
    </div>
    <template #footer>
      <Button
        size="lg"
        @click="checkConfigForProjectId"
      >
        Try again
      </Button>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'

const emit = defineEmits<{
  (event:'close'): void
}>()

defineProps<{
  show: boolean
}>()

function checkConfigForProjectId () {
  emit('close')
}

const projectId = 'asdasd'
const projectIdCode = computed(() => `projectId: '${projectId}'`)

const helpCode = computed(() => {
  return `
export default {
  ${projectIdCode.value}, // <- add this line
  // ...
}`
})

</script>

<style scoped lang="scss">
// make the marker black while the rest of the line is gray
ol li::marker{
  @apply text-gray-900;
}
</style>
