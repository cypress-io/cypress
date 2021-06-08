<template>
  <div class="welcomeWrapper">
    <CloseButton @click="close" />
    <h3 class="title">Welcome to Cypress!</h3>
    <p class="subtitle">
      Cypress allows you to write both e2e (end-to-end) and component tests.
    </p>
    <p class="buttonWrapper">
      <button class="underline" @click="close">No thanks</button>
      <button class="outlineButton" @click="showHelper = true">
        Help me choose >
      </button>
    </p>
  </div>
  <BaseModal v-if="showHelper" @close="showHelper = false">
    <p>Some content here</p>
  </BaseModal>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import BaseModal from "./BaseModal.vue";
import CloseButton from "./CloseButton.vue";

export default defineComponent({
  emits: ["close"],
  components: {
    BaseModal,
    CloseButton,
  },
  setup(_, { emit }) {
    return {
      showHelper: ref(false),
      close: () => emit("close"),
    };
  },
});
</script>

<style scoped lang="scss">
  .welcomeWrapper {
    @apply p-8 m-4 pb-10 bg-blue-200 rounded-xl max-w-128 relative grid gap-4;
  }

  .buttonWrapper {
    @apply text-right
        grid grid-flow-col
        justify-end
        absolute
        bottom-4
        right-4;
  }

  .title {
    @apply text-size-1.5rem;
  }

  .subtitle {
    @apply text-gray-600;
  }

  button {
    @apply px-2 py-0.5 text-blue-900 text-size-0.8rem;
    @apply hover:opacity-70;
  }

  .outlineButton {
    @apply border-blue-900 border-width-1px border-solid rounded-xl;
  }
</style>