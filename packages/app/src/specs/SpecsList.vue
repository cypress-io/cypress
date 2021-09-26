<template>
  <SpecsListHeader v-model="searchString"/>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import SpecsListHeader from './SpecsListHeader.vue'

const searchString = ref('')
</script>
