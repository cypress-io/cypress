<template>
  <CreateSpecModal v-model:show="showModal" :currentGenerator="currentGenerator"/>
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
      <component v-for="generator in generators" :key="generator.id"
      :is="generator.card"
      @click="openModal(generator.id)"/>
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
import { useI18n } from '@cy/i18n'
import { find } from 'lodash'
import type { TestingTypeEnum } from '../generated/graphql'
import SettingsIcon from '~icons/cy/settings_x16'
import Button from '@cy/components/Button.vue'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import CreateSpecModal from './CreateSpecModal.vue'
import { generators as _generators } from './generators'
import type { SpecGenerator } from './generators'
const { t } = useI18n()

// TODO: gql current testingType when it's available
const props = defineProps<{
  testingType: TestingTypeEnum
}>()

const generators = computed(() => _generators.filter(g => g.matches(props.testingType)))
const currentGenerator: Ref<null | SpecGenerator> = ref(null)
const showModal = ref(false)

const openModal = (id) => {
  currentGenerator.value = find(generators.value, { id }) || null
  showModal.value = true
}

const goToSpecsPattern = () => {}
</script>
