<template>
  <div class="flex flex-col justify-between flex-grow">
    <template v-if="!result">
      <div class="p-24px w-720px">
        <Input
          v-model="specFile"
          :placeholder="t('createSpec.e2e.importEmptySpec.inputPlaceholder')"
          :has-error="hasError"
        >
          <template #prefix>
            <i-cy-document-blank_x16 class="icon-light-gray-50 icon-dark-gray-300" />
          </template>
        </Input>

        <div
          v-if="hasError"
        >
          <div
            class="flex items-center font-medium rounded bg-error-100 p-16px gap-8px text-error-600"
          >
            <i-cy-errored-outline_x16 class="icon-dark-error-600" />
            <span>{{ t('createSpec.e2e.importEmptySpec.invalidSpecWarning') }}<b>specPattern</b>.</span>
          </div>

          <div class="mt-16px">
            <SpecPatterns
              :gql="{...props.gql}"
            />
          </div>
        </div>
        <div
          v-else-if="showExtensionWarning"
          class="flex items-center font-medium rounded bg-warning-100 p-16px mt-16px gap-8px text-warning-600"
        >
          <i-cy-errored-outline_x16 class="icon-dark-warning-600" />
          {{ t('createSpec.e2e.importEmptySpec.specExtensionWarning') }}<span class="rounded bg-warning-200 px-8px py-2px text-warning-700">{{ recommendedFileName }}</span>
        </div>
      </div>
      <StandardModalFooter
        v-if="!result"
        class="flex gap-16px"
      >
        <Button
          class="w-110px"
          :disabled="!isValidSpecFile"
          @click="createSpec"
        >
          {{ t('createSpec.createSpec') }}
        </Button>

        <Button
          variant="outline"
          @click="emits('restart')"
        >
          {{ t('components.button.cancel') }}
        </Button>
      </StandardModalFooter>
    </template>

    <template v-else>
      <GeneratorSuccess
        :file="result.file"
      />
      <StandardModalFooter
        class="flex items-center h-72px gap-16px"
      >
        <router-link
          class="outline-none"
          :to="{ path: '/specs/runner', query: { file: result.file.relative } }
          "
        >
          <Button
            :prefix-icon="TestResultsIcon"
            prefix-icon-class="w-16px h-16px icon-dark-white"
            @click="emits('close')"
          >
            {{ t('createSpec.successPage.runSpecButton') }}
          </Button>
        </router-link>
        <Button
          :prefix-icon="PlusButtonIcon"
          prefix-icon-class="w-16px h-16px icon-dark-gray-500"
          variant="outline"
          @click="emits('restart')"
        >
          {{ t('createSpec.successPage.createAnotherSpecButton') }}
        </Button>
      </StandardModalFooter>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from '@packages/frontend-shared/src/locales/i18n'
import Input from '@packages/frontend-shared/src/components/Input.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { useVModels, whenever } from '@vueuse/core'
import { gql, useMutation } from '@urql/vue'
import SpecPatterns from '../../SpecPatterns.vue'
import { EmptyGeneratorCardStepOneFragment, EmptyGeneratorCardStepOne_MatchSpecFileDocument, EmptyGeneratorCardStepOne_GenerateSpecDocument, GeneratorSuccessFragment } from '../../../generated/graphql'
import StandardModalFooter from '@packages/frontend-shared/src/components/StandardModalFooter.vue'
import GeneratorSuccess from '../GeneratorSuccess.vue'
import TestResultsIcon from '~icons/cy/test-results_x24.svg'
import PlusButtonIcon from '~icons/cy/add-large_x16.svg'

const props = defineProps<{
  title: string,
  gql: EmptyGeneratorCardStepOneFragment
}>()

const { t } = useI18n()

gql`
fragment EmptyGeneratorCardStepOne on Query {
  currentProject {
    id
    config
  }
  ...SpecPatterns
}
`

gql`
mutation EmptyGeneratorCardStepOne_MatchSpecFile($specFile: String!) {
  matchesSpecPattern (specFile: $specFile) 
}
`

gql`
mutation EmptyGeneratorCardStepOne_generateSpec($codeGenCandidate: String!, $type: CodeGenType!) {
  generateSpecFromSource(codeGenCandidate: $codeGenCandidate, type: $type) {
    ...GeneratorSuccess
  }
}`

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
  (event: 'restart'): void
  (event: 'close'): void
}>()

const { title } = useVModels(props, emits)

const specFile = ref('')

const matches = useMutation(EmptyGeneratorCardStepOne_MatchSpecFileDocument)
const writeFile = useMutation(EmptyGeneratorCardStepOne_GenerateSpecDocument)

const isValidSpecFile = ref(false)
const hasError = computed(() => !isValidSpecFile.value && !!specFile.value)

const result = ref<GeneratorSuccessFragment | null>(null)

whenever(result, () => {
  title.value = t('createSpec.successPage.header')
})

const createSpec = async () => {
  const { data } = await writeFile.executeMutation({ codeGenCandidate: specFile.value, type: 'e2e' })

  result.value = data?.generateSpecFromSource ?? null
}

watch(specFile, async (value) => {
  const result = await matches.executeMutation({ specFile: value })

  isValidSpecFile.value = result.data?.matchesSpecPattern ?? false
})

title.value = t('createSpec.e2e.importEmptySpec.header')

const showExtensionWarning = computed(() => isValidSpecFile.value && !specFile.value.includes('.cy'))
const recommendedFileName = computed(() => {
  const split = specFile.value.split('.')

  return `{filename}.cy.${split[split.length - 1]}`
})
</script>
