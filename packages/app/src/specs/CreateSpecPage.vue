<template>
  <StandardModal :clickOutside="false" v-model="modal">
    <template #overlay={classes}>
        <DialogOverlay :class="classes" class="bg-gray-900 opacity-[0.97]" />
    </template>
  </StandardModal>
  <div class="overflow-scroll text-center max-w-600px">
    <h1
      data-testid="create-spec-page-title"
      class="text-gray-900 text-32px mb-12px"
    >
      {{ t('createSpec.page.title') }}
    </h1>
    <p
      data-testid="create-spec-page-description"
      class="leading-normal text-gray-600 text-18px mb-32px"
    >
      {{ t(`createSpec.page.${testingType}.description`) }}
    </p>

    <div
      class="flex flex-wrap pb-32px border-b-1 gap-32px children:mx-auto"
      data-testid="create-spec-page-cards"
    >
      <template v-if="testingType === 'component'">
        <CreateSpecCard
          :icon="BookCodeIcon"
          :header="t('createSpec.component.importFromStory.header')"
          :description="t('createSpec.component.importFromStory.description')"
          @click="openModal('importFromStory')"
        />
        <CreateSpecCard
          :icon="DocumentCodeIcon"
          :header="t('createSpec.component.importFromComponent.header')"
          :description="t('createSpec.component.importFromComponent.description')"
          @click="openModal('importFromComponent')"
        />
      </template>
      <template v-else>
        <CreateSpecCard
          :icon="BoxOpenIcon"
          :header="t('createSpec.e2e.importFromScaffold.header')"
          :description="t('createSpec.e2e.importFromScaffold.description')"
          @click="openModal('importFromScaffold')"
        />
        <CreateSpecCard
          :icon="DocumentCodeIcon"
          :header="t('createSpec.e2e.importEmptySpec.header')"
          :description="t('createSpec.e2e.importEmptySpec.description')"
          @click="openModal('importEmptySpec')"
        />
      </template>
    </div>
    <div class="text-center mt-32px">
      <p
        data-testid="no-specs-message"
        class="leading-normal text-gray-600 text-16px mb-16px"
      >
        {{ t('createSpec.noSpecsMessage') }}
      </p>
      <Button
        data-testid="view-spec-pattern"
        variant="outline"
        prefix-icon-class="icon-light-gray-50 icon-dark-gray-400"
        :prefix-icon="SettingsIcon"
        class="mx-auto duration-300 hocus:ring-gray-50 hocus:border-gray-200"
        @click="goToSpecsPattern"
      >
        {{ t('createSpec.viewSpecPatternButton') }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import StandardModal from '@cy/components/StandardModal.vue '
import { useI18n } from '@cy/i18n'
import BoxOpenIcon from '~icons/cy/box-open_x48'
import DocumentCodeIcon from '~icons/cy/document-code_x48'
import BookCodeIcon from '~icons/cy/book-code_x48'
import CreateSpecCard from './CreateSpecCard.vue'
import CreateSpecModal from './CreateSpecModal.vue'
import SettingsIcon from '~icons/cy/settings_x16'
import Button from '@cy/components/Button.vue'
import ImportComponentSelector from './ImportComponentSelector.vue'
import {DialogOverlay} from '@headlessui/vue'
import { ref } from 'vue'
const { t } = useI18n()

// TODO: gql current testingType when it's available
defineProps<{
  testingType: 'component' | 'e2e'
}>()

const modal = ref(false)
const openModal = (id) => {
  modal.value = true
}

const goToSpecsPattern = () => { /* TODO: route to specific sections in the settings page */ }
</script>
