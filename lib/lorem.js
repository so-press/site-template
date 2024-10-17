import {loremIpsum} from 'lorem-ipsum'

/**
 * Génère un texte lorem ipsum avec une longueur aléatoire entre un minimum et un maximum.
 *
 * @param {number} min - Le nombre minimum de mots.
 * @param {number} max - Le nombre maximum de mots.
 * @returns {string} - Le texte lorem ipsum généré.
 */
export function loremGen(units, min, max = false) {
  let length = min
  if (typeof max === 'number') {
    length = Math.floor(Math.random() * (max - min + 1)) + min
  }

  return loremIpsum({
    count: length,
    units
  })
}
