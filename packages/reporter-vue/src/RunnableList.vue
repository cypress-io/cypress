<template></template>

<script lang="ts">
import { defineComponent, computed, reactive, ref } from "vue";

export default defineComponent({
  props: ["runnables", "spec"],
  setup({ runnables, spec }) {
    let selected = ref([]);

    const toggleSelect = (node, isSelected) => {
      isSelected
        ? selected.value.push(node.id)
        : selected.value.splice(selected.value.indexOf(node.id), 1);
      if (node.suites && node.suites.length) {
        node.suites.forEach((ch) => {
          toggleSelect(ch, isSelected);
        });
      }
    };

    return {
      runnables: reactive(runnables),
      toggleSelect,
      selected,
      spec,
      runnableProps: {
        label: "title",
        expand: "expand",
        children: "suites",
        key: "id",
      },
    };
  },
});
</script>

<style lang="scss" scoped>
ul {
  padding-left: 0.5rem;
}

ul, li { list-style: disc; list-style-position: inside;}

ul ul {
  padding-left: 0.5rem;
}
ul li {
  padding-left: 0.5rem;
}
</style>