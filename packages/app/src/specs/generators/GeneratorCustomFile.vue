<template v-if="fileName">
  <div class="p-24px w-720px">
    <Input
      v-model="fileName"
      :placeholder="t('createSpec.e2e.importEmptySpec.inputPlaceholder')"
      :has-error="true"
    >
      <template #prefix>
        <i-cy-document-blank_x16 class="icon-light-gray-50 icon-dark-gray-300" />
      </template>
    </Input>

    <div
      v-if="true && props.gql.currentProject"
    >
      <div
        class="rounded flex font-medium bg-error-100 p-16px text-error-600 gap-8px items-center"
      >
        <i-cy-errored-outline_x16 class="icon-dark-error-600" />
        <span>{{ t('createSpec.component.importFromComponent.invalidComponentWarning') }}<b>specPattern</b>.</span>
      </div>

      <div class="mt-16px">
        <SpecPatterns
          :gql="props.gql.currentProject"
        />
      </div>
    </div>
  </div>
  <StandardModalFooter
    v-if="fileName"
    class="flex gap-16px"
  >
    <Button
      class="w-110px"
      :disabled="!false"
    >
      {{ t('createSpec.createSpec') }}
    </Button>

    <Button
      variant="outline"
      @click="emits('restart')"
    >
      {{ t('components.button.cancel') }}
    </Button>
  </StandardModalFooter>
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/vue'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import Input from '@packages/frontend-shared/src/components/Input.vue'
import SpecPatterns from '../../components/SpecPatterns.vue'
import type { GeneratorCustomFileFragment } from '../../generated/graphql'
import { ref } from 'vue'

const props = defineProps<{
  gql: GeneratorCustomFileFragment,
}>()

const { t } = useI18n()

const emits = defineEmits<{
  (event: 'restart'): void
}>()

gql`
fragment GeneratorCustomFile on GenerateSpecResponse {
  # Used to update the cache after a spec is created, so when the user tries to
  # run it, it already exists
  currentProject {
    id
    ...SpecPatterns
    specs: specs(first: 1000) {
      edges {
        ...SpecNode_InlineSpecList
      }
    }
  }
  generatedSpecResult {
    ... on GeneratedSpecError {
      fileName
    }
  }
}
`

const fileName = ref(props.gql.generatedSpecResult?.__typename === 'GeneratedSpecError' ? props.gql.generatedSpecResult.fileName : '')

</script>
