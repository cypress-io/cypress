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
        {{ tooltipText }}
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
import IconGit from '~icons/cy/git_x16'

const { t } = useI18n()

gql`
fragment SpecListRow on GitInfo {
  lastModifiedTimestamp
  lastModifiedHumanReadable
  author
  statusType
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
      icon: IconGit,
      showTooltip: true,
    },
  }[props.gql?.statusType || 'unmodified']
})

const tooltipText = computed(() => {
  if (props.gql?.statusType === 'unmodified') {
    return t('specPage.rows.gitTooltip', {
      author: props.gql.author,
    })
  }

  return ''
})

</script>
