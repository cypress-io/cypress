<template>
  <div class="outline-none children:cursor-pointer group">
    <div class="grid grid-cols-[16px,auto,auto] items-center gap-10px">
      <component :class="icon.classes" :is="icon.component"></component>
      <div>
        <span class="font-medium text-gray-700 group-hocus:text-indigo-500">{{ specNameParts(spec?.name).name }}</span>
        <span class="font-light text-gray-400 group-hocus:text-indigo-500">{{ specNameParts(spec?.name).extension }}</span>
      </div>
    </div>
    <div class="grid git-info-row grid-cols-[16px,auto] items-center gap-9px">
      <span class="flex items-center justify-center w-16px">
      <span v-if="fileState !== 'unmodified'"
        class="rounded-full min-w-6px max-w-6px min-h-6px max-h-6px border-1"
        :class="classes?.indicator"
      />
      <IconGithub v-else class="min-w-16px max-w-16px min-h-16px icon-dark-gray-300 group-hocus:icon-dark-indigo-500 max-h-16px"/>      
      </span>
      <div :class="classes?.gitText"> {{ gitInfoText }} </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import type { SpecListRowFragment } from '../generated/graphql'
import faker from 'faker'
import { computed, ref } from 'vue'
import { useTimeAgo } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import DocumentIconBlank from '~icons/cy/document-blank_x16'
import DocumentIconPlus from '~icons/cy/document-plus_x16'
import DocumentIconPlusMinus from '~icons/cy/document-plus-minus_x16'
import DocumentIconMinus from '~icons/cy/document-minus_x16'
import IconGithub from '~icons/cy/github'

const { t } = useI18n()
gql`
fragment SpecListRow on SpecEdge {
  node {
    id
    absolute
    name
    gitInfo {
      author
      lastModifiedHumanReadable
    }
  }
}
`

const fileState = computed(() => {
  return faker.random.arrayElement(['modified', 'unmodified', 'deleted', 'created'])
})

const props = defineProps<{
  gql: SpecListRowFragment
}>()

const spec = computed(() => props.gql.node)
const timeAgo = useTimeAgo(spec.value.gitInfo?.lastModifiedHumanReadable || '')

const specNameParts = (s) => {
  const name = s.match(/([A-Za-z]+)/g)[0]
  return {
    name,
    extension: s.replace(name, '')
  }
}

const classes = computed(() => ({
  created: {
    indicator: 'border-jade-400 bg-jade-300',
    gitText: 'text-jade-500',
    icon: DocumentIconPlus,
    iconClasses: 'icon-dark-jade-400 icon-light-jade-50'
  },
  modified: {
    indicator: 'border-orange-400 bg-orange-300',
    gitText: 'text-orange-500',
    icon: DocumentIconPlusMinus,
    iconClasses: 'icon-dark-orange-400 icon-light-orange-50'
  },
  unmodified: {
    indicator: 'border-transparent bg-transparent',
    gitText: 'text-gray-600 group-hocus:text-indigo-500',
  },
  deleted: {
    indicator: 'border-red-400 bg-red-300',
    gitText: 'text-red-500',
    iconClasses: 'icon-dark-red-400 icon-light-red-50',
    icon: DocumentIconMinus
  }
}[fileState.value]))

const icon = computed(() => ({
  component: classes.value?.icon || DocumentIconBlank,
  classes: classes.value?.iconClasses || 'icon-light-gray-50 icon-dark-gray-200'
}))

const gitInfoText = computed(() => {
  if (fileState.value === 'unmodified') {
    // Modified x days ago by AuthorName
    return t('specPage.rows.gitInfoWithAuthor', {
      fileState: t('file.git.modified'),
      timeAgo: timeAgo.value,
      author: spec.value.gitInfo?.author
    })
  } else {
    // Created|Deleted|Modified x days ago by AuthorName
    return t('specPage.rows.gitInfo', {
      fileState: t(`file.git.${fileState.value}`),
      timeAgo: timeAgo.value
    })
  }
})

const go = () => {
  debugger
}
</script>
