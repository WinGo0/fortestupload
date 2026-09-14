<template>
  <div>
    <el-button 
      type="primary" 
      @click="logDataToConsole" 
      style="margin-bottom: 1rem; float: right;"
      size="small"
    >
      在控制台输出配置
    </el-button>
    
    <div style="clear: both;">
      <RuleNode 
        v-if="rootGroup.children"
        :node="rootGroup"
        :path="[]"
        @promote-to-group="handleRuleAdditionClick"
        @add-rule-to-group="addRuleToGroup"
        @remove-node="removeNode"
        @toggle-operator="toggleOperator"
        @update-node-value="updateNodeValue"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'; // 引入 watch
import RuleNode from './RuleNode.vue';

// 1. 定义 props 来接收外部传入的初始数据
const props = defineProps({
  initialData: {
    type: Object,
    required: true
  }
});

// 2. 改造 rootGroup 的初始化逻辑
const rootGroup = ref({}); // 先初始化为空对象

// 3. 使用 watch 来监听 props 的变化，并用传入的数据更新内部状态
watch(() => props.initialData, (newData) => {
  if (newData && typeof newData === 'object') {
    // 使用深拷贝，避免直接修改 props
    rootGroup.value = JSON.parse(JSON.stringify(newData));
  }
}, { immediate: true, deep: true });

// --- 辅助函数 ---
const findNodeContext = (path) => {
  // 确保 rootGroup 和 children 已定义
  if (!rootGroup.value || !rootGroup.value.children) return { parentChildren: [], nodeIndex: -1 };
  let parentChildren = rootGroup.value.children;
  for (let i = 0; i < path.length - 1; i++) {
    if (!parentChildren[path[i]] || !parentChildren[path[i]].children) return { parentChildren: [], nodeIndex: -1 };
    parentChildren = parentChildren[path[i]].children;
  }
  const nodeIndex = path[path.length - 1];
  return { parentChildren, nodeIndex };
};

const findNodeByPath = (path) => {
  if (!path) return null;
  if (path.length === 0) return rootGroup.value; // 路径为空，返回根节点
  if (!rootGroup.value || !rootGroup.value.children) return null;

  let currentNode = rootGroup.value;
  for (const index of path) {
    if (!currentNode.children || !currentNode.children[index]) return null;
    currentNode = currentNode.children[index];
  }
  return currentNode;
};

const generateUniqueKey = (timestamp) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `${timestamp}-${randomPart}`;
};

const createNewRuleNode = () => ({
  type: 'rule',
  value: { parameter: '', operator: '>', comparisonValue: null }
});

// --- 核心操作函数 ---
const handleRuleAdditionClick = (path) => {
  if (path.length === 1 && path[0] === 0 && rootGroup.value.children && rootGroup.value.children.length === 1) {
    addRuleToGroup([]);
  } else {
    promoteRuleToGroup(path);
  }
};

const promoteRuleToGroup = (path) => {
  const { parentChildren, nodeIndex } = findNodeContext(path);
  if (!parentChildren || nodeIndex < 0 || !parentChildren[nodeIndex]) return; // 安全检查
  const ruleToPromote = parentChildren[nodeIndex];
  const newGroup = {
    type: 'group',
    operator: 'AND',
    children: [ ruleToPromote, createNewRuleNode() ]
  };
  parentChildren.splice(nodeIndex, 1, newGroup);
};

const addRuleToGroup = (path) => {
  const groupNode = findNodeByPath(path);
  if (groupNode && groupNode.type === 'group') {
    if (!groupNode.children) groupNode.children = []; // 初始化 children
    groupNode.children.push(createNewRuleNode());
  } else {
    console.error("添加规则失败：目标节点不是一个组或未找到。", path);
  }
};

const removeNode = (path) => {
  if (path.length === 1 && rootGroup.value.children && rootGroup.value.children.length === 1) {
    console.warn("为了保持至少一条规则，无法删除最后一条。");
    return;
  }
  
  const { parentChildren, nodeIndex } = findNodeContext(path);
  if (!parentChildren || nodeIndex < 0) return; // 安全检查

  parentChildren.splice(nodeIndex, 1);

  const parentPath = path.slice(0, -1);
  if (parentChildren.length === 1 && parentPath.length > 0) {
    const { parentChildren: grandParentChildren, nodeIndex: parentIndexInGrandparent } = findNodeContext(parentPath);
    if (!grandParentChildren || parentIndexInGrandparent < 0) return; // 安全检查
    const lonelyChild = parentChildren[0];
    grandParentChildren.splice(parentIndexInGrandparent, 1, lonelyChild);
  }
};

const toggleOperator = (path) => {
  const groupNode = findNodeByPath(path);
  if (groupNode && groupNode.type === 'group') {
    groupNode.operator = groupNode.operator === 'AND' ? 'OR' : 'AND';
  }
};

const updateNodeValue = ({ path, field, value }) => {
  const targetNode = findNodeByPath(path);
  if (!targetNode || targetNode.type !== 'rule') return;
  if (!targetNode.value) {
    targetNode.value = { parameter: '', operator: '>', comparisonValue: null };
  }
  targetNode.value[field] = value;
};

// --- 数据输出逻辑 ---
const buildOutputRecursive = (node, currentLevel, timestamp) => {
  if (!node) return null;
  if (node.type === 'rule') {
    const { parameter, operator, comparisonValue } = node.value;
    if (parameter === undefined || operator === undefined || comparisonValue === undefined || comparisonValue === null) return null;
    const conditionString = `${parameter} ${operator} ${comparisonValue}`;
    return {
      key: generateUniqueKey(timestamp),
      level: currentLevel,
      rowValues: { input: conditionString }
    };
  }
  if (node.type === 'group') {
    const groupLevel = currentLevel;
    const validChildren = node.children ? node.children
        .map(child => {
          if (child.type === 'group') {
            return buildOutputRecursive(child, groupLevel + 1, timestamp);
          } else {
            return buildOutputRecursive(child, groupLevel, timestamp);
          }
        })
        .filter(Boolean) : [];

    return {
      key: generateUniqueKey(timestamp),
      level: groupLevel,
      type: node.operator === 'AND' ? 1 : 2,
      operator: node.operator,
      children: validChildren
    };
  }
  return null;
};

const logDataToConsole = () => {
  if (!rootGroup.value || !rootGroup.value.children || rootGroup.value.children.length === 0) {
    console.log("没有可输出的内容。");
    return;
  }
  const hasContent = rootGroup.value.children.some(child => {
      if (child.type === 'group') return child.children && child.children.length > 0;
      const { parameter, operator, comparisonValue } = child.value;
      return parameter && operator && comparisonValue !== null && comparisonValue !== undefined;
  });
  if (!hasContent) {
     console.log("没有可输出的内容（所有输入均为空或不完整）。");
     return;
  }

  const timestamp = Date.now();
  if (rootGroup.value.children.length === 1 && rootGroup.value.children[0].type === 'rule') {
    const singleRuleNode = rootGroup.value.children[0];
    const { parameter, operator, comparisonValue } = singleRuleNode.value;
    const conditionString = `${parameter} ${operator} ${comparisonValue}`;
    const output = {
      key: generateUniqueKey(timestamp),
      level: 0,
      rowValues: { input: conditionString }
    };
    console.log(JSON.stringify(output, null, '  '));
  } else {
    const output = buildOutputRecursive(rootGroup.value, 1, timestamp);
    console.log(JSON.stringify(output, null, '  '));
  }
};

// 4. 暴露 rootGroup 以便父组件通过 ref 获取
defineExpose({
  rootGroup
});
</script>
