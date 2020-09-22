const fsPromises = require('fs').promises
const puppeteer = require('puppeteer')
const wbn = require('wbn') // See https://www.npmjs.com/package/wbn
const fetch = require('node-fetch')

const { shouldIgnoreHeader } = require('./headers')
const { encodeUrl, decodeUrl } = require('./url')
const { relative } = require('path')

const viewport = {
  width: 1200,
  height: 2400,
  deviceScaleFactor: 2.0
}
const fetchTimeoutMs = 6 * 1000

const myIgnoreHeaders = [
  'content-security-policy',
  'access-control-allow-origin',
  'access-control-allow-credentials'
]

const wait = ms => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve(null) }, ms)
  })
}

const main = async primaryURL => {
  const requestList = []
  // Requestを集める
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  await page.setViewport(viewport)
  await page.on('request', function (request) {
    if (request.method() === 'GET') {
      requestList.push(request)
    }
    return request.continue()
  })
  await page.goto(primaryURL) // { waitUntil: 'networkidle2' }
  await page.evaluate(() => {
    window.scrollTo(0, 10)
  })
  await page.waitFor(10 * 1000)
  // wbn表示時にclient jsのエラーでSPAの初期画面が描画されないのを防ぐため、
  // primaryURLに対するレスポンスはPuppeteerで表示されたHTMLテキストとする
  const primaryHtml = await page.evaluate(() => {
    return document.querySelector('html').outerHTML
  })
  const title = await page.evaluate(() => {
    return document.title.replace(/[\s/]/g, '_')
  })
  await browser.close()
  // Web Bundle fileを作る
  await buildWbn(primaryURL, primaryHtml, title, null, requestList)
}

const buildWbn = async (primaryURL, primaryBody, title, manifestURL, requestList) => {
  primaryURL = encodeUrl(primaryURL)
  console.log(`There are ${requestList.length} requests`)

  const builder = new wbn.BundleBuilder(primaryURL)
  if (manifestURL) {
    builder.setManifestURL(manifestURL)
  }

  for (const req of requestList) {
    const url = req.url()
    console.log('|', decodeUrl(url))

    let res
    try {
      res = await Promise.race([
        fetch(url, { method: 'GET', timeout: fetchTimeoutMs }),
        wait(fetchTimeoutMs)
      ])
      if (!res || !res.ok) {
        console.log('res is not Ok:', url)
        continue
      }
    } catch (err) {
      // TODO: data URL
      console.log(err)
      continue
    }

    const headers = Object.create(null)
    for (const [name, value] of Array.from(res.headers)) {
      if (shouldIgnoreHeader(name)) continue
      // 追加で無視
      if (myIgnoreHeaders.includes(name.toLowerCase())) continue
      headers[name] = value
    }

    const body = url === encodeUrl(primaryURL)
      ? primaryBody
      : new Uint8Array(await res.arrayBuffer())

    builder.addExchange(
      url, // URL
      res.status, // response code
      headers, // response headers
      body // response body (string or Uint8Array)
    )
  }
  // console.log(builder)
  const outPath = `${title || 'out'}.wbn`
  await fsPromises.writeFile(outPath, builder.createBundle())
  console.log('> primaryURL:', decodeUrl(primaryURL))
  console.log('>', outPath)
}

if (require.main === module) {
  const pageUrl = process.env.PAGE_URL
  if (!pageUrl) {
    console.error('PAGE_URL is required')
    process.exit(1)
  }
  main(pageUrl)
}

module.exports = { main }
