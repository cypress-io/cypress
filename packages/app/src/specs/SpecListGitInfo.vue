<template>
  <div
    class="h-full grid grid-col-1 git-info-row justify-start items-center"
    data-cy="git-info-row"
  >
    <Tooltip
      v-if="['unmodified', 'modified', 'created'].includes(props.gql?.statusType ?? '')"
      :key="props.gql?.statusType ?? undefined"
      placement="top"
      class="h-full truncate"
      data-cy="tooltip"
    >
      <div class="flex h-full gap-9px justify-start items-center">
        <div>
          <!-- <component
            :is="classes.icon"
            :class="classes.iconClasses"
            :data-cy="classes.testId"
          /> -->
          <svg
            v-if="props.gql?.statusType === 'unmodified'"
            width="14"
            height="8"
            viewBox="0 0 14 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="icon-light-gray-500"
            data-cy="unmodified-icon"
          >
            <path
              d="M10 4C10 5.65685 8.65685 7 7 7C5.34315 7 4 5.65685 4 4C4 2.34315 5.34315 1 7 1C8.65685 1 10 2.34315 10 4Z"
              fill="#E1E3ED"
            />
            <path
              d="M10 4C10 5.65685 8.65685 7 7 7C5.34315 7 4 5.65685 4 4M10 4C10 2.34315 8.65685 1 7 1C5.34315 1 4 2.34315 4 4M10 4H13M4 4H1"
              stroke="#9095AD"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg
            v-else-if="props.gql?.statusType === 'modified'"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="icon-dark-orange-400 icon-light-orange-50"
            data-cy="modified-icon"
          >
            <path
              d="M3 15C2.44772 15 2 14.5523 2 14V2C2 1.44772 2.44772 1 3 1L13 1C13.5523 1 14 1.44772 14 2V14C14 14.5523 13.5523 15 13 15H3Z"
              fill="#D0D2E0"
              class="icon-light"
            />
            <path
              d="M6 6.5H10M8 8.5V4.5M6 11.5H10M13 1L3 1C2.44772 1 2 1.44772 2 2V14C2 14.5523 2.44772 15 3 15H13C13.5523 15 14 14.5523 14 14V2C14 1.44772 13.5523 1 13 1Z"
              stroke="#1B1E2E"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon-dark"
            />
          </svg>
          <svg
            v-else-if="props.gql?.statusType === 'created'"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="icon-dark-jade-400 icon-light-jade-50"
            data-cy="created-icon"
          >
            <path
              d="M3 15C2.44772 15 2 14.5523 2 14V2C2 1.44772 2.44772 1 3 1H13C13.5523 1 14 1.44772 14 2V14C14 14.5523 13.5523 15 13 15H3Z"
              fill="#D0D2E0"
              class="icon-light"
            />
            <path
              d="M6 8H10M8 10V6M13 1H3C2.44772 1 2 1.44772 2 2V14C2 14.5523 2.44772 15 3 15H13C13.5523 15 14 14.5523 14 14V2C14 1.44772 13.5523 1 13 1Z"
              stroke="#1B1E2E"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon-dark"
            />
          </svg>
        </div>
        <div
          class="text-gray-700 overflow-hidden truncate"
        >
          {{ props.gql?.lastModifiedHumanReadable ?? '' }}
        </div>
      </div>
      <template
        #popper
      >
        <div data-cy="git-info-tooltip">
          <p class="max-w-sm text-sm truncate overflow-hidden">
            {{ tooltipMainText }}
          </p>
          <p
            v-if="tooltipSubtext"
            class="text-xs"
          >
            {{ tooltipSubtext }}
          </p>
        </div>
      </template>
    </Tooltip>
    <div
      v-else
      class="text-gray-700 overflow-hidden truncate"
    >
      {{ props.gql?.lastModifiedHumanReadable ?? '' }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import type { SpecListRowFragment } from '../generated/graphql'
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'

const { t } = useI18n()

gql`
fragment SpecListRow on GitInfo {
  lastModifiedTimestamp
  lastModifiedHumanReadable
  author
  statusType
  shortHash
  subject
}
`

const props = defineProps<{
  gql: SpecListRowFragment
}>()

const tooltipMainText = computed(() => {
  switch (props.gql?.statusType) {
    case 'unmodified': return props.gql?.subject
    case 'created': return t('file.git.created')
    case 'modified': return t('file.git.modified')
    default: return null
  }
})

const tooltipSubtext = computed(() => {
  if (props.gql?.statusType === 'unmodified') {
    return t('specPage.rows.gitTooltipSubtext', {
      author: props.gql.author,
      shortHash: props.gql.shortHash,
    })
  }

  return ''
})

</script>
