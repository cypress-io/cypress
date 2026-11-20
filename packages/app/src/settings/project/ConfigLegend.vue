<template>
  <div class="children:mb-[18px]">
    <ConfigBadge
      :class="CONFIG_LEGEND_COLOR_MAP.default"
      label="default"
    >
      Default values
    </ConfigBadge>

    <ConfigBadge
      :class="CONFIG_LEGEND_COLOR_MAP.config"
      label="config"
    >
      Set from
      <OpenConfigFileInIDE :gql="props.gql" />
    </ConfigBadge>

    <ConfigBadge
      :class="CONFIG_LEGEND_COLOR_MAP.env"
      label="env"
    >
      Set from environment variables
    </ConfigBadge>

    <ConfigBadge
      :class="CONFIG_LEGEND_COLOR_MAP.cli"
      label="cli"
    >
      Set from CLI arguments
    </ConfigBadge>

    <ConfigBadge
      :class="CONFIG_LEGEND_COLOR_MAP.plugin"
      label="dynamic"
    >
      Set by the
      <ExternalLink
        href="https://on.cypress.io/setup-node-events"
        class="text-purple-500"
      >
        setupNodeEvents
      </ExternalLink>
      function
    </ConfigBadge>
  </div>
</template>

<script lang="ts" setup>
import ConfigBadge from './ConfigBadge.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { CONFIG_LEGEND_COLOR_MAP } from './ConfigSourceColors'
import OpenConfigFileInIDE from '@packages/frontend-shared/src/gql-components/OpenConfigFileInIDE.vue'
import type { OpenConfigFileInIdeFragment } from '../../generated/graphql'

const props = defineProps<{
  gql: OpenConfigFileInIdeFragment
}>()
</script>
