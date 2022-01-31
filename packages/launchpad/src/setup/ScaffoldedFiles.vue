<template>
  <LaunchpadHeader
    :title="t('setupWizard.configFiles.title')"
    :description="t('setupWizard.configFiles.description')"
  />
  <div class="py-8 mx-auto max-w-220">
    <FileRow
      v-for="file in files"
      :key="file.file.id"
      :content="file.file.contents"
      :status="file.status"
      :file-path="file.file.relative"
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
import { ScaffoldedFilesFragment, ScaffoldedFiles_CompleteSetupDocument } from '../generated/graphql'
import { useMutation } from '@urql/vue'

const emit = defineEmits<{
  (event: 'completeSetup')
}>()

const { t } = useI18n()

gql`
mutation ScaffoldedFiles_completeSetup {
  completeSetup {
    currentProject {
      id
      isLoadingConfigFile
      isLoadingNodeEvents
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

const completeSetup = () => {
  mutation.executeMutation({})
}
</script>
