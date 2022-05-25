<template>
  <div
    class="h-full grid gap-9px git-info-row items-center"
    :class="{'grid-cols-[16px,auto]': classes.icon}"
    data-cy="git-info-row"
  >
    <Tooltip
      v-if="classes.icon"
      :key="props.gql?.statusType ?? undefined"
      placement="top"
      class="h-full grid items-center"
    >
      <component
        :is="classes.icon"
        :class="classes.iconClasses"
      />
      <template
        #popper
      >
        <div>
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
    },
    modified: {
      icon: DocumentIconPlusMinus,
      iconClasses: 'icon-dark-orange-400 icon-light-orange-50',
    },
    unmodified: {
      icon: CommitIcon,
      iconClasses: 'icon-light-gray-500',
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
