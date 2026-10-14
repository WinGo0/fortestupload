<template>
  <Teleport to="body">
    <div
      class="context-menu"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      role="menu"
      @click.stop
      @contextmenu.prevent
    >
      <button
        v-for="item in items"
        :key="item.label"
        type="button"
        class="context-menu__item"
        role="menuitem"
        @click="handleSelect(item)"
      >
        {{ item.label }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
type ContextMenuItem = {
  label: string;
  action?: () => void;
};

const props = defineProps<{
  items: ContextMenuItem[];
  position: {
    x: number;
    y: number;
  };
}>();

const emit = defineEmits<{
  (event: "select", item: ContextMenuItem): void;
}>();

const handleSelect = (item: ContextMenuItem) => {
  emit("select", item);
};
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 4000;
  min-width: 176px;
  padding: 6px;
  background: #151b2b;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 6px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 40%);
}

.context-menu__item {
  display: block;
  width: 100%;
  padding: 9px 12px;
  color: #e5eaf3;
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.context-menu__item:hover,
.context-menu__item:focus-visible {
  background: #2c3549;
  outline: none;
}

</style>
