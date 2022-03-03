<template>
  <div v-if="specStore.activeSpec">
    <SpecRunnerOpenMode
      v-if="initialized"
      :gql="props.gql"
    />
  </div>

  <div v-else>
    Error, no spec matched!
  </div>
</template>

<script lang="ts" setup>
import { computed, watchEffect } from 'vue'
import type { SpecRunnerFragment } from '../generated/graphql'
import type { ResolvedConfigProp } from '../types'
import { useAutStore, useSpecStore, viewportDefaults } from '../store'
import SpecRunnerOpenMode from './SpecRunnerOpenMode.vue'
import { useUnifiedRunner } from './unifiedRunner'

const props = defineProps<{
  gql: SpecRunnerFragment
}>()

const specStore = useSpecStore()
const autStore = useAutStore()

watchEffect(() => {
  /**
   * In open mode, we want to support updating cypress.config.js
   * without restarting the runner. On the server we watch
   * the config file for changes and propagate a data-context-push
   * event which causes all the GraphQL queries to retrigger.
   * As part of this, we receive the latest config values in props.gql,
   * such as viewportHeight, viewportWidth, etc.
   * Unfortunately, we  still rely on the static window.UnifiedRunner.config
   * when initializing the driver, so we need to update that, too.
   */
  const fields = ['viewportWidth', 'viewportHeight'] as const
  const [viewportWidth, viewportHeight] = fields.map((field) => {
    const prop = props.gql.currentProject?.config?.find((x: ResolvedConfigProp) => x.field === field)

    return prop?.value ?? viewportDefaults[window.__CYPRESS_TESTING_TYPE__][field]
  })

  autStore.updateDimensions(viewportWidth, viewportHeight)

  if (!window.UnifiedRunner?.config) {
    return
  }

  for (const prop of (props.gql.currentProject?.config as ResolvedConfigProp[])) {
    // // Don't change things from null -> undefined.
    // if (prop.value === null || prop.value === undefined) {
    //   continue
    // }

    window.UnifiedRunner.config[prop.field] = prop.value
  }
})

const { initialized, watchSpec } = useUnifiedRunner()

const specs = computed(() => {
  return props.gql.currentProject?.specs ?? []
})

watchSpec(specs)
</script>
