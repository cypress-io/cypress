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
        <template v-if="props.isDefaultSpecPattern">
          {{ DEFAULT_PATTERN_DESCRIPTIONS[props.gql.currentProject.currentTestingType] }}
        </template>
        <template v-else>
          We couldn't find any files matching the following spec patterns. You may need to move your specs or update your
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
          to find them.
        </template>
      </p>
    </div>

    <DefaultSpecPatternNoContent
      v-if="props.isDefaultSpecPattern"
      :gql="props.gql"
      @show-create-spec-modal="showCreateSpecModal"
    />
    <CustomPatternNoSpecContent
      v-else
      :gql="props.gql.currentProject"
      @show-create-spec-modal="showCreateSpecModal"
    />
  </div>
</template>

<script lang="ts" setup>
import DefaultSpecPatternNoContent from './DefaultSpecPatternNoContent.vue'
import { gql } from '@urql/vue'
import type { NoSpecsPageFragment, TestingTypeEnum } from '../generated/graphql'
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

const DEFAULT_PATTERN_DESCRIPTIONS: Record<TestingTypeEnum, string> = {
  component: 'Since this project looks new, we recommend that you get started by creating a spec for one of your components.',
  e2e: 'Since this project looks new, we recommend that you use the specs and tests that we\'ve written for you to get started.',
}

</script>
