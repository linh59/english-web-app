const { chromium } = require('playwright-core')

;(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const reqLog = []
  page.on('request', (req) => {
    if (req.url().includes('jsdelivr') || req.url().includes('ffmpeg-core')) {
      reqLog.push(req.url())
    }
  })
  const respLog = []
  page.on('response', (res) => {
    if (res.url().includes('jsdelivr') || res.url().includes('ffmpeg-core')) {
      respLog.push(`${res.status()} ${res.url()}`)
    }
  })
  const consoleLog = []
  page.on('console', (msg) => consoleLog.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleLog.push(`[pageerror] ${err.message}`))

  await page.goto('http://localhost:8931/ffmpeg-cdn-test.html')

  let status = ''
  for (let i = 0; i < 60; i++) {
    status = await page.textContent('#status')
    if (status !== 'pending') break
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log('FINAL STATUS:', status)
  console.log('--- requests ---')
  console.log(reqLog.join('\n'))
  console.log('--- responses ---')
  console.log(respLog.join('\n'))
  console.log('--- console/page errors ---')
  console.log(consoleLog.join('\n'))

  await browser.close()
  process.exit(status === 'LOADED_OK' ? 0 : 1)
})()
