<template>
  <div
    class="h-full grid gap-9px grid-cols-[16px,auto] git-info-row items-center"
  >
    <Tooltip
      placement="top"
      class="h-full grid items-center"
      :skip-tooltip="!classes.showTooltip"
    >
      <component
        :is="classes.icon"
        :class="classes?.iconClasses"
      />
      <template
        v-if="classes.showTooltip"
        #popper
      >
        <div>
          <p class="max-w-sm text-sm truncate overflow-hidden">
            {{ props.gql.subject }}
          </p>
          <p class="text-xs">
            {{ gitTooltipSubtext }}
          </p>
        </div>
      </template>
    </Tooltip>
    <div
      class="overflow-hidden truncate"
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
      showTooltip: false,
    },
    modified: {
      icon: DocumentIconPlusMinus,
      iconClasses: 'icon-dark-orange-400 icon-light-orange-50',
      showTooltip: false,
    },
    unmodified: {
      icon: CommitIcon,
      iconClasses: 'icon-light-gray-500',
      showTooltip: true,
    },
  }[props.gql?.statusType || 'unmodified']
})

const gitTooltipSubtext = computed(() => {
  if (props.gql?.statusType === 'unmodified') {
    return t('specPage.rows.gitTooltipSubtext', {
      author: props.gql.author,
      shortHash: props.gql.shortHash,
    })
  }

  return ''
})

</script>
