<template>
  <FileChooser
    v-model:extensionPattern="extensionPattern"
    :files="allFiles"
    :loading="query.fetching.value"
    @reset:extensionPattern="extensionPattern = initialExtension"
    @selectFile="makeSpec"
  />
  <GeneratorSuccess
    v-if="result"
    :file="result"
  />
  <div class="rounded-b w-full h-24px" />
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import FileChooser from '../FileChooser.vue'
import GeneratorSuccess from '../GeneratorSuccess.vue'
import { computed, ref } from 'vue'
import { gql, useQuery, useMutation } from '@urql/vue'
import { StoryGeneratorDocument, StoryGeneratorStepOne_GenerateSpecDocument } from '../../../generated/graphql'

const props = defineProps<{
  title?: string,
}>()

const { t } = useI18n()

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
}>()

const { title } = useVModels(props, emits)

title.value = t('createSpec.component.importFromStory.chooseAStoryHeader')

gql`
query StoryGenerator($glob: String!) {
  app {
    activeProject {
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
}
`

gql`
mutation StoryGeneratorStepOne_generateSpec($codeGenCandidate: String!, $type: CodeGenType!) {
  generateSpecFromSource(codeGenCandidate: $codeGenCandidate, type: $type) {
    ...GeneratorSuccess
  }
}
`

const initialExtension = '*.stories.*'
const extensionPattern = ref(initialExtension)
const mutation = useMutation(StoryGeneratorStepOne_GenerateSpecDocument)

const glob = computed(() => {
  return `**/${extensionPattern.value}`
})

const query = useQuery({
  query: StoryGeneratorDocument,

  // @ts-ignore
  variables: { glob },
})

const allFiles = computed(() => {
  if (query.data.value) {
    return query.data.value.app?.activeProject?.codeGenCandidates
  }

  return []
})

const result = ref()
const makeSpec = async (file) => {
  const { data } = await mutation.executeMutation({
    codeGenCandidate: file.relative,
    type: 'component',
  })

  result.value = data?.generateSpecFromSource
}

</script>
