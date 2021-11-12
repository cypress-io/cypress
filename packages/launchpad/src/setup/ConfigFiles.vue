<template>
  <HeadingText
    :title="t('setupPage.configFile.title')"
    :description="t('setupPage.configFile.description')"
  />
  <div class="py-8 mx-auto max-w-220">
    <FileRow
      v-for="file in files"
      :key="file.filePath"
      v-bind="file"
      :description="file.description || undefined"
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
import type { ConfigFilesFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import FileRow from '../components/code/FileRow.vue'
import { useWizardStore } from '../store/wizardStore'
import WizardLayout from './WizardLayout.vue'
import HeadingText from './HeadingText.vue'

const wizardStore = useWizardStore()

const { t } = useI18n()

gql`
mutation ConfigFiles_CompleteWizard {
  completeOnboarding {
    currentProject {
      id
      title
    }
  }
}
`

gql`
fragment ConfigFiles on Wizard {
  sampleConfigFiles {
    id
    filePath
    content
    status
    description
  }
}
`

const props = defineProps<{
  gql: ConfigFilesFragment
}>()
const files = computed(() => props.gql.sampleConfigFiles)

const continueForward: any = () => {
  // TODO: mutation to "complete" the wizard workflow
}

const canNavigateForward: any = () => {
  //
}

const backFn: any = () => {
  wizardStore.setWizardStep('installDependencies')
}

</script>
