<template>
  <StandardModal
    :model-value="props.open"
    help-link="https://on.cypress.io/guides/references/cypress-studio"
    :help-text="t('links.learnMoreButton')"
    variant="bare"
    data-cy="studio-instructions-modal"
    @update:model-value="emit('close')"
  >
    <template #title>
      {{ t('runner.studio.studio') }} {{ t('versions.beta') }}
    </template>

    <div class="max-w-2xl p-6 text-gray-900">
      <p class="mb-1">
        {{ t('runner.studio.studioDetailedDescription') }}
      </p>

      <ul class="mb-1">
        <li>
          <pre>.check()</pre>
        </li>
        <li>
          <pre>.click()</pre>
        </li>
        <li>
          <pre>.select()</pre>
        </li>
        <li>
          <pre>.type()</pre>
        </li>
        <li>
          <pre>.uncheck()</pre>
        </li>
      </ul>
      <p>
        {{ t('runner.studio.experimentalMessage') }}
        <i18n-t
          scope="global"
          keypath="runner.studio.feedbackPrompt"
        >
          <a
            class="text-indigo-500"
            href="https://on.cypress.io/studio-beta"
            target="_blank"
          >{{ t('runner.studio.feedbackLink') }}</a>
        </i18n-t>
      </p>
    </div>
  </StandardModal>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import StandardModal from '@packages/frontend-shared/src/components/StandardModal.vue'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

</script>
