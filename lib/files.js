import fs from 'node:fs'
import fse from 'fs-extra'
import path from 'node:path'
import {distBase, srcBase, repoUrl} from './config.js'
import {getJson} from './utils.js'
import {breakpoints} from './breakpoints.js'
import {App} from './app.js'

import {promisify} from 'node:util'

const sleep = promisify(setTimeout)
function getCssForType(slug, type) {
  const typePath = path.join(srcBase, type, slug)
  const files = fs.readdirSync(typePath, {withFileTypes: true})
  const cssFiles = []
  for (const file of files) {
    if (!file.name.includes('css')) {
      continue
    }

    cssFiles.push('/' + type + '/' + slug + '/' + file.name)
  }

  return cssFiles
}

function buildStructure() {
  const payload = {}
  payload.breakpoints = Object.values(breakpoints)
  payload.app = App.config
  payload.app.git = repoUrl
  const types = ['pages', 'components', 'fragments']
  for (const type of types) {
    payload[type] = {}
    const typeDir = path.join(srcBase, type)
    const files = fs.readdirSync(typeDir, {withFileTypes: true})
    for (const file of files) {
      if (file.isDirectory()) {
        const slug = file.name
        const itemType = getJson(path.join(typeDir, slug, slug + '.json'))
        itemType.slug = slug
        itemType.name ||= slug
        itemType.uri = (type === 'pages' ? '' : ('/' + type + '/' + slug)) + '/' + slug + '.html'

        if (type !== 'pages') {
          itemType.source = '/' + type + '/' + slug + '/' + slug + '.rbs'
          itemType.css = getCssForType(slug, type)
        }

        // console.log({itemType})
        payload[type][slug] = itemType
      }
    }
  }

  return payload
}

/**
 * Create a JSON file containing the structure of the dist folder.
 */
export const generateFilesJson = () => {
  if (!fs.existsSync(distBase)) {
    console.error('The dist folder does not exist.')
    return
  }

  // Get the list of files and folders in the dist folder
  const structure = buildStructure()

  // Save the structure to dist/files.json
  const filesJsonPath = path.join(distBase, 'files.json')
  fs.writeFileSync(filesJsonPath, JSON.stringify(structure, null, 2), 'utf8')
  console.error('files.json created')
}

export async function copyPublicToDist() {
  try {
    await fse.copy('./public', './dist')
    console.log('Files copied successfully!')
  } catch (error) {
    console.error('An error occurred while copying the files:', error)
  }
}

export async function emptyDistFolder(distBase) {
  let attempts = 5

  while (attempts > 0) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await fse.emptyDir(distBase)
      console.log('The dist folder has been emptied!')
      return
    } catch (error) {
      console.error('Attempt failed, retrying...', error)
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000) // Wait 1 second before retrying
      attempts--
    }
  }

  console.error('Failed to empty the dist folder after several attempts.')
}
