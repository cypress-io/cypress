<template>
  <RouterLink :to="{ path: 'runner', query: { file: spec.relative } }">
    <div
      class="group flex items-center pl-18px spec-item"
      :class="{ selected: selected }"
    >
      <SpecFileItem
        :fileName="spec.fileName"
        :extension="spec.specFileExtension"
        :selected="selected"
      >
      </SpecFileItem>
      <span
        class="
          font-light
          text-sm text-gray-700
          pl-8px
          hidden
          group-hover:inline
        "
        >{{ relativeFolder }}</span
      >
    </div>
  </RouterLink>
</template>
<script lang="ts" setup>
import type { FoundSpec } from "@packages/types";
import {computed, onMounted} from 'vue'
import {RouterLink} from 'vue-router'
import SpecFileItem from "./SpecFileItem.vue";

const props = defineProps<{
  spec: FoundSpec;
  selected: boolean;
}>();

const relativeFolder = computed(() => props.spec.relative.replace(`/${props.spec.baseName}`, ""))
</script>

<style>
.spec-item:hover::before,
.selected::before {
  position: absolute;
  content: "";
  width: 8px;
  left: -4px;
  height: 28px;
  @apply border-r-4 border-r-indigo-300 rounded-lg;
}
</style>
