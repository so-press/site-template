import {runBuildTask} from './lib/build.js'
import {serve} from './lib/serve.js'
import {gen} from './lib/gen.js'
import {copyPublicToDist, emptyDistFolder} from './lib/files.js'
import process from 'node:process'

if (process.argv.includes('--build')) {
  emptyDistFolder()
  runBuildTask()
  copyPublicToDist()
} else if (process.argv.includes('--gen')) {
  gen()
} else {
  serve()
}

