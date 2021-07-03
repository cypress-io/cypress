<template>
  <div
    v-for="(pkg, index) in listOfNecessaryPackages"
    class="flex text-left"
    :class="index > 0 ? 'border-t border-t-gray-200' : undefined"
  >
    <div class="p-5">
      <h2 class="text-indigo-600 font-normal">{{ pkg.name }}</h2>
      <p class="text-gray-400 text-sm" v-html="pkg.description"/>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useStoreConfig } from "../store/config";
import { getPackages } from "../utils/packages";


export function listPackages() {
  const store = useStoreConfig();
  const framework = computed(() => store.getState().component?.framework);
  const bundler = computed(() => store.getState().component?.bundler);
  const listOfNecessaryPackages = computed(() =>
    framework.value && bundler.value
      ? getPackages(framework.value, bundler.value)
      : []
  );
  return listOfNecessaryPackages;
}

export default defineComponent({
  setup() {
    return { listOfNecessaryPackages: listPackages() };
  },
});
</script>
