export interface PerfilProgenieProps {
  touro: {
    codigo: string;
    nome: string;
    naab: string;
    pedigree: string; // "Pai x Avô x Bisavô"
    brinco?: string;
  };
  indices: {
    // produção
    tpi?: number;
    netMerit?: number;
    cheeseMerit?: number;
    milk?: number;
    fat?: number;
    fatPercent?: number;
    protein?: number;
    proteinPercent?: number;
    productiveLife?: number;
    feedEfficiency?: number;
    somaticCellScore?: number;
    // fertilidade/saúde
    dpr?: number;
    hcr?: number;
    ccr?: number;
    fertilityIndex?: number;
    healthIndex?: number;
    livability?: number;
    heiferLivability?: number;
    earlyFirstCalving?: number;
    mastitisResistance?: number;
    sireCalvingEase?: number;
    sireStillbirth?: number;
    // compostos
    ptat?: number;
    udc?: number;
    flc?: number;
    bde?: number;
    dfm?: number;
    // conformação (traits individuais)
    sta?: number; str?: number; rpa?: number; ruw?: number;
    fls?: number; rls?: number; fta?: number; fua?: number;
    ruh?: number; ucl?: number; udp?: number;
    tlg?: number; trw?: number; rlr?: number;
    // consanguinidade
    gInb?: number;
    futureInbreeding?: number;
  };
  pedigree: {
    sireNome?: string;
    sireNaab?: string;
    mgsNome?: string;
    mgsNaab?: string;
    damId?: string;
  };
}
