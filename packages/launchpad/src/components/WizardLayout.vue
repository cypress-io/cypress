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

<script lang="ts">
import { defineComponent, PropType } from "vue";
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

// gql`
// mutation WizardLayoutNavigateBack {
//   wizardNavigateBack {
//     ...WizardLayout
//   }
// }
// `

export default defineComponent({
  components: { ButtonBar },
  props: {
    next: {
      type: String,
      default: "Next Step",
    },
    back: {
      type: String,
      default: "Back",
    },
    alt: {
      type: String,
      default: undefined,
    },
    altFn: {
      type: Function as PropType<(val: boolean) => void>,
      default: undefined
    }
  },
  setup() {
    const navigate = useMutation(WizardLayoutNavigateDocument)

    function nextFn() {
      navigate.executeMutation({ direction: 'forward' })
    }

    function backFn() {
      navigate.executeMutation({ direction: 'back' })
    }

    return {
      nextFn,
      backFn,
    }
  }
});
</script>
