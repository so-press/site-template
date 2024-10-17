import path from 'node:path'
import fs from 'node:fs'
import {fileURLToPath} from 'node:url'
import {cleanPath} from './utils.js'

import dotenv from 'dotenv'

dotenv.config()

const filename = fileURLToPath(import.meta.url) // Get the filename
const appBase = cleanPath(path.join(path.dirname(filename), '..'))

const distBase = cleanPath(path.join(appBase, '/dist'))
const srcBase = cleanPath(`${appBase}/src`)
const libBase = cleanPath(`${appBase}/lib`)
const publicBase = cleanPath(`${appBase}/public`)
const adminBase = cleanPath(`${publicBase}/admin`)
const componentsBase = cleanPath(`${srcBase}/components`)
const assetsBase = cleanPath(`${srcBase}/assets`)
const fragmentsBase = cleanPath(`${srcBase}/fragments`)
const pagesBase = cleanPath(`${srcBase}/pages`)
const globalsBase = cleanPath(`${srcBase}/globals`)

const repoUrl = getGitRepoUrl()

// Ensure dist folder exists
const ensureDistributionFolder = () => {
  if (!fs.existsSync(distBase)) {
    fs.mkdirSync(distBase)
    console.log('Created dist folder')
  }
}

// Fonction pour obtenir l'URL du dépôt Git depuis le fichier .git/config
function getGitRepoUrl() {
  const gitConfigPath = path.join(appBase, '.git', 'config')

  try {
    const gitConfig = fs.readFileSync(gitConfigPath, 'utf8')
    const remoteOriginUrlMatch = gitConfig.match(/\[remote "origin"]\s+url = (.+)/)

    if (remoteOriginUrlMatch) {
      let repoUrl = remoteOriginUrlMatch[1].trim()

      // Si l'URL est en format SSH pour GitHub (git@github.com:username/repo.git), la convertir en format HTTPS
      if (repoUrl.startsWith('git@github.com:')) {
        repoUrl = repoUrl.replace('git@github.com:', 'https://github.com/')
      }
      // Si l'URL est en format SSH pour GitLab (git@gitlab.com:username/repo.git), la convertir en format HTTPS
      else if (repoUrl.startsWith('git@gitlab.com:')) {
        repoUrl = repoUrl.replace('git@gitlab.com:', 'https://gitlab.com/')
      }

      // Retourner l'URL convertie ou l'URL d'origine si déjà en HTTPS
      return repoUrl
    }

    return 'Aucune URL de dépôt Git trouvée.'
  } catch (error) {
    return 'Erreur lors de la lecture du fichier .git/config : ' + error.message
  }
}

ensureDistributionFolder() // Ensure dist folder exists before build

export {
  assetsBase,
  appBase,
  libBase,
  adminBase,
  distBase,
  srcBase,
  componentsBase,
  pagesBase,
  globalsBase,
  fragmentsBase,
  publicBase,
  repoUrl
}
