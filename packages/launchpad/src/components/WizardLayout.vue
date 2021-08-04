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
    <ButtonBar :nextFn="nextFn" :backFn="backFn" :altFn="altFn" :next="next" :back="back" :alt="alt" />
  </div>
</template>

<script lang="ts" setup>
import ButtonBar from "./ButtonBar.vue";
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import { WizardLayoutNavigateDocument } from "../generated/graphql";

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

const props = withDefaults(
  defineProps<{
    next: string
    back: string
    alt?: string
    altFn?: (val: boolean) => void
    nextFn?: (...args: unknown[]) => any
}>(), {
  next: 'Next Step',
  back: 'Back Step',
})

const navigate = useMutation(WizardLayoutNavigateDocument)

async function nextFn() {
  await props.nextFn?.()
  navigate.executeMutation({ direction: 'forward' })
}

function backFn() {
  navigate.executeMutation({ direction: 'back' })
}
</script>
