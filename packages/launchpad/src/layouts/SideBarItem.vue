<template>
  <div
    class="relative mt-3 min-w-25px cursor-pointer flex items-center justify-center overflow-hidden"
  >
    <!-- Can't do a border-left solution because you need to round the corners. -->
    <span
      class="absolute -left-7px rounded min-w-10px h-full"
      :class="{ 'bg-jade-300': active }"
    />
    <Icon
      :icon="icon"
      class="pl-0.25rem py-0.25rem min-h-25px min-w-25px w-full h-full"
      :class="{
        'text-jade-300': active
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import Icon from '@cy/components/Icon.vue'
import { computed } from 'vue'

// eslint-disable-next-line no-duplicate-imports
import type { FunctionalComponent, SVGAttributes, HTMLAttributes } from 'vue'

import type { SideBarItemFragment } from '../generated/graphql'
import { gql } from '@urql/core'

interface Props extends HTMLAttributes {
  icon: FunctionalComponent<SVGAttributes>
  gql: SideBarItemFragment
}

gql`
fragment SideBarItem on NavigationItem {
  id
  name
  selected
  iconPath
  type
}
`

const props = defineProps<Props>()

const active = computed(() => props.gql.selected)
</script>
