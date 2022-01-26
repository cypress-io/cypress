<template v-if="specFile">
  <div class="p-24px w-720px">
    <Input
      v-model="specFile"
      :placeholder="t('createSpec.e2e.importEmptySpec.inputPlaceholder')"
      :has-error="hasError"
    >
      <template #prefix>
        <i-cy-document-blank_x16 class="icon-light-gray-50 icon-dark-gray-300" />
      </template>
    </Input>

    <div
      v-if="hasError && props.gql.currentProject"
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
    v-if="specFile"
    class="flex gap-16px"
  >
    <Button
      class="w-110px"
      :disabled="!isValidSpecFile"
      @click="createSpec"
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
import { gql, useMutation } from '@urql/vue'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import Input from '@packages/frontend-shared/src/components/Input.vue'
import SpecPatterns from '../../components/SpecPatterns.vue'
import { GeneratorCustomFileFragment, GeneratorCustomFile_GenerateSpecDocument, GeneratorCustomFile_MatchSpecFileDocument, GeneratorSuccessFileFragment } from '../../generated/graphql'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  gql: GeneratorCustomFileFragment,
}>()

const { t } = useI18n()

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
  (event: 'restart'): void
  (event: 'close'): void
}>()

gql`
fragment GeneratorCustomFile on GenerateSpecResponse {
  # Used to update the cache after a spec is created, so when the user tries to
  # run it, it already exists
  currentProject {
    id
    ...SpecPatterns
    specs {
      id
      ...SpecNode_InlineSpecList
    }
  }
  generatedSpecResult {
    ... on GeneratedSpecError {
      fileName
    }
  }
}
`

gql`
mutation GeneratorCustomFile_MatchSpecFile($specFile: String!) {
  matchesSpecPattern (specFile: $specFile) 
}
`

gql`
mutation GeneratorCustomFile_generateSpec($codeGenCandidate: String!, $type: CodeGenType!) {
  generateSpecFromSource(codeGenCandidate: $codeGenCandidate, type: $type) {
    ...GeneratorSuccess
  }
}`

const specFile = ref(props.gql.generatedSpecResult?.__typename === 'GeneratedSpecError' ? props.gql.generatedSpecResult.fileName : '')

const matches = useMutation(GeneratorCustomFile_MatchSpecFileDocument)
const writeFile = useMutation(GeneratorCustomFile_GenerateSpecDocument)

const isValidSpecFile = ref(true)
const hasError = computed(() => !isValidSpecFile.value && !!specFile.value)

const result = ref<GeneratorSuccessFileFragment | null>(null)

const createSpec = async () => {
  const { data } = await writeFile.executeMutation({ codeGenCandidate: specFile.value, type: 'component' })

  result.value = data?.generateSpecFromSource?.generatedSpecResult?.__typename === 'ScaffoldedFile' ? data?.generateSpecFromSource?.generatedSpecResult : null
}

watch(specFile, async (value) => {
  const result = await matches.executeMutation({ specFile: value })

  isValidSpecFile.value = result.data?.matchesSpecPattern ?? false
}, { immediate: true })

</script>
