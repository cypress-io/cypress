<template>
  <StandardModal
    :model-value="props.open"
    help-link="https://on.cypress.io/guides/references/cypress-studio"
    :help-text="t('links.learnMoreButton')"
    variant="bare"
    data-cy="studio-init-modal"
    @update:model-value="emit('close')"
  >
    <template #title>
      <i className="fas fa-magic icon" />
      {{ t('runner.studio.studio') }}
      <span className="beta">{{ t('versions.beta') }}</span>
    </template>

    <div className="gif">
      <img
        src="../../static/studio.gif"
        alt="Studio"
      >
    </div>

    <div className="content center">
      <div className="text">
        {{ t('runner.studio.studioDescription') }}
      </div>
      <button
        className="btn-main"
        @click="emit('start')"
      >
        {{ t('runner.studio.getStartedButton') }}
      </button>
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
  (e: 'start'): void
  (e: 'close'): void
}>()

</script>
