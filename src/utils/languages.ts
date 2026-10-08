/**
 * Multi-Language Resolver and Subtitle Formatter
 * Converts cryptic language codes (ENG, SPA, SRP, SLV, CZE, etc.)
 * into full, human-friendly language names (English, Serbian, Spanish, etc.)
 */

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
}

// Comprehensive dictionary mapping 2-letter, 3-letter, and common provider codes
const LANGUAGE_MAP: Record<string, LanguageInfo> = {
  // English
  en: { code: 'en', name: 'English', nativeName: 'English' },
  eng: { code: 'en', name: 'English', nativeName: 'English' },

  // South Slavic / Balkan
  bs: { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
  bos: { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
  hr: { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  hrv: { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  cro: { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  sr: { code: 'sr', name: 'Serbian', nativeName: 'Srpski' },
  srp: { code: 'sr', name: 'Serbian', nativeName: 'Srpski' },
  ser: { code: 'sr', name: 'Serbian', nativeName: 'Srpski' },
  scc: { code: 'sr', name: 'Serbian', nativeName: 'Srpski' },
  se: { code: 'sr', name: 'Serbian', nativeName: 'Srpski' }, // Common subtitle provider alias for Serbian
  sl: { code: 'sl', name: 'Slovenian', nativeName: 'Slovenski' },
  slv: { code: 'sl', name: 'Slovenian', nativeName: 'Slovenski' },
  slo: { code: 'sl', name: 'Slovenian', nativeName: 'Slovenski' },
  mk: { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  mkd: { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  sq: { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
  sqi: { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
  alb: { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },

  // Spanish & Portuguese
  es: { code: 'es', name: 'Spanish', nativeName: 'Español' },
  spa: { code: 'es', name: 'Spanish', nativeName: 'Español' },
  sp: { code: 'es', name: 'Spanish', nativeName: 'Español' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  por: { code: 'pt', name: 'Portuguese (Portugal)', nativeName: 'Português' },
  po: { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  pob: { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  br: { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  bra: { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  'pt-br': { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },

  // Western & Northern European
  de: { code: 'de', name: 'German', nativeName: 'Deutsch' },
  deu: { code: 'de', name: 'German', nativeName: 'Deutsch' },
  ger: { code: 'de', name: 'German', nativeName: 'Deutsch' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français' },
  fra: { code: 'fr', name: 'French', nativeName: 'Français' },
  fre: { code: 'fr', name: 'French', nativeName: 'Français' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  ita: { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  nld: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  dut: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  da: { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  dan: { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  swe: { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  sw: { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  no: { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  nor: { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  nb: { code: 'no', name: 'Norwegian', nativeName: 'Norsk Bokmål' },
  nn: { code: 'no', name: 'Norwegian', nativeName: 'Nynorsk' },
  fi: { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  fin: { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  is: { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  ice: { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  isl: { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  ic: { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },

  // Central & Eastern European
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  pol: { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  cs: { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  cze: { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  ces: { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  cz: { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  sk: { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  slk: { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  hu: { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  hun: { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  ro: { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  ron: { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  rum: { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  bg: { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  bul: { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  rus: { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  uk: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  ukr: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  el: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  ell: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  gre: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  gr: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },

  // Middle Eastern & Asian
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  tur: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ara: { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  he: { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  heb: { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  fa: { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  fas: { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  per: { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  hin: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  ben: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  be: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  urd: { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  pan: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  ind: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  in: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  ms: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  msa: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  may: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  ma: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  tha: { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  vie: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  fil: { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
  tl: { code: 'fil', name: 'Filipino', nativeName: 'Tagalog' },
  tgl: { code: 'fil', name: 'Filipino', nativeName: 'Tagalog' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  jpn: { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어' },
  kor: { code: 'ko', name: 'Korean', nativeName: '한국어' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文' },
  zho: { code: 'zh', name: 'Chinese', nativeName: '中文' },
  chi: { code: 'zh', name: 'Chinese', nativeName: '中文' },
  ch: { code: 'zh', name: 'Chinese', nativeName: '中文' },
  ha: { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  hau: { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  swa: { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
};

/**
 * Checks if a subtitle label indicates Hearing Impaired / Closed Captions / SDH
 */
export function isCcLabel(rawLabel?: string): boolean {
  if (!rawLabel) return false;
  const l = rawLabel.toLowerCase();
  return (
    l.includes(' hi') ||
    l.includes('hi3') ||
    l.includes('hi4') ||
    l.includes('hi5') ||
    l.includes('hi6') ||
    l.includes('hi7') ||
    l.includes('hi8') ||
    l.includes('sdh') ||
    l.includes('cc') ||
    l.includes('hearing impaired') ||
    l.endsWith(' hi')
  );
}

/**
 * Normalizes any language code or raw string into clean full language info.
 */
export function resolveLanguageInfo(rawLang?: string, rawLabel?: string): LanguageInfo {
  const cleanLang = (rawLang || '').trim().toLowerCase();
  const cleanLabel = (rawLabel || '').trim().toLowerCase();

  // 1. Direct dictionary match by language code
  if (cleanLang && LANGUAGE_MAP[cleanLang]) {
    return LANGUAGE_MAP[cleanLang];
  }

  // 2. Direct dictionary match by label code (e.g. "ENG", "SRP", "SLV", "POB", "DAN")
  if (cleanLabel && LANGUAGE_MAP[cleanLabel]) {
    return LANGUAGE_MAP[cleanLabel];
  }

  // 3. Inspect label for well-known language names
  for (const [_, info] of Object.entries(LANGUAGE_MAP)) {
    if (
      cleanLabel.startsWith(info.name.toLowerCase()) ||
      (info.nativeName && cleanLabel.startsWith(info.nativeName.toLowerCase()))
    ) {
      return info;
    }
  }

  // 4. Special cases common in subtitle feeds
  if (cleanLabel.includes('brazilian') || cleanLabel.includes('brasil')) {
    return LANGUAGE_MAP['pob'];
  }
  if (cleanLabel.includes('english')) {
    return LANGUAGE_MAP['en'];
  }
  if (cleanLabel.includes('serbian') || cleanLabel.includes('srpski')) {
    return LANGUAGE_MAP['sr'];
  }
  if (cleanLabel.includes('croatian') || cleanLabel.includes('hrvatski')) {
    return LANGUAGE_MAP['hr'];
  }
  if (cleanLabel.includes('bosnian') || cleanLabel.includes('bosanski')) {
    return LANGUAGE_MAP['bs'];
  }
  if (cleanLabel.includes('spanish') || cleanLabel.includes('espanol') || cleanLabel.includes('español')) {
    return LANGUAGE_MAP['es'];
  }
  if (cleanLabel.includes('french') || cleanLabel.includes('francais') || cleanLabel.includes('français')) {
    return LANGUAGE_MAP['fr'];
  }
  if (cleanLabel.includes('german') || cleanLabel.includes('deutsch')) {
    return LANGUAGE_MAP['de'];
  }
  if (cleanLabel.includes('italian') || cleanLabel.includes('italiano')) {
    return LANGUAGE_MAP['it'];
  }
  if (cleanLabel.includes('portuguese') || cleanLabel.includes('portugues')) {
    return LANGUAGE_MAP['pt'];
  }
  if (cleanLabel.includes('russian') || cleanLabel.includes('russ')) {
    return LANGUAGE_MAP['ru'];
  }
  if (cleanLabel.includes('czech')) {
    return LANGUAGE_MAP['cs'];
  }
  if (cleanLabel.includes('danish')) {
    return LANGUAGE_MAP['da'];
  }
  if (cleanLabel.includes('finnish')) {
    return LANGUAGE_MAP['fi'];
  }
  if (cleanLabel.includes('norwegian')) {
    return LANGUAGE_MAP['no'];
  }
  if (cleanLabel.includes('swedish')) {
    return LANGUAGE_MAP['sv'];
  }
  if (cleanLabel.includes('greek')) {
    return LANGUAGE_MAP['el'];
  }
  if (cleanLabel.includes('slovenian')) {
    return LANGUAGE_MAP['sl'];
  }
  if (cleanLabel.includes('turkish')) {
    return LANGUAGE_MAP['tr'];
  }
  if (cleanLabel.includes('arabic')) {
    return LANGUAGE_MAP['ar'];
  }

  // 5. Fallback: capitalize whatever string exists
  const fallbackName =
    rawLabel && rawLabel.length > 2
      ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
      : rawLang
      ? rawLang.toUpperCase()
      : 'Unknown';

  return {
    code: cleanLang || 'und',
    name: fallbackName,
    nativeName: fallbackName,
  };
}

/**
 * Returns the base formatted name for a language (including native name for Balkan languages)
 */
export function getBaseLanguageDisplay(langInfo: LanguageInfo): string {
  if (langInfo.nativeName && langInfo.nativeName !== langInfo.name) {
    if (['bs', 'hr', 'sr', 'sl', 'mk'].includes(langInfo.code)) {
      return `${langInfo.name} (${langInfo.nativeName})`;
    }
  }
  return langInfo.name;
}

/**
 * Formats a single subtitle item into a pristine full-name label
 */
export function formatSubtitleFullLabel(
  rawLabel: string | undefined,
  rawLang: string | undefined
): { fullTitle: string; badge?: string; langCode: string; nativeName?: string } {
  const label = (rawLabel || '').trim();
  const langInfo = resolveLanguageInfo(rawLang, label);
  const baseName = getBaseLanguageDisplay(langInfo);
  const isCC = isCcLabel(label);

  const fullTitle = isCC ? `${baseName} [CC / SDH]` : baseName;

  return {
    fullTitle,
    badge: isCC ? 'CC / SDH' : undefined,
    langCode: langInfo.code,
    nativeName: langInfo.nativeName,
  };
}

/**
 * Takes a list of raw subtitle items and returns them with pristine,
 * deduplicated full labels and sorted intelligently:
 * 1. Bosnian / Croatian / Serbian (local priority)
 * 2. English (international primary)
 * 3. All other languages sorted alphabetically by their full name
 */
export function enrichAndSortSubtitles<
  T extends { id: string; label: string; language: string; url?: string }
>(
  items: T[]
): Array<T & { fullLabel: string; langCode: string; badge?: string; nativeName?: string }> {
  if (!items || items.length === 0) return [];

  // Group by resolved language to handle numbering cleanly
  const grouped = new Map<string, Array<{ item: T; index: number }>>();

  items.forEach((item, index) => {
    const langInfo = resolveLanguageInfo(item.language, item.label);
    const key = langInfo.code;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push({ item, index });
  });

  const enriched: Array<T & { fullLabel: string; langCode: string; badge?: string; nativeName?: string }> = [];

  grouped.forEach((groupItems) => {
    const langInfo = resolveLanguageInfo(groupItems[0].item.language, groupItems[0].item.label);
    const baseName = getBaseLanguageDisplay(langInfo);

    let regularCount = 0;
    let ccCount = 0;

    const totalRegular = groupItems.filter(({ item }) => !isCcLabel(item.label)).length;
    const totalCc = groupItems.filter(({ item }) => isCcLabel(item.label)).length;

    groupItems.forEach(({ item }) => {
      const isCC = isCcLabel(item.label);
      let title = '';

      if (isCC) {
        ccCount++;
        title = `${baseName} [CC / SDH]${totalCc > 1 && ccCount > 1 ? ` #${ccCount}` : ''}`;
      } else {
        regularCount++;
        title = `${baseName}${totalRegular > 1 && regularCount > 1 ? ` #${regularCount}` : ''}`;
      }

      enriched.push({
        ...item,
        label: title,
        fullLabel: title,
        langCode: langInfo.code,
        badge: isCC ? 'CC / SDH' : undefined,
        nativeName: langInfo.nativeName,
      });
    });
  });

  // Sort with Priority:
  // 1. Bosnian / Croatian / Serbian
  // 2. English
  // 3. Alphabetical by full label
  enriched.sort((a, b) => {
    const isBalkanA = ['bs', 'hr', 'sr', 'sl', 'mk'].includes(a.langCode);
    const isBalkanB = ['bs', 'hr', 'sr', 'sl', 'mk'].includes(b.langCode);
    if (isBalkanA && !isBalkanB) return -1;
    if (!isBalkanA && isBalkanB) return 1;

    const isEngA = a.langCode === 'en';
    const isEngB = b.langCode === 'en';
    if (isEngA && !isEngB) return -1;
    if (!isEngA && isEngB) return 1;

    return a.fullLabel.localeCompare(b.fullLabel);
  });

  return enriched;
}
