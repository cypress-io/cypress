<template>
  <div class="max-w-180 mx-auto m-y-4">
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
import { ConfigFilesFragment, ConfigFilesNavigateDocument } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import FileRow from '../components/code/FileRow.vue'
import { useMutation } from '@urql/vue'

const { t } = useI18n()

gql`
fragment ConfigFiles on Query {
  app {
    activeProject {
      id
      projectRoot
    }
  }
  wizard {
    ...SampleFiles
  }
}
`

gql`
fragment SampleFiles on Wizard {
  sampleConfigFiles {
    filePath
    content
    status
    description
    warningText
    warningLink
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

const props = defineProps<{
  gql: ConfigFilesFragment
}>()

const files = computed(() => props.gql.wizard.sampleConfigFiles)
const canNavigateForward = computed(() => props.gql.wizard.canNavigateForward)

const continueForward: any = () => {
  navigate.executeMutation({ direction: 'forward' })
}

const backFn:any = () => {
  navigate.executeMutation({ direction: 'back' })
}

</script>
