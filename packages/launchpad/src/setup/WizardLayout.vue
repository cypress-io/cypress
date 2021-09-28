<template>
  <div :class="noContainer ? wrapperClasses['no-container'] : wrapperClasses.default">
    <div class="flex-grow">
      <slot :backFn="backFn" />
    </div>

    <ButtonBar
      v-if="!noContainer"
      :nextFn="nextFn"
      :canNavigateForward="canNavigateForward"
      :backFn="backFn"
      :altFn="altFn"
      :next="nextLabel"
      :showNext="showNext"
      :back="backLabel"
      :alt="alt"
    >
      <slot name="button-bar"></slot>
    </ButtonBar>
  </div>
</template>

<script lang="ts" setup>
import ButtonBar from "./ButtonBar.vue"
import { computed } from "vue"
import { useMutation } from '@urql/vue'
import { gql } from '@urql/core'
import { WizardLayoutNavigateDocument } from "../generated/graphql"
import { useI18n } from "@cy/i18n"

gql`
fragment WizardLayout on Wizard {
  title
  description
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

const props = withDefaults(
  defineProps<{
    next?: string
    back?: string
    alt?: string
    showNext?: boolean
    canNavigateForward?: boolean
    noContainer?: boolean
    altFn?: (val: boolean) => void
    nextFn?: (...args: unknown[]) => any,
  }>(), {
  showNext: true
})

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

const wrapperClasses = {
  'default': "max-w-3xl min-h-70 mx-auto border-1 border-gray-200 rounded m-10 flex flex-col",
  'no-container': ''
}

</script>
