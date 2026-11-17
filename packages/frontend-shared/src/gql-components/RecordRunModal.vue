<template>
  <StandardModal
    class="transition transition-all duration-200"
    variant="bare"
    title="Record your first run"
    :model-value="isModalOpen"
    :help-link="helpLink"
    :no-help="!helpLink"
    data-cy="record-run-modal"
    @update:model-value="emit('cancel')"
  >
    <div class="max-w-[43.75rem] py-7 px-6 text-gray-600">
      <p class="mb-[24px]">
        Record a run to see your test results in Cypress Cloud. You can then optimize your test suite, debug failing and flaky tests, and integrate with your favorite tools.
      </p>
      <RecordPromptAdapter />
    </div>
  </StandardModal>
</template>

<script setup lang="ts">
import StandardModal from '../components/StandardModal.vue'
import RecordPromptAdapter from './RecordPromptAdapter.vue'
import { getUtmSource } from '../utils/getUtmSource'
import { getUrlWithParams } from '../utils/getUrlWithParams'
import { usePromptManager } from './composables/usePromptManager'
import { onMounted, ref } from 'vue'

const { setPromptShown } = usePromptManager()

onMounted(() => {
  setPromptShown('loginModalRecord')
})

const isModalOpen = ref(true)

const props = defineProps<{
  utmMedium: string
  utmContent?: string
}>()

const emit = defineEmits<{
  (eventName: 'cancel'): void
}>()

const helpLink = getUrlWithParams({
  url: 'https://on.cypress.io/cypress-run-record-key',
  params: {
    utm_medium: props.utmMedium,
    utm_source: getUtmSource(),
    utm_content: props.utmContent || '',
  },
})

</script>
