import type { BullRow } from './supabase';

// Map: nome normalizado (lowercase) → código NAAB
const NAAB_BY_NAME: Record<string, string> = {
  'cobot': '14HO17486', 'bentehm': '7HO18078', 'golley': '7HO17200',
  'cateye': '7HO17419', 'good vibe': '7HO17540', 'roonie': '14HO17539',
  'waymire': '7HO18093', 'lanechange': '7HO18108', 'sack': '14HO17589',
  'pa-king': '14HO18269', 'tenerife': '250HO18118', 'foonburton': '7HO17413',
  'sheepster': '7HO16276', 'wantucker': '7HO17542', 'ammo': '14HO17426',
  'whippet': '7HO17568', 'zanaz': '7HO17675', 'gavin': '7HO17929',
  'poplar': '250HO17387', 'blind date': '7HO18089', 'tevlade': '14HO18083',
  'flabbergast': '7HO17406', 'ozark': '14HO17393', 'kaweah': '14HO18084',
  'kick-it': '7HO18184', 'lighthouse': '7HO17514', 'mican': '7HO17191',
  'hoakly': '7HO18373', 'boldness': '250HO17346', 'stagger': '7HO17142',
  'donald': '7HO17194', 'madcap': '14HO17945', 'myboyblue': '7HO17572',
  'day trip': '14HO17216', 'maynard': '7HO17679', 'serrano': '14HO17453',
  'commander': '7HO17686', 'billerbeck': '14HO18000', 'genoa': '250HO17992',
  'saloon': '250HO17417', 'hesekiah': '14HO17805', 'kilgore': '7HO18024',
  'levanna': '14HO17991', 'gentry': '7HO18225', 'sturgeon': '7HO17478',
  'rattlesnake': '7HO18381', 'rimbot': '7HO16644', 'leif': '250HO18112',
  'clavicle': '7HO17330', 'jin': '7HO17944', 'mvp-p': '507HO18401',
  'deems': '14HO17940', 'stewart': '7HO18014', 'skeet': '7HO17383',
  'eeyore': '250HO17404', 'dijon': '7HO17380', 'country': '250HO17507',
  'azul-p': '14HO17533', 'bill': '7HO18281', 'noni': '7HO17338',
  'atoz': '7HO17069', 'hulahoop': '14HO18218', 'rooker': '14HO17564',
  'refute': '14HO18110', 'slapshot': '7HO18055', 'fierce': '7HO17680',
  'buttermaker': '7HO17199', 'wolff': '7HO18017', 'servant': '7HO17803',
  'sousaphone': '7HO17639', 'mclaurin': '7HO18091', 'eras': '14HO18087',
  'betzold': '7HO17593', 'hemlock': '250HO18258', 'aulius': '14HO17344',
  'metronome': '7HO17821', 'alewife': '7HO17476', 'shaft': '14HO18109',
  'chopper': '14HO18025', 'independant': '250HO17271', 'dressup': '7HO17527',
  'ollyver': '14HO17305', 'knack': '250HO17022', 'vanbenthem': '7HO18004',
  'lusby': '7HO17924', 'mirko': '7HO17436', 'patron': '7HO17434',
  'barkeep': '7HO17418', 'karl': '7HO16735', 'cabare': '250HO17347',
  'epenetus': '7HO17883', 'jumparound': '14HO17937', 'alcatraz': '7HO17372',
  'frosky': '7HO16990', 'twisted-p': '14HO17204', 'transfer': '250HO16691',
  'felix': '7HO16396', 'pierce rc': '14HO18196', 'bellis': '7HO17858',
  'fisher': '14HO17352', 'lapeno': '14HO17066', 'rosemary': '7HO17220',
  'hoedown': '14HO17260', 'baxley': '7HO17031', 'kingdom': '14HO17263',
  'sanborn': '7HO16966', 'kokio': '14HO17556', 'tynan': '14HO17592',
  'mosher': '7HO17391', 'quesadilla': '7HO17853', 'ronan-p': '7HO18096',
  'hostens-p': '250HO18259', 'superbass': '7HO17981', 'matthias-p': '7HO18097',
  'undertone': '14HO16236', 'paxton': '14HO17392', 'complete': '7HO17682',
  'howitzer': '7HO16527', 'jackson': '7HO17773', 'utrecht': '250HO17719',
  'pinnicles': '250HO17962', 'ephedra': '7HO17318', 'lyon': '7HO17706',
  'tubman': '250HO17513', 'soetebier-p': '7HO17365', 'hugo': '7HO18023',
  'cannonball': '250HO17196', 'honoco': '7HO17010', 'saxophone': '7HO17660',
  'shepard': '14HO18054', 'denyme': '7HO17411', 'longpoint': '250HO17013',
  'arapaima': '7HO17843', 'draft': '7HO16418', 'eight ball-p': '7HO17668',
  'marlon': '7HO17273', 'christoff-p': '7HO18101', 'hathway': '14HO17772',
  'thread': '7HO17673', 'peachtown-p': '250HO18261', 'scotty': '250HO17776',
  'bromelain': '7HO17232', 'ronnie': '7HO17920', 'tumeric': '7HO17321',
  'abner': '7HO17735', 'giant': '7HO16935', 'keanu': '7HO16763',
  'frontenac': '7HO17256', 'hoodia': '14HO17311', 't rex': '7HO16275',
  'hafestis': '7HO17399', 'solas': '14HO17026', 'howland-p': '250HO17009',
  'regency': '7HO18051', 'driscoll': '7HO18111', 'woz-s': '9HO17969',
  'dospoll-pp': '14HO18231', 'ramone': '14HO17922', 'gossage': '14HO17205',
  'caruthers-s': '9HO17970', 'wonderboy': '7HO17048', 'dun': '7HO16992',
  'neuralink': '7HO17728', 'overdrive-p': '7HO18035', 'frampton': '14HO16082',
  'van gogh': '14HO15926', 'hooligan-p': '7HO18230', 'blackrock': '7HO17648',
  'bolt action': '507HO15927', 'springside': '7HO17910', 'drydon': '14HO16836',
  'yorion-p': '7HO18136', 'pbj': '7HO16520', 'crusher': '7HO15465',
  'tonado-p': '14HO18061', 'handleit': '7HO17655', 'hopkins-p': '7HO18260',
  'noch': '7HO17685', 'otis': '14HO17657', 'flame': '14HO17403',
  'bonappetit': '250HO17653', 'marv': '14HO17800', 'rally': '7HO18192',
  'opie': '14HO17659', 'hague': '7HO17718', 'gibeon': '7HO17778',
  'fundancer': '7HO17927', 'frankthetank': '7HO17369', 'mickael-p': '7HO17952',
  'paxcel': '7HO17943', 'waterbuck': '7HO17645', 'ledger': '7HO17807',
  'novice-s': '9HO18145', 'butter pecan': '7HO17956', 'shimmy': '7HO17537',
  'goldy gopher-s': '9HO17983', 'organic': '14HO16393', 'earnest bass': '7HO16308',
  'leonidas': '7HO17132', 'munchy': '7HO17684', 'trooper': '14HO15179',
  'mosely-p': '7HO17501', 'yuma-pp': '7HO18135', 'heasty': '14HO17268',
  'huck': '7HO15396', 'hibiscus': '7HO17128', 'beegone-pp': '250HO18208',
  'gobretch': '7HO17605', 'hard rock': '7HO17284', 'owly': '7HO17917',
  'sparx': '7HO17784', 'retrospect': '7HO17464', 'riche': '7HO15597',
  'confay': '250HO17433', 'athens-red': '250HO18217', 'huggy': '7HO16743',
  'beethoven': '7HO15778', 'gabe': '7HO17267', 'habulous-p': '250HO17298',
  'snowhare-pp': '7HO17370', 'odayle': '7HO17375', 'chuck': '7HO17002',
  'zappa': '7HO15754', 'tune up': '7HO17547', 'oats': '250HO17793',
  'eze-s': '9HO17356', 'cruciate': '7HO17335', 'rocky rc-p': '7HO17938',
  'lionel': '7HO14454', 'laser-p': '7HO18190', 'watne': '7HO15830',
  'offer-p': '250HO18354', 'reverie-p': '7HO17255', 'ancho peppr-red': '14HO18063',
  'akshay-p': '250HO17075', 'figaro': '250HO16074', 'gordy': '14HO15301',
  'rupert': '7HO14985', 'flex-pp': '7HO18191', 'taos': '7HO15112',
  'loosem-pp': '250HO18206', 'lacking-p': '7HO18058', 'reaper': '7HO16570',
  'vegas': '7HO17771', 'pace': '250HO16497', 'sunsun': '250HO17295',
  'east': '14HO15831', 'huhon': '7HO15980', 'hader': '250HO17215',
  'holy-p': '7HO17158', 'sundance': '7HO16485', 'hazed': '7HO17424',
  'recover-red': '7HO18237', 'ice cube-s': '9HO16849', 'palisaide-pp': '250HO17979',
  'rufus': '7HO17285', 'heist': '14HO17164', 'eskil': '250HO17108',
  'oakha-pp': '7HO18266', 'easton': '14HO16391', 'ragnar-red': '14HO17550',
  'papaya-red': '7HO17695', 'parsly': '7HO15523', 'superb': '7HO15624',
  'hardin': '250HO16741', 'page-pp': '14HO17016', 'allgone-pp': '250HO16801',
  'drop n hot': '7HO17379', 'glowstick-s': '9HO17743', 'ready-red': '7HO18235',
  'dann': '250HO17817', 'reason rc': '744HO18232', 'harrow': '7HO17565',
  'jens-p-s': '9HO18011', 'blakely': '250HO16290', 'vicolleto-ss': '9HO18007',
  'harmony': '250HO15955', 'rebby-red': '7HO18220', 'tentastic': '250HO16979',
  'chew-p': '7HO16103', 'pamaze-red': '7HO17428', 'pabulous-red': '14HO17429',
  'smoke signal': '7HO16607', 'phoenix': '7HO16468', 'sertoli': '14HO14629',
  'riptide rc': '250HO17808', 'rickross rc': '250HO17810', 'hinge': '7HO17700',
  'zz top': '7HO15471', 'patootie': '250HO18064', 'rollsroyce-red': '14HO17809',
  'cruz-pp': '250HO17152', 'rio-red': '7HO17663', 'esquire': '7HO15937',
  'demand': '7HO18028', 'parfect': '7HO15085', 'powerpolled-pp-red': '250HO17146',
  'reasure-red': '14HO17548', 'etowah-red': '14HO17172', 'pamex-p': '7HO18219',
  'pop rock-red': '14HO18236', 'applecore-red': '14HO18405', 'renegade': '250HO14134',
  'banjo-p': '7HO14694', 'has it all': '7HO16295', 'crypto pp': '250HO18358',
  'hayes': '7HO17163', 'exclusive-red': '7HO17155', 'hardwick': '250HO17304',
  'havefun-red': '250HO16537', 'spin-red': '7HO17137', 'tabasco-p': '7HO17798',
  'hansh': '250HO18065', 'mellencamp': '7HO15204', 'hantastic-p': '250HO17297',
  'kickstart': '250HO17435', 'diesel': '7HO16954', 'amen-pp': '7HO16099',
  'applejax': '7HO17431', 'rampitup-p-red': '250HO18059', 'hanx-p': '7HO16387',
  'squibb-red': '250HO17050', 'leysurely pp': '250HO18204', 'hardy': '7HO16116',
  'hellion': '744HO17425', 'paldwyn': '250HO17567', 'reed-red': '7HO17661',
  'dax-red': '744HO17932', 'hijack': '250HO17165', 'rebel-red': '7HO15825',
  'parian-p': '250HO17560', 'rager-red': '7HO12344', 'haliant-p': '7HO17162',
  'partake': '250HO16121', 'repo-red': '14HO17662', 'pazzle': '250HO16115',
  'elevate': '250HO17549', 'karma-pp': '7HO17101', 'enrich-p': '744HO18394',
  'hulu': '250HO16498', 'hakan-p': '7HO16493', 'hancock': '250HO14579',
  'jinx': '744HO17423', 'kingme-p': '744HO17422', 'slugger': '744HO17931',
  'heritage-p': '744HO17072', 'hazard-pp': '744HO17073', 'image': '744HO17702',
  'lombardi': '250HO16490', 'donatelo': '744HO17933', 'pracise rc-p': '250HO17699',
  'acetylene-red': '744HO17076', 'hendrix': '744HO16956', 'siri': '744HO18214',
  'venmo': '744HO17769', 'cobra': '744HO17936', 'lacteur': '744HO17421',
  'miraculous-red': '744HO17701', 'alonzo-red': '744HO18070', 'asher-red': '744HO17546',
  'fanwell': '744HO18071', 'flash': '744HO17043',
};

function n(s: string | undefined): number | null {
  if (!s) return null;
  const v = parseFloat(s.trim());
  return isNaN(v) ? null : v;
}

export interface SelectSiresBull extends Omit<BullRow, 'id' | 'created_at' | 'farm_id'> {
  _matched: boolean;
}

export function parseSelectSiresCSV(csvText: string): SelectSiresBull[] {
  const lines = csvText.replace(/\r/g, '').trim().split('\n');
  if (lines.length < 2) return [];

  const results: SelectSiresBull[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 170) continue;

    const rawName = cols[0]?.trim();
    if (!rawName) continue;

    const code = NAAB_BY_NAME[rawName.toLowerCase()];
    if (!code) continue;

    results.push({
      code,
      short_name: rawName,
      full_name: cols[171]?.trim() || null,
      gtpi: n(cols[3]),
      net_merit: n(cols[4]),
      milk: n(cols[8]),
      fat: n(cols[10]),
      protein: n(cols[12]),
      productive_life: n(cols[14]),
      dpr: n(cols[15]),
      cow_livability: n(cols[16]),
      scs: n(cols[17]),
      ptat: n(cols[20]),
      udc: n(cols[21]),
      flc: n(cols[22]),
      sire_calving_ease: n(cols[23]),
      reliability: n(cols[34]),
      ccr: n(cols[126]),
      hcr: n(cols[128]),
      fertility_index: n(cols[130]),
      beta_casein: cols[166]?.trim() || null,
      kappa_casein: cols[167]?.trim() || null,
      gfi: n(cols[169]),
      hh1: 'Free',
      hh2: 'Free',
      hh3: 'Free',
      hh4: 'Free',
      hh5: 'Free',
      hh6: 'Free',
      price_per_dose: null,
      catalog: 'Select Sires',
      is_custom: true,
      source: 'select_sires',
      feed_saved: null,
      _matched: true,
    });
  }

  return results;
}
