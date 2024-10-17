import fs from 'node:fs'
import path from 'node:path'
import {
  appBase
} from './config.js'

/**
 * @fileoverview Ce module fournit une fonction anonyme auto-exécutée qui lit le contenu du fichier package.json
 * dans le répertoire de base de l'application et renvoie un objet qui contient ce contenu en format JSON.
 */

export const App = (() => {
  /**
   * Lire le contenu du fichier package.json dans le répertoire de base de l'application
   * @type {string}
   */
  const content = fs.readFileSync(path.join(appBase, 'package.json'), 'utf8')

  /**
   * Renvoie un objet avec le contenu du fichier package.json converti en format JSON
   * @return {{config: object}}
   */
  return {config: JSON.parse(content)}
})()
