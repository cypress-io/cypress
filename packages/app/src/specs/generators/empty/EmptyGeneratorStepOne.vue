<template>
  <!-- <div>Content</div> -->
  <div class="flex-grow">
    <div
      v-if="mutation.fetching.value"
      class="inline-flex items-center w-full justify-center mt-48px"
    >
      <i-cy-loading_x16 class="animate-spin w-48px h-48px mr-12px" />
      <p class="text-lg">
        Loading
      </p>
    </div>
    <NewFileInput
      v-else-if="!result"
      v-model="fileName"
    />
    <GeneratorSuccess
      v-else
      :file="result"
    />
  </div>
  <div>
    <StandardModalFooter
      class="h-72px flex gap-16px children:(inline-flex w-full gap-12px)"
    >
      <div
        v-if="!result"
      >
        <Button
          size="lg"
          :disabled="!fileName.length"
          @click="makeSpec"
        >
          {{ t('createSpec.e2e.importEmptySpec.createSpecButton') }}
        </Button>
        <Button
          size="lg"
          variant="outline"
          @click="$emit('close')"
        >
          {{ t('components.button.cancel') }}
        </Button>
      </div>
      <div v-else>
        <router-link
          class="outline-none"
          :to="{ path: 'runner', query: { file: result.spec.relative } }
          "
        >
          <Button
            size="lg"
            :prefix-icon="TestResultsIcon"
            prefix-icon-class="w-16px h-16px icon-dark-white"
          >
            {{ t('createSpec.successPage.runSpecButton') }}
          </Button>
        </router-link>
        <Button
          size="lg"
          :prefix-icon="PlusButtonIcon"
          prefix-icon-class="w-16px h-16px icon-dark-gray-500"
          variant="outline"
          @click="$emit('restart')"
        >
          {{ t('createSpec.successPage.createAnotherSpecButton') }}
        </Button>
      </div>
    </StandardModalFooter>
  </div>
</template>

<script lang="ts">
import BaseGenerator from '../BaseGenerator.vue'

export default { extends: BaseGenerator }
</script>

<script setup lang="ts">
import { useVModels, whenever } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import NewFileInput from '../NewFileInput.vue'
import GeneratorSuccess from '../GeneratorSuccess.vue'
import { ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import { EntryGeneratorStepOne_GenerateSpecDocument } from '../../../generated/graphql'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import PlusButtonIcon from '~icons/cy/add-large_x16.svg'
import TestResultsIcon from '~icons/cy/test-results_x24.svg'

const props = defineProps<{
  title: string,
}>()

const { t } = useI18n()

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'restart'): void,
  (event: 'close'): void
}>()

const fileName = ref('')
const { title } = useVModels(props, emits)

title.value = t('createSpec.e2e.importEmptySpec.chooseFilenameHeader')

gql`
mutation EntryGeneratorStepOne_generateSpec($codeGenCandidate: String!, $type: CodeGenType!) {
  generateSpecFromSource(codeGenCandidate: $codeGenCandidate, type: $type) {
    id
    ...GeneratorSuccess
  }
}`

const mutation = useMutation(EntryGeneratorStepOne_GenerateSpecDocument)

const result = ref()

whenever(result, () => {
  title.value = t('createSpec.successPage.header')
})

const makeSpec = async () => {
  const { data } = await mutation.executeMutation({
    codeGenCandidate: `${fileName.value}`,
    type: 'integration',
  })

  result.value = data?.generateSpecFromSource
}

</script>
