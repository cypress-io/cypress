<template>
  <header class="h-40px"><SpecsListHeader v-model="searchString"/></header>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import SpecsListHeader from './SpecsListHeader.vue'

const searchString = ref('my search')
</script>
