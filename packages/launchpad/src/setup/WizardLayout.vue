<template>
  <div
    class="      
      max-w-3xl
      min-h-70
      mx-auto
      border-1 border-gray-200
      rounded
      m-10
      flex flex-col
    "
  >
    <div class="flex-grow">
      <slot />
    </div>
    <ButtonBar 
      :nextFn="nextFn" 
      :canNavigateForward="canNavigateForward"
      :backFn="backFn" 
      :altFn="altFn" 
      :next="nextLabel" 
      :back="backLabel" 
      :alt="alt" 
    />
  </div>
</template>

<script lang="ts" setup>
import ButtonBar from "./ButtonBar.vue"
import { computed } from "vue"
import { useMutation, gql } from '@urql/vue'
import { WizardLayoutFragment, WizardLayoutNavigateDocument } from "../generated/graphql"
import { useI18n } from "../composables"

gql`
fragment WizardLayout on Wizard {
  step
  canNavigateForward
}
`

gql`
mutation WizardLayoutNavigate($direction: WizardNavigateDirection!) {
  wizardNavigate(direction: $direction) {
    ...WizardLayout
  }
}
`

const { t } = useI18n()

const props = defineProps<{
    next?: string
    back?: string
    alt?: string
    canNavigateForward?: boolean
    altFn?: (val: boolean) => void
    nextFn?: (...args: unknown[]) => any,
}>()

const nextLabel = computed(() => props.next || t('setupPage.step.next'))
const backLabel = computed(() => props.back || t('setupPage.step.back'))

const navigate = useMutation(WizardLayoutNavigateDocument)

async function nextFn() {
  await props.nextFn?.()
  navigate.executeMutation({ direction: 'forward' })
}

function backFn() {
  navigate.executeMutation({ direction: 'back' })
}
</script>
