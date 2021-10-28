<template>
  <FileChooser
    :files="allFiles"
    v-model:extensionPattern="extensionPattern"
    @reset:extensionPattern="extensionPattern = initialExtension" 
    :loading="query.fetching.value"
    @selectFile="makeSpec"
    />
  <GeneratorSuccess v-if="query.data.value" :file="query.data.value.app.activeProject?.generatedSpec">
  </GeneratorSuccess>
  <div class="rounded-b w-full h-24px"></div>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import FileChooser from '../FileChooser.vue'
import GeneratorSuccess from '../GeneratorSuccess.vue'
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { gql, useQuery, useMutation } from '@urql/vue'
import { StoryGeneratorDocument, NewSpec_CodeGenSpecDocument } from '../../../generated/graphql'
// import type { DocumentNode } from 'graphql'

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
      generatedSpec {
        content
        spec {
          fileName
          fileExtension
          baseName
          id
        } 
      }
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
mutation NewSpec_CodeGenSpec($codeGenCandidate: String!, $type: CodeGenType!) {
  codeGenSpec(codeGenCandidate: $codeGenCandidate, type: $type)
}
`

const initialExtension = '*.stories.*'
const extensionPattern = ref(initialExtension)
const mutation = useMutation(NewSpec_CodeGenSpecDocument)

const glob = computed(() => {
  return `**/${extensionPattern.value}`
})

const query = useQuery({
  query: StoryGeneratorDocument,

  // @ts-ignore
  variables: { glob }
})

const allFiles = computed(() => {
  if (query.data.value) {
    return query.data.value.app?.activeProject.codeGenCandidates
  }
  return []
})

const makeSpec = (file) => {
  debugger;
  mutation.executeMutation({
    codeGenCandidate: file.relative,
    type: 'component'
  })
}

</script>
