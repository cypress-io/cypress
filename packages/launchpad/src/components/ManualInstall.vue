<template>
  <div class="bg-gray-50 h-7 flex items-center p-2 gap-2 border-b border-gray-200">
    <div v-for="i in [0,1,2]" class="rounded-md h-3 w-3 border border-1-gray-500"/>
  </div>
  <pre class="text-left text-gray-500 p-5 h-60"><span 
    class="text-purple-500"
    >{{ projectTitle }}:~$</span> {{ dependenciesCode }}</pre>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useStore } from "../store";
import { listPackages } from "./PackagesList.vue";

export default defineComponent({
  setup() {
    const store = useStore()
    const listOfNecessaryPackages = listPackages()
    const dependenciesCode = computed(() => "yarn add -D \\\n" + listOfNecessaryPackages.value.map(pack => 
    `                    ${pack.name} \\`).join('\n'))
    return { dependenciesCode, projectTitle: computed(() => store.getState().projectTitle ) };
  },
});
</script>
