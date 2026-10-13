import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type MuteTimeUnit = 'h' | 'm' | 's'
export type CountdownStatus = 'idle' | 'running' | 'ended'

const MUTE_TIME_UNIT_MS: Record<MuteTimeUnit, number> = {
  h: 60 * 60 * 1000,
  m: 60 * 1000,
  s: 1000,
}

export const useAudiosStore = defineStore('audios', () => {
  const muteTime = ref(10)
  const muteTimeUnit = ref<MuteTimeUnit>('m')
  const remainingSeconds = ref(10 * 60)
  const status = ref<CountdownStatus>('idle')

  let timer: ReturnType<typeof setInterval> | null = null
  let endTime = 0

  const hours = computed(() => Math.floor(remainingSeconds.value / 3600))
  const minutes = computed(() => Math.floor((remainingSeconds.value % 3600) / 60))
  const seconds = computed(() => remainingSeconds.value % 60)

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const tick = () => {
    const rest = Math.max(0, endTime - Date.now())
    remainingSeconds.value = Math.ceil(rest / 1000)

    if (rest === 0) {
      status.value = 'ended'
      stopTimer()
    }
  }

  const saveSettings = (nextMuteTime: number, nextMuteTimeUnit: MuteTimeUnit) => {
    if (!Number.isInteger(nextMuteTime) || nextMuteTime < 1) return false

    stopTimer()
    muteTime.value = nextMuteTime
    muteTimeUnit.value = nextMuteTimeUnit
    remainingSeconds.value = Math.ceil((nextMuteTime * MUTE_TIME_UNIT_MS[nextMuteTimeUnit]) / 1000)
    status.value = 'idle'
    endTime = 0
    return true
  }

  const startCountdown = () => {
    stopTimer()
    endTime = Date.now() + muteTime.value * MUTE_TIME_UNIT_MS[muteTimeUnit.value]
    remainingSeconds.value = Math.ceil((endTime - Date.now()) / 1000)
    status.value = 'running'
    timer = setInterval(tick, 1000)
  }

  return {
    muteTime,
    muteTimeUnit,
    status,
    hours,
    minutes,
    seconds,
    saveSettings,
    startCountdown,
  }
})
