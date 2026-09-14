下面给你一个**可直接跑起来的 Vue3 完整组件**，包含：源数据 sheet + 编程方式生成透视表 sheet + 读取/切换/还原透视表配置。注释按你的要求尽量写细，尤其是 `pivotTable` 里**行、列、筛选、值**每一块的配置规则。

**前置条件**：本项目已在 `src/main.js` 全局引入 Luckysheet 的 CSS、plugin.js 和核心库，组件里直接用 `window.luckysheet`。

```vue
<template>
  <div class="luckysheet-demo">
    <!-- ================= 操作栏（演示用，实际项目可换成自己的 UI） ================= -->
    <div class="op-bar">
      <button @click="rebuild(false)">只打开源数据</button>
      <button @click="rebuild(true)">打开并生成透视表</button>
      <button @click="switchRowDim">切换行维度（销售员 ⇄ 产品）</button>
      <button @click="readPivotConfig">读取透视表配置（用于持久化）</button>
      <button @click="readPivotResult">读取透视表结果数据</button>
    </div>

    <!--
      Luckysheet 挂载容器：
      1. id 必须和 create() 里的 container 一致
      2. 必须显式有尺寸，官方推荐 absolute 撑满的方式
    -->
    <div id="luckysheet" class="sheet-container"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

/* ============================================================================
 * 一、源数据（实际项目中替换成接口返回的数据即可）
 *
 * 【重要规则】第 0 行必须是表头！
 * 透视表拖拽面板里显示的"字段名"，就是源数据第 0 行每一列的值。
 * 透视表配置里的 index（列号）也是以这张表为准，从 0 开始数。
 * ==========================================================================*/
const SOURCE_TABLE = [
  // 列号:    0        1       2       3       4
  ['销售员', '地区', '产品', '金额', '数量'], // ← 表头行（字段名来源）
  ['张三', '华东', '手机', 5200, 3],
  ['李四', '华北', '手机', 4800, 2],
  ['张三', '华北', '电脑', 8900, 1],
  ['王五', '华东', '电脑', 7600, 1],
  ['李四', '华东', '平板', 3200, 4],
  ['王五', '华南', '手机', 5100, 2],
  ['张三', '华南', '平板', 2800, 5],
  ['李四', '华南', '电脑', 9200, 1],
]

/* ============================================================================
 * 二、工具函数：二维数组 -> Luckysheet 的 celldata 格式
 *
 * celldata 是一维数组，每项 { r, c, v }：
 *   r: 行号（从 0 开始）
 *   c: 列号（从 0 开始）
 *   v: 单元格对象
 *      - v.v  : 原始值（透视表计算时取的是它！）
 *      - v.m  : 显示值（字符串，渲染到格子里的文本）
 *      - v.ct : 单元格类型 { fa: 格式, t: 类型 }
 *               t='n' 数字 / t='g' 通用 / t='s' 字符串 / t='d' 日期
 *
 * 【坑点】要参与 SUM/AVERAGE 等数值聚合的列，v 必须是 number 且 t 必须是 'n'，
 *         如果数字存成了字符串，求和结果会不对（按 COUNTA 之类处理了）。
 * ==========================================================================*/
function buildCelldata(table) {
  const celldata = []
  table.forEach((rowArr, r) => {
    rowArr.forEach((val, c) => {
      if (val === null || val === undefined || val === '') return // 空单元格不用存
      const isNumber = typeof val === 'number'
      celldata.push({
        r,
        c,
        v: {
          v: val,          // 原始值
          m: String(val),  // 显示值
          ct: { fa: 'General', t: isNumber ? 'n' : 'g' },
        },
      })
    })
  })
  return celldata
}

/* ============================================================================
 * 三、源数据 sheet 配置
 * ==========================================================================*/
const SOURCE_SHEET_INDEX = 'sheet_source_001' // 透视表通过这个 index 找到源数据

function buildSourceSheet() {
  return {
    name: '销售明细',            // sheet 名（底部标签显示）
    index: SOURCE_SHEET_INDEX,   // 唯一标识（注意：不是顺序，顺序是 order）
    status: 0,                   // 0=未激活 1=激活（整个工作簿只能有一个 1）
    order: 0,                    // 底部标签排列顺序，从 0 开始
    row: 100,                    // 表格总行数（要比数据行多，留余量）
    column: 10,                  // 表格总列数
    celldata: buildCelldata(SOURCE_TABLE), // 初始化单元格数据（仅初始化时用一次）
    config: {},                  // 合并/行高/列宽/边框等，空对象即可
  }
}

/* ============================================================================
 * 四、透视表 sheet 配置 ★★★ 本文重点 ★★★
 *
 * 【核心概念】Luckysheet 的透视表 = 一个独立的 sheet：
 *   - 这个 sheet 的 isPivotTable = true
 *   - 所有透视配置都存在这个 sheet 的 pivotTable 字段里
 *   - 它通过 pivotTable.pivotDataSheetIndex 关联到源数据 sheet
 *
 * 【用户手动操作路径】（理解了这个，就理解配置结构了）：
 *   1. 在源数据 sheet 选中数据区域
 *   2. 点工具栏"数据透视表"按钮
 *   3. Luckysheet 自动新建一个 sheet 并切过去
 *   4. 弹出拖拽面板：把字段分别拖进【筛选】【行】【列】【值】四个区域
 *   5. 面板里的四个区域 ↔ pivotTable 里的 filter / row / column / values 四个数组
 * ==========================================================================*/
const PIVOT_SHEET_INDEX = 'sheet_pivot_001'

// 当前行维度字段（提出来是为了演示"动态切换维度"）
// 结构含义见下方 pivotTable.row 的注释
let currentRowField = { index: 0, name: '销售员', fullname: '销售员' }

function buildPivotSheet() {
  return {
    name: '透视分析',
    index: PIVOT_SHEET_INDEX,
    status: 1,        // 打开页面默认停在这个 sheet
    order: 1,
    row: 60,
    column: 20,
    celldata: [],     // 透视表 sheet 不需要手动给数据，结果由引擎算
    config: {},

    isPivotTable: true, // ★ 标记：这是一个透视表 sheet

    pivotTable: {
      /* ----------------------------------------------------------------------
       * 【1】pivot_select_save：透视表在"自己这个 sheet"里的占位选区
       *   - 不是源数据的范围！是透视表结果画在当前 sheet 的哪块区域
       *   - row: [起始行, 结束行]，column: [起始列, 结束列]，从 0 开始
       *   - 给个大概范围即可，引擎绘制时会按实际结果调整
       * --------------------------------------------------------------------*/
      pivot_select_save: {
        row: [0, 20],
        column: [0, 10],
      },

      /* ----------------------------------------------------------------------
       * 【2】pivotDataSheetIndex：源数据在哪个 sheet
       *   - 填源 sheet 的 index（本例 'sheet_source_001'），不是 order！
       *   - 透视引擎会去那个 sheet 读 data 做聚合计算
       * --------------------------------------------------------------------*/
      pivotDataSheetIndex: SOURCE_SHEET_INDEX,

      /* ----------------------------------------------------------------------
       * 【3】row：行维度（拖拽面板的"行"区域）—— 数组，可放多个字段
       * 每个字段对象 3 个属性：
       *   index   : 【源数据的列号，从 0 开始】0=销售员列
       *   name    : 字段名 = 源数据表头那一格的值（必须和表头一致）
       *   fullname: 显示名（拖拽面板和表头上显示用，一般和 name 一样）
       *
       * 效果：销售员的每个去重值（张三/李四/王五）变成结果表的一行
       * 放多个字段就是多级行头，例如：
       *   row: [ {index:1,...地区}, {index:0,...销售员} ] → 先按地区分组，组内再按销售员
       * --------------------------------------------------------------------*/
      row: [currentRowField],

      /* ----------------------------------------------------------------------
       * 【4】column：列维度（拖拽面板的"列"区域）—— 结构同 row
       * 效果：地区的每个去重值（华东/华北/华南）变成结果表的一组列
       * 同样可以放多个字段做多级列头
       * --------------------------------------------------------------------*/
      column: [
        { index: 1, name: '地区', fullname: '地区' },
      ],

      /* ----------------------------------------------------------------------
       * 【5】filter：筛选区字段（拖拽面板的"筛选"区域）—— 结构同 row
       * 效果：该字段会出现在透视表顶部的筛选下拉里，用户可勾选值来过滤结果
       *   例：把"产品"放进来，用户就能只看"手机"的汇总
       *
       * 【注意】官方文档只明确了字段本身的结构 {index, name, fullname}；
       * 用户在下拉里"勾选了哪些值"的存储字段官方没有文档化。
       * 如果你需要持久化用户的勾选状态，建议实际操作一次筛选后，
       * 用 luckysheet.getLuckysheetfile() 打印 pivotTable.filter 确认结构再存。
       * --------------------------------------------------------------------*/
      filter: [
        { index: 2, name: '产品', fullname: '产品' },
      ],

      /* ----------------------------------------------------------------------
       * 【6】values：值区域（拖拽面板的"值"区域）—— 数组，可放多个
       * 每个值字段 5 个属性：
       *   index   : 源数据的列号（要聚合的那列）
       *   name    : 字段名（和表头一致）
       *   fullname: 显示名，惯例写法 "聚合名:字段名"，如 "求和:金额"
       *             ★ 它只影响表头显示文字，不影响计算！
       *   sumtype : ★ 真正决定计算方式的字段，可选值：
       *             'SUM'     求和
       *             'COUNT'   计数（统计数字单元格个数）
       *             'COUNTA'  计数（统计非空单元格个数，文本也算）
       *             'MAX'     最大值
       *             'MIN'     最小值
       *             'AVERAGE' 平均值
       *             'PRODUCT' 乘积
       *             'STDEV'   样本标准差
       *             'STDEVP'  总体标准差
       *             'VAR'     样本方差
       *             'VARP'    总体方差
       *   nameindex: 同一字段被多次拖入值区域时的编号（0,1,2...）
       *             例：金额既要 SUM 又要 COUNT →
       *             { name:'金额', sumtype:'SUM',   nameindex:0, ... }
       *             { name:'金额', sumtype:'COUNT', nameindex:1, ... }
       *             不同字段时都用 0 即可
       * --------------------------------------------------------------------*/
      values: [
        { index: 3, name: '金额', fullname: '求和:金额', sumtype: 'SUM', nameindex: 0 },
        { index: 4, name: '数量', fullname: '求和:数量', sumtype: 'SUM', nameindex: 0 },
      ],

      /* ----------------------------------------------------------------------
       * 【7】showType：多个值字段的排列方向（只有 values 放了 2 个以上才有意义）
       *   'column': 值字段沿【列】方向展开
       *             → 每个地区下面分出"求和:金额""求和:数量"两个子列
       *   'row'   : 值字段沿【行】方向展开
       *             → 每个销售员下面分出两行
       * --------------------------------------------------------------------*/
      showType: 'column',

      /* ----------------------------------------------------------------------
       * 【8】pivotDatas：透视表计算结果缓存（二维数组）
       *   - 可以留空数组 []，配合 drawPivotTable:true 让引擎打开时自己算
       *   - 引擎算完后的结构（官方单值字段示例）：
       *       [
       *         ["count:score", "science", "mathematics", ..., "total"], // 表头行
       *         ["Alex",  1, 1, ..., 4],   // 每个行维度值一行
       *         ["Joy",   1, 1, ..., 4],
       *         ["total", 3, 3, ..., 12]   // 最后自动带一行总计
       *       ]
       *   - 即：第一行表头（首格是值字段显示名，中间是列维度各值，末尾 total），
       *         最后一行是 total 汇总行
       *   - 多个值字段时表头会是两行（值字段名一行 + 列维度值一行），
       *     具体以实际生成结果为准
       *   - 持久化时把它一起存下来，下次还原可直接显示上次的计算结果
       * --------------------------------------------------------------------*/
      pivotDatas: [],

      /* ----------------------------------------------------------------------
       * 【9】drawPivotTable：初始化时是否强制重新计算并绘制
       *   true  → 打开页面就用最新源数据重算（推荐，保证结果新鲜）
       *   false → 直接用 pivotDatas 里的缓存结果渲染（打开快，但可能是旧数据）
       * --------------------------------------------------------------------*/
      drawPivotTable: true,

      /* ----------------------------------------------------------------------
       * 【10】pivotTableBoundary：透视表结果占用的边界 [行数, 列数]
       *   给预估值即可，用于占位和绘制范围，引擎绘制时按实际结果来
       * --------------------------------------------------------------------*/
      pivotTableBoundary: [20, 11],
    },
  }
}

/* ============================================================================
 * 五、创建 / 销毁 / 重建
 * ==========================================================================*/
function createLuckysheet(data) {
  if (!window.luckysheet) {
    console.error('未检测到 window.luckysheet，请先在 index.html 引入 Luckysheet 资源')
    return
  }
  window.luckysheet.create({
    container: 'luckysheet',  // 容器 id
    title: '销售数据透视分析', // 工作簿名（顶部信息栏显示）
    lang: 'zh',
    data,                      // sheet 配置数组（源数据 sheet + 透视表 sheet）

    showtoolbar: true,         // 顶部工具栏
    showtoolbarConfig: {
      pivotTable: true,        // 显示"数据透视表"按钮（用户手动创建的入口）
      // 其他按钮都可以在这里单独控制显隐，如 chart: false 隐藏图表
    },
    showsheetbar: true,        // 底部 sheet 标签栏（多 sheet 必须开）
    showstatisticBar: true,    // 底部计数栏
    allowEdit: true,           // 是否允许编辑（只读场景设 false）

    hook: {
      // 工作簿创建完成后的回调（适合在这里做数据回显、DOM 微调）
      workbookCreateAfter() {
        console.log('[luckysheet] 工作簿创建完成')
      },
    },
  })
}

/**
 * 重建整个工作簿
 * 【为什么用 destroy + create？】
 * Luckysheet 没有提供"修改透视表配置"的官方 API，
 * 想编程方式改维度/值，最稳的做法就是：改配置对象 → 销毁 → 重新创建
 */
function rebuild(withPivot) {
  window.luckysheet && window.luckysheet.destroy() // 先销毁，否则重复 create 会白屏/事件残留

  const sheets = [buildSourceSheet()]
  if (withPivot) {
    sheets.push(buildPivotSheet()) // 透视表 sheet 里 status=1，打开即停在透视表
  } else {
    sheets[0].status = 1           // 不带透视表时，激活源数据 sheet
  }
  createLuckysheet(sheets)
}

/* ============================================================================
 * 六、演示操作
 * ==========================================================================*/

/** 演示：编程方式切换行维度（销售员 ⇄ 产品） */
function switchRowDim() {
  currentRowField = currentRowField.index === 0
    ? { index: 2, name: '产品', fullname: '产品' }   // 切成"产品"（第 2 列）
    : { index: 0, name: '销售员', fullname: '销售员' } // 切回"销售员"（第 0 列）
  rebuild(true)
}

/**
 * 读取透视表配置 —— 用于【持久化】
 * 场景：用户手动拖拽改了维度，你想把配置存到后端，下次打开原样还原
 * 还原方法：把这里拿到的 pivotTable 对象，原样塞回透视表 sheet 配置即可
 */
function readPivotConfig() {
  const files = window.luckysheet.getLuckysheetfile() // 拿到所有 sheet 的完整状态
  const pivotFile = files.find(f => f.isPivotTable)
  if (!pivotFile) {
    alert('当前没有透视表 sheet')
    return
  }
  // 深拷贝打印，避免控制台看到的是引用
  console.log('===== 透视表完整配置（存后端就存这个）=====')
  console.log(JSON.parse(JSON.stringify(pivotFile.pivotTable)))
  alert('已打印到控制台（F12 查看）')
}

/**
 * 读取透视表结果数据 —— 用于【导出/二次加工】
 * pivotTable.pivotDatas 就是算好的二维表（含表头和 total 行）
 */
function readPivotResult() {
  const files = window.luckysheet.getLuckysheetfile()
  const pivotFile = files.find(f => f.isPivotTable)
  if (!pivotFile || !pivotFile.pivotTable) {
    alert('当前没有透视表 sheet')
    return
  }
  console.log('===== 透视表结果（二维数组）=====')
  console.log(JSON.parse(JSON.stringify(pivotFile.pivotTable.pivotDatas || [])))
  alert('已打印到控制台（F12 查看）')
}

/* ============================================================================
 * 七、生命周期
 * ==========================================================================*/
onMounted(() => {
  rebuild(true) // 默认打开：源数据 + 透视表
})

onBeforeUnmount(() => {
  // 路由离开/组件销毁时必须 destroy，否则下次进来 create 会出问题
  window.luckysheet && window.luckysheet.destroy()
})
</script>

<style scoped>
.luckysheet-demo {
  position: relative;
  width: 100%;
  height: 100%;
}
.op-bar {
  height: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  box-sizing: border-box;
}
/*
 * Luckysheet 容器要求：
 * 1. 必须有明确的宽高（官方推荐 absolute 撑满父容器的方式）
 * 2. 放在 Dialog/抽屉里时，要等弹层动画结束、DOM 有尺寸后再 create，
 *    否则 canvas 计算出的宽高是 0，表现为白屏
 */
.sheet-container {
  margin: 0;
  padding: 0;
  position: absolute;
  top: 50px;   /* 给顶部操作栏留出 50px */
  bottom: 0;
  left: 0;
  width: 100%;
}
/*
 * 如果组件放在 Element Plus / Ant Design Vue 的弹层里，
 * 编辑框和右键菜单 z-index 不够会被盖住，需要手动抬层级
 */
:deep(.luckysheet-input-box) { z-index: 3000; }
:deep(.luckysheet-cols-menu) { z-index: 3001; }
</style>
