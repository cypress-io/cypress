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
    <div v-if="altFunction && alt" class="flex items-center px-3">
      <label @click="handleAlt" class="text-gray-500 px-3">{{ alt }}</label>
      <Switch :value="altValue" @update="handleAlt" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import Button from "./Button.vue";
import Switch from "./Switch.vue";

export default defineComponent({
  components: { Button, Switch },
  props: {
    next: {
      type: String,
      required: true,
    },
    nextFn: {
      type: Function,
      required: true
    },
    back: {
      type: String,
      required: true,
    },
    backFn: {
      type: Function,
      required: true
    },
    alt: {
      type: String,
      default: undefined,
    },
    altFn: {
      type: Function,
      default: undefined,
    },
  },
  setup(props) {
    const altValue = ref(false);

    const handleAlt = () => {
      props.altFn?.(!altValue.value);
    };

    return { nextFunction: props.nextFn, backFunction: props.backFn, altFunction: props.altFn, altValue, handleAlt };
  },
});
</script>
