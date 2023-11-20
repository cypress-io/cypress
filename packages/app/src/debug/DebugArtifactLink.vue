<template>
  <Tooltip
    placement="bottom"
    :data-cy="`artifact-for-${icon}`"
    :distance="8"
  >
    <ExternalLink
      class="flex h-[24px] w-[24px] justify-center items-center hocus:rounded-md group hocus:border-[1px] hocus:border-indigo-500"
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
        interactive-colors-on-group
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
import { IconTechnologyTerminalLog, IconTechnologyImageScreenshot, IconActionPlaySmall, IconActionTestReplay } from '@cypress-design/vue-icon'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { ArtifactType } from './utils/debugArtifacts'

const props = defineProps<{
  icon: ArtifactType
  popperText: string
  url: string
}>()

const ICON_MAP: Record<ArtifactType, any> = {
  'TERMINAL_LOG': IconTechnologyTerminalLog,
  'IMAGE_SCREENSHOT': IconTechnologyImageScreenshot,
  'PLAY': IconActionPlaySmall,
  'REPLAY': IconActionTestReplay,
}

</script>
