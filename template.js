import {runBuildTask} from './lib/build.js'
import {serve} from './lib/serve.js'
import {gen} from './lib/gen.js'
import {copyPublicToDist, emptyDistFolder} from './lib/files.js'
import process from 'node:process'

try {
  if (process.argv.includes('--build')) {
    await emptyDistFolder()
    await runBuildTask()
    await copyPublicToDist()
    process.exit(0)
  } else if (process.argv.includes('--gen')) {
    await gen()
  } else {
    await serve()
  }
} catch (error) {
  console.error('An error occurred:', error)
  throw error // Throwing the error will cause the process to exit with a non-zero code.
}

