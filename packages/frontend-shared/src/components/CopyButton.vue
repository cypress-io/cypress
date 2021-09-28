<template>
  <div class="absolute top-2 right-2">
    <transition name="fade">
      <span class="mx-3" v-show="showCopied">{{ t('clipboard.copied') }}</span>
    </transition>
    <button
      class="bg-gray-50 px-3 py-1 rounded text-indigo-600"
      @click="copyToClipboard"
    >
      {{ t('clipboard.copy') }}
    </button>
  </div>
  <textarea class="absolute -top-96" ref="textElement">{{ text }}</textarea>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref } from "vue";
import { useI18n } from "@cy/i18n";

export default defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup() {
    const showCopied = ref(false)
    const textElement = ref<HTMLTextAreaElement | null>(null);
    const copyToClipboard = async () => {
      textElement.value?.select();
      document.execCommand("copy");
      showCopied.value = true
      await nextTick()
      showCopied.value = false
    };
    const { t } = useI18n()
    return { copyToClipboard, textElement, showCopied, t };
  },
});
</script>

<style>
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-leave-to {
  opacity: 0;
}
</style>
