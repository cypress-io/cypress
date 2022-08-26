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

    <div class="max-w-2xl py-7 px-15 text-gray-900">
      <div class="text-center">
        {{ t('runner.studio.studioDetailedDescription') }}
      </div>

      <div class="flex mt-3 justify-center">
        <ul>
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
      </div>
      <div class="my-3 text-center">
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
      </div>
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
