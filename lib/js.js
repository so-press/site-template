import fs from 'node:fs'
import path from 'node:path'

import {
  distBase,
  srcBase
} from './config.js'
/**
* Concatenate all JavaScript files from src folder into dist/scripts.js
*/
export const concatenateJsFiles = () => {
  console.log('Compiling JavaScript...')
  // List all .js files in src folder and subfolders
  const jsFiles = listJsFiles(srcBase)
  if (jsFiles.length === 0) {
    console.log('No JavaScript files found to concatenate.')
    return
  }

  let concatenatedJs = ''
  let nb = 0
  for (const jsFilePath of jsFiles) {
    // Read the content of each .js file
    const jsComment = `/* ${path.relative(srcBase, jsFilePath)} */\n` // Add relative file path as a comment
    const jsContent = fs.readFileSync(jsFilePath, 'utf8')

    concatenatedJs += jsComment + jsContent + '\n'
    nb++
  }

  // Write the concatenated JavaScript to dist/scripts.js
  fs.writeFileSync(`${distBase}/scripts.js`, concatenatedJs)

  console.log('   ... ' + nb + ' JS files compiled')
}

/**
 * Recursively list all .js files in a directory and its subdirectories,
 * ensuring that files with "globals" in their path are listed first.
 *
 * @param {string} dir - The directory to search.
 * @returns {string[]} - Array of full paths to .js files.
 */
const listJsFiles = dir => {
  let jsFiles = []

  const files = fs.readdirSync(dir, {withFileTypes: true})

  for (const file of files) {
    const fullPath = path.join(dir, file.name)
    if (file.isDirectory()) {
      // Recursively search subdirectories
      jsFiles = jsFiles.concat(listJsFiles(fullPath))
    } else if (file.isFile() && file.name.endsWith('.js')) {
      // Add .js file to the list
      jsFiles.push(fullPath)
    }
  }

  jsFiles.sort((a, b) => {
    const aHasGlobals = a.includes('globals')
    const bHasGlobals = b.includes('globals')

    // Sort files with "globals" in their path before others
    if (aHasGlobals && !bHasGlobals) {
      return -1
    }

    if (!aHasGlobals && bHasGlobals) {
      return 1
    }

    // Otherwise, sort alphabetically
    return a.localeCompare(b)
  })

  return jsFiles
}
