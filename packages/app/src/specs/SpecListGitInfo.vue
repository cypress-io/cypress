<template>
  <div class="h-full grid gap-9px grid-cols-[16px,auto] git-info-row items-center">
    <span
      class="flex w-16px items-center justify-center"
      :data-cy="`git-status-${props.gql.statusType}`"
    >
      <span
        v-if="props.gql.statusType !== 'unmodified'"
        class="rounded-full border-1 min-w-6px min-h-6px max-w-6px max-h-6px"
        :class="classes?.indicator"
      />
      <IconGithub
        v-else
        class="min-w-16px min-h-16px max-w-16px max-h-16px icon-dark-gray-300 group-hocus:icon-dark-indigo-500"
      />
    </span>
    <div
      class="overflow-hidden truncate"
      :class="classes?.gitText"
    >
      {{ gitInfoText }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import type { SpecListRowFragment } from '../generated/graphql'
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import DocumentIconPlus from '~icons/cy/document-plus_x16'
import DocumentIconPlusMinus from '~icons/cy/document-plus-minus_x16'
import IconGithub from '~icons/cy/github'

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
      indicator: 'border-jade-400 bg-jade-300',
      gitText: 'text-jade-500',
      icon: DocumentIconPlus,
      iconClasses: 'icon-dark-jade-400 icon-light-jade-50',
    },
    modified: {
      indicator: 'border-orange-400 bg-orange-300',
      gitText: 'text-orange-500',
      icon: DocumentIconPlusMinus,
      iconClasses: 'icon-dark-orange-400 icon-light-orange-50',
    },
    unmodified: {
      indicator: 'border-transparent bg-transparent',
      gitText: 'text-gray-600 group-hocus:text-indigo-500',
    },
  }[props.gql.statusType || 'modified']
})

const gitInfoText = computed(() => {
  if (props.gql.statusType === 'unmodified') {
    return t('specPage.rows.gitInfoWithAuthor', {
      fileState: t(`file.git.${props.gql.statusType}`),
      timeAgo: props.gql.lastModifiedHumanReadable,
      author: props.gql.author,
    })
  }

  return t('specPage.rows.gitInfo', {
    fileState: t(`file.git.${props.gql.statusType}`),
    timeAgo: props.gql.lastModifiedHumanReadable,
  })
})
</script>
