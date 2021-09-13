<template>
        <Button
          v-for="browser of props.gql.browsers"
          :key="browser.version"
          class="m-2"
        >
          {{ `${browser.displayName} v${browser.version}.x` }}
        </Button>
     
</template>

<script lang="ts" setup>
import { gql } from "@urql/core";
import type { OpenBrowserListFragment } from "../generated/graphql"

gql`fragment OpenBrowserList on App {
  browsers {
      name
      family
      channel
      displayName
      path
      version
      majorVersion
  }
}`

const props = defineProps<{
  gql: OpenBrowserListFragment
}>()

</script>
