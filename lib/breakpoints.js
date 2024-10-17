/**
 * Définit et exporte des points d'arrêt pour l'affichage responsive.
 * Chaque point d'arrêt comporte un identifiant (slug), une largeur minimale (width)
 * et éventuellement un ratio utilisé pour le redimensionnement.
 *
 * @returns {object} Un ensemble de points d'arrêt définis
 */
export const breakpoints = (() => {
  // Définir les points d'arrêt initiaux
  const breakpoints = {
    tiny: {
      slug: 'tiny', // Identifiant du point d'arrêt
      width: 0 // Largeur minimale pour ce point d'arrêt
    },
    small: {
      slug: 'small',
      width: 750,
      ratio: 19.5 / 9 // Ratio pour le redimensionnement
    },
    medium: {
      slug: 'medium',
      width: 850,
      ratio: 3 / 4
    },
    large: {
      slug: 'large',
      width: 1200,
      ratio: 10 / 16
    },
    xlarge: {
      slug: 'xlarge',
      width: 1500,
      ratio: 9 / 16
    }
  }

  // Parcourir les points d'arrêt pour définir le prochain point d'arrêt pour chacun
  const keys = Object.keys(breakpoints)
  for (const [index, key] of keys.entries()) {
    breakpoints[key].next = index + 1 < keys.length ? {slug: breakpoints[keys[index + 1]].slug, width: breakpoints[keys[index + 1]].width} : null
  }

  return breakpoints
})()
