import fs from 'fs'
import os from 'os'
import path from 'path'

const htmlPath = path.join(os.tmpdir(), 'wx.html')
const html = fs.readFileSync(htmlPath, 'utf8')

function pick(re) {
  const m = html.match(re)
  return m ? m[1].replace(/\s+/g, ' ').trim() : null
}

const title =
  pick(/property="og:title" content="([^"]+)"/) ||
  pick(/id="activity-name"[^>]*>([^<]+)/) ||
  pick(/var msg_title = (?:htmlDecode\()?['"]([^'"]+)['"]/)

const publisher =
  pick(/property="og:article:author" content="([^"]+)"/) ||
  pick(/id="js_name"[^>]*>([^<]+)/) ||
  pick(/var nickname = (?:htmlDecode\()?['"]([^'"]+)['"]/)

const ct = pick(/var ct = "(\d+)"/)
const publishTimeText = pick(/id="publish_time"[^>]*>([^<]+)/)
const publishedAt = ct
  ? new Date(Number.parseInt(ct, 10) * 1000).toISOString().slice(0, 10)
  : publishTimeText

const coverImage =
  pick(/property="og:image" content="([^"]+)"/) ||
  pick(/var msg_cdn_url = "([^"]+)"/)

const imageSet = new Set()
if (coverImage) imageSet.add(coverImage)
for (const m of html.matchAll(/data-src="(https:\/\/mmbiz[^"]+)"/g)) {
  imageSet.add(m[1])
}
for (const m of html.matchAll(/src="(https:\/\/mmbiz[^"]+)"/g)) {
  imageSet.add(m[1])
}

console.log(JSON.stringify({
  title,
  publishedAt,
  publisher,
  url: 'https://mp.weixin.qq.com/s/DAEZa8rqsGUMFK8zGo4n1A',
  coverImage,
  images: [...imageSet].slice(0, 10)
}, null, 2))
