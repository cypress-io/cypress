<template>
  <StandardModal
    class="transition transition-all duration-200"
    variant="bare"
    :title="title"
    :model-value="show"
    :help-link="helpLink"
    :no-help="!helpLink"
    data-cy="create-spec-modal"
    @update:model-value="close"
  >
    <template #overlay="{classes}">
      <DialogOverlay
        :class="classes"
        class="bg-gray-900 opacity-[0.97]"
      />
    </template>
    <div class="flex flex-col min-h-[280px] sm:min-w-[640px]">
      <component
        :is="generator.entry"
        v-if="generator"
        :key="`${generator.id}-${iteration}`"
        v-model:title="title"
        :gql="props.gql.currentProject"
        :type="props.gql.currentProject?.currentTestingType === 'e2e' ? props.gql.currentProject?.currentTestingType : 'componentEmpty'"
        :spec-file-name="specFileName"
        :other-generators="filteredGenerators.length > 1"
        @restart="currentGeneratorId = undefined; iteration++"
        @close="close"
      />
      <div
        v-else
        class="grow flex items-center self-center"
      >
        <CreateSpecCards
          :gql="props.gql"
          :generators="filteredGenerators"
          @select="currentGeneratorId = $event"
        />
      </div>
    </div>
  </StandardModal>
</template>

<script lang="ts" setup>
import { generators, getFilteredGeneratorList } from './generators'
import type { GeneratorId } from './generators'
import { DialogOverlay } from '@headlessui/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import CreateSpecCards from './CreateSpecCards.vue'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { CreateSpecModalFragment } from '../generated/graphql'
import { gql } from '@urql/vue'
import { not, whenever } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import { getPathForPlatform } from '../paths'

const props = defineProps<{
  initialGenerator?: GeneratorId
  show: boolean
  gql: CreateSpecModalFragment
}>()

const emits = defineEmits<{
  (eventName: 'close'): void
}>()

// When restarting the process re-paint the whole dialog
// on each restart we need to increment the iteration
// to have a different key for the generator
const iteration = ref(0)

gql`
fragment ComponentGeneratorStepOne_codeGenGlob on CurrentProject {
  id
  codeGenGlobs {
    id
    component
  }
  codeGenFramework
}
`

gql`
fragment CreateSpecModal on Query {
  ...CreateSpecCards
  currentProject {
    id
    fileExtensionToUse
    defaultSpecFileName
    ...ComponentGeneratorStepOne_codeGenGlob
    ...EmptyGenerator
  }
}
`

const currentGeneratorId: Ref<GeneratorId | undefined> = ref(props.initialGenerator)

const { t } = useI18n()
const title = ref(t('createSpec.newSpecModalTitle'))

const generator = computed(() => {
  if (currentGeneratorId.value) return generators[currentGeneratorId.value]

  return singleGenerator.value
})

const helpLink = computed(() => {
  if (title.value === t('createSpec.e2e.importFromScaffold.specsAddedHeader')) {
    return 'https://on.cypress.io/writing-and-organizing-tests'
  }

  return ''
})

const specFileName = computed(() => {
  return getPathForPlatform(props.gql.currentProject?.defaultSpecFileName || '')
})

const filteredGenerators = getFilteredGeneratorList(props.gql.currentProject)

const singleGenerator = computed(() => filteredGenerators.value.length === 1 ? filteredGenerators.value[0] : null)

whenever(not(generator), () => {
  title.value = t('createSpec.newSpecModalTitle')
})

function close () {
  currentGeneratorId.value = undefined
  emits('close')
}
</script>
