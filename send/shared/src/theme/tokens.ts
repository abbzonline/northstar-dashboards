/**
 * Fireworks brand tokens, copied from fireworks.ai's production CSS (blog pages).
 * Values are the site's own oklch() definitions; hex equivalents in comments.
 * The same values are exposed as CSS variables in global.css.
 */
export const fw = {
  purple25: 'oklch(89% .06 299.99)', //  #E0D2FD
  purple50: 'oklch(82% .11 298.95)', //  #CEB4FF
  purple100: 'oklch(74% .15 297.15)', // #B695FD
  purple200: 'oklch(66% .2 294.66)', //  #9D72FE
  purple300: 'oklch(58% .25 291.29)', // #8349FE
  purple400: 'rgb(103, 32, 255)', //     #6720FF — the site's primary accent
  purple500: 'oklch(43% .23 285.65)', // #501BC4
  purple600: 'oklch(35% .18 287)', //    #3C1590
  purple900: 'oklch(22% .13 285.01)', // #1B0052
  marine500: 'oklch(83% .15 180.67)', // #00E6CC
  marine700: 'oklch(64% .11 180.47)', // #1DA28F
  marine800: 'oklch(49% .09 181.22)', // #007163
  blue300: 'oklch(54% .26 263.91)', //   #1756FF
  blue100: 'oklch(78% .12 246.26)', //   #73BEFF
  red100: 'oklch(94% .03 22.95)', //     #FFE4E2
  red500: 'oklch(64% .21 28.54)', //     #F14539
  red700: 'oklch(50% .18 29.51)', //     #B32519
  surfaceTint: '#FAF7FF',
  border: '#E6EAF4',
  ink: '#17191D',
  neutrals700: 'oklch(28% .01 285.93)', // #28282E
  gray: 'oklch(48% .01 256.74)', //        #5A5E63
  neutrals300: 'oklch(74% 0 0)', //        #ABABAB
  neutrals100: 'oklch(93% 0 0)', //        #E8E8E8
  white: '#FFFFFF',
  /** NOT a Fireworks token: their palette has no yellow/amber, needed for the 'Positive-Watch' health band. */
  amber500: 'oklch(76% .15 75)', // #E3A53A
} as const;

/** Chart series roles. Primary metric is always Fireworks purple. */
export const series = {
  primary: fw.purple400,
  primarySoft: fw.purple50,
  secondary: fw.marine700,
  tertiary: fw.blue300,
  muted: fw.purple200,
  bad: fw.red500,
  grid: fw.border,
  axis: fw.gray,
  target: fw.neutrals300,
} as const;
