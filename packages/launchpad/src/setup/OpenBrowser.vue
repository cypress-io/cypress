<template>
  <WizardLayout :canNavigateForward="false" :showNext="false">
    <img src="../images/success.svg" class="mx-auto my-10"/>
    <div class="flex justify-center">
      <Button
        v-for="browser of props.app.browsers"
        :key="browser.version"
        class="m-2"
      >
        {{ `${browser.displayName} v${browser.version}.x` }}
      </Button>
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { gql } from "@urql/core"
import Button from "../components/button/Button.vue"
import WizardLayout from "./WizardLayout.vue";
import type { OpenBrowserFragment } from "../generated/graphql"

gql`
fragment OpenBrowser on App {
  browsers {
    displayName
    version
    majorVersion
    name
  }
}
`

const props = defineProps<{
  app: OpenBrowserFragment
}>()
</script>
