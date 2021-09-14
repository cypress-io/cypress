<script setup lang="ts">
import { onMounted, ref } from "vue";
import Iframe from "./Iframe.vue";

interface Spec {
  name: string;
  absolute: string;
  relative: string;
}

const props = defineProps({
  cypressConfig: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['closePreview'])

const specs = ref([] as Spec[]);

const selectedSpec = ref();
function setSelectedSpec(spec: Spec) {
  selectedSpec.value = spec;
}

onMounted(async () => {
  const { componentFolder } = props.cypressConfig;
  const { files, globPattern } = await fetch(
    "/__/getStories?projectRoot=" + componentFolder
  ).then((res) => res.json());
  specs.value = files;
});

function closePreview() {
  emit('closePreview');
}

</script>

<template>
  <div class="container">
    <ul>
      <li
        v-for="spec in specs"
        v-on:click="setSelectedSpec(spec)"
        :class="{ 'selected-story': spec === selectedSpec }"
      >
        {{ spec.name }}
      </li>
    </ul>
    <div>
      <Iframe
        v-if="selectedSpec"
        :spec="selectedSpec"
        :cypress-config="props.cypressConfig"
      ></Iframe>
      <button v-on:click="closePreview">Close Preview</button>
    </div>
  </div>
</template>

<style>

</style>
