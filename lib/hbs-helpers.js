import hbs from 'handlebars'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

import {distBase, assetsBase, publicBase} from './config.js'
import {loremGen} from './lorem.js'
import {parseLoopSpec, randInt} from './utils.js'

let servedImages = []
const svgUsed = []
export const helpers = [
  {
    name: 'classes',
    code(...args) {
      const seen = new Set()
      const result = []

      for (const arg of args) {
        const items = Array.isArray(arg) ? arg : [arg]
        for (let item of items) {
          if (typeof item !== 'string') {
            continue
          }

          // Supprime les espaces aux extrémités
          item = item.trim()

          // Découpe sur les espaces internes
          const parts = item.split(/\s+/)
          for (const part of parts) {
            if (part && !seen.has(part)) {
              seen.add(part)
              result.push(part)
            }
          }
        }
      }

      return result.join(' ')
    }
  },
  {
    name: 'array',
    code(...args) {
      args.pop()
      return args
    }
  },
  {
    name: 'loop',
    code(...args) {
      const options = args.pop()
      const spec = parseLoopSpec(args, options.hash)
      const count = spec.count || randInt(spec.min, spec.max)
      let out = ''
      for (let i = 0; i < count; i++) {
        out += options.fn(i)
      }

      return out
    }
  },
  {
    name: 'asset',
    code(fileName) {
      const filePath = path.join(distBase, fileName)
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath)
        const hash = crypto
          .createHash('sha1')
          .update(fileContent)
          .digest('hex')
        return `/${fileName}?v=${hash}`
      }

      return fileName
    }
  },
  {
    name: 'default',
    code(value, ...defaultValues) {
      if (!value) {
        for (const defaultValue of defaultValues) {
          if (defaultValue) {
            return defaultValue
          }
        }
      }

      return value
    }
  },
  {
    name: 'lorem',
    code: (units, min, max = false, data) => loremGen(units, min, max, data)
  },
  {
    name: 'svgDefs',
    code(slugs) {
      if (slugs && Array.isArray(slugs)) {
        for (const slug of slugs) {
          hbs.helpers.svgUse(slug)
        }
      }

      let symbols = ''
      for (const {slug, content} of svgUsed) {
        const viewBoxMatch = content.match(/viewBox="([^"]+)"/)
        const innerContentMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
        const viewBoxAttr = viewBoxMatch ? ` viewBox="${viewBoxMatch[1]}"` : ''
        const innerContent = innerContentMatch ? innerContentMatch[1] : content
        symbols += `<symbol id="svg-${slug}"${viewBoxAttr}>${innerContent}</symbol>\n`
      }

      return new hbs.SafeString(
        `<svg style="display: none;">\n  <defs>\n${symbols}  </defs>\n</svg>`
      )
    }
  },
  {
    name: 'condition',
    code(v1, operator, v2, options) {
      const operators = {
        '==': (a, b) => a == b,
        '===': (a, b) => a === b,
        '!=': (a, b) => a != b,
        '!==': (a, b) => a !== b,
        '<': (a, b) => a < b,
        '<=': (a, b) => a <= b,
        '>': (a, b) => a > b,
        '>=': (a, b) => a >= b,
        '&&': (a, b) => a && b,
        '||': (a, b) => a || b
      }
      const fn = operators[operator]
      return fn
        ? (fn(v1, v2)
          ? options.fn(this)
          : options.inverse(this))
        : options.inverse(this)
    }
  },
  {
    name: 'svgUse',
    code(slug) {
      for (const base of [assetsBase, publicBase]) {
        const filePath = path.join(base, 'svg', `${slug}.svg`)
        if (!fs.existsSync(filePath)) {
          continue
        }

        try {
          const svgContent = fs.readFileSync(filePath, 'utf8')
          if (svgContent.includes('<svg')) {
            if (!svgUsed.some(item => item.slug === slug)) {
              svgUsed.push({slug, content: svgContent})
            }

            return new hbs.SafeString(
              `<svg data-svg="${slug}"><use href="#svg-${slug}"></use></svg>`
            )
          }
        } catch (error) {
          console.error(`Error loading SVG file for <use>: ${filePath}`, error)
          return new hbs.SafeString('')
        }
      }
    }
  },
  {
    name: 'svg',
    code(slug) {
      for (const base of [assetsBase, publicBase]) {
        const filePath = path.join(base, 'svg', `${slug}.svg`)
        if (!fs.existsSync(filePath)) {
          continue
        }

        try {
          const svgContent = fs.readFileSync(filePath, 'utf8')
          return new hbs.SafeString(
            svgContent.replace('<svg ', `<svg data-svg="${slug}" `)
          )
        } catch (error) {
          console.error(`Error loading SVG file: ${filePath}`, error)
          return new hbs.SafeString('')
        }
      }
    }
  },
  {
    name: 'Svg',
    code(slug) {
      for (const base of [assetsBase, publicBase]) {
        const filePath = path.join(base, 'svg', `${slug}.svg`)
        if (!fs.existsSync(filePath)) {
          continue
        }

        try {
          const svgContent = fs.readFileSync(filePath, 'utf8')
          return new hbs.SafeString(
            `<figure data-svg="${slug}">${svgContent}</figure>`
          )
        } catch (error) {
          console.error(`Error loading SVG file: ${filePath}`, error)
          return new hbs.SafeString('')
        }
      }
    }
  },
  {
    name: 'image',
    code() {
      const imagesDir = path.join(publicBase, 'images')
      const files = fs.readdirSync(imagesDir)
      const imageFiles = files.filter(file =>
        /\.(jpg|jpeg|png|gif)$/.test(file)
      )
      if (imageFiles.length === 0) {
        return 'No images found'
      }

      if (servedImages.length >= imageFiles.length) {
        servedImages = []
      }

      const remainingImages = imageFiles.filter(
        img => !servedImages.includes(img)
      )
      const randomImage
        = remainingImages[Math.floor(Math.random() * remainingImages.length)]
      servedImages.push(randomImage)
      return path.join('/images', randomImage)
    }
  }
]
export function registerHelpers() {
  console.log('Setting Helpers')
  for (const {name, code} of helpers) {
    hbs.registerHelper(name, code)
  }
}
