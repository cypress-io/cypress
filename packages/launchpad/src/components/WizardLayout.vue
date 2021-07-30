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
import { defineComponent } from "vue";
import ButtonBar from "./ButtonBar.vue";
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import { WizardLayoutNavigateForwardDocument, WizardLayoutNavigateBackDocument } from "../generated/graphql";

gql`
fragment WizardLayout on Wizard {
  step
  canNavigateForward
}
`

gql`
mutation WizardLayoutNavigateForward {
  wizardNavigateForward {
    ...WizardLayout
  }
}
`

gql`
mutation WizardLayoutNavigateBack {
  wizardNavigateBack {
    ...WizardLayout
  }
}
`

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
      type: Function,
      default: undefined
    }
  },
  setup(props) {
    const navigateForward = useMutation(WizardLayoutNavigateForwardDocument)
    const navigateBack = useMutation(WizardLayoutNavigateBackDocument)

    function nextFn() {
      navigateForward.executeMutation({})
    }

    function backFn() {
      navigateBack.executeMutation({})
    }

    return {
      nextFn,
      backFn,
      altFn: props.altFn
    }
  }
});
</script>
