<template>
  <div class="flex-grow">
    <div
      v-if="mutation.fetching.value"
      class="inline-flex items-center w-full justify-center mt-48px"
    >
      <i-cy-loading_x16 class="animate-spin w-48px h-48px mr-12px" />
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
      :file="result"
    />
  </div>
  <div>
    <div
      v-if="!result"
      class="rounded-b w-full h-24px"
    />
    <StandardModalFooter
      v-else
      class="h-72px flex gap-16px"
    >
      <router-link
        class="outline-none"
        :to="{ path: 'runner', query: { file: result.spec.relative } }
        "
      >
        <Button
          size="lg"
          :prefix-icon="TestResultsIcon"
          prefix-icon-class="w-16px h-16px icon-dark-white"
        >
          {{ t('createSpec.successPage.runSpecButton') }}
        </Button>
      </router-link>
      <Button
        size="lg"
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

<script setup lang="ts">
import { useVModels, whenever } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import FileChooser from '../FileChooser.vue'
import GeneratorSuccess from '../GeneratorSuccess.vue'
import { computed, ref } from 'vue'
import { gql, useQuery, useMutation } from '@urql/vue'
import { StoryGeneratorStepOneDocument, StoryGeneratorStepOne_GenerateSpecDocument } from '../../../generated/graphql'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import PlusButtonIcon from '~icons/cy/add-large_x16.svg'
import TestResultsIcon from '~icons/cy/test-results_x24.svg'

const props = defineProps<{
  title: string,
  codeGenGlob: any
}>()

const { t } = useI18n()

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
  (event: 'restart'): void
}>()

const { title } = useVModels(props, emits)

title.value = t('createSpec.component.importFromStory.header')

gql`
fragment StoryGeneratorStepOne_codeGenGlob on CurrentProject {
  id
  codeGenGlob(type: story)
}
`

gql`
query StoryGeneratorStepOne($glob: String!) {
  currentProject {
    id
    codeGenCandidates(glob: $glob) {
      id
      name
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
    id
    ...GeneratorSuccess
  }
}`

const mutation = useMutation(StoryGeneratorStepOne_GenerateSpecDocument)

const extensionPattern = ref(props.codeGenGlob)

const glob = computed(() => {
  return `**/${extensionPattern.value}`
})

const query = useQuery({
  query: StoryGeneratorStepOneDocument,

  // @ts-ignore
  variables: { glob },
})

const allFiles = computed(() => {
  if (query.data.value?.currentProject?.codeGenCandidates) {
    return query.data.value.currentProject?.codeGenCandidates
  }

  return []
}) as any

const result = ref()

whenever(result, () => {
  title.value = t('createSpec.successPage.header')
})

const makeSpec = async (file) => {
  const { data } = await mutation.executeMutation({
    codeGenCandidate: file.relative,
    type: 'component',
  })

  result.value = data?.generateSpecFromSource
}

</script>
