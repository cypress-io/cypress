<template>
  <h2 class="text-2xl">Specs List</h2>>
  <SpecsListHeader v-model="search" />
  <ul>
    <li
      v-for="spec in specs"
      :key="spec.id"
    >
      {{ spec.name }} {{ spec.relativePath }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import { ref } from 'vue'

interface GitInfo {
  comitter?: string,
  timeAgo?: number | Date,
  fileState: 'modified' | 'unmodified' | 'added' | 'deleted'
}

interface Spec {
  id: string,
  relativePath: string,
  name: string,
  componentName: string,
  extension: string,
  specExtension: string,
  gitInfo?: GitInfo
}

defineProps<{
  specs: Spec[]
}>()

const search = ref('')

</script>
