
export const breakpoints = (() => {
  const breakpoints = {
    tiny: {
      slug: 'tiny',
      width: 0
    },
    small: {
      slug: 'small',
      width: 750,
      ratio: 19.5 / 9
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
  const keys = Object.keys(breakpoints)
  for (const [index, key] of keys.entries()) {
    breakpoints[key].next = index + 1 < keys.length ? {slug: breakpoints[keys[index + 1]].slug, width: breakpoints[keys[index + 1]].width} : null
  }

  return breakpoints
})()
