export const META_ACCOUNTS: string[] = [
  '1735113139989857',
  '403663420100973',
  '961650757625796',
  '1847386985347986',
  '777050266134172',
  '992386864471766',
  '905420285681589',
  '469315270785940',
  '1184002296160825',
  '1239913009988989',
  '1100672934584550',
  '886558279232108',
  '790761380532137',
  '2659430351062582',
  '503453318661318',
  '889198435432397',
  '430096303398103',
  '1459616038851486',
  '925662795239797',
]

export const META_ACCOUNT_NAMES: Record<string, string> = {
  '1735113139989857': 'UniBF Seminário',
  '403663420100973': 'UniBF Boleto',
  '961650757625796': 'UniBF Cartão',
  '1847386985347986': 'Eletroluz Lojas Físicas',
  '777050266134172': 'Eletroluz Express',
  '992386864471766': 'Eletroluz E-commerce',
  '905420285681589': 'Unicive Londrina Polo',
  '469315270785940': 'Unicive Londrina',
  '1184002296160825': 'Unicive Londrina Polo 2',
  '1239913009988989': 'Febracis',
  '1100672934584550': 'Febracis Interno',
  '886558279232108': 'Vida Animal',
  '790761380532137': 'Daccs',
  '2659430351062582': 'Docg',
  '503453318661318': 'VMARK',
  '889198435432397': 'Foco Leds',
  '430096303398103': 'Foco Nova',
  '1459616038851486': 'Guia-se',
  '925662795239797': 'AG Perform',
}

export const GOOGLE_ACCOUNTS: string[] = [
  '842-650-4432',
  '146-404-8039',
  '611-909-3219',
  '142-560-0294',
  '929-008-1178',
  '636-999-8968',
  '929-073-4541',
  '984-710-1992',
  '602-449-0797',
  '397-266-0827',
  '568-925-7999',
]

export const GOOGLE_ACCOUNT_NAMES: Record<string, string> = {
  '842-650-4432': 'UniBF',
  '146-404-8039': 'Eletroluz eComm',
  '611-909-3219': 'Eletroluz Lojas',
  '142-560-0294': 'Febracis',
  '929-008-1178': 'Vida Animal',
  '636-999-8968': 'Daccs',
  '929-073-4541': 'Docg',
  '984-710-1992': 'FOCO',
  '602-449-0797': 'EducaSul',
  '397-266-0827': 'Grafo Capital',
  '568-925-7999': 'AG Perform',
}

/** Maps account names (per platform) to canonical client names */
export const CLIENT_MAP: Record<string, string> = {
  // Meta accounts
  'UniBF Seminário': 'UniBF',
  'UniBF Boleto': 'UniBF',
  'UniBF Cartão': 'UniBF',
  'Eletroluz Lojas Físicas': 'Eletroluz',
  'Eletroluz Express': 'Eletroluz',
  'Eletroluz E-commerce': 'Eletroluz',
  'Unicive Londrina Polo': 'Unicive Londrina',
  'Unicive Londrina Polo 2': 'Unicive Londrina',
  'Unicive Londrina': 'Unicive Londrina',
  'Febracis Interno': 'Febracis',
  'Foco Leds': 'Foco',
  'Foco Nova': 'Foco',
  'Guia-se': 'Guia-se',
  // Google accounts (different names for same clients)
  'UniBF': 'UniBF',
  'Eletroluz eComm': 'Eletroluz',
  'Eletroluz Lojas': 'Eletroluz',
  'FOCO': 'Foco',
  // Same name on both platforms — identity mappings to normalize casing
  'Febracis': 'Febracis',
  'Vida Animal': 'Vida Animal',
  'Daccs': 'Daccs',
  'Docg': 'Docg',
  'VMARK': 'VMARK',
  'AG Perform': 'AG Perform',
  'EducaSul': 'EducaSul',
  'Grafo Capital': 'Grafo Capital',
}

export function toClientName(accountName: string): string {
  return CLIENT_MAP[accountName] ?? accountName
}

/** All unique client names across platforms */
export const ALL_CLIENT_NAMES: string[] = [
  'UniBF',
  'Eletroluz',
  'Unicive Londrina',
  'Febracis',
  'Vida Animal',
  'Daccs',
  'Docg',
  'VMARK',
  'Foco',
  'Guia-se',
  'EducaSul',
  'Grafo Capital',
  'AG Perform',
]
