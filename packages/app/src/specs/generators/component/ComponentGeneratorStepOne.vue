<template>
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
        @click="emits('restart')"
      >
        {{ t('createSpec.successPage.createAnotherSpecButton') }}
      </Button>
    </StandardModalFooter>
  </div>
</template>

<script setup lang="ts">
import { useVModels, whenever } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import FileChooser from '../FileChooser.vue'
import GeneratorSuccess from '../GeneratorSuccess.vue'
import { computed, ref } from 'vue'
import { gql, useQuery, useMutation } from '@urql/vue'
import { ComponentGeneratorStepOneDocument, ComponentGeneratorStepOne_GenerateSpecDocument, GeneratorSuccessFragment } from '../../../generated/graphql'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import PlusButtonIcon from '~icons/cy/add-large_x16.svg'
import TestResultsIcon from '~icons/cy/test-results_x24.svg'

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

title.value = t('createSpec.component.importFromComponent.chooseAComponentHeader')

gql`
fragment ComponentGeneratorStepOne_codeGenGlob on CurrentProject {
  id
  codeGenGlobs {
    id
    component
  }
}
`

gql`
query ComponentGeneratorStepOne($glob: String!) {
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
mutation ComponentGeneratorStepOne_generateSpec($codeGenCandidate: String!, $type: CodeGenType!) {
  generateSpecFromSource(codeGenCandidate: $codeGenCandidate, type: $type) {
    ...GeneratorSuccess
  }
}`

const mutation = useMutation(ComponentGeneratorStepOne_GenerateSpecDocument)

const extensionPattern = ref(props.codeGenGlob)

const query = useQuery({
  query: ComponentGeneratorStepOneDocument,

  // @ts-ignore
  variables: { glob: extensionPattern },
})

const allFiles = computed((): any => {
  if (query.data.value?.currentProject?.codeGenCandidates) {
    return query.data.value.currentProject?.codeGenCandidates
  }

  return []
})

const result = ref<GeneratorSuccessFragment | null>(null)

whenever(result, () => {
  title.value = t('createSpec.successPage.header')
})

const makeSpec = async (file) => {
  const { data } = await mutation.executeMutation({
    codeGenCandidate: file.absolute,
    type: 'component',
  })

  result.value = data?.generateSpecFromSource ?? null
}

</script>
