import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const rawBaseUrl = 'https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main'

const userscriptBanner = `// ==UserScript==
// @name         Bilibili Fitness Timer
// @namespace    https://github.com/RyanChouHua/bili-fitness-timer
// @version      0.4.19
// @description  Turn Bilibili video clips into workout intervals with sets and rest timers.
// @match        https://www.bilibili.com/*
// @match        https://m.bilibili.com/*
// @match        https://bilibili.com/*
// @downloadURL  ${rawBaseUrl}/dist/bili-fitness-timer.user.js
// @updateURL    ${rawBaseUrl}/dist/bili-fitness-timer.meta.js
// @supportURL   https://github.com/RyanChouHua/bili-fitness-timer/issues
// @grant        none
// @run-at       document-idle
// ==/UserScript==
`

const userscriptMeta = `${userscriptBanner.trimEnd()}\n`

function userscriptMetadataPlugin(): Plugin {
  return {
    name: 'userscript-metadata',
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.fileName.endsWith('.user.js')) {
          chunk.code = `${userscriptBanner}\n${chunk.code}`
        }
      }
      this.emitFile({
        type: 'asset',
        fileName: 'bili-fitness-timer.meta.js',
        source: userscriptMeta,
      })
    },
  }
}

export default defineConfig({
  plugins: [userscriptMetadataPlugin()],
  build: {
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'BiliFitnessTimer',
      formats: ['iife'],
      fileName: () => 'bili-fitness-timer.user.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
