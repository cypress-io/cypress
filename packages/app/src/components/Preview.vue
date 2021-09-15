<script setup lang="ts">
import Iframe from "./IFrame.vue";
import Walkthrough from "./Walkthrough.vue"

const props = defineProps({
  cypressConfig: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['closePreview'])
function closePreview() {
  emit('closePreview');
}
</script>

<template>
  <div class="container">
    <Walkthrough :cypress-config="props.cypressConfig"/>
  </div>
</template>

<style>
.selected-story {
  border: solid 1px black;
}

.container {
  width: 100%;
}
</style>
