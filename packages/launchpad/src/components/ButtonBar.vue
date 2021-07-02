<template>
  <div
    class="
      px-5
      py-5
      flex
      gap-3
      bg-gray-50
      border-t border-t-1 border-t-gray-200
      rounded-b
    "
  >
    <Button @click="nextFunction()">{{ next }}</Button>
    <Button @click="backFunction()" variant="outline">{{ back }}</Button>
    <div class="flex-grow" />
    <Button v-if="altFunction && alt" @click="altFunction?.()" variant="link">{{
      alt
    }}</Button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useStore } from "../store";
import Button from "./Button.vue";

export default defineComponent({
  components: { Button },
  props: {
    next: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: undefined,
    },
  },
  setup() {
    const store = useStore();
    const state = computed(() => store.getState());
    const nextFunction = computed(() => state.value.nextAction);
    const backFunction = computed(() => state.value.backAction);
    const altFunction = computed(() => state.value.alternativeAction);
    return { nextFunction, backFunction, altFunction };
  },
});
</script>
