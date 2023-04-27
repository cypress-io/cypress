<template>
  <div
    v-if="props.gql.currentProject?.currentTestingType"
    class="mx-auto text-center max-w-[642px] py-[40px]"
  >
    <div class="mx-auto max-w-[600px]">
      <h1
        data-cy="create-spec-page-title"
        class="mb-[12px] text-gray-900 text-[32px] leading-snug"
      >
        {{ props.title }}
      </h1>
      <p
        data-cy="create-spec-page-description"
        class="leading-normal mb-[32px] text-gray-600 text-[18px]"
      >
        <i18n-t
          scope="global"
          :keypath="descriptionKeyPath"
        >
          <OpenConfigFileInIDE
            v-if="props.gql.currentProject.configFileAbsolutePath"
            v-slot="{onClick}"
            :gql="props.gql.currentProject"
          >
            <button
              class="text-purple-500 hocus-link-default"
              data-cy="no-specs-specPattern"
              @click="onClick"
            >
              specPattern
            </button>
          </OpenConfigFileInIDE>
          <span v-else>specPattern</span>
        </i18n-t>
      </p>
    </div>

    <DefaultSpecPatternNoContent
      v-if="props.isDefaultSpecPattern"
      :gql="props.gql"
      @showCreateSpecModal="showCreateSpecModal"
    />
    <CustomPatternNoSpecContent
      v-else
      :gql="props.gql.currentProject"
      @showCreateSpecModal="showCreateSpecModal"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import DefaultSpecPatternNoContent from './DefaultSpecPatternNoContent.vue'
import { gql } from '@urql/vue'
import type { NoSpecsPageFragment } from '../generated/graphql'
import CustomPatternNoSpecContent from './CustomPatternNoSpecContent.vue'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'

gql`
fragment NoSpecsPage on Query {
  ...CreateSpecCards
  ...ChooseExternalEditor
  currentProject {
    id
    codeGenGlobs {
      id
      component
    }
    currentTestingType
    configFileAbsolutePath
    ...CustomPatternNoSpecContent
    ...OpenConfigFileInIDE
  }
}
`

const props = defineProps<{
  gql: NoSpecsPageFragment
  title: string
  isDefaultSpecPattern: boolean
}>()

const emit = defineEmits<{
  (e: 'showCreateSpecModal', id?: string): void
}>()

const showCreateSpecModal = (id?: string) => {
  emit('showCreateSpecModal', id)
}

const descriptionKeyPath = computed(() => {
  return props.isDefaultSpecPattern ?
    `createSpec.page.defaultPatternNoSpecs.${props.gql.currentProject?.currentTestingType}.description` :
    'createSpec.page.customPatternNoSpecs.description'
})

</script>
