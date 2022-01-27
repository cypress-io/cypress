<template>
  <div class="flex flex-col flex-grow justify-between">
    <template v-if="generatedSpecError">
      <EmptyGenerator
        :gql="generateSpecFromSource.currentProject"
        title=""
        type="story"
        :spec-file-name="generatedSpecError.fileName"
        :errored-codegen-candidate="generatedSpecError.erroredCodegenCandidate"
        @restart="cancelSpecNameCreation"
        @updateTitle="(value) => emits('update:title', value)"
      />
    </template>

    <template v-else>
      <div class="flex-grow">
        <div
          v-if="mutation.fetching.value"
          class="inline-flex items-center justify-center w-full mt-48px"
        >
          <i-cy-loading_x16 class="h-48px mr-12px animate-spin w-48px" />
          <p class="text-lg">
            Loading
          </p>
        </div>
        <FileChooser
          v-else-if="!result"
          v-model:extensionPattern="extensionPattern"
          :files="allFiles || []"
          :loading="query.fetching.value"
          @selectFile="makeSpec"
        />
        <GeneratorSuccess
          v-else
          :file="result.file"
        />
      </div>
      <div>
        <div
          v-if="!result"
          class="w-full rounded-b h-24px"
        />
        <StandardModalFooter
          v-else
          class="flex items-center h-72px gap-16px"
        >
          <router-link
            class="outline-none"
            :to="{ path: '/specs/runner', query: { file: result.file.relative } }
            "
          >
            <Button
              :prefix-icon="TestResultsIcon"
              prefix-icon-class="w-16px h-16px icon-dark-white"
              @click="emits('close')"
            >
              {{ t('createSpec.successPage.runSpecButton') }}
            </Button>
          </router-link>
          <Button
            :prefix-icon="PlusButtonIcon"
            prefix-icon-class="w-16px h-16px icon-dark-gray-500"
            variant="outline"
            @click="$emit('restart')"
          >
            {{ t('createSpec.successPage.createAnotherSpecButton') }}
          </Button>
        </StandardModalFooter>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useVModels, whenever } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import FileChooser from '../FileChooser.vue'
import GeneratorSuccess from '../GeneratorSuccess.vue'
import { computed, ref } from 'vue'
import { gql, useQuery, useMutation } from '@urql/vue'
import { GeneratorSuccessFileFragment, StoryGeneratorStepOneDocument, StoryGeneratorStepOne_GenerateSpecDocument } from '../../../generated/graphql'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import PlusButtonIcon from '~icons/cy/add-large_x16.svg'
import TestResultsIcon from '~icons/cy/test-results_x24.svg'
import EmptyGenerator from '../EmptyGenerator.vue'

const props = defineProps<{
  title: string,
  codeGenGlob: string
}>()

const { t } = useI18n()

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
  (event: 'restart'): void
  (event: 'close'): void
}>()

const { title } = useVModels(props, emits)

title.value = t('createSpec.component.importFromStory.header')

gql`
fragment StoryGeneratorStepOne_codeGenGlob on CurrentProject {
  id
  codeGenGlobs {
    id
    story
  }
}
`

gql`
query StoryGeneratorStepOne($glob: String!) {
  currentProject {
    id
    codeGenCandidates(glob: $glob) {
      id
      fileName
      fileExtension
      absolute
      relative
      baseName
    }
  }
}
`

gql`
mutation StoryGeneratorStepOne_generateSpec($codeGenCandidate: String!, $type: CodeGenType!) {
  generateSpecFromSource(codeGenCandidate: $codeGenCandidate, type: $type) {
    ...GeneratorSuccess
    currentProject {
      id
      ...EmptyGenerator
    }
    generatedSpecResult {
      ... on GeneratedSpecError {
        fileName
        erroredCodegenCandidate
      }
    }
  }
}`

const mutation = useMutation(StoryGeneratorStepOne_GenerateSpecDocument)

const extensionPattern = ref(props.codeGenGlob)

const query = useQuery({
  query: StoryGeneratorStepOneDocument,

  // @ts-ignore
  variables: { glob: extensionPattern },
})

const allFiles = computed(() => {
  if (query.data.value?.currentProject?.codeGenCandidates) {
    return query.data.value.currentProject?.codeGenCandidates
  }

  return []
}) as any

const result = ref<GeneratorSuccessFileFragment | null>(null)
const generatedSpecError = ref()
const generateSpecFromSource = ref()

whenever(result, () => {
  title.value = t('createSpec.successPage.header')
})

whenever(generatedSpecError, () => {
  title.value = t('createSpec.component.importEmptySpec.header')
})

const makeSpec = async (file) => {
  const { data } = await mutation.executeMutation({
    codeGenCandidate: file.absolute,
    type: 'story',
  })

  generateSpecFromSource.value = data?.generateSpecFromSource
  result.value = data?.generateSpecFromSource?.generatedSpecResult?.__typename === 'ScaffoldedFile' ? data?.generateSpecFromSource?.generatedSpecResult : null
  generatedSpecError.value = data?.generateSpecFromSource?.generatedSpecResult?.__typename === 'GeneratedSpecError' ? data?.generateSpecFromSource?.generatedSpecResult : null
}

const cancelSpecNameCreation = () => {
  generatedSpecError.value = null
}

</script>
