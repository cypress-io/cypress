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
      <i className="fas fa-magic icon" />
      {{ t('runner.studio.studio') }}
      <span className="beta">{{ t('versions.beta') }}</span>
    </template>

    <div className="content center">
      <div className="text">
        {{ t('runner.studio.studioDetailedDescription') }}
      </div>

      <div className="text center-box">
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
      <div className="text">
        {{ t('runner.studio.betaMessage') }}
        <i18n-t
          scope="global"
          keypath="runner.studio.feedbackPrompt"
        >
          <a
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
