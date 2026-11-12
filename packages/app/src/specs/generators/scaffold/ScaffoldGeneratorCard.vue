<template>
  <CreateSpecCard
    :disabled="disabled"
    header="Scaffold example specs"
    description="We'll generate several example specs to help guide you on how to write tests in Cypress."
    :icon="BoxOpenIcon"
  />
</template>

<script lang="ts" setup>
import CreateSpecCard from '../../CreateSpecCard.vue'
import BoxOpenIcon from '~icons/cy/box-open_x48'

defineProps<{
  disabled?: boolean
}>()

</script>
