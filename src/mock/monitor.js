import dayjs from "dayjs";

const TIME_RANGE_MINUTES = {
  近1小时: 60,
  近6小时: 360,
  近24小时: 1440,
};

const PROCEDURES = [
  {
    procedureCode: "PROC-START-001",
    procedureName: "机组启动规程",
    plans: [
      {
        id: 101,
        vcConfigName: "机组启动阶段监控方案",
        planScale: 0.94,
      },
      {
        id: 102,
        vcConfigName: "升速暖机阶段监控方案",
        planScale: 1,
      },
    ],
  },
  {
    procedureCode: "PROC-LOAD-002",
    procedureName: "并网升负荷规程",
    plans: [
      {
        id: 201,
        vcConfigName: "并网升负荷监控方案",
        planScale: 1.04,
      },
      {
        id: 202,
        vcConfigName: "高负荷运行监控方案",
        planScale: 1.08,
      },
    ],
  },
  {
    procedureCode: "PROC-STEADY-003",
    procedureName: "稳态运行规程",
    plans: [
      {
        id: 301,
        vcConfigName: "稳态运行监控方案",
        planScale: 1,
      },
    ],
  },
];

const STAGE_TEMPLATES = [
  {
    stageOrder: 1,
    params: [
      {
        paramCode: "1-TE-101",
        paramName: "主蒸汽温度",
        paramUnit: "℃",
        baseline: 538,
        amplitude: 6,
        lowerLimit: 525,
        upperLimit: 550,
        hasAlarm: false,
        decimals: 1,
      },
      {
        paramCode: "1-PT-102",
        paramName: "主蒸汽压力",
        paramUnit: "MPa",
        baseline: 16.7,
        amplitude: 0.35,
        lowerLimit: 15.8,
        upperLimit: 17.5,
        hasAlarm: false,
        decimals: 2,
      },
      {
        paramCode: "1-FT-103",
        paramName: "给水流量",
        paramUnit: "t/h",
        baseline: 886,
        amplitude: 32,
        lowerLimit: 820,
        upperLimit: 960,
        hasAlarm: true,
        decimals: 1,
      },
      {
        paramCode: "1-VB-104",
        paramName: "汽轮机轴振",
        paramUnit: "mm/s",
        baseline: 3.6,
        amplitude: 0.8,
        lowerLimit: 0,
        upperLimit: 7.1,
        hasAlarm: false,
        decimals: 2,
      },
      {
        paramCode: "1-LT-105",
        paramName: "汽包液位",
        paramUnit: "mm",
        baseline: 18,
        amplitude: 9,
        lowerLimit: -50,
        upperLimit: 50,
        hasAlarm: false,
        decimals: 1,
      },
    ],
  },
  {
    stageOrder: 2,
    params: [
      {
        paramCode: "2-TE-201",
        paramName: "再热蒸汽温度",
        paramUnit: "℃",
        baseline: 536,
        amplitude: 5,
        lowerLimit: 524,
        upperLimit: 548,
        hasAlarm: false,
        decimals: 1,
      },
      {
        paramCode: "2-PT-202",
        paramName: "再热蒸汽压力",
        paramUnit: "MPa",
        baseline: 3.42,
        amplitude: 0.16,
        lowerLimit: 3.1,
        upperLimit: 3.8,
        hasAlarm: false,
        decimals: 2,
      },
      {
        paramCode: "2-SP-203",
        paramName: "汽轮机转速",
        paramUnit: "r/min",
        baseline: 3000,
        amplitude: 12,
        lowerLimit: 2950,
        upperLimit: 3050,
        hasAlarm: false,
        decimals: 1,
      },
      {
        paramCode: "2-OP-204",
        paramName: "调节阀开度",
        paramUnit: "%",
        baseline: 72,
        amplitude: 4,
        lowerLimit: 60,
        upperLimit: 85,
        hasAlarm: false,
        decimals: 1,
      },
      {
        paramCode: "2-CT-205",
        paramName: "凝汽器真空",
        paramUnit: "kPa",
        baseline: -92,
        amplitude: 1.8,
        lowerLimit: -96,
        upperLimit: -88,
        hasAlarm: true,
        decimals: 2,
      },
      {
        paramCode: "2-LT-206",
        paramName: "凝汽器水位",
        paramUnit: "mm",
        baseline: 760,
        amplitude: 25,
        lowerLimit: 650,
        upperLimit: 850,
        hasAlarm: false,
        decimals: 1,
      },
    ],
  },
  {
    stageOrder: 3,
    params: [
      {
        paramCode: "3-ET-301",
        paramName: "发电机功率",
        paramUnit: "MW",
        baseline: 586,
        amplitude: 18,
        lowerLimit: 540,
        upperLimit: 620,
        hasAlarm: false,
        decimals: 1,
      },
      {
        paramCode: "3-PF-302",
        paramName: "功率因数",
        paramUnit: "",
        baseline: 0.98,
        amplitude: 0.01,
        lowerLimit: 0.95,
        upperLimit: 1,
        hasAlarm: false,
        decimals: 3,
      },
      {
        paramCode: "3-UT-303",
        paramName: "电网频率",
        paramUnit: "Hz",
        baseline: 50,
        amplitude: 0.04,
        lowerLimit: 49.8,
        upperLimit: 50.2,
        hasAlarm: false,
        decimals: 3,
      },
      {
        paramCode: "3-TE-304",
        paramName: "发电机定子温度",
        paramUnit: "℃",
        baseline: 68,
        amplitude: 3,
        lowerLimit: 45,
        upperLimit: 80,
        hasAlarm: false,
        decimals: 1,
      },
      {
        paramCode: "3-VB-305",
        paramName: "发电机轴承振动",
        paramUnit: "mm/s",
        baseline: 2.8,
        amplitude: 0.6,
        lowerLimit: 0,
        upperLimit: 6.5,
        hasAlarm: false,
        decimals: 2,
      },
    ],
  },
];

const planList = PROCEDURES.flatMap((procedure) =>
  procedure.plans.map((plan) => ({
    ...plan,
    procedureCode: procedure.procedureCode,
    procedureName: procedure.procedureName,
  })),
);

const createPlanParams = (plan) =>
  STAGE_TEMPLATES.flatMap((stage) =>
    stage.params.map((param, paramIndex) => {
      const scale = plan.planScale;
      const shouldScale = Math.abs(param.baseline) > 1;
      const value = (rawValue) =>
        Number((shouldScale ? rawValue * scale : rawValue).toFixed(param.decimals));

      return {
        id: plan.id * 100 + stage.stageOrder * 10 + paramIndex,
        planId: plan.id,
        stageOrder: stage.stageOrder,
        paramCode: `${param.paramCode}-P${plan.id}`,
        paramName: param.paramName,
        paramUnit: param.paramUnit,
        baseline: value(param.baseline),
        amplitude: value(param.amplitude),
        lowerLimit: value(param.lowerLimit),
        upperLimit: value(param.upperLimit),
        hasAlarm: param.hasAlarm,
        decimals: param.decimals,
      };
    }),
  );

const planParamMap = new Map(
  planList.map((plan) => [plan.id, createPlanParams(plan)]),
);

const paramMap = new Map(
  [...planParamMap.values()].flat().map((param) => [param.paramCode, param]),
);

const wait = (data, delay = 120) =>
  new Promise((resolve) => {
    setTimeout(() => resolve({ data }), delay);
  });

const clone = (data) => JSON.parse(JSON.stringify(data));

const getRangeMinutes = (timeRange) =>
  TIME_RANGE_MINUTES[timeRange] || TIME_RANGE_MINUTES["近1小时"];

const getSeed = (param) => {
  const codeSeed = Array.from(param.paramCode).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return codeSeed + param.id;
};

const pseudoNoise = (seed, sampleIndex) => {
  const value = Math.sin(seed * 12.9898 + sampleIndex * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};

const getPointValue = (param, timestamp) => {
  const seed = getSeed(param);
  const sampleIndex = Math.floor(timestamp / 30000);
  const wave =
    Math.sin(sampleIndex / 18 + seed / 97) * 0.58 +
    Math.sin(sampleIndex / 63 + seed / 41) * 0.27 +
    Math.sin(sampleIndex / 9 + seed / 23) * 0.15;
  const noise = pseudoNoise(seed, sampleIndex) * 0.16;
  const value = param.baseline + param.amplitude * (wave + noise);

  return Number(value.toFixed(param.decimals));
};

const createPoint = (param, timestamp) => ({
  timestamp,
  timeStr: dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss"),
  value: getPointValue(param, timestamp),
});

const createSeries = (param, timeRange) => {
  const rangeMinutes = getRangeMinutes(timeRange);
  const stepSeconds = rangeMinutes <= 60 ? 30 : 60;
  const pointCount = Math.floor((rangeMinutes * 60) / stepSeconds);
  const endTime = Math.floor(Date.now() / (stepSeconds * 1000)) * stepSeconds * 1000;
  const startTime = endTime - (pointCount - 1) * stepSeconds * 1000;
  const dataList = Array.from({ length: pointCount }, (_, index) =>
    createPoint(param, startTime + index * stepSeconds * 1000),
  );

  return {
    paramCode: param.paramCode,
    paramName: param.paramName,
    paramUnit: param.paramUnit,
    upperLimit: param.upperLimit,
    lowerLimit: param.lowerLimit,
    dataList,
  };
};

export const queryVcConfigByProcedureCode = async ({ procedureCode } = {}) => {
  const procedure =
    PROCEDURES.find((item) => item.procedureCode === procedureCode) ||
    PROCEDURES[0];
  const plans = procedure.plans.map((plan) => ({
    id: plan.id,
    vcConfigName: plan.vcConfigName,
    procedureCode: procedure.procedureCode,
    procedureName: procedure.procedureName,
  }));

  return wait(plans);
};

export const queryVcConfigParams = async ({ id } = {}) => {
  const fallbackPlanId = planList[0].id;
  const planId = Number(id) || fallbackPlanId;
  const params = planParamMap.get(planId) || planParamMap.get(fallbackPlanId);

  return wait(clone(params || []));
};

export const batchGetParamDataWithTimeRange = async ({
  paramCodesList = [],
  timeRange = "",
} = {}) => {
  const fallbackParams = planParamMap.get(planList[0].id)?.slice(0, 5) || [];
  const targetParams = paramCodesList.length
    ? paramCodesList.map((paramCode) => paramMap.get(paramCode)).filter(Boolean)
    : fallbackParams;

  return wait(
    targetParams.map((param) => createSeries(param, timeRange)),
    180,
  );
};

export const batchPullParamsDataWithCertainRate = async ({
  paramCodesList = [],
} = {}) => {
  const timestamp = Math.floor(Date.now() / 5000) * 5000;
  const targetParams = paramCodesList
    .map((paramCode) => paramMap.get(paramCode))
    .filter(Boolean);

  return wait(
    targetParams.map((param) => {
      return {
        paramCode: param.paramCode,
        paramName: param.paramName,
        paramUnit: param.paramUnit,
        upperLimit: param.upperLimit,
        lowerLimit: param.lowerLimit,
        dataList: [createPoint(param, timestamp)],
      };
    }),
    80,
  );
};

export const getParamDetail = async ({ paramCode } = {}) => {
  const param = paramMap.get(paramCode);
  if (!param) return wait(null);

  return wait({
    ...clone(param),
    systemCode: "MOCK-SYSTEM",
    description: `${param.paramName}模拟参数详情`,
  });
};
