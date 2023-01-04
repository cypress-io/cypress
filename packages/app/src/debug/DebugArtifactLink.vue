<template>
  <Tooltip
    placement="bottom"
    :data-cy="`artifact-for-${icon}`"
  >
    <ExternalLink
      class="flex h-full w-full items-center justify-center"
      :data-cy="`${icon}-button`"
      :href="props.url || '#'"
      :use-default-hocus="true"
      :aria-label="popperText"
    >
      <component
        :is="ICON_MAP[icon]"
        stroke-color="gray-600"
        fill-color="gray-100"
        hocus-stroke-color="indigo-500"
        hocus-fill-color="indigo-100"
      />
    </ExternalLink>
    <template #popper>
      <span
        class="font-normal text-sm inline-flex"
        data-cy="tooltip-content"
      >
        {{ popperText }}
      </span>
    </template>
  </Tooltip>
</template>
<script lang="ts" setup>
import { IconTechnologyTerminalLog, IconTechnologyImageScreenshot, IconActionPlaySmall } from '@cypress-design/vue-icon'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { ArtifactType } from './types'

const props = defineProps<{
  icon: ArtifactType
  popperText: string
  url: string
}>()

const ICON_MAP: Record<ArtifactType, any> = {
  'TERMINAL_LOG': IconTechnologyTerminalLog,
  'IMAGE_SCREENSHOT': IconTechnologyImageScreenshot,
  'PLAY': IconActionPlaySmall,
}

</script>
