<template>
  <CreateSpecModalBody>
    <FileMatch class="sticky top-0 bg-white" v-model:pattern="fileName" v-model:extensionPattern="extensionPattern"/>
    <CreateSpecFileList
      @createSpec="makeSpec"
      :files="files"
    />
  </CreateSpecModalBody>
  <StandardModalFooter>
    <Button @click="$emit('restart')">Hello!</Button>
  </StandardModalFooter>
</template>

<script setup lang="ts">
import { useVModels, useDebounce } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import CreateSpecModalBody from '../CreateSpecModalBody.vue'
import CreateSpecFileList from '../CreateSpecFileList.vue'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import FileMatch from '../../../components/FileMatch.vue'
import { onBeforeUnmount, computed, ref } from 'vue'
import type { ReactiveEffect, Ref } from 'vue'
import { gql, useQuery, useMutation } from '@urql/vue'
import { StoryGeneratorDocument, NewSpec_CodeGenSpecDocument } from '../../../generated/graphql'
import type { DocumentNode } from 'graphql'

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
        relative
        fileExtension
        fileName
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

const extensionPattern = ref('*.vue')
const fileName = ref('')
const glob = computed(() => {
  return `**/${extensionPattern.value}`
})

const mutation = useMutation(NewSpec_CodeGenSpecDocument)

const makeSpec = (file) => {
  mutation.executeMutation({
    codeGenCandidate: file.relative,
    type: 'component'
  })
}

const debouncedGlob = useDebounce(glob, 1000)

const files = computed(() => {
  return query.data.value?.app.activeProject?.codeGenCandidates?.filter((c) => {
    return c?.relative.toLowerCase().includes(fileName.value.toLowerCase())
  })
})

const query = useQuery<DocumentNode, Record<string, Ref>>({
  query: StoryGeneratorDocument,
  variables: { glob: debouncedGlob }
})
</script>
