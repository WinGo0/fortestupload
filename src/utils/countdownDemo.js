/**
 * 模拟接口：返回活动结束时间。
 * 联调时换成 request.get('/activity/countdown') 即可。
 */
export function fetchCountdownInfo() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        title: '双十一大促',
        endTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 天后结束
      })
    }, 300)
  })
}
