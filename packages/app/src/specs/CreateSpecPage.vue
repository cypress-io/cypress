<template>
  <CreateSpecModal
    v-if="props.gql.currentProject?.currentTestingType"
    :key="generator"
    :initial-generator="generator"
    :show="showModal"
    :gql="props.gql"
    @close="closeModal"
  />
  <div
    v-if="props.gql.currentProject?.currentTestingType"
    class="overflow-scroll text-center max-w-600px mx-auto py-40px"
  >
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
      {{ t(`createSpec.page.${props.gql.currentProject.currentTestingType}.description`) }}
    </p>
    <CreateSpecCards
      data-testid="create-spec-page-cards"
      :gql="props.gql"
      @select="choose"
    />

    <div class="text-center border-t-1 pt-32px mt-32px">
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
        @click.prevent=""
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
import { ref, computed, Ref } from 'vue'
import CreateSpecModal from './CreateSpecModal.vue'
import CreateSpecCards from './CreateSpecCards.vue'
import { gql } from '@urql/vue'
import type { CreateSpecPageFragment } from '../generated/graphql'
const { t } = useI18n()

gql`
fragment CreateSpecPage on Query {
  ...CreateSpecCards
  ...CreateSpecModal
   currentProject {
     currentTestingType
  }
}
`

const props = defineProps<{
  gql: CreateSpecPageFragment
}>()

const showModal = ref(false)

const generator = ref()

const closeModal = () => {
  showModal.value = false
  generator.value = null
}

const choose = (id) => {
  showModal.value = true
  generator.value = id
}
</script>
