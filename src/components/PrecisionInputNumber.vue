<template>
  <el-input-number
    v-model="internalValue"
    v-bind="filteredAttrs"
    :controls="false"
    @input="handleInput"
    @change="handleChange"
  />
</template>

<script setup>
import { ref, watch, computed, useAttrs } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    default: undefined
  },
  maxDecimals: {
    type: Number,
    default: 8
  }
});

const emit = defineEmits(['update:modelValue']);

const attrs = useAttrs();

/**
 * 【关键点】
 * Element Plus 的 el-input-number 如果设置了 precision 属性，
 * 就会强制使用 toFixed(precision) 来格式化显示，导致自动补齐末尾的 0。
 * 
 * 为了“只限制最大位数，但不自动补0”，我们必须在这个封装组件里：
 * 1. 过滤掉传给底层 el-input-number 的 precision 属性。
 * 2. 在业务逻辑中手动截断多余的小数位。
 */
const filteredAttrs = computed(() => {
  const { precision, ...rest } = attrs;
  return rest;
});

const internalValue = ref(props.modelValue);

/**
 * 手动限制小数位数（截断，不进位，不补0）
 */
const limitDecimal = (val, max) => {
  if (val === null || val === undefined || isNaN(val)) return val;
  
  const str = val.toString();
  if (str.includes('.')) {
    const [int, dec] = str.split('.');
    if (dec.length > max) {
      // 截断多余的小数位
      return Number(`${int}.${dec.slice(0, max)}`);
    }
  }
  return val;
};

// 监听父组件更新
watch(() => props.modelValue, (val) => {
  if (val !== internalValue.value) {
    internalValue.value = val;
  }
}, { immediate: true });

// 实时输入处理
const handleInput = (val) => {
  const limited = limitDecimal(val, props.maxDecimals);
  if (limited !== val) {
    internalValue.value = limited;
  }
  emit('update:modelValue', internalValue.value);
};

// 失去焦点或回车处理
const handleChange = (val) => {
  const limited = limitDecimal(val, props.maxDecimals);
  if (limited !== val) {
    internalValue.value = limited;
  }
  emit('update:modelValue', internalValue.value);
};
</script>
