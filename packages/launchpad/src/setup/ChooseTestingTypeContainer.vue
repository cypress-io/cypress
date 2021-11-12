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
    :gql="query.data.value"
  />
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { gql, useQuery } from '@urql/vue'
import { ref } from 'vue'
import { ChooseTestingTypeContainerDocument } from '../generated/graphql'
import StandardModal from '@cy/components/StandardModal.vue'
import HeadingText from './HeadingText.vue'
import CompareTestingTypes from './CompareTestingTypes.vue'
import TestingTypeCards from './TestingTypeCards.vue'

const { t } = useI18n()
const isTestingTypeModalOpen = ref(false)

gql`
query ChooseTestingTypeContainer {
  ...TestingTypeCards
}
`

const query = useQuery({ query: ChooseTestingTypeContainerDocument })
</script>
