<script setup lang="ts">
import { computed } from 'vue';
import {
  getAllFileInDirectory,
  groupSpecTreeNodes,
} from '../tree/deriveTree';
import SpecsListFile from './SpecsListFile.vue'
import IconFolder from '~icons/cy/folder_x16.svg'
import type { DirectoryNode } from '../tree/types';
import HighlightedText from '../HighlightedText.vue';

const props = defineProps<{
  node: DirectoryNode
}>()

const emit = defineEmits<{
  (event: 'handleCollapse', node: DirectoryNode): void
}>()

const fileList = computed(() => getAllFileInDirectory(props.node));

const grouped = computed(() => groupSpecTreeNodes(props.node));
</script>

<template>
  <div :style="{ paddingLeft: `${(props.node.depth) * 10}px` }" class="flex items-center">
    <button 
      class="h-full grid gap-8px grid-cols-[14px,16px,auto] items-center focus:outline-none"
      :data-cy="`row-directory-depth-${props.node.depth}`"
      :aria-expanded="!props.node.children"
      @click="emit('handleCollapse', props.node)"
    >
      <i-cy-chevron-down-small_x16
        class="
          mr-8px text-sm icon-dark-gray-300
          group-hocus:(icon-dark-gray-700)
        "
        :class="{'transform rotate-270': props.node.collapsed}"
      />
      <component
        :is="IconFolder"
        class="icon-dark-white icon-light-gray-200"
      />

      <div
        :title="props.node.name"
        class="text-gray-600 truncate"
      >
        <HighlightedText
          :text="props.node.name"
          :indexes="[]"
          class="font-medium"
          highlight-classes="text-gray-1000"
        />
        <span class="text-gray-700 text-xs">
          (Run {{ fileList.length }} specs)
        </span>
      </div>
      <span class="sr-only">{{ !props.node.collapsed ? 'collapse' : 'expand' }}</span>

    </button>
  </div>

  <template v-if="!props.node.collapsed">
    <SpecsListFile 
      v-for="file of grouped.files" 
      :node="file" :key="file.data.relative" 
    />

    <SpecsListDirectory 
      v-for="child of grouped.directories"
      :key="child.relative"
      :node="child" 
      @handleCollapse="(node: DirectoryNode) => emit('handleCollapse', node)"
    />
  </template>
</template>