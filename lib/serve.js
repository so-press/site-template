import {runBuildTask} from './build.js'
import {broadcast} from './wss.js'
import path from 'node:path'
import express from 'express'
import chokidar from 'chokidar'
import {WebSocketServer} from 'ws'
import {App} from './app.js'
import {getLocalIPAddress} from './utils.js'
import cors from 'cors'

import {
  adminBase, distBase, componentsBase, pagesBase, globalsBase, fragmentsBase,
  libBase,
  publicBase
} from './config.js'
import process from 'node:process'

export function serve() {
  const app = express()
  app.use(cors())
  const port = process.env.PORT ?? 3000

  // Serve static files
  app.use('/', express.static(distBase))
  app.use('/admin', express.static(adminBase))
  app.use('/images', express.static(path.join(publicBase, 'images')))
  // Watcher for changes
  const watcher = chokidar.watch([componentsBase, fragmentsBase, pagesBase, libBase, globalsBase], {
    persistent: true
  })

  // WebSocket server setup
  const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
    console.log(`Server is running at http://${getLocalIPAddress()}:${port}`)
    console.log(`Access admin page here: https://template-admin-sopress.netlify.app/?url=http://localhost:${port}`)
    console.log(`Production url: ${App.config.url}`)
  })

  // Create WebSocket server
  const wss = new WebSocketServer({server})

  watcher.on('change', async filePath => {
    console.log(`File changed: ${filePath}`)

    // Run build task directly at the top level using await
    await runBuildTask()

    console.log('Reloading browers ...')

    if (filePath.includes('css')) {
      broadcast('reload-css', wss)
    } else {
    // Notify clients (browsers) to reload the page
      broadcast('reload', wss)
    }
  })

  // Top-level build task executed with await
  setTimeout(runBuildTask, 100)

  // Serve index.html on root access
  app.get('/', (req, res) => {
    res.sendFile(path.join(distBase, 'index.html'))
  })
}
