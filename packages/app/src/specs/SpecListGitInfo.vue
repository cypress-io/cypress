<template>
  <div class="h-full grid gap-9px grid-cols-[16px,auto] git-info-row items-center">
    <span class="flex w-16px items-center justify-center">
      <span
        v-if="fileState !== 'unmodified'"
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
import { useTimeAgo } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import DocumentIconPlus from '~icons/cy/document-plus_x16'
import DocumentIconPlusMinus from '~icons/cy/document-plus-minus_x16'
import DocumentIconMinus from '~icons/cy/document-minus_x16'
import IconGithub from '~icons/cy/github'

const { t } = useI18n()

gql`
fragment SpecListRow on GitInfo {
  lastModifiedTimestamp
  author
}
`

const props = defineProps<{
  gql: SpecListRowFragment
}>()

const gitInfo = computed(() => props.gql)
const timeAgo = useTimeAgo(gitInfo.value.lastModifiedTimestamp || '')

// TODO UNIFY-863: File state needs to come from git,
// but the data context doesn't contain this info yet
const fileState = computed(() => gitInfo.value ? 'unmodified' : 'modified')

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
    deleted: {
      indicator: 'border-red-400 bg-red-300',
      gitText: 'text-red-500',
      iconClasses: 'icon-dark-red-400 icon-light-red-50',
      icon: DocumentIconMinus,
    },
  }[fileState.value]
})

const gitInfoText = computed(() => {
  if (fileState.value === 'unmodified') {
    // Modified x days ago by AuthorName
    return t('specPage.rows.gitInfoWithAuthor', {
      fileState: t('file.git.modified'),
      timeAgo: timeAgo.value,
      author: gitInfo.value.author,
    })
  }

  // TODO UNIFY-863: implement the backend for git to report this info
  // Created|Deleted|Modified x days ago by AuthorName
  return t('specPage.rows.gitInfo', {
    fileState: t(`file.git.${fileState.value}`),
    timeAgo: timeAgo.value,
  })
})
</script>
