<template>
  <h3>Select your framework</h3>
  <p class="opacity-0">
    <select
      data-cy="select-framework"
      v-model="selectedFrameworkId"
      class="h-20 absolute left-60"
    >
      <option
        v-for="framework of frameworks"
        :key="framework.displayName"
        :value="framework.id"
      >
        {{ framework.displayName }}
      </option>
      <option value="none" disabled>Select framework</option>
    </select>
  </p>
  <p class="text-center m-3 h-20">
    <template v-if="images" v-for="(img, i) of images" :key="img + i">
      <img
        class="w-20 h-20 inline m-3"
        :src="`${require(`@assets/${img}.svg`)}`"
      />
      <span v-if="i < images.length - 1">x</span>
    </template>
    <template v-else>
      <div class="align-middle inline-block h-20 w-20 bg-gray-200 m-3" />
      x
      <div class="align-middle inline-block h-20 w-20 bg-gray-200 m-3" />
    </template>
  </p>

  <p>
    To finish configuring your project we need to install some dependencies and
    create a few files.
  </p>
</template>

<script lang="ts">
import { computed, defineComponent, markRaw } from "vue";
import { useStore } from "../store";
import { frameworks } from "../supportedFrameworks";

export default defineComponent({
  setup(props, ctx) {
    const store = useStore();

    const selectedFramework = computed(
      () => store.getState().component.framework
    );

    const selectedFrameworkId = computed({
      get() {
        return selectedFramework.value ? selectedFramework.value.id : "none";
      },
      set(id: string) {
        store.setComponentFramework(frameworks.find((x) => x.id === id)!);
      },
    });

    return {
      selectedFrameworkId,
      frameworks: markRaw(frameworks),
      images: computed(
        () => selectedFramework.value && selectedFramework.value.images
      ),
    };
  },
});
</script>