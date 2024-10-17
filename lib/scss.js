import path from 'node:path'
import fs from 'node:fs'
import sass from 'node-sass'
import cssbeautify from 'cssbeautify'
import {distBase, srcBase, appBase} from './config.js'
import {App} from './app.js'
import {breakpoints} from './breakpoints.js'

function extractBreakpointName(cssFile) {
  const basename = path.basename(cssFile)
  const breakpoint = basename.split('.')[0].split('-').pop()

  if (breakpoint in breakpoints) {
    return breakpoint
  }
}

export const compileCssAndScss = () => {
  console.log('Compiling css/scss ...')

  // Collect and process CSS/SCSS files

  const cssFiles = collectCssAndScssFiles(srcBase)

  const includesContent = []
  const sass = App.config.sass
  if (sass.includes) {
    for (const include of sass.includes) {
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

    const content = compileScss(cssFile)

    const breakpointsContent = getBreakpointsContent(cssFile)

    if (content || breakpointsContent) {
      cssContent.push(
        `/* ${temporaryPath} */`,
        content,
        breakpointsContent,
        `/* end of ${temporaryPath} */\n`
      )
    }
  }

  // Beautify the CSS content
  const beautifiedCss = cssbeautify(cssContent.join('\n'), {
    indent: '    ', // 4 spaces for indentation
    autosemicolon: true // Ensure semicolons at the end of every rule
  })

  // Write the formatted CSS back to the file
  fs.writeFileSync(`${distBase}/style.css`, includesContent.join('\n') + '\n' + beautifiedCss)

  // Console.log('CSS merged to ./dist/style.css');
  console.log(`   ... ${cssFiles.length} css/scss files compiled`)
}

function getBreakpointsContent(cssFile) {
  const content = []
  for (const slug in breakpoints) {
    if (!Object.hasOwn(breakpoints, slug)) {
      continue
    }

    const breakpoint = breakpoints[slug]

    // Convert the object keys into an array
    // const keys = Object.keys(breakpoints)
    // const currentIndex = keys.indexOf(slug)
    // let nextBreakpoint = false
    // if (currentIndex !== -1 && currentIndex < keys.length - 1) {
    //   const nextSlug = keys[currentIndex + 1]
    //   nextBreakpoint = breakpoints[nextSlug]
    // }

    for (const mode of ['', 'inverse']) {
      for (const type of ['css', 'scss']) {
        if (!cssFile.includes('.' + type)) {
          continue
        }

        const cssFileBreakpoint = cssFile.replace('.' + type, '-' + slug + (mode ? '-' + mode : '') + '.' + type)

        if (!fs.existsSync(cssFileBreakpoint)) {
          continue
        }

        const temporaryPath = cssFileBreakpoint.split('src').pop().replaceAll('\\', '/')
        const compiledCss = compileScss(cssFileBreakpoint)
        const clause = []
        if (mode === 'inverse' && breakpoint.next) {
          clause.push(`max-width: ${breakpoint.next.width}px`)
        }

        if (mode === '') {
          clause.push(`min-width: ${breakpoint.width}px`)
        }
        // if (nextBreakpoint && slug == ' tiny') {
        //   clause.push(`max-width:${nextBreakpoint.width}px`)
        // }

        if (compiledCss) {
          content.push(
            `/* Breakpoint: ${slug} - ${temporaryPath} */`,
            `@media (${clause.join(') and (')}) {`,
            compiledCss,
            '}'
          )
        // console.log({content})
        }
      }
    }
  }

  return content.join('\n').trim()
}

// Helper function to compile SCSS
const compileScss = scssFilePath => {
  try {
    const scssContent = fs.readFileSync(scssFilePath, 'utf8')
    if (!scssContent) {
      return ''
    }

    // if (scssFilePath.includes('tiny')) {
    //   console.log({scssFilePath, parsed: parseMediaQueries(scssContent)})
    // }

    const result = sass.renderSync({data: scssContent})
    return result.css.toString().trim()
  } catch (error) {
    console.error(
      `Error compiling SCSS file ${scssFilePath}:`, error.formatted
    )
    return ''
  }
}

function parseMediaQueries(cssContent) {
  // Convert the breakpoints object into an array of keys
  const keys = Object.keys(breakpoints)

  // Iterate over each slug in the breakpoints object
  for (const [index, slug] of keys.entries()) {
    const content = []
    const nextBreakpoint = keys[index + 1]
    const maxWidth = nextBreakpoint ? breakpoints[nextBreakpoint].width - 1 : null

    // Construct the media query
    const mediaQuery = []

    // if (minWidth) {
    //   mediaQuery.push(`min-width: ${minWidth}px`)
    // }

    if (maxWidth) {
      mediaQuery.push(`max-width: ${maxWidth}px`)
    }

    content.push(`@media (${mediaQuery.join(') and (')})`)
    // Replace occurrences of @[slug] { ... } with the actual media query
    const regex = new RegExp(`\\[max="${slug}"\\]`, 'g')
    const newContent = cssContent.replace(regex, content.join('\n'))

    cssContent = newContent
  }

  return cssContent
}

/**
 * Recursively collect all .css and .scss files in a directory, ignoring files that contain keys from breakpoints object, and sort them.
 * Files from the 'globals' folder are at the top, followed by 'pages' folder files, then the rest.
 *
 * @param {string} dirPath - The directory to traverse.
 * @returns {string[]} - An array of sorted file paths for CSS and SCSS files.
 */
const collectCssAndScssFiles = dirPath => {
  let cssFiles = []
  const ignoreKeys = Object.keys(breakpoints)

  const files = fs.readdirSync(dirPath, {withFileTypes: true})

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name)
    const shouldIgnore = ignoreKeys.some(key => fullPath.includes(key))

    if (file.isDirectory()) {
      // Recursively collect from subdirectories
      cssFiles = cssFiles.concat(collectCssAndScssFiles(fullPath))
    } else if (file.isFile() && (file.name.endsWith('.css') || file.name.endsWith('.scss')) && !shouldIgnore) {
      // Collect .css and .scss files that do not contain breakpoint keys
      cssFiles.push(fullPath)
    }
  }

  // Sort the files: 'globals' folder files first, then 'pages', then the rest
  cssFiles.sort((a, b) => {
    // If 'globals' is present in one but not the other
    if (a.includes('globals') && !b.includes('globals')) {
      return -1
    }

    if (!a.includes('globals') && b.includes('globals')) {
      return 1
    }

    // If both contain 'globals', sort alphabetically within 'globals'
    if (a.includes('globals') && b.includes('globals')) {
      return a.localeCompare(b)
    }

    // If 'pages' is present in one but not the other
    if (a.includes('pages') && !b.includes('pages')) {
      return -1
    }

    if (!a.includes('pages') && b.includes('pages')) {
      return 1
    }

    // If both contain 'pages', sort alphabetically within 'pages'
    if (a.includes('pages') && b.includes('pages')) {
      return a.localeCompare(b)
    }

    // Fallback: if neither contains 'globals' or 'pages', do not change order
    return 0
  })

  return cssFiles
}
