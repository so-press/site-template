import readline from 'node:readline'
import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'

const srcBase = path.join(process.cwd(), 'src')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, answer => resolve(answer))
  })
}

export async function gen() {
  const options = ['page', 'component', 'fragment']

  console.log('\nWhat would you like to create?')
  for (const [i, option] of options.entries()) {
    console.log(`${i + 1}. ${option}`)
  }

  const answer = await askQuestion('Please select an option (1/2/3): ')
  const selectedIndex = Number.parseInt(answer, 10) - 1

  if (selectedIndex >= 0 && selectedIndex < options.length) {
    const type = options[selectedIndex]
    console.log(`You chose to create a ${type}.`)

    const name = await askQuestion(`Please enter the name of the ${type} to create: `)

    const newFolderPath = path.join(srcBase, type + 's', name)
    if (fs.existsSync(newFolderPath)) {
      console.error(`Error: The ${type} "${name}" already exists.`)
      return gen()
    }

    const addSlot = await askQuestion('Should the component include a dynamic slot ? (y/N): ')
    const tagContent = addSlot.toLowerCase() === 'y' ? '{{> @partial-block }}' : `${type} - ${name}`

    const addJSFile = await askQuestion('Should a JS file be created? (y/N): ')

    console.log(`You are going to create a ${type} named "${name}".`)
    const confirmation = await askQuestion('Do you want to continue? (Y/n): ')

    if (confirmation.toLowerCase() === 'n') {
      console.log('Operation cancelled.')
      return gen()
    }

    fs.mkdirSync(newFolderPath, {recursive: true})
    fs.writeFileSync(path.join(newFolderPath, `${name}.hbs`), `<div class="${name}">\n${tagContent}\n</div>`)
    fs.writeFileSync(path.join(newFolderPath, `${name}.scss`), `.${name} {\n\n}\n`)

    if (addJSFile.toLowerCase() === 'y') {
      fs.writeFileSync(
        path.join(newFolderPath, `${name}.js`),
        `App.modules['${name}'] = (() => {
    return {
        start() {
            console.log('${name}')
        }
    }
})();`
      )
    }

    console.log(`Successfully created ${type} "${name}" in "${newFolderPath}".`)

    return gen() // 👈 Go back to the type selection menu
  }

  console.log('Invalid selection. Please choose 1, 2, or 3.')
  return gen()
}

// Do not close rl here – it stays open to keep the loop running
