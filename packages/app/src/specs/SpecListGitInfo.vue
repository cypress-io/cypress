<template>
  <div
    class="h-full grid grid-col-1 git-info-row justify-start items-center"
    data-cy="git-info-row"
  >
    <Tooltip
      v-if="classes.icon"
      :key="props.gql?.statusType ?? undefined"
      placement="top"
      class="h-full truncate"
      data-cy="tooltip"
    >
      <button class="flex h-full w-full gap-[9px] justify-start items-center">
        <div>
          <component
            :is="classes.icon"
            :class="classes.iconClasses"
            :data-cy="classes.testId"
          />
        </div>
        <div
          class="text-gray-700 overflow-hidden truncate"
        >
          {{ props.gql?.lastModifiedHumanReadable ?? '' }}
        </div>
      </button>
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
import DocumentIconPlus from '~icons/cy/document-plus_x16'
import DocumentIconPlusMinus from '~icons/cy/document-plus-minus_x16'
import CommitIcon from '~icons/cy/commit_x14'

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

const classes = computed(() => {
  return {
    created: {
      icon: DocumentIconPlus,
      iconClasses: 'icon-dark-jade-400 icon-light-jade-50',
      testId: 'created-icon',
    },
    modified: {
      icon: DocumentIconPlusMinus,
      iconClasses: 'icon-dark-orange-400 icon-light-orange-50',
      testId: 'modified-icon',
    },
    unmodified: {
      icon: CommitIcon,
      iconClasses: 'icon-light-gray-500',
      testId: 'unmodified-icon',
    },
    noGitInfo: {},
  }[props.gql?.statusType || 'unmodified']
})

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
