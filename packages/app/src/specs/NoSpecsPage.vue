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
    class="mx-auto text-center max-w-642px py-40px"
  >
    <div class="m-x-auto max-w-600px">
      <h1
        data-testid="create-spec-page-title"
        class="mb-12px text-gray-900 text-32px"
      >
        {{ props.title }}
      </h1>
      <p
        data-testid="create-spec-page-description"
        class="leading-normal mb-32px text-gray-600 text-18px"
      >
        <i18n-t
          scope="global"
          :keypath="descriptionKeyPath"
        >
          <button
            class="text-purple-500 hocus-link-default"
          >
            specPattern
          </button>
        </i18n-t>
      </p>
    </div>

    <DefaultSpecPatternNoContent
      v-if="props.isUsingDefaultSpecs"
      :gql="props.gql"
      @choose="choose"
    />
    <CustomPatternNoSpecContent
      v-else
      :gql="props.gql"
      @newSpec="showModal = true"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import CreateSpecModal from './CreateSpecModal.vue'
import DefaultSpecPatternNoContent from './DefaultSpecPatternNoContent.vue'
import { gql } from '@urql/vue'
import type { NoSpecsPageFragment } from '../generated/graphql'
import CustomPatternNoSpecContent from './CustomPatternNoSpecContent.vue'

gql`
fragment NoSpecsPage on Query {
  ...CreateSpecCards
  ...CreateSpecModal
  ...ChooseExternalEditor
  ...CustomPatternNoSpecContent
  currentProject {
    id
    currentTestingType
    configFileAbsolutePath
  }
}
`

const props = defineProps<{
  gql: NoSpecsPageFragment
  title: string
  isUsingDefaultSpecs: boolean
}>()

const showModal = ref(false)

const generator = ref()

const descriptionKeyPath = computed(() => {
  return props.isUsingDefaultSpecs ?
    `createSpec.page.defaultPatternNoSpecs.${props.gql.currentProject?.currentTestingType}.description` :
    'createSpec.page.customPatternNoSpecs.description'
})

const closeModal = () => {
  showModal.value = false
  generator.value = null
}

const choose = (id: string) => {
  showModal.value = true
  generator.value = id
}
</script>
