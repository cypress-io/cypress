<template>
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
        @click="emit('completeSetup')"
      >
        {{ t('setupPage.step.continue') }}
      </Button>
      <Button
        size="lg"
        variant="outline"
        @click="emit('navigate', 'installDependencies')"
      >
        {{ t('setupPage.step.back') }}
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
import type { CurrentStep } from './Wizard.vue'
import type { ConfigFilesFragment } from '../generated/graphql'

const emit = defineEmits<{
  (event: 'navigate', currentStep: CurrentStep): void
  (event: 'completeSetup')
}>()

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

const props = defineProps<{
  gql: ConfigFilesFragment
}>()
const files = computed(() => props.gql.sampleConfigFiles)

</script>
