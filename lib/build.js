import {compileCssAndScss} from './scss.js'
import {concatenateJsFiles} from './js.js'
import {compileHbsFiles} from './hbs.js'
import {generateFilesJson} from './files.js'

// Function to run the build task
export async function runBuildTask() {
  await concatenateJsFiles()
  await compileCssAndScss()
  await compileHbsFiles()
  setTimeout(() => generateFilesJson(), 100)
}
