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
          :loading="query.fetching.value"
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
          <RouterButton
            size="40"
            variant="indigo-dark"
            :to="{ name: 'SpecRunner',
                   query: {
                     file: posixify(result.file.relative)
                   },
                   params: {
                     shouldShowTroubleRenderingAlert: 'true'
                   }
            }"
            @click="emits('close')"
          >
            <IconTechnologyTestResults
              stroke-color="white"
              class="mr-[8px]"
            />
            {{ t('createSpec.successPage.runSpecButton') }}
          </RouterButton>
          <Button
            size="40"
            variant="outline-light"
            @click="emits('restart')"
          >
            <IconActionAddLarge
              stroke-color="gray-500"
              class="mr-[8px]"
            />
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
import { computed, ref } from 'vue'
import { useVModels, whenever } from '@vueuse/core'
import Button from '@cypress-design/vue-button'
import { useI18n } from '@cy/i18n'
import FileChooser from '../FileChooser.vue'
import GeneratorSuccess from '../GeneratorSuccess.vue'
import { gql, useQuery, useMutation } from '@urql/vue'
import type { ComponentGeneratorStepOne_CodeGenGlobFragment, GeneratorSuccessFileFragment } from '../../../generated/graphql'
import { VueComponentGeneratorStepOneDocument, VueComponentGeneratorStepOne_GenerateSpecDocument } from '../../../generated/graphql'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import EmptyGenerator from '../EmptyGenerator.vue'
import { posixify } from '../../../paths'
import RouterButton from '../../../components/RouterButton.vue'
import { IconActionAddLarge, IconTechnologyTestResults } from '@cypress-design/vue-icon'

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

const query = useQuery({
  query: VueComponentGeneratorStepOneDocument,
  // @ts-ignore
  variables: { glob: extensionPattern },
  requestPolicy: 'network-only',
})
const allFiles = computed((): any => {
  if (query.data.value?.currentProject?.codeGenCandidates) {
    return query.data.value.currentProject?.codeGenCandidates
  }

  return []
})
const result = ref<GeneratorSuccessFileFragment | null>(null)
const generatedSpecError = ref()
const generateSpecFromSource = ref()

whenever(result, () => {
  title.value = t('createSpec.successPage.header')
})

whenever(generatedSpecError, () => {
  title.value = t('createSpec.component.importTemplateSpec.header')
})

const makeSpec = async (file) => {
  const { data } = await mutation.executeMutation({
    codeGenCandidate: file.absolute,
    type: 'component',
  })

  generateSpecFromSource.value = data?.generateSpecFromSource
  result.value = data?.generateSpecFromSource?.generatedSpecResult?.__typename === 'ScaffoldedFile' ? data?.generateSpecFromSource?.generatedSpecResult : null
  generatedSpecError.value = data?.generateSpecFromSource?.generatedSpecResult?.__typename === 'GeneratedSpecError' ? data?.generateSpecFromSource?.generatedSpecResult : null
}
const cancelSpecNameCreation = () => {
  generatedSpecError.value = null
}
</script>
