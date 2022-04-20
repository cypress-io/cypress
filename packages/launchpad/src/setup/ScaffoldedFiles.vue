<template>
  <LaunchpadHeader
    :title="t('setupWizard.configFiles.title')"
    :description="t('setupWizard.configFiles.description')"
  />
  <div class="mx-auto max-w-220 py-8">
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
        size="lg"
        :disabled="needsChanges"
        @click="completeSetup"
      >
        {{ t('setupPage.step.continue') }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/core'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import FileRow from '../components/code/FileRow.vue'
import LaunchpadHeader from './LaunchpadHeader.vue'
import type { ScaffoldedFilesFragment } from '../generated/graphql'
import { ScaffoldedFiles_CompleteSetupDocument } from '../generated/graphql'
import { useMutation } from '@urql/vue'
import { scaffoldedFileOrder } from '../utils/scaffoldedFileOrder'

const { t } = useI18n()

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

const files = computed(() => {
  // we have an explicit order for displaying certain files
  const orderedFiles = [...props.gql.scaffoldedFiles].sort((fileA, fileB) => {
    const indexA = scaffoldedFileOrder.findIndex((name) => fileA.file.relative.includes(name))
    const indexB = scaffoldedFileOrder.findIndex((name) => fileB.file.relative.includes(name))

    // any files w/o an explicit order go last
    if (indexA === -1) {
      return 1
    }

    if (indexB === -1) {
      return -1
    }

    // sort according to scaffoldedFileOrder
    return indexA - indexB
  })

  return orderedFiles
})

const needsChanges = computed(() => props.gql.scaffoldedFiles?.some((f) => f.status === 'changes'))

const mutation = useMutation(ScaffoldedFiles_CompleteSetupDocument)

const completeSetup = async () => {
  await mutation.executeMutation({})
}
</script>
