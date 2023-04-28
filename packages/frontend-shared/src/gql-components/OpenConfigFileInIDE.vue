<template>
  <OpenFileInIDE
    v-if="props.gql.configFileAbsolutePath"
    v-slot="{onClick}"
    :file-path="props.gql.configFileAbsolutePath"
  >
    <slot :on-click="onClick">
      <button
        data-testid="open-config-file"
        class="hocus-link-default decoration-purple-500"
        @click="onClick"
      >
        <span
          class="text-purple-500 cursor-pointer"
        >
          {{ props.gql.configFile ?? 'cypress.config.js' }}
        </span>
      </button>
    </slot>
  </OpenFileInIDE>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import OpenFileInIDE from './OpenFileInIDE.vue'
import type { OpenConfigFileInIdeFragment } from '../generated/graphql'

gql`
fragment OpenConfigFileInIDE on CurrentProject {
  id
  configFile
  configFileAbsolutePath
}
`

const props = defineProps<{
  gql: OpenConfigFileInIdeFragment
}>()
</script>
