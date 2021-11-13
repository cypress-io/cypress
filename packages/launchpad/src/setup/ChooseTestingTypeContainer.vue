<template>
  <HeadingText
    :title="t('chooseTestingTypePage.title')"
    :description="t('chooseTestingTypePage.description')"
  />
  <StandardModal
    v-model="isTestingTypeModalOpen"
    class="h-full sm:h-auto sm:w-auto w-full sm:mx-[5%]"
  >
    <template #title>
      Key Differences
    </template>
    <CompareTestingTypes />
  </StandardModal>
  <button
    class="block mx-auto text-indigo-500 text-18px hocus-link-default group mt-12px"
    @click="isTestingTypeModalOpen = true"
  >
    {{ t('chooseTestingTypePage.review') }}<i-cy-arrow-right_x16
      class="inline-block transition-transform duration-200 ease-in transform -translate-y-1px ml-4px icon-dark-current group-hocus:translate-x-2px"
    />
  </button>
  <TestingTypeCards
    :gql="props.gql"
  />
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/vue'
import { ref } from 'vue'
import StandardModal from '@cy/components/StandardModal.vue'
import HeadingText from './HeadingText.vue'
import CompareTestingTypes from './CompareTestingTypes.vue'
import TestingTypeCards from './TestingTypeCards.vue'
import type { ChooseTestingTypeContainerFragment } from '../generated/graphql'

const { t } = useI18n()
const isTestingTypeModalOpen = ref(false)

gql`
fragment ChooseTestingTypeContainer on CurrentProject {
  id
  ...TestingTypeCards
}
`

const props = defineProps<{
  gql: ChooseTestingTypeContainerFragment
}>()
</script>
