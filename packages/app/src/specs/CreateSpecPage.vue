<template>
  <div class="text-center max-w-592px overflow-scroll">
    <h1
      data-testid="create-spec-page-title"
      class="text-32px text-gray-900 mb-12px"
    >
      {{ t('createSpec.page.title') }}
    </h1>
    <p
      data-testid="create-spec-page-description"
      class="text-18px text-gray-600 leading-normal mb-32px"
    >
      {{ t(`createSpec.page.${testingType}.description`) }}
    </p>

    <div
      class="pb-32px border-b-1"
      data-testid="create-spec-page-cards"
    >
      <CreateNewComponentSpec v-if="testingType === 'component'" />
      <CreateNewE2ESpec v-else />
    </div>
    <div class="mt-32px text-center">
      <p
        data-testid="no-specs-message"
        class="text-gray-600 text-16px leading-normal mb-16px"
      >
        {{ t('createSpec.noSpecsMessage') }}
      </p>
      <Button
        data-testid="view-spec-pattern"
        variant="outline"
        prefix-icon-class="icon-light-gray-50 icon-dark-gray-400"
        :prefix-icon="SettingsIcon"
        class="mx-auto
      my-0 hocus:ring-gray-50 duration-300 hocus:border-gray-200"
        @click="goToSpecsPattern"
      >
        {{ t('createSpec.viewSpecPatternButton') }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import SettingsIcon from '~icons/cy/settings_x16'
import Button from '@cy/components/Button.vue'
import CreateNewComponentSpec from './CreateNewComponentSpec.vue'
import CreateNewE2ESpec from './CreateNewE2ESpec.vue'
const { t } = useI18n()

// TODO: gql current testingType when it's available
defineProps<{
  testingType: 'component' | 'e2e'
}>()

const goToSpecsPattern = () => { /* TODO: route to specific sections in the settings page */ }
</script>
