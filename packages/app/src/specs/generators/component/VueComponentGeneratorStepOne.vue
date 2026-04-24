<template>
  <div class="flex flex-col grow justify-between">
    <template v-if="generatedSpecError">
      <EmptyGenerator
        :gql="generateSpecFromSource.currentProject"
        title=""
        type="component"
        :other-generators="false"
        :spec-file-name="generatedSpecError.fileName"
        @restart="cancelSpecNameCreation"
        @spec-created="onEmptyGeneratorSpecCreated"
        @updateTitle="(value) => emits('update:title', value)"
      />
    </template>

    <template v-else>
      <div class="grow">
        <div
          v-if="mutation.fetching.value"
          class="mt-[48px] w-full inline-flex items-center justify-center"
        >
          <i-cy-loading_x16 class="h-[48px] mr-[12px] animate-spin w-[48px]" />
          <p class="text-lg">
            Loading
          </p>
        </div>
        <FileChooser
          v-else-if="!result"
          v-model:extensionPattern="extensionPattern"
          :files="allFiles"
          :loading="isCodeGenCandidatesInitialLoad"
          @selectFile="makeSpec"
        />
        <GeneratorSuccess
          v-else
          :file="result.file"
        />
      </div>
      <div>
        <StandardModalFooter
          v-if="result"
          class="flex gap-[16px] items-center"
        >
          <Button
            size="lg"
            :to="runSpecTo"
            :prefix-icon="TestResultsIcon"
            prefix-icon-class="w-[16px] h-[16px] icon-dark-white"
            @click.capture="seedActiveSpecBeforeRunnerNavigate"
            @click="emits('close')"
          >
            {{ t('createSpec.successPage.runSpecButton') }}
          </Button>
          <Button
            size="lg"
            :prefix-icon="PlusButtonIcon"
            prefix-icon-class="w-[16px] h-[16px] icon-dark-gray-500"
            variant="outline"
            @click="emits('restart')"
          >
            {{ t('createSpec.successPage.createAnotherSpecButton') }}
          </Button>
        </StandardModalFooter>
        <div
          v-else
          class="bg-white rounded-b h-[24px] bottom-0 left-0 w-[calc(100%-24px)] absolute"
        />
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useVModels, whenever } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import FileChooser from '../FileChooser.vue'
import GeneratorSuccess from '../GeneratorSuccess.vue'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import PlusButtonIcon from '~icons/cy/add-large_x16.svg'
import TestResultsIcon from '~icons/cy/test-results_x24.svg'
import { computed, ref } from 'vue'
import { gql, useQuery, useMutation } from '@urql/vue'
import type {
  ComponentGeneratorStepOne_CodeGenGlobFragment,
  GeneratorSuccessFileFragment,
} from '../../../generated/graphql'
import { VueComponentGeneratorStepOneDocument, VueComponentGeneratorStepOne_GenerateSpecDocument } from '../../../generated/graphql'
import EmptyGenerator from '../EmptyGenerator.vue'
import { posixify } from '../../../paths'
import { useSpecStore } from '../../../store'
import type { SpecFile } from '@packages/types/src'
import type { EmptyGeneratorSpecCreatedPayload } from '../EmptyGenerator.vue'

const props = defineProps<{
  title: string
  gql: ComponentGeneratorStepOne_CodeGenGlobFragment
}>()
const { t } = useI18n()
const emits = defineEmits<{
  (event: 'update:title', value: string): void
  (event: 'update:description', value: string): void
  (event: 'restart'): void
  (event: 'close'): void
}>()
const { title } = useVModels(props, emits)
const specStore = useSpecStore()

title.value = t('createSpec.component.importFromComponent.chooseAComponentHeader')

gql`
query VueComponentGeneratorStepOne($glob: String!) {
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
    # Add the specs, so we can keep the list up to date with the cache
    specs {
      id
      ...SpecNode_InlineSpecList
    }
  }
}
`

gql`
mutation VueComponentGeneratorStepOne_generateSpec($codeGenCandidate: String!, $type: CodeGenType!) {
  generateSpecFromSource(codeGenCandidate: $codeGenCandidate, type: $type) {
    ...GeneratorSuccess
    currentProject {
      id
      ...EmptyGenerator
    }
    generatedSpecResult {
      ... on GeneratedSpecError {
        fileName
      }
    }
  }
}`

const mutation = useMutation(VueComponentGeneratorStepOne_GenerateSpecDocument)
const extensionPattern = ref(props.gql.codeGenGlobs.component)

// Nested refs are not unwrapped by @urql/vue when building the operation; use a
// computed so `glob` is always a plain string on the wire and in the cache key.
const codeGenVariables = computed(() => ({ glob: extensionPattern.value }))

const query = useQuery({
  query: VueComponentGeneratorStepOneDocument,
  variables: codeGenVariables,
  requestPolicy: 'network-only',
})
const allFiles = computed((): any => {
  if (query.data.value?.currentProject?.codeGenCandidates) {
    return query.data.value.currentProject?.codeGenCandidates
  }

  return []
})

// Hiding the file list on every network refetch drops rows mid-click; only treat
// the list as loading before we have any candidates to render.
const isCodeGenCandidatesInitialLoad = computed(() => {
  return Boolean(
    query.fetching.value &&
    !query.data.value?.currentProject?.codeGenCandidates?.length,
  )
})
const generatedSpecError = ref()
const generateSpecFromSource = ref()
const result = ref<GeneratorSuccessFileFragment | null>(null)

whenever(generatedSpecError, () => {
  title.value = t('createSpec.component.importTemplateSpec.header')
})

whenever(result, () => {
  title.value = t('createSpec.successPage.header')
})

const runSpecTo = computed(() => {
  const rel = result.value?.file?.relative

  return {
    name: 'SpecRunner' as const,
    query: { file: rel ? posixify(rel) : '' },
    params: { shouldShowTroubleRenderingAlert: 'true' },
  }
})

function seedActiveSpecBeforeRunnerNavigate () {
  const rel = result.value?.file?.relative

  if (!rel) {
    return
  }

  const normalized = posixify(rel)
  const specsList = generateSpecFromSource.value?.currentProject?.specs as ReadonlyArray<SpecFile> | undefined
  const specForStore = specsList?.find((s) => posixify(s.relative) === normalized)

  if (specForStore) {
    specStore.setActiveSpec(specForStore)
  }
}

const makeSpec = async (file) => {
  generatedSpecError.value = null
  result.value = null

  const { data } = await mutation.executeMutation({
    codeGenCandidate: file.absolute,
    type: 'component',
  })

  generateSpecFromSource.value = data?.generateSpecFromSource
  const specResult = data?.generateSpecFromSource?.generatedSpecResult

  if (specResult && 'file' in specResult && specResult.file) {
    result.value = specResult as GeneratorSuccessFileFragment

    return
  }

  if (specResult?.__typename === 'GeneratedSpecError' || (specResult && 'fileName' in specResult)) {
    generatedSpecError.value = specResult

    return
  }
}

function onEmptyGeneratorSpecCreated (payload: EmptyGeneratorSpecCreatedPayload) {
  generatedSpecError.value = null
  generateSpecFromSource.value = payload.generateSpecFromSource
  result.value = payload.scaffoldedFile
}

const cancelSpecNameCreation = () => {
  generatedSpecError.value = null
  result.value = null
}
</script>
