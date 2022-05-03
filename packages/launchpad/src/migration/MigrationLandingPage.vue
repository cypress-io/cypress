<template>
  <h1>{{ t('migration.landingPage.title') }}</h1>
  <p>{{ t('migration.landingPage.description') }}</p>

  <div class="text-center">
    <div>
      video
    </div>
    <div class="flex gap-8px">
      <Button @click="handleClick">
        {{ t('migration.landingPage.actionContinue') }}
      </Button>
      <Button
        href="https://on.cypress.io/changelog"
        variant="outline"
      >
        {{ t('migration.landingPage.linkReleaseNotes') }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'

import { useI18n } from '@cy/i18n'
const { t } = useI18n()

const handleClick = () => {
  // emit event dismiss
}

</script>
