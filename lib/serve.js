import {runBuildTask} from './build.js'
import {broadcast} from './wss.js'
import path from 'node:path'
import express from 'express'
import chokidar from 'chokidar'
import {WebSocketServer} from 'ws'
import {App} from './app.js'
import {getLocalIPAddress} from './utils.js'
import cors from 'cors'
import http from 'node:http'
import {
  adminBase, distBase, componentsBase, pagesBase, globalsBase, fragmentsBase,
  libBase,
  publicBase
} from './config.js'
import process from 'node:process'

export async function serve() {
  const app = express()
  app.use(cors())

  // Get an available port
  const port = await getAvailablePort(process.env.PORT)

  // Serve static files
  app.use('/', express.static(distBase))
  app.use('/admin', express.static(adminBase))
  app.use('/images', express.static(path.join(publicBase, 'images')))

  // Watcher for changes
  const watcher = chokidar.watch([componentsBase, fragmentsBase, pagesBase, libBase, globalsBase], {
    persistent: true
  })

  function showHostInfos() {
    console.log(`Server is running at http://localhost:${port}`)
    console.log(`Server is running at http://${getLocalIPAddress()}:${port}`)
    console.log(`Access admin page here: https://template-admin-sopress.netlify.app/?url=http://localhost:${port}`)
    console.log(`Production url: ${App.config.url}`)
  }

  // WebSocket server setup
  const server = app.listen(port, () => {
    showHostInfos()
  })

  // Create WebSocket server
  const wss = new WebSocketServer({server})

  watcher.on('change', async filePath => {
    console.log(`File changed: ${filePath}`)
    await runBuildTask()
    console.log('Reloading browsers ...')
    showHostInfos()

    if (filePath.includes('css')) {
      broadcast('reload-css', wss)
    } else {
      broadcast('reload', wss)
    }
  })

  setTimeout(runBuildTask, 100)

  app.get('/', (req, res) => {
    res.sendFile(path.join(distBase, 'index.html'))
  })
}

// Utility to find an available port using ES Modules
const getAvailablePort = startPort => {
  const server = http.createServer()
  startPort = Number.parseInt(startPort || 3333, 10)
  return new Promise(resolve => {
    server.listen(startPort, () => {
      const {port} = server.address()
      server.close(() => resolve(port))
    })

    server.on('error', () => {
      resolve(getAvailablePort(startPort + 1))
    })
  })
}
