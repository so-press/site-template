import path from 'node:path'
import fs from 'node:fs'
import {compileStringAsync} from 'sass'
import cssbeautify from 'cssbeautify'
import {distBase, srcBase, appBase} from './config.js'
import {App} from './app.js'
import {moveUseStatementsToTop, importFromUrls} from './utils.js'
import {breakpoints} from './breakpoints.js'

// function extractBreakpointName(cssFile) {
//   const basename = path.basename(cssFile)
//   const breakpoint = basename.split('.')[0].split('-').pop()

//   if (breakpoint in breakpoints) {
//     return breakpoint
//   }
// }

/**
 * Replace inline-svg('filename') in CSS with base64-encoded SVG data.
 * @param {string} css - The CSS content.
 * @returns {string} - The processed CSS with embedded SVG data.
 */
export function replaceInlineSvg(css) {
  return css.replaceAll(/inline-svg\(['"](.*?)['"]\)/g, (match, filename) => {
    const svgPath = path.join(srcBase, 'assets', 'svg', `${filename}.svg`)

    if (!fs.existsSync(svgPath)) {
      console.warn(`Warning: SVG file not found - ${svgPath}`)
      return match // Keep the original if file is missing
    }

    try {
      let svgContent = fs.readFileSync(svgPath, 'utf8')

      // Remove newlines and extra spaces
      svgContent = svgContent.replaceAll(/\s+/g, ' ').trim()

      // Encode as URI component
      const encodedSvg = encodeURIComponent(svgContent)
        .replaceAll('%20', ' ') // Preserve spaces for readability
        .replaceAll('\'', '%27') // Encode single quotes
        .replaceAll('"', '%22') // Encode double quotes

      return `url("data:image/svg+xml,${encodedSvg}")`
    } catch (error) {
      console.error(`Error processing SVG file: ${svgPath}`, error)
      return match
    }
  })
}

export const compileCssAndScss = async () => {
  console.log('Compiling css/scss ...')

  const {cssFiles, placeHolders} = collectCssAndScssFiles(srcBase)
  const includesContent = []
  const sassConfig = App.config.sass
  if (sassConfig.includes) {
    for (const include of sassConfig.includes) {
      includesContent.push(
        `/* ${include} */`,
        fs.readFileSync(path.join(appBase, include), 'utf8'),
        `/* end of ${include} */`
      )
    }
  }

  const cssContent = []
  for (const cssFile of cssFiles) {
    const temporaryPath = cssFile.split('src').pop().replaceAll('\\', '/')

    const content = await compileScss(cssFile, {placeHolders})
    const breakpointsContent = await getBreakpointsContent(cssFile)

    if (content || breakpointsContent) {
      cssContent.push(
        `/* ${temporaryPath} */`,
        content,
        breakpointsContent,
        `/* end of ${temporaryPath} */\n`
      )
    }
  }

  const beautifiedCss = cssbeautify(cssContent.join('\n'), {
    indent: '    ', // 4 spaces for indentation
    autosemicolon: true // Ensure semicolons at the end of every rule
  })

  const svgInlinedCss = replaceInlineSvg(beautifiedCss)
  fs.writeFileSync(
    `${distBase}/style.css`,
    includesContent.join('\n') + '\n' + svgInlinedCss
  )

  console.log(`   ... ${cssFiles.length} css/scss files compiled`)
}

const getBreakpointsContent = async cssFile => {
  const {placeHolders} = collectCssAndScssFiles(srcBase)

  const content = []
  for (const slug in breakpoints) {
    if (!Object.hasOwn(breakpoints, slug)) {
      continue
    }

    const breakpoint = breakpoints[slug]

    for (const mode of ['', 'inverse']) {
      for (const type of ['css', 'scss']) {
        if (!cssFile.includes('.' + type)) {
          continue
        }

        const cssFileBreakpoint = cssFile.replace(
          '.' + type,
          '-' + slug + (mode ? '-' + mode : '') + '.' + type
        )

        if (!fs.existsSync(cssFileBreakpoint)) {
          continue
        }

        const temporaryPath = cssFileBreakpoint
          .split('src')
          .pop()
          .replaceAll('\\', '/')
        const compiledCss = await compileScss(cssFileBreakpoint, {placeHolders})
        const clause = []
        if (mode === 'inverse' && breakpoint.next) {
          clause.push(`max-width: ${breakpoint.next.width}px`)
        }

        if (mode === '') {
          clause.push(`min-width: ${breakpoint.width}px`)
        }

        if (compiledCss) {
          content.push(
            `/* Breakpoint: ${slug} - ${temporaryPath} */`,
            `@media (${clause.join(') and (')}) {`,
            compiledCss,
            '}'
          )
        }
      }
    }
  }

  return content.join('\n').trim()
}

const compileScss = async (scssFilePath, options = {}) => {
  const placeHolders = options.placeHolders || ''
  let scssContent = fs.readFileSync(scssFilePath, 'utf8')
  if (!scssContent) {
    return ''
  }

  scssContent = placeHolders + removePlaceholders(scssContent)
  // if (scssFilePath.includes('lists')) {
  //   console.log('###########################################################################')
  //   console.log(scssContent)
  // }

  const mixins = []
  // mixins.push(`
  //   @mixin svg($slug) {
  //     background-image: url("data:image/svg+xml,%3Csvg%20data-slug%3D%22#{$slug}%22%3E%3Cuse%20href%3D%22%23svg-#{$slug}%22%3E%3C/use%3E%3C/svg%3E");
  //   }
  // `)
  for (const slug in breakpoints) {
    if (!Object.hasOwn(breakpoints, slug)) {
      continue
    }

    const breakpoint = breakpoints[slug]

    if (breakpoint.next) {
      mixins.push(
        `
          @mixin ${slug} {
            @media (min-width: ${breakpoint.next.width}px) {
              @content;
            }
          }
          `,
        `
          @mixin before-${slug} {
            @media (max-width: ${breakpoint.next.width}px) {
              @content;
            }
          }
          `
        ,
        `
          @include ${slug} {
          body:after {
              content: "${breakpoint.slug}";
          }
        }
          `
      )
    }
  }

  mixins.push('')

  const scssContentAliases = scssContent.replaceAll(
    '"@/',
    '"../node_modules/'
  )

  const scssContentImports = await importFromUrls(scssContentAliases)
  const scssContentFinal = moveUseStatementsToTop(
    mixins.join('\n') + scssContentImports
  )
  try {
    const result = await compileStringAsync(scssContentFinal, {
      loadPaths: [srcBase]
    })
    return result.css.trim()
  } catch (error) {
    console.error(`Error compiling SCSS file ${scssFilePath}:`, error.message)
    console.log(scssContent)
    return ''
  }
}

const collectCssAndScssFiles = dirPath => {
  let cssFiles = []
  const ignoreKeys = Object.keys(breakpoints)

  const files = fs.readdirSync(dirPath, {withFileTypes: true})

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name)
    const shouldIgnore = ignoreKeys.some(key => fullPath.includes(key))

    if (file.isDirectory()) {
      cssFiles = cssFiles.concat(collectCssAndScssFiles(fullPath).cssFiles)
    } else if (
      file.isFile()
      && (file.name.endsWith('.css') || file.name.endsWith('.scss'))
      && !shouldIgnore
    ) {
      cssFiles.push(fullPath)
    }
  }

  cssFiles.sort((a, b) => {
    if (a.includes('globals') && !b.includes('globals')) {
      return -1
    }

    if (!a.includes('globals') && b.includes('globals')) {
      return 1
    }

    if (a.includes('globals') && b.includes('globals')) {
      return a.localeCompare(b)
    }

    if (a.includes('pages') && !b.includes('pages')) {
      return -1
    }

    if (!a.includes('pages') && b.includes('pages')) {
      return 1
    }

    return 0
  })

  // collect placeholders
  const placeHolders = getPlaceHolders(cssFiles)

  return {cssFiles, placeHolders}
}

function getPlaceHolders(cssFiles) {
  // collect placeholders
  const placeHolders = []

  for (const file of cssFiles) {
    const raw = fs.readFileSync(file, 'utf8')

    const regex = /%[\w-]+\s*{/g
    let match

    while ((match = regex.exec(raw)) !== null) {
      const startIndex = match.index
      let braceCount = 0
      let endIndex = startIndex
      let inside = false

      for (let i = startIndex; i < raw.length; i++) {
        const ch = raw[i]

        if (ch === '{') {
          braceCount++
          inside = true
        } else if (ch === '}') {
          braceCount--
        }

        if (inside && braceCount === 0) {
          endIndex = i + 1 // include the closing }
          break
        }
      }

      if (endIndex > startIndex) {
        const block = raw.slice(startIndex, endIndex)
        placeHolders.push(block)
      }
    }
  }

  return placeHolders.join('\n')
}

/**
 * Supprime toutes les définitions de placeholders (%... { ... }) d'une chaîne SCSS.
 * Gère les blocs imbriqués et les includes.
 *
 * @param {string} scss - Le contenu SCSS à nettoyer
 * @returns {string} - Le SCSS sans les définitions de placeholders
 */
export function removePlaceholders(scss) {
  let output = scss
  const regex = /%[\w-]+\s*{/g
  let match

  while ((match = regex.exec(output)) !== null) {
    const startIndex = match.index
    let braceCount = 0
    let endIndex = startIndex
    let inside = false

    for (let i = startIndex; i < output.length; i++) {
      const ch = output[i]

      if (ch === '{') {
        braceCount++
        inside = true
      } else if (ch === '}') {
        braceCount--
      }

      if (inside && braceCount === 0) {
        endIndex = i + 1 // inclut la fermeture }
        break
      }
    }

    // supprimer le bloc trouvé
    output
      = output.slice(0, startIndex)
      + output.slice(endIndex)

    // remettre le curseur au début car le texte a changé
    regex.lastIndex = 0
  }

  return output
}
