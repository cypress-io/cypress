<template>
  <CreateSpecCard
    :disabled="disabled"
    header="Create from component"
    description="Generate a basic component test for any of the components in this project."
    :icon="DocumentCodeIcon"
  />
</template>

<script lang="ts" setup>
import CreateSpecCard from '../../CreateSpecCard.vue'
import DocumentCodeIcon from '~icons/cy/document-code_x48'

defineProps<{
  disabled?: boolean
}>()
</script>
