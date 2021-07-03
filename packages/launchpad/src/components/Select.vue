<template>
  <div class="text-left relative">
    <label class="text-gray-800 text-sm my-3 block" :class="disabledClass">{{
      name
    }}</label>
    <button
      class="
        h-10
        text-left
        flex
        justify-between
        items-center
        border-1 border-gray-200
        px-2
        py-1
        rounded
        w-full
        focus:border-indigo-600 focus:outline-transparent
      "
      @click="
        if (!disabled) {
          isOpen = !isOpen;
        }
      "
      :class="disabledClass"
      :disabled="disabled"
      v-click-outside="() => (isOpen = false)"
    >
      <template v-if="selectedOptionObject">
        <img
          :src="
            logos[`../assets/logos/${selectedOptionObject.logo}.svg`]?.default
          "
          class="w-5 h-5 mr-3"
        />
        <span>
          {{ selectedOptionObject.name }}
        </span>
        <span
          v-if="selectedOptionObject.description"
          class="text-gray-400 ml-2"
        >
          {{ selectedOptionObject.description }}
        </span>
      </template>
      <span v-else class="text-gray-400">
        {{ placeholder }}
      </span>
      <span class="flex-grow"></span>
      <i-fa-angle-down />
    </button>
    <ul
      v-if="isOpen"
      class="
        w-full
        absolute
        bg-white
        border-1 border-indigo-600 border-t-1 border-t-gray-100
        rounded-b
        flex flex-col
        gap-0
        z-10
      "
      style="margin-top: -3px"
    >
      <li
        v-for="opt in options"
        :key="opt.id"
        @click="selectOption(opt)"
        focus="1"
        class="cursor-pointer flex items-center py-1 px-2 hover:bg-gray-10"
      >
        <img
          :src="logos[`../assets/logos/${opt.logo}.svg`]?.default"
          class="w-5 h-5 mr-3"
        />
        <span>
          {{ opt.name }}
        </span>
        <span v-if="opt.description" class="text-gray-400 ml-2">
          {{ opt.description }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";

const logos = import.meta.globEager("../assets/logos/*.svg");
interface Option {
  name: string;
  description?: string;
  logo: string;
  id: string;
}

export default defineComponent({
  emits: { select: Object },
  props: {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      default: undefined,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    options: {
      type: Array as PropType<Array<Option>>,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const isOpen = ref(false);

    const selectedOptionObject = computed(() => {
      return props.options.find((opt) => opt.id === props.value);
    });

    const selectOption = (opt: Option) => {
      emit("select", opt);
    };

    const disabledClass = computed(() =>
      props.disabled ? "opacity-50" : undefined
    );

    return {
      logos,
      isOpen,
      selectedOptionObject,
      selectOption,
      disabledClass,
    };
  },
});
</script>
