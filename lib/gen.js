import readline from 'node:readline'
import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'

// Define the base directory for the source
const srcBase = path.join(process.cwd(), 'src') // Change this to your actual src base directory

// Create an interface for readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Function to prompt the user
function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer)
    })
  })
}

export async function gen() {
  const options = ['page', 'component', 'fragment']

  console.log('What would you like to create?')
  for (const [index, option] of options.entries()) {
    console.log(`${index + 1}. ${option}`)
  }

  const answer = await askQuestion('Please select an option (1/2/3): ')

  const selectedIndex = Number.parseInt(answer, 10) - 1

  // Validate the selection
  if (selectedIndex >= 0 && selectedIndex < options.length) {
    const type = options[selectedIndex]
    console.log(`You chose to create a ${type}.`)

    // Prompt for the name of the chosen type
    const name = await askQuestion(`Please enter the name of the ${type} to create: `)

    // Path to the new folder
    const newFolderPath = path.join(srcBase, type + 's', name)
    // Check if the folder already exists
    if (fs.existsSync(newFolderPath)) {
      console.error(`Error: The ${type} "${name}" already exists.`)
      rl.close()
      return
    }

    // Ask if a dynamic slot should be added
    const addSlot = await askQuestion('Should the component include a dynamic slot ? (y/N): ')
    const tagContent = addSlot.toLowerCase() === 'y' ? '{{> @partial-block }}' : `${type} - ${name}`

    // Ask if a JS file should be created
    const addJSFile = await askQuestion('Should a JS file be created? (y/N): ')

    // Prompt for a description
    // const description = await askQuestion(`Please enter a description for the ${type}: `)

    // Show the chosen values and ask for confirmation
    console.log(`You are going to create a ${type} named "${name}".`)

    const confirmation = await askQuestion('Do you want to continue? (Y/n): ')

    if (confirmation.toLowerCase() === 'n') {
      console.log('Operation cancelled.')
      rl.close()
      return
    }

    // Create the folder and the files
    fs.mkdirSync(newFolderPath, {recursive: true})

    // Create the .hbs file with or without the slot content
    fs.writeFileSync(path.join(newFolderPath, `${name}.hbs`), `<div class="${name}">${tagContent}</div>`)

    // Create the .scss file
    fs.writeFileSync(path.join(newFolderPath, `${name}.scss`), `/* Styles for ${name} ${type} */\n`)

    // Conditionally create the .js file
    if (addJSFile.toLowerCase() === 'y') {
      fs.writeFileSync(path.join(newFolderPath, `${name}.js`), `App.modules['${name}'] = (() => {
    return {
        start() {
          console.log('${name}')
        }
    }
})();`)
    }

    console.log(`Successfully created ${type} "${name}" in "${newFolderPath}".`)
  } else {
    console.log('Invalid selection. Please choose 1, 2, or 3.')
  }

  // Close the readline interface
  rl.close()
}
