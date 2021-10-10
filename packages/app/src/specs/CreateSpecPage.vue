<template>
  <div class="text-center max-w-600px overflow-scroll">
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
      class="pb-32px border-b-1 flex flex-wrap gap-32px children:mx-auto"
      data-testid="create-spec-page-cards"
    >
    
      <template v-if="testingType === 'component'">
        <CreateSpecCard
        @click="openModal('importFromStory')"
    :icon="BookCodeIcon"
    :header="t('createSpec.component.importFromStory.header')"
    :description="t('createSpec.component.importFromStory.description')"/>
    <CreateSpecCard
    @click="openModal('importFromComponent')"
    :icon="DocumentCodeIcon"
    :header="t('createSpec.component.importFromComponent.header')"
    :description="t('createSpec.component.importFromComponent.description')"/>
      </template>
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
        class="mx-auto hocus:ring-gray-50 duration-300 hocus:border-gray-200"
        @click="goToSpecsPattern"
      >
        {{ t('createSpec.viewSpecPatternButton') }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import BookCodeIcon from '~icons/cy/book-code_x48'
import DocumentCodeIcon from '~icons/cy/document-code_x48'

import SettingsIcon from '~icons/cy/settings_x16'
import Button from '@cy/components/Button.vue'
import CreateNewComponentSpec from './CreateNewComponentSpec.vue'
import CreateNewE2ESpec from './CreateNewE2ESpec.vue'
import ImportComponentSelector from './ImportComponentSelector.vue'
const { t } = useI18n()

// TODO: gql current testingType when it's available
defineProps<{
  testingType: 'component' | 'e2e'
}>()

const modal = ref(null)
const openModal = (id) => {
}

const goToSpecsPattern = () => { /* TODO: route to specific sections in the settings page */ }
</script>
