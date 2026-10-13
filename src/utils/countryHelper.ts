export interface CountryInfo {
  code: string; // ISO 3166-1 alpha-2, e.g. 'US'
  name: string; // e.g. 'United States of America'
  shortName: string; // e.g. 'United States'
  slug: string; // e.g. 'united-states'
  flag: string; // e.g. '🇺🇸'
}

// Master registry of countries with their ISO codes, standard names, and flags
export const COUNTRY_REGISTRY: Record<string, CountryInfo> = {
  US: { code: 'US', name: 'United States of America', shortName: 'United States', slug: 'united-states', flag: '🇺🇸' },
  GB: { code: 'GB', name: 'United Kingdom', shortName: 'United Kingdom', slug: 'united-kingdom', flag: '🇬🇧' },
  JP: { code: 'JP', name: 'Japan', shortName: 'Japan', slug: 'japan', flag: '🇯🇵' },
  KR: { code: 'KR', name: 'South Korea', shortName: 'South Korea', slug: 'south-korea', flag: '🇰🇷' },
  FR: { code: 'FR', name: 'France', shortName: 'France', slug: 'france', flag: '🇫🇷' },
  DE: { code: 'DE', name: 'Germany', shortName: 'Germany', slug: 'germany', flag: '🇩🇪' },
  CA: { code: 'CA', name: 'Canada', shortName: 'Canada', slug: 'canada', flag: '🇨🇦' },
  IT: { code: 'IT', name: 'Italy', shortName: 'Italy', slug: 'italy', flag: '🇮🇹' },
  ES: { code: 'ES', name: 'Spain', shortName: 'Spain', slug: 'spain', flag: '🇪🇸' },
  AU: { code: 'AU', name: 'Australia', shortName: 'Australia', slug: 'australia', flag: '🇦🇺' },
  IN: { code: 'IN', name: 'India', shortName: 'India', slug: 'india', flag: '🇮🇳' },
  CN: { code: 'CN', name: 'China', shortName: 'China', slug: 'china', flag: '🇨🇳' },
  HK: { code: 'HK', name: 'Hong Kong', shortName: 'Hong Kong', slug: 'hong-kong', flag: '🇭🇰' },
  TW: { code: 'TW', name: 'Taiwan', shortName: 'Taiwan', slug: 'taiwan', flag: '🇹🇼' },
  MX: { code: 'MX', name: 'Mexico', shortName: 'Mexico', slug: 'mexico', flag: '🇲🇽' },
  BR: { code: 'BR', name: 'Brazil', shortName: 'Brazil', slug: 'brazil', flag: '🇧🇷' },
  SE: { code: 'SE', name: 'Sweden', shortName: 'Sweden', slug: 'sweden', flag: '🇸🇪' },
  NO: { code: 'NO', name: 'Norway', shortName: 'Norway', slug: 'norway', flag: '🇳🇴' },
  DK: { code: 'DK', name: 'Denmark', shortName: 'Denmark', slug: 'denmark', flag: '🇩🇰' },
  NL: { code: 'NL', name: 'Netherlands', shortName: 'Netherlands', slug: 'netherlands', flag: '🇳🇱' },
  IE: { code: 'IE', name: 'Ireland', shortName: 'Ireland', slug: 'ireland', flag: '🇮🇪' },
  NZ: { code: 'NZ', name: 'New Zealand', shortName: 'New Zealand', slug: 'new-zealand', flag: '🇳🇿' },
  TR: { code: 'TR', name: 'Turkey', shortName: 'Turkey', slug: 'turkey', flag: '🇹🇷' },
  PL: { code: 'PL', name: 'Poland', shortName: 'Poland', slug: 'poland', flag: '🇵🇱' },
  RU: { code: 'RU', name: 'Russia', shortName: 'Russia', slug: 'russia', flag: '🇷🇺' },
  BE: { code: 'BE', name: 'Belgium', shortName: 'Belgium', slug: 'belgium', flag: '🇧🇪' },
  AT: { code: 'AT', name: 'Austria', shortName: 'Austria', slug: 'austria', flag: '🇦🇹' },
  CH: { code: 'CH', name: 'Switzerland', shortName: 'Switzerland', slug: 'switzerland', flag: '🇨🇭' },
  CZ: { code: 'CZ', name: 'Czech Republic', shortName: 'Czech Republic', slug: 'czech-republic', flag: '🇨🇿' },
  AR: { code: 'AR', name: 'Argentina', shortName: 'Argentina', slug: 'argentina', flag: '🇦🇷' },
  ZA: { code: 'ZA', name: 'South Africa', shortName: 'South Africa', slug: 'south-africa', flag: '🇿🇦' },
  TH: { code: 'TH', name: 'Thailand', shortName: 'Thailand', slug: 'thailand', flag: '🇹🇭' },
  ID: { code: 'ID', name: 'Indonesia', shortName: 'Indonesia', slug: 'indonesia', flag: '🇮🇩' },
  PH: { code: 'PH', name: 'Philippines', shortName: 'Philippines', slug: 'philippines', flag: '🇵🇭' },
  GR: { code: 'GR', name: 'Greece', shortName: 'Greece', slug: 'greece', flag: '🇬🇷' },
  PT: { code: 'PT', name: 'Portugal', shortName: 'Portugal', slug: 'portugal', flag: '🇵🇹' },
  HU: { code: 'HU', name: 'Hungary', shortName: 'Hungary', slug: 'hungary', flag: '🇭🇺' },
  RO: { code: 'RO', name: 'Romania', shortName: 'Romania', slug: 'romania', flag: '🇷🇴' },
  UA: { code: 'UA', name: 'Ukraine', shortName: 'Ukraine', slug: 'ukraine', flag: '🇺🇦' },
  IL: { code: 'IL', name: 'Israel', shortName: 'Israel', slug: 'israel', flag: '🇮🇱' },
  IS: { code: 'IS', name: 'Iceland', shortName: 'Iceland', slug: 'iceland', flag: '🇮🇸' },
  FI: { code: 'FI', name: 'Finland', shortName: 'Finland', slug: 'finland', flag: '🇫🇮' },
  RS: { code: 'RS', name: 'Serbia', shortName: 'Serbia', slug: 'serbia', flag: '🇷🇸' },
  HR: { code: 'HR', name: 'Croatia', shortName: 'Croatia', slug: 'croatia', flag: '🇭🇷' },
  BA: { code: 'BA', name: 'Bosnia and Herzegovina', shortName: 'Bosnia', slug: 'bosnia-and-herzegovina', flag: '🇧🇦' },
  ME: { code: 'ME', name: 'Montenegro', shortName: 'Montenegro', slug: 'montenegro', flag: '🇲🇪' },
  SI: { code: 'SI', name: 'Slovenia', shortName: 'Slovenia', slug: 'slovenia', flag: '🇸🇮' },
  MK: { code: 'MK', name: 'North Macedonia', shortName: 'Macedonia', slug: 'north-macedonia', flag: '🇲🇰' },
  CL: { code: 'CL', name: 'Chile', shortName: 'Chile', slug: 'chile', flag: '🇨🇱' },
  CO: { code: 'CO', name: 'Colombia', shortName: 'Colombia', slug: 'colombia', flag: '🇨🇴' },
  SG: { code: 'SG', name: 'Singapore', shortName: 'Singapore', slug: 'singapore', flag: '🇸🇬' },
  MY: { code: 'MY', name: 'Malaysia', shortName: 'Malaysia', slug: 'malaysia', flag: '🇲🇾' },
};

// Aliases mapping name or slug variants to the ISO code
const ALIAS_MAP: Record<string, string> = {
  'united-states-of-america': 'US',
  'united-states': 'US',
  'united states of america': 'US',
  'united states': 'US',
  'usa': 'US',
  'us': 'US',
  'america': 'US',
  'united-kingdom': 'GB',
  'united kingdom': 'GB',
  'uk': 'GB',
  'gb': 'GB',
  'great-britain': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'south-korea': 'KR',
  'south korea': 'KR',
  'korea': 'KR',
  'kr': 'KR',
  'japan': 'JP',
  'jp': 'JP',
  'france': 'FR',
  'fr': 'FR',
  'germany': 'DE',
  'de': 'DE',
  'canada': 'CA',
  'ca': 'CA',
  'italy': 'IT',
  'it': 'IT',
  'spain': 'ES',
  'es': 'ES',
  'australia': 'AU',
  'au': 'AU',
  'india': 'IN',
  'in': 'IN',
  'china': 'CN',
  'cn': 'CN',
  'hong-kong': 'HK',
  'hong kong': 'HK',
  'taiwan': 'TW',
  'tw': 'TW',
  'mexico': 'MX',
  'mx': 'MX',
  'brazil': 'BR',
  'br': 'BR',
  'sweden': 'SE',
  'se': 'SE',
  'norway': 'NO',
  'no': 'NO',
  'denmark': 'DK',
  'dk': 'DK',
  'netherlands': 'NL',
  'nl': 'NL',
  'ireland': 'IE',
  'ie': 'IE',
  'new-zealand': 'NZ',
  'new zealand': 'NZ',
  'nz': 'NZ',
  'turkey': 'TR',
  'tr': 'TR',
  'poland': 'PL',
  'pl': 'PL',
  'russia': 'RU',
  'ru': 'RU',
  'belgium': 'BE',
  'be': 'BE',
  'austria': 'AT',
  'at': 'AT',
  'switzerland': 'CH',
  'ch': 'CH',
  'czech-republic': 'CZ',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'cz': 'CZ',
  'argentina': 'AR',
  'ar': 'AR',
  'south-africa': 'ZA',
  'south africa': 'ZA',
  'za': 'ZA',
};

/**
 * Returns clean slug for a country name
 */
export function slugifyCountry(name: string): string {
  if (!name) return 'united-states';
  const clean = name.trim().toLowerCase();
  if (ALIAS_MAP[clean]) {
    const info = COUNTRY_REGISTRY[ALIAS_MAP[clean]];
    if (info) return info.slug;
  }
  return clean
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');
}

/**
 * Resolves a country code, slug, or name into standard CountryInfo
 */
export function getCountryBySlugOrCode(param: string): CountryInfo {
  if (!param) return COUNTRY_REGISTRY.US;
  const normalized = param.trim().toLowerCase();
  const upper = param.trim().toUpperCase();

  // Direct ISO match
  if (COUNTRY_REGISTRY[upper]) {
    return COUNTRY_REGISTRY[upper];
  }

  // Alias match
  const codeFromAlias = ALIAS_MAP[normalized];
  if (codeFromAlias && COUNTRY_REGISTRY[codeFromAlias]) {
    return COUNTRY_REGISTRY[codeFromAlias];
  }

  // Look through registry by slug or name
  for (const item of Object.values(COUNTRY_REGISTRY)) {
    if (
      item.slug.toLowerCase() === normalized ||
      item.name.toLowerCase() === normalized ||
      item.shortName.toLowerCase() === normalized
    ) {
      return item;
    }
  }

  // Fallback for custom / unlisted country
  const prettyName = param
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return {
    code: upper.length === 2 ? upper : 'US',
    name: prettyName,
    shortName: prettyName,
    slug: slugifyCountry(param),
    flag: '🌐',
  };
}
