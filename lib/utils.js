import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

/**
 * Checks if the provided directory contains only subdirectories (no files).
 *
 * @param {string} dirPath - The path to the directory to check.
 * @returns {boolean} - Returns true if the directory contains only subdirectories, false otherwise.
 */
export const containsOnlyDirectories = dirPath => {
  try {
    const contents = fs.readdirSync(dirPath, {withFileTypes: true})

    // Check if every entry is a directory
    return contents.every(entry => entry.isDirectory())
  } catch (error) {
    console.error(`Error reading directory: ${error.message}`)
    return false
  }
}

export function getLocalIPAddress() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e., 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }

  return 'localhost' // Fallback to localhost if no local IP is found
}

/**
 * Normalize the path and replace backslashes with forward slashes.
 *
 * @param {string} inputPath - The original file path
 * @return {string} - The cleaned file path with uniform slashes
 */
export function cleanPath(inputPath) {
  // Normalize the path to remove any irregularities
  const normalizedPath = path.normalize(inputPath)

  // Replace all backslashes with forward slashes
  return normalizedPath.replaceAll('\\', '/')
}

export function getJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {}
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    console.log(error)
    return {}
  }
}
