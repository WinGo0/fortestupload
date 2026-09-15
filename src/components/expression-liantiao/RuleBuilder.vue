<template>
  <div>
    <el-button 
      type="primary" 
      @click="logDataToConsole" 
      style="margin-bottom: 1rem; float: right;"
      size="small"
    >
      在控制台输出新格式配置
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
const operatorCodeMap = {
  '>': 'GT',
  '<': 'LT',
  '==': 'EQ',
  '===': 'EQ',
  '!=': 'NE',
  '>=': 'GTE',
  '<=': 'LTE'
};

const createNewConditionNode = (value = {}) => ({
  nodeType: 'CONDITION_NODE',
  type: 'REAL_TIME',
  paramCode: value.parameter ?? '',
  operator: operatorCodeMap[value.operator] ?? value.operator ?? 'GT',
  threshold: value.comparisonValue ?? null,
  timeValue: 1,
  timeUnit: 'SECOND',
  targetState: 1,
  openRangeStart: null,
  openRangeEnd: null,
  closeRangeStart: null,
  closeRangeEnd: null
});

const buildNewConfigRecursive = (node) => {
  if (!node) return null;

  if (node.type === 'rule') {
    return createNewConditionNode(node.value);
  }

  if (node.type === 'group') {
    return {
      nodeType: 'LOGIC_NODE',
      logicOperator: node.operator === 'OR' ? 'OR' : 'AND',
      children: (node.children ?? [])
        .map(buildNewConfigRecursive)
        .filter(Boolean)
    };
  }

  return null;
};

const buildNewConfig = () => buildNewConfigRecursive(rootGroup.value);

const logDataToConsole = () => {
  const output = buildNewConfig();
  console.log(JSON.stringify(output, null, '  '));
};

// 4. 暴露内部树和转换后的新格式，父组件可直接获取用于提交
defineExpose({
  rootGroup,
  getConfig: buildNewConfig
});
</script>
