import hbs from 'handlebars'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

import { distBase, assetsBase, publicBase } from './config.js'
import { loremGen } from './lorem.js'

let servedImages = []
const svgUsed = []

export function registerHelpers() {
  hbs.registerHelper('array', (...args) => {
    // Le dernier argument est le hash options de handlebars
    args.pop()
    return args
  })

  // Example helper to resolve versioned assets
  hbs.registerHelper('asset', fileName => {
    const filePath = path.join(distBase, fileName)

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Read the file content
      const fileContent = fs.readFileSync(filePath)

      // Generate the SHA-1 hash
      const hash = crypto.createHash('sha1').update(fileContent).digest('hex')

      // Append the hash to the file name for cache busting
      const versionedFilePath = `/${fileName}?v=${hash}`

      return versionedFilePath
    }

    // Fallback to the original file path if the file doesn't exist
    return fileName
  })

  hbs.registerHelper('default', (value, ...defaultValues) => {
    if (!value) {
      for (const defaultValue of defaultValues) {
        if (defaultValue) {
          return defaultValue
        }
      }
    }

    return value
  })

  hbs.registerHelper('lorem', (units, min, max = false, data) =>
    loremGen(units, min, max, data)
  )

  hbs.registerHelper('svgDefs', slugs => {
    if (slugs && Array.isArray(slugs)) {
      for (const slug of slugs) {
        hbs.helpers.svgUse(slug)
      }
    }

    let symbols = ''
    for (const { slug, content } of svgUsed) {
      // Extraction du viewBox et du contenu interne de la balise <svg>
      const viewBoxMatch = content.match(/viewBox="([^"]+)"/)
      const innerContentMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
      const viewBoxAttr = viewBoxMatch ? ` viewBox="${viewBoxMatch[1]}"` : ''
      const innerContent = innerContentMatch ? innerContentMatch[1] : content
      symbols += `<symbol id="svg-${slug}"${viewBoxAttr}>${innerContent}</symbol>\n`
    }

    return new hbs.SafeString(
      `<svg style="display: none;">\n  <defs>\n${symbols}  </defs>\n</svg>`
    )
  })

  // Register a 'svg' helper
  hbs.registerHelper('svgUse', slug => {
    const filePath = path.join(assetsBase, 'svg', `${slug}.svg`)

    try {
      const svgContent = fs.readFileSync(filePath, 'utf8')
      if (svgContent.includes('<svg')) {
        if (!svgUsed.some(item => item.slug === slug)) {
          svgUsed.push({ slug, content: svgContent })
        }

        return new hbs.SafeString(
          `<svg data-svg="${slug}"><use href="#svg-${slug}"></use></svg>`
        )
      }
    } catch (error) {
      console.error(`Error loading SVG file fo <use>: ${filePath}`, error)
      return new hbs.SafeString('')
    }
  })

  // Register a 'svg' helper
  hbs.registerHelper('svg', slug => {
    const filePath = path.join(assetsBase, 'svg', `${slug}.svg`)

    try {
      const svgContent = fs.readFileSync(filePath, 'utf8')
      return new hbs.SafeString(
        svgContent.replace('<svg ', `<svg data-svg="${slug}" `)
      )
    } catch (error) {
      console.error(`Error loading SVG file: ${filePath}`, error)
      return new hbs.SafeString('')
    }
  })

  hbs.registerHelper('Svg', slug => {
    const filePath = path.join(assetsBase, 'svg', `${slug}.svg`)

    try {
      const svgContent = fs.readFileSync(filePath, 'utf8')
      return new hbs.SafeString(
        `<figure data-svg="${slug}">${svgContent}</figure>`
      )
    } catch (error) {
      console.error(`Error loading SVG file: ${filePath}`, error)
      return new hbs.SafeString('')
    }
  })

  hbs.registerHelper('image', () => {
    const imagesDir = path.join(publicBase, 'images')

    // Get list of all files in the directory
    const files = fs.readdirSync(imagesDir)

    // Filter for image files (you can add more extensions if needed)
    const imageFiles = files.filter(file =>
      /\.(jpg|jpeg|png|gif)$/.test(file)
    )

    // If no images found, return a default message
    if (imageFiles.length === 0) {
      return 'No images found'
    }

    // Check if all images have been served, and reset the list if so
    if (servedImages.length >= imageFiles.length) {
      servedImages = []
    }

    // Filter out images that have already been served
    const remainingImages = imageFiles.filter(
      image => !servedImages.includes(image)
    )

    // Select a random image from the remaining ones
    const randomImage
      = remainingImages[Math.floor(Math.random() * remainingImages.length)]

    // Add the selected image to the list of served images
    servedImages.push(randomImage)

    // Return the URI of the selected image
    return path.join('/images', randomImage)
  })
}
