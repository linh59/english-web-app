// Self-hosts the ffmpeg.wasm core (single-threaded) so audio compression
// doesn't depend on an external CDN at runtime. Runs via the "postinstall"
// npm script — relies on `npm install` running lifecycle scripts (default;
// only breaks if invoked with --ignore-scripts).
import { cpSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const srcDir = join(rootDir, 'node_modules/@ffmpeg/core/dist/esm')
const destDir = join(rootDir, 'public/ffmpeg')

mkdirSync(destDir, { recursive: true })
for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  cpSync(join(srcDir, file), join(destDir, file))
}

console.log('Copied ffmpeg-core files to public/ffmpeg/')
