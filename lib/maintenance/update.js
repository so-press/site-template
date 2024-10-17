import {spawn} from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

// Obtenir le chemin absolu du dossier des scripts
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const scriptsPath = path.resolve(__dirname, '../scripts')

// Fonction pour exécuter les scripts avec interaction utilisateur
function runScript(command, args) {
  const script = spawn(command, args, {stdio: 'inherit'})

  script.on('error', error => {
    console.error(`Erreur lors de l'exécution du script: ${error}`)
  })

  script.on('exit', code => {
    console.log(`Le script s'est terminé avec le code ${code}`)
  })
}

// Détecter l'OS et exécuter le script approprié
if (os.platform() === 'win32') {
  runScript('cmd.exe', ['/c', path.join(scriptsPath, 'update.bat')])
} else {
  // Utiliser bash au lieu de sh
  runScript('bash', [path.join(scriptsPath, 'update.sh')])
}
