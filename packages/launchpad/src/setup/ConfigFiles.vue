<template>
  <div class="py-8 mx-auto max-w-220">
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
import { ConfigFilesFragment, ConfigFilesNavigateDocument } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import FileRow from '../components/code/FileRow.vue'

const { t } = useI18n()

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

gql`
mutation ConfigFilesNavigate($input: WizardUpdateInput!) {
  wizardUpdate(input: $input)
}
`

const navigate = useMutation(ConfigFilesNavigateDocument)

const props = defineProps<{
  gql:ConfigFilesFragment
}>()
const files = computed(() => props.gql.sampleConfigFiles)

const continueForward: any = () => {
  // TODO: check that all the files have been fixed
  // if not diplay the same screen again with errors
  navigate.executeMutation({ input: { direction: 'forward', testingType: null } })
}

const backFn:any = () => {
  navigate.executeMutation({ input: { direction: 'back', testingType: null } })
}

</script>
