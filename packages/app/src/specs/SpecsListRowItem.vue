<template>
  <div
    class="h-full outline-none border-gray-50 ring-inset grid grid-cols-6 group focus-within:ring-indigo-300 focus-within:ring-1 children:cursor-pointer"
    data-cy="specs-list-row"
  >
    <div class="col-span-3">
      <slot name="file" />
    </div>

    <div class="col-span-2">
      <slot name="git-info" />
    </div>

    <div>
      <slot name="latest-runs" />
    </div>
  </div>
</template>
