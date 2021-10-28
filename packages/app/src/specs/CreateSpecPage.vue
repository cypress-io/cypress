<template>
  <CreateSpecModal v-if="query.data.value?.app.activeTestingType" :key="generator" :testingType="query.data.value?.app.activeTestingType"
    :initial-generator="generator" :show="showModal" @close="closeModal"/>
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
      <CreateSpecCards 
      @select="choose" :testingType="testingType"></CreateSpecCards>
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
        @click=""
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
import type { TestingTypeEnum } from '../generated/graphql'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import CreateSpecModal from './CreateSpecModal.vue'
import CreateSpecCards from './CreateSpecCards.vue'
import { useRouter } from 'vue-router'
import { gql, useQuery } from '@urql/vue'
import { CreateSpecPageDocument } from '../generated/graphql'
const { t } = useI18n()

gql`
  query CreateSpecPage {
    app {
      activeTestingType
    }
  }
`

const query = useQuery({
  query: CreateSpecPageDocument
})

// TODO: gql current testingType when it's available
const props = defineProps<{
  testingType: TestingTypeEnum
}>()

const router = useRouter()

const showModal = ref(false)

const generator = ref(null)

const closeModal = () => {
  showModal.value = false
  generator.value = null
}

const choose = (id) => {
  showModal.value = true
  generator.value = id
}
</script>
