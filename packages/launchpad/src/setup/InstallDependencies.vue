<template>
  <WizardLayout
    :title="t('setupPage.install.title')"
    :description="t('setupPage.install.description')"
    :next="t('setupPage.install.confirmManualInstall')"
    :can-navigate-forward="canNavigateForward"
    class="max-w-640px"
  >
    <ManualInstall />
  </WizardLayout>
</template>

<script lang="ts" setup>
import WizardLayout from './WizardLayout.vue'
import ManualInstall from './ManualInstall.vue'
import { useI18n } from '@cy/i18n'
import { computed } from 'vue-demi'

const { t } = useI18n()

// TODO: determine how we want this to work w/ checking for installed modules
const canNavigateForward = computed(() => true)

</script>
