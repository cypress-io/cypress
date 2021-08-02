<template>
  <div>
    <prism-editor
      class="font-mono leading-tight prism-editor"
      v-model="localValue"
      :highlight="highlighter"
    ></prism-editor>
  </div>
</template>

<script>
import prism from "prismjs";
import { PrismEditor } from "vue-prism-editor"; //
import "vue-prism-editor/dist/prismeditor.min.css"; // import the styles somewhere
import "prismjs/themes/prism.css"; // import syntax highlighting styles
// import highlighting library (you can use any library you want just return html string)
import { useModelWrapper } from "../composables";
import { defineComponent } from "vue";

export default defineComponent({
  components: {
    PrismEditor,
  },
  props: {
    modelValue: {
      type: String,
    }
  },
  setup(props, { emit }) {
    const highlighter = (code) => {
      return prism.highlight(code, prism.languages.js);
    };
    return {
      localValue: useModelWrapper(props, emit, 'modelValue'),
      highlighter
    };
  },
});
</script>

<style>
.prism-editor__line-number {
  display: none;
}

.prism-editor textarea {
  @apply focus:ring-0 focus:outline-none;
}
</style>