<template>
  <LaunchpadHeader
    title="Configuration files"
    description="We added the following files to your project:"
  />
  <div class="mx-auto max-w-[55rem] py-8">
    <FileRow
      v-for="file in files"
      :key="file.file.id"
      :content="file.file.contents"
      :status="file.status"
      :file-path="file.file.relative"
      :file-extension="file.file.fileExtension"
      :description="file.description || undefined"
    />
    <hr class="my-4">
    <div class="flex gap-2">
      <Button
        size="40"
        :disabled="needsChanges"
        data-cy="continue-button"
        @click="completeSetup"
      >
        Continue
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/core'
import Button from '@cypress-design/vue-button'
import FileRow from '../components/code/FileRow.vue'
import LaunchpadHeader from './LaunchpadHeader.vue'
import type { ScaffoldedFilesFragment } from '../generated/graphql'
import { ScaffoldedFiles_CompleteSetupDocument } from '../generated/graphql'
import { useMutation } from '@urql/vue'

gql`
mutation ScaffoldedFiles_completeSetup {
  completeSetup {
    currentProject {
      id
      isLoadingConfigFile
      isLoadingNodeEvents
      isCTConfigured
    }
    scaffoldedFiles {
      status
    }
  }
}
`

gql`
fragment ScaffoldedFiles on Query {
  scaffoldedFiles {
    status
    description
    file {
      id
      absolute
      relative
      contents
      fileExtension
    }
  }
}
`

const props = defineProps<{
  gql: ScaffoldedFilesFragment
}>()

const files = computed(() => props.gql.scaffoldedFiles)

const needsChanges = computed(() => props.gql.scaffoldedFiles?.some((f) => f.status === 'changes'))

const mutation = useMutation(ScaffoldedFiles_CompleteSetupDocument)

const completeSetup = async () => {
  await mutation.executeMutation({})
}
</script>
