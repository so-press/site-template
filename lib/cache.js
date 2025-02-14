import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import os from 'node:os'

const CACHE_DIR = path.join(os.tmpdir())
/**
 * Get a cache path for a given URL.
 * @param {string} url - The URL to hash for caching.
 * @returns {string} - The cache directory path.
 */
export function getCachePath(url, where) {
  const hash = crypto.createHash('md5').update(url).digest('hex')
  return path.join(CACHE_DIR, where, hash, 'cache.txt')
}

/**
 * Fetch content from URL with caching.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string>} - The content from the URL, cached if available.
 */
export async function fetchWithCache(url, where) {
  const cachePath = getCachePath(url, where)
  try {
    await fs.access(cachePath) // Check if cache exists
    return await fs.readFile(cachePath, 'utf8')
  } catch {
    // Fetch if not cached
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`)
      }

      const content = `/* import de ${url} */\n${await response.text()}`

      // Ensure directory exists and save to cache
      await fs.mkdir(path.dirname(cachePath), {recursive: true})
      await fs.writeFile(cachePath, content, 'utf-8')

      return content
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message)
      return `/* Failed to import ${url} */`
    }
  }
}
