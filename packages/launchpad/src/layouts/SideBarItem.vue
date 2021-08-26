<template>
  <div
    class="relative mt-3 min-w-25px cursor-pointer flex items-center justify-center overflow-hidden"
  >
    <!-- Can't do a border-left solution because you need to round the corners. -->
    <span class="absolute -left-7px rounded min-w-10px h-full" :class="{ 'bg-green-300': active }" />
    <Icon
      :icon="icon"
      class="pl-0.25rem py-0.25rem min-h-25px min-w-25px w-full h-full"
      :class="{
        'text-green-300': active
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import { gql } from "@urql/vue"
import { defineProps, computed } from "vue"
import Icon from '../components/icon/Icon.vue'
import type { HTMLAttributes, FunctionalComponent, SVGAttributes } from 'vue'
import type { SideBarItemFragment } from '../generated/graphql'

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
}
`

const props = defineProps<Props>()

const active = computed(() => props.gql.selected)
</script>
