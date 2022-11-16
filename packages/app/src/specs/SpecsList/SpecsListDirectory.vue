<script setup lang="ts">
import { computed } from 'vue';
import {
  getAllFileInDirectory,
  groupSpecTreeNodes,
  SpecTreeDirectoryNode
} from '../tree/deriveTree';
import SpecsListFile from './SpecsListFile.vue'
import IconFolder from '~icons/cy/folder_x16.svg'

const props = defineProps<{
  node: SpecTreeDirectoryNode
}>()

const emit = defineEmits<{
  (event: 'handleCollapse', node: SpecTreeDirectoryNode): void
}>()

const fileList = computed(() => getAllFileInDirectory(props.node));

const grouped = computed(() => groupSpecTreeNodes(props.node));
</script>

<template>
  <div :style="{ paddingLeft: `${(props.node.depth - 2) * 10}px` }" class="flex items-center">
    <button 
      class="flex items-center"
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
      <span class="directory-name">{{ props.node.name }}</span>

      <span class="text-gray-700 text-xs">
        (Run {{ fileList.length }} specs)
      </span>
    </button>
  </div>

  <div v-if="!props.node.collapsed">
    <SpecsListFile v-for="file of grouped.files" :node="file" :key="file.data.relative" />
    <SpecsListDirectory 
      v-for="child of grouped.directories"
      :key="child.relative"
      :node="child" 
      @handleCollapse="(node: SpecTreeDirectoryNode) => emit('handleCollapse', node)"
    />
  </div>
</template>