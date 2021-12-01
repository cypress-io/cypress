<template>
  <div class="px-24px">
    <Input
      v-model="specFile"
      placeholder="Enter spec file ..."
    />
    <!-- <div>
      You are ignoring: {{ ignoreTestFiles }}.
    </div> -->

    <Error v-if="!isValidSpecFile">
      Your filename is invalid because it doesn't match the follow <b>specPattern</b>.
    </Error>

    <Button
      :disabled="!isValidSpecFile"
      @click="createSpec"
    >
      Create
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from '@packages/frontend-shared/src/locales/i18n'
import Input from '@packages/frontend-shared/src/components/Input.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import Error from '@packages/frontend-shared/src/components/Error.vue'
import { useVModels } from '@vueuse/core'
import { gql, useMutation } from '@urql/vue'
import { EmptyGeneratorCardStepOne_MatchSpecFileDocument } from '../../../generated/graphql'

const props = defineProps<{
  title: string,
  projectConfig: Array<{ from: string, value: string, field: string }>
}>()

const { t } = useI18n()

gql`
fragment EmptyGeneratorCardStepOne on CurrentProject {
  id
  config
}
`

gql`
mutation EmptyGeneratorCardStepOne_MatchSpecFile($specFile: String!) {
  matchesSpecPattern (specFile: $specFile) 
}
`

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
  (event: 'restart'): void
}>()

const { title } = useVModels(props, emits)

const testFiles = computed<string[]>(() => {
  const val = props.projectConfig.find((x) => x.field === 'testFiles')?.value ?? []

  return typeof val === 'string' ? [val] : val
})

const ignoreTestFiles = computed<string[]>(() => {
  const val = props.projectConfig.find((x) => x.field === 'ignoreTestFiles')?.value ?? []

  return typeof val === 'string' ? [val] : val
})

const specFile = ref('')

const matches = useMutation(EmptyGeneratorCardStepOne_MatchSpecFileDocument)
const isValidSpecFile = ref(false)

const createSpec = () => {
}

watch(specFile, async (value) => {
  const result = await matches.executeMutation({ specFile: value })

  isValidSpecFile.value = result.data?.matchesSpecPattern ?? false
})

title.value = t('createSpec.e2e.importEmptySpec.header')
</script>
