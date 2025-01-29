import hbs from 'handlebars'
import fs from 'node:fs'
import fse from 'fs-extra'
import path from 'node:path'
import pkg from 'js-beautify'
import {loremGen} from './lorem.js'
import {registerHelpers} from './hbs-helpers.js'
import {App} from './app.js'
import {cleanPath} from './utils.js'

import {
  componentsBase, pagesBase, globalsBase, distBase, srcBase, fragmentsBase
} from './config.js'

const {html: beautifyHtml} = pkg
const allComponents = []
export const compileHbsFiles = () => {
  registerHelpers()

  prepareHbs()

  copyFoldersToDist()

  compileComponents()
  compilePages()
}

function compilePages() {
  // Fonction récursive pour trouver tous les fichiers .hbs dans pagesBase
  const findHbsFiles = dir => {
    const files = fs.readdirSync(dir)
    let hbsFiles = []

    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        hbsFiles = hbsFiles.concat(findHbsFiles(fullPath))
      } else if (file.endsWith('.hbs')) {
        hbsFiles.push(fullPath)
      }
    }

    return hbsFiles.map(p => cleanPath(p))
  }

  // Trouver tous les fichiers .hbs dans pagesBase
  const hbsFiles = findHbsFiles(pagesBase)

  // Compiler chaque fichier .hbs en fichier .html dans distBase
  for (const filePath of hbsFiles) {
    const page = loadJsonData(filePath)
    const htmlContent = hbsCompile(filePath, {layout: true, data: {page}, admin: true})

    const fileName = path.basename(filePath, '.hbs')

    const htmlFilePath = path.join(distBase, `${fileName}.html`)

    fse.ensureDirSync(distBase)

    fs.writeFileSync(htmlFilePath, htmlContent)
  }
}

function loadJsonData(filePath) {
  const jsonFilePath = filePath.replace('.hbs', '.json')
  if (!fs.existsSync(jsonFilePath)) {
    return {}
  }

  const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'))

  if (data.fields) {
    const fields = data.fields
    for (const fieldSlug in fields) {
      if (!Object.hasOwn(fields, fieldSlug)) {
        continue
      }

      const field = fields[fieldSlug]

      if (!field.lorem) {
        continue
      }

      data[fieldSlug] = loremGen(field.lorem.units, field.lorem.min, field.lorem.max || false, {filePath})
    }
  }

  return data
}

function compileComponents() {
  // Fonction récursive pour trouver tous les fichiers .hbs dans distBase
  const findHbsFiles = dir => {
    const files = fs.readdirSync(dir)
    let hbsFiles = []

    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        hbsFiles = hbsFiles.concat(findHbsFiles(fullPath))
      } else if (file.endsWith('.hbs')) {
        hbsFiles.push(fullPath)
      }
    }

    return hbsFiles.map(p => cleanPath(p))
  }

  for (const workDir of [componentsBase, fragmentsBase]) {
  // Trouver tous les fichiers .hbs dans distBase
    const hbsFiles = findHbsFiles(workDir)
    // Compiler chaque fichier .hbs en fichier .html
    for (const filePath of hbsFiles) {
      const htmlContent = hbsCompile(filePath)

      // Remplacer l'extension .hbs par .html
      const htmlFilePath = cleanPath(filePath.replace(srcBase, distBase).replace(/\.hbs$/, '.html'))
      // Écrire le fichier HTML dans le même dossier
      fs.writeFileSync(htmlFilePath, htmlContent)
    // console.log(`Fichier compilé : ${htmlFilePath}`)
    }
  }
}

function copyFoldersToDist() {
  const folders = ['components', 'fragments']

  for (const folder of folders) {
    const srcFolderPath = path.join(srcBase, folder)
    const distFolderPath = path.join(distBase, folder)

    // Copie du dossier source vers le dossier de destination en excluant les fichiers .hbs
    fse.copySync(srcFolderPath, distFolderPath, {
      filter: src => !src.endsWith('.hbs')
    })

    // console.log(`Dossier copié : ${srcFolderPath} vers ${distFolderPath}`);
  }
}

const globalData = {}
export const prepareHbs = () => {
  globalData.app = App.config
  hbs.partials = {}
  // Function to recursively search for all .hbs files
  const findHbsFiles = dir => {
    const files = fs.readdirSync(dir)
    let hbsFiles = []

    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        hbsFiles = hbsFiles.concat(findHbsFiles(fullPath))
      } else if (file.endsWith('.hbs')) {
        const slug = path.basename(fullPath).split('.')[0]

        globalData[slug] = loadJsonData(fullPath)
        hbsFiles.push(fullPath)
      }
    }

    return hbsFiles.map(p => cleanPath(p))
  }

  // // Function to generate the partial name from file path
  // const generatePartialName = (filePath, baseDir) => {
  //   const relativePath = path.relative(baseDir, filePath)
  //   const pathParts = relativePath.split(path.sep)

  //   // Remove the .hbs extension from the file name
  //   const fileNameWithoutExt = path.basename(pathParts.pop(), '.hbs')

  //   pathParts[0] = pathParts[0].replace(/s$/, '')

  //   if (!pathParts.includes(fileNameWithoutExt)) {
  //     pathParts.push(fileNameWithoutExt)
  //   }

  //   // Join the folder structure as required
  //   return pathParts.join('-')
  // }

  // Find and register all partials
  const hbsFiles = findHbsFiles(srcBase)

  for (const filePath of hbsFiles) {
    // if (filePath.includes('pages')) {
    //   continue
    // }

    // const partialName = generatePartialName(filePath, srcBase)
    const partialName = path.basename(filePath).replace('.hbs', '')
    const partialContent = fs.readFileSync(filePath, 'utf8')

    if (filePath.includes('components') || filePath.includes('fragments')) {
      allComponents.push(partialName)
    }

    if (hbs.partials[partialName]) {
      throw new Error('Duplicated component ' + filePath)
    }

    hbs.registerPartial(partialName, partialContent)
  }

  for (const slug in hbs.partials) {
    if (!Object.hasOwn(hbs.partials, slug)) {
      continue
    }

    hbs.partials[slug] = replacePseudoTags(hbs.partials[slug])
  }
}

function hbsCompile(filePath, args = {}) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')

    const slug = path.basename(filePath).split('.')[0]
    content = content.replaceAll(
      '{{> @partial-block }}',
      `{{#if ${slug}.demo }}{{${slug}.demo}}{{else}}{{#if ${slug}.description }}{{${slug}.description}}{{else}}{{${slug}.name }}{{/if}}{{/if}}`
    )

    const data = args.data || {}

    if (args.layout || {}) {
      const headContent = fs.readFileSync(path.join(globalsBase, 'head.hbs'), 'utf8')
      const footContent = fs.readFileSync(path.join(globalsBase, 'foot.hbs'), 'utf8')
      content = [
        headContent,
        content,
        footContent,
        `<script src="/admin/js/ws.js?${Math.random()}"></script>`
      ].join('\n')
    }

    if (args.admin || false) {
      content += `\n<script src="/admin/js/admin.js?${Math.random()}"></script>`
      content += `<link rel="stylesheet" href="/admin/css/admin.css?${Math.random()}" type="text/css" media="screen">`
    }

    // Inject the template file name into the context
    data._templateFile = path.basename(filePath)

    const template = hbs.compile(replacePseudoTags(content))
    Object.assign(data, globalData)

    const htmlContent = template(data)

    const htmlBeautifiedContent = beautifyHtml(htmlContent, {
      indent_with_tabs: true,
      indent_size: 1,
      wrap_line_length: 80,
      preserve_newlines: true,
      end_with_newline: true
    })

    return htmlBeautifiedContent
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }
}

/**
 * Replaces pseudo-tags <[slug] [attributes]>...</[slug]> with Handlebars {{#>slug [attributes]}}...{{/slug}},
 * only if the slug is in Handlebars.partials.
 * @param {string} input - The input string containing pseudo-tags.
 * @return {string} - The string with pseudo-tags and their attributes replaced by Handlebars blocks.
 */
function replacePseudoTags(input) {
  for (const slug of allComponents) {
    const regex = new RegExp(`<${slug}(\\s[^>]*)?>([\\s\\S]*?)<\\/${slug}>`, 'g')
    input = input.replace(regex, (match, attributes, content) => `{{#>${slug}${attributes || ''}}}${content}{{/${slug}}}`)
  }

  return input
}
