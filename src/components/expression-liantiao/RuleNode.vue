<template>
  <div v-if="node" class="node-container">

    <div v-if="node.type === 'group'" class="rule-group-container">
      <div v-if="node.children.length > 1" class="connector-area">
        <el-button 
          type="primary" 
          circle 
          @click="emit('toggleOperator', path)"
        >
          {{ node.operator === 'AND' ? '且' : '或' }}
        </el-button>
        <div class="vertical-line-filler"></div>
        <el-button :icon="Plus" circle @click="emit('addRuleToGroup', path)" />
      </div>
      <div class="rows-area" :class="{ 'is-grouped': node.children.length > 1 }">
        <div v-for="(childNode, index) in node.children" :key="childNode.id">
          <RuleNode
            :node="childNode"
            :path="[...path, index]"
            :is-in-group="node.children.length > 1"
            @promote-to-group="emit('promoteToGroup', $event)"
            @add-sibling="emit('addSibling', $event)"
            @remove-node="emit('removeNode', $event)"
            @add-rule-to-group="emit('addRuleToGroup', $event)"
            @toggle-operator="emit('toggleOperator', $event)"
            @update-node-value="emit('updateNodeValue', $event)"
          />
        </div>
      </div>
    </div>

    <div v-else-if="node.type === 'rule'" class="row-item" :class="{'is-in-group': isInGroup}">
      <div class="input-with-buttons-container">
        <div class="structured-rule-container">
          <el-input 
            v-model="parameterModel" 
            placeholder="请输入参数"
            size="large"
          >
            <template #append>
              <el-button :icon="Search" />
            </template>
          </el-input>
          <el-select 
            v-model="operatorModel" 
            placeholder="符号" 
            style="width: 100px;"
            size="large"
          >
            <el-option label=">" value=">" />
            <el-option label="<" value="<" />
            <el-option label="==" value="==" />
          </el-select>
          <el-input-number
            v-model="comparisonValueModel"
            :controls="false"
            placeholder="请输入数值"
            size="large"
            style="flex-grow: 1;"
          />
        </div>
        
        <el-button :icon="Plus" circle style="margin-left: 8px;" @click="emit('promoteToGroup', path)" />
        <el-button :icon="Minus" circle style="margin-left: 8px;" @click="emit('removeNode', path)" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Plus, Minus, Search } from '@element-plus/icons-vue';
import RuleNode from './RuleNode.vue';

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  path: {
    type: Array,
    required: true
  },
  isInGroup: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'promoteToGroup',
  'addSibling',
  'removeNode',
  'addRuleToGroup',
  'toggleOperator',
  'updateNodeValue'
]);

const emitRuleUpdate = (field, value) => {
  if (!props.node || props.node.type !== 'rule') return;
  emit('updateNodeValue', { path: props.path, field, value });
};

const parameterModel = computed({
  get: () => props.node?.value?.parameter ?? '',
  set: (value) => emitRuleUpdate('parameter', value)
});

const operatorModel = computed({
  get: () => props.node?.value?.operator ?? '>',
  set: (value) => emitRuleUpdate('operator', value)
});

const comparisonValueModel = computed({
  get: () => props.node?.value?.comparisonValue ?? null,
  set: (value) => emitRuleUpdate('comparisonValue', value)
});
</script>

<style scoped>
/* 新增：为结构化规则容器添加样式 */
.structured-rule-container {
  display: flex;
  align-items: center;
  gap: 8px; /* 组件之间的间距 */
  width: 100%;
}

/* ... 其余样式无需改动 ... */
.rule-group-container {
  display: flex;
  background-color: rgba(64, 158, 255, 0.05);
  border: 1px dashed #dcdfe6;
  padding: 1rem;
  margin-top: 0.5rem;
  border-radius: 4px;
}
.rows-area.is-grouped {
  margin-left: 20px;
}
.connector-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.vertical-line-filler {
  flex-grow: 1;
  width: 2px;
  background-color: #409EFF;
  margin: 8px 0;
}
.rows-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}
.row-item {
  width: 100%;
}
.row-item.is-in-group {
  position: relative;
  padding-left: 20px;
}
.row-item.is-in-group::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20px;
  transform: translateY(-50%);
  width: 20px;
  height: 2px;
  background-color: #409EFF;
}
.input-with-buttons-container {
  display: flex;
  align-items: center;
  width: 100%;
}
.node-container {
  width: 100%;
}
</style>
