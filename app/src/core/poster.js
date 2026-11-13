/**
 * 分享海报生成器
 *
 * 用 Canvas 绘制一张 750x1200 的竖版海报, 可下载为 PNG
 * 纯前端实现, 无网络依赖
 */

const W = 750
const H = 1200

/**
 * 绘制圆角矩形
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * 绘制文字 (自动换行)
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = text.split('')
  let line = ''
  let lines = []
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight))
  return lines.length
}

/**
 * 生成海报
 * @param {Object} data { name, avatar, rating, dailyAvg, total, equivalents, rank, betterThan, locale }
 * @returns {Promise<string>} dataURL
 */
export function generatePoster(data) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    const zh = data.locale !== 'en'

    // 背景渐变
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#1a3d2a')
    bg.addColorStop(0.5, '#2e9e5b')
    bg.addColorStop(1, '#1e6b3d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // 装饰圆
    ctx.globalAlpha = 0.08
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(W - 80, 120, 200, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(60, H - 150, 160, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // 顶部标题
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '600 26px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(zh ? '碳迹 · 我的碳足迹报告' : 'Carbon Trace · My Footprint', W / 2, 90)

    // 头像
    ctx.font = '90px sans-serif'
    ctx.fillText(data.avatar || '🙋', W / 2, 210)

    // 昵称
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 40px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(data.name || (zh ? '我' : 'Me'), W / 2, 275)

    // 主卡片
    const cardY = 320
    const cardH = 400
    ctx.fillStyle = 'rgba(255,255,255,0.96)'
    roundRect(ctx, 60, cardY, W - 120, cardH, 28)
    ctx.fill()

    // 评级徽章
    const ratingColors = { A: '#2e9e5b', B: '#7ED321', C: '#F5A623', D: '#E8834A', E: '#d9534f' }
    const rc = ratingColors[data.rating?.level] || '#2e9e5b'
    ctx.fillStyle = rc
    roundRect(ctx, W / 2 - 60, cardY + 40, 120, 120, 24)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 64px -apple-system, sans-serif'
    ctx.fillText(data.rating?.level || 'A', W / 2, cardY + 122)

    // 评级文字
    ctx.fillStyle = '#5a6b60'
    ctx.font = '500 22px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(zh ? '环保评级' : 'Eco Rating', W / 2, cardY + 195)

    // 日均排放
    ctx.fillStyle = '#1a2b1f'
    ctx.font = '800 56px -apple-system, sans-serif'
    ctx.fillText(String(data.dailyAvg ?? 0), W / 2, cardY + 265)
    ctx.fillStyle = '#8a9a90'
    ctx.font = '400 20px -apple-system, "PingFang SC", sans-serif'
    ctx.fillText(zh ? 'kgCO₂e / 天' : 'kgCO₂e / day', W / 2, cardY + 295)

    // 排名
    if (data.rank) {
      ctx.fillStyle = '#2e9e5b'
      ctx.font = '600 24px -apple-system, "PingFang SC", sans-serif'
      const rankText = zh
        ? `排名第 ${data.rank} 位 · 超过 ${data.betterThan}% 的人`
        : `Rank #${data.rank} · Better than ${data.betterThan}%`
      ctx.fillText(rankText, W / 2, cardY + 350)
    }

    // 等效换算区
    const eqY = cardY + cardH + 40
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    roundRect(ctx, 60, eqY, W - 120, 200, 24)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = '600 22px -apple-system, "PingFang SC", sans-serif'
    ctx.fillText(zh ? '累计减排相当于' : 'Cumulative savings equal', W / 2, eqY + 45)

    const eq = data.equivalents || {}
    const items = [
      { icon: '🌳', value: eq.trees ?? 0, label: zh ? '棵树吸收一年' : 'tree-years' },
      { icon: '🚗', value: eq.kmDriving ?? 0, label: zh ? '公里汽车行驶' : 'km driving' },
      { icon: '📱', value: eq.phoneCharges ?? 0, label: zh ? '次手机充电' : 'phone charges' },
    ]
    const colW = (W - 120) / 3
    items.forEach((it, i) => {
      const cx = 60 + colW * i + colW / 2
      ctx.font = '36px sans-serif'
      ctx.fillText(it.icon, cx, eqY + 100)
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 30px -apple-system, sans-serif'
      ctx.fillText(String(it.value), cx, eqY + 145)
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.font = '400 16px -apple-system, "PingFang SC", sans-serif'
      ctx.fillText(it.label, cx, eqY + 172)
    })

    // 标语
    const sloganY = eqY + 250
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 30px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
    const slogan = zh ? '每一次低碳选择，都在改变未来' : 'Every low-carbon choice changes the future'
    ctx.fillText(slogan, W / 2, sloganY)

    // 底部
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '400 20px -apple-system, "PingFang SC", sans-serif'
    ctx.fillText(zh ? '碳迹 Carbon Trace · 记录每一天的碳足迹' : 'Carbon Trace · Track your daily footprint', W / 2, H - 60)

    resolve(canvas.toDataURL('image/png'))
  })
}

/**
 * 下载海报
 */
export async function downloadPoster(data, filename = null) {
  const url = await generatePoster(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `carbon-trace-${new Date().toISOString().slice(0, 10)}.png`
  a.click()
  return url
}