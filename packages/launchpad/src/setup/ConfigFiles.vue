<template>
  <div class="max-w-220 mx-auto py-8">
    <FileRow
      v-for="file in files"
      :key="file.filePath"
      v-bind="file"
    />
    <hr class="my-4">
    <div class="flex gap-2">
      <Button
        size="lg"
        @click="continueForward"
      >
        {{ t('setupPage.step.continue') }}
      </Button>
      <Button
        size="lg"
        variant="outline"
        @click="backFn"
      >
        {{ t('setupPage.step.back') }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/core'
import { useMutation, useQuery } from '@urql/vue'
import { ConfigFilesDocument, ConfigFilesNavigateDocument } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import FileRow from '../components/code/FileRow.vue'

const { t } = useI18n()

gql`
query ConfigFiles {
  wizard {
    sampleConfigFiles {
      filePath
      content
      status
      description
      warningText
      warningLink
    }
  }
}
`

gql`
mutation ConfigFilesNavigate($direction: WizardNavigateDirection!) {
  wizardNavigate(direction: $direction) {
    ...WizardLayout
  }
}
`

const navigate = useMutation(ConfigFilesNavigateDocument)

const { data } = useQuery({
  query: ConfigFilesDocument,
})

const files = computed(() => data.value?.wizard.sampleConfigFiles)

const continueForward: any = () => {
  navigate.executeMutation({ direction: 'forward' })
}

const backFn:any = () => {
  navigate.executeMutation({ direction: 'back' })
}

</script>
