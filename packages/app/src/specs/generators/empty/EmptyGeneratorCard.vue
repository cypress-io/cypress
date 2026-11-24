<template>
  <CreateSpecCard
    :disabled="disabled"
    header="Create new spec"
    description="We'll generate a template spec file which can be used to start testing your application."
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
