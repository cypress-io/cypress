<template>
  <span>
    <div class="p-24px">
      <Input
        v-model="specFile"
        placeholder="Enter spec file ..."
      >
        <template #prefix>
          <i-cy-document-blank_x16 class="icon-light-gray-50 icon-dark-gray-300 min-w-16px min-h-16px" />
        </template>
      </Input>

      <Warning
        v-if="recommendedFilename"
        class="mt-16px"
      >
        We recommend naming your spec with the pattern
        <code class="text-purple-600 bg-purple-100 rounded p-2px">
          {{ recommendedFilename }}
        </code>

      </Warning>

      <Error
        v-if="!isValidSpecFile"
        class="mt-16px"
      >
        Your filename is invalid because it doesn't match the follow <b>specPattern</b>.
      </Error>

      <div class="mt-16px">
        <SpecPatterns
          :gql="{...props.gql}"
        />
      </div>
    </div>

    <StandardModalFooter class="flex gap-16px">
      <Button
        class="w-110px"
        :disabled="!isValidSpecFile"
        @click="createSpec"
      >
        {{ done ? t('createSpec.done') : t('createSpec.createSpec') }}
      </Button>

      <Button
        variant="outline"
        @click="emits('restart')"
      >
        {{ t('components.button.cancel') }}
      </Button>
    </StandardModalFooter>
  </span>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from '@packages/frontend-shared/src/locales/i18n'
import Input from '@packages/frontend-shared/src/components/Input.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import Error from '@packages/frontend-shared/src/components/Error.vue'
import Warning from '@packages/frontend-shared/src/components/Warning.vue'
import { useVModels } from '@vueuse/core'
import { gql, useMutation } from '@urql/vue'
import SpecPatterns from '../../SpecPatterns.vue'
import { EmptyGeneratorCardStepOneFragment, EmptyGeneratorCardStepOne_MatchSpecFileDocument, EmptyGeneratorCardStepOne_WriteFileDocument } from '../../../generated/graphql'
import StandardModalFooter from '@packages/frontend-shared/src/components/StandardModalFooter.vue'

const props = defineProps<{
  title: string,
  gql: EmptyGeneratorCardStepOneFragment
}>()

const { t } = useI18n()

gql`
fragment EmptyGeneratorCardStepOne on CurrentProject {
  id
  config
  ...SpecPatterns
}
`

gql`
mutation EmptyGeneratorCardStepOne_MatchSpecFile($specFile: String!) {
  matchesSpecPattern (specFile: $specFile) 
}
`

gql`
mutation EmptyGeneratorCardStepOne_WriteFile ($file: String!) {
  writeFileRelativeToProjectRoot(file: $file)
}
`

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
  (event: 'restart'): void
}>()

const { title } = useVModels(props, emits)

const specFile = ref('')

const matches = useMutation(EmptyGeneratorCardStepOne_MatchSpecFileDocument)
const writeFile = useMutation(EmptyGeneratorCardStepOne_WriteFileDocument)

const isValidSpecFile = ref(false)
const done = ref(false)

const recommendedFilename = computed(() => {
  if (isValidSpecFile.value && specFile.value.includes('.cy.')) {
    return false
  }

  if (!isValidSpecFile.value) {
    return false
  }

  if (specFile.value.endsWith('ts')) {
    return 'filename.cy.ts'
  }

  return 'filename.cy.js'
})

const createSpec = async () => {
  await writeFile.executeMutation({ file: specFile.value })
  done.value = true
  window.setTimeout(() => {
    done.value = false
  }, 1000)
}

watch(specFile, async (value) => {
  const result = await matches.executeMutation({ specFile: value })

  isValidSpecFile.value = result.data?.matchesSpecPattern ?? false
})

title.value = t('createSpec.e2e.importEmptySpec.header')
</script>
