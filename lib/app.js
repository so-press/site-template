import fs from 'node:fs'
import path from 'node:path'
import {
  appBase
} from './config.js'

export const App = (() => {
  const content = fs.readFileSync(path.join(appBase, 'package.json'), 'utf8')
  return {config: JSON.parse(content)}
})()
