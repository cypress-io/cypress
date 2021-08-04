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
    <Button @click="nextFn">{{ next }}</Button>
    <Button @click="backFn" variant="outline">{{ back }}</Button>
    <div class="flex-grow" />
    <div v-if="altFn && alt" class="flex items-center px-3">
      <label @click="handleAlt" class="text-gray-500 px-3">{{ alt }}</label>
      <Switch :value="altValue" @update="handleAlt" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import Button from "../components/button/Button.vue";
import Switch from "../components/switch/Switch.vue";

export default defineComponent({
  components: { Button, Switch },
  props: {
    next: {
      type: String,
      required: true,
    },
    nextFn: {
      type: Function as PropType<() => void>,
      required: true
    },
    back: {
      type: String,
      required: true,
    },
    backFn: {
      type: Function as PropType<() => void>,
      required: true
    },
    alt: {
      type: String,
      default: undefined,
    },
    altFn: {
      type: Function as PropType<(value: boolean) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const altValue = ref(false);

    const handleAlt = () => {
      altValue.value = !altValue.value
      props.altFn?.(altValue.value);
    };

    return { altValue, handleAlt };
  },
});
</script>
