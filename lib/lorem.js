import {loremIpsum} from 'lorem-ipsum'
import process from 'node:process'
/**
 * Génère un texte lorem ipsum avec une longueur aléatoire entre un minimum et un maximum.
 *
 * @param {number} min - Le nombre minimum de mots.
 * @param {number} max - Le nombre maximum de mots.
 * @returns {string} - Le texte lorem ipsum généré.
 */
export function loremGen(units, min, max = false, data = false) {
  let length = Number(min)
  if (Number.isNaN(length)) {
    length = 1
  }

  if (units === undefined) {
    console.error({
      units, min, max, data
    })
    process.exit()
  }

  if (typeof max === 'number') {
    length = Math.floor(Math.random() * (max - min + 1)) + min
  }

  const result = loremIpsum({
    count: length,
    units
  })

  return String(result[0]).toUpperCase() + String(result).slice(1)
}
