import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const userscriptBanner = `// ==UserScript==
// @name         Bilibili Fitness Timer
// @namespace    https://github.com/RyanChouHua/bili-fitness-timer
// @version      0.4.0
// @description  Turn Bilibili video clips into workout intervals with sets and rest timers.
// @match        https://www.bilibili.com/*
// @match        https://m.bilibili.com/*
// @match        https://bilibili.com/*
// @downloadURL  https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.user.js
// @updateURL    https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.user.js
// @supportURL   https://github.com/RyanChouHua/bili-fitness-timer/issues
// @grant        none
// @run-at       document-idle
// ==/UserScript==
`

function userscriptMetadataPlugin(): Plugin {
  return {
    name: 'userscript-metadata',
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.fileName.endsWith('.user.js')) {
          chunk.code = `${userscriptBanner}\n${chunk.code}`
        }
      }
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
