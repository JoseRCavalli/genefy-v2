/**
 * Maps NAAB company prefix to brand/catalog name.
 * Source: NAAB member directory + known catalog prefixes.
 */
const PREFIX_TO_BRAND: Record<string, string> = {
  // Select Sires
  '2': 'Select Sires', '6': 'Select Sires', '7': 'Select Sires', '9': 'Select Sires',
  '14': 'Select Sires', '250': 'Select Sires', '507': 'Select Sires', '509': 'Select Sires',
  '527': 'Select Sires', '550': 'Select Sires', '557': 'Select Sires', '559': 'Select Sires',
  '579': 'Select Sires', '585': 'Select Sires', '614': 'Select Sires', '660': 'Select Sires',
  '661': 'Select Sires', '663': 'Select Sires', '665': 'Select Sires', '667': 'Select Sires',
  '689': 'Select Sires', '760': 'Select Sires', '761': 'Select Sires', '763': 'Select Sires',
  '765': 'Select Sires', '767': 'Select Sires', '814': 'Select Sires',
  // Alta Genetics
  '11': 'Alta Genetics', '28': 'Alta Genetics', '511': 'Alta Genetics', '581': 'Alta Genetics',
  '584': 'Alta Genetics', '593': 'Alta Genetics', '611': 'Alta Genetics', '681': 'Alta Genetics',
  '684': 'Alta Genetics', '699': 'Alta Genetics',
  // ABS Global
  '29': 'ABS Global', '94': 'ABS Global', '529': 'ABS Global', '530': 'ABS Global',
  '531': 'ABS Global', '532': 'ABS Global', '533': 'ABS Global', '594': 'ABS Global',
  '602': 'ABS Global', '603': 'ABS Global', '604': 'ABS Global', '605': 'ABS Global',
  '629': 'ABS Global', '694': 'ABS Global', '729': 'ABS Global', '794': 'ABS Global',
  '802': 'ABS Global', '803': 'ABS Global', '804': 'ABS Global', '805': 'ABS Global',
  '806': 'ABS Global', '829': 'ABS Global', '894': 'ABS Global', '929': 'ABS Global',
  '994': 'ABS Global',
  // GENEX Cooperative
  '1': 'Genex', '501': 'Genex', '502': 'Genex', '521': 'Genex', '541': 'Genex',
  '549': 'Genex', '590': 'Genex', '601': 'Genex', '621': 'Genex', '751': 'Genex',
  '752': 'Genex',
  // Semex Alliance
  '200': 'Semex', '517': 'Semex', '518': 'Semex', '519': 'Semex', '574': 'Semex',
  '575': 'Semex', '722': 'Semex', '723': 'Semex', '777': 'Semex', '888': 'Semex',
  // STgenetics / Sexing Technologies
  '551': 'STgenetics', '76': 'STgenetics', '151': 'STgenetics', '513': 'STgenetics',
  '576': 'STgenetics', '586': 'STgenetics',
  '203': 'STgenetics', '523': 'STgenetics', '537': 'STgenetics',
};

export function getBrandFromCode(code: string): string {
  const match = code.match(/^(\d+)[A-Z]{2}/);
  if (!match) return 'CDCB';
  return PREFIX_TO_BRAND[match[1]] ?? 'CDCB';
}

/** Add Accelerated Genetics as alias for Select Sires */
export const CATALOG_ALIAS: Record<string, string> = {
  'GenerVation (Select Sires)': 'Select Sires',
  'Accelerated (Select Sires)': 'Select Sires',
  'Accelerated Genetics': 'Select Sires',
};

export const ALL_CATALOGS = [
  'Select Sires',
  'GenerVation (Select Sires)',
  'Accelerated (Select Sires)',
  'Semex',
  'STgenetics',
  'Alta Genetics',
  'Genex',
  'ABS Global',
  'CDCB',
] as const;

export type CatalogName = (typeof ALL_CATALOGS)[number];
