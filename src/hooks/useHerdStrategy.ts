import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { FemaleRow, MatingRow } from '../lib/supabase';
import type { Female, WeightMap } from '../lib/genetics';
import { calculateFemaleMeritScore } from '../lib/matching';
import type {
  HerdStrategy,
  FemaleAssignment,
  ReplacementPlan,
  BeefOnDairyEconomics,
  AssignmentGroup,
  SemenType,
} from '../types/herd-strategy.types';
import {
  DEFAULT_HERD_STRATEGY,
} from '../types/herd-strategy.types';

const LS_STRATEGY = 'genefy_demo_herd_strategy';

export function useHerdStrategy(
  farmId: string | null | undefined,
  females: Female[],
  femaleRows: FemaleRow[],
  weights: WeightMap
) {
  const isDemo = farmId === 'demo-farm' || !farmId;

  const [strategy, setStrategyState] = useState<HerdStrategy>(() => {
    if (isDemo) {
      try {
        const saved = localStorage.getItem(LS_STRATEGY);
        return saved ? JSON.parse(saved) : { ...DEFAULT_HERD_STRATEGY, farm_id: 'demo-farm' };
      } catch {
        return { ...DEFAULT_HERD_STRATEGY, farm_id: 'demo-farm' };
      }
    }
    return { ...DEFAULT_HERD_STRATEGY, farm_id: farmId || '' };
  });

  const [failedMatingsCount, setFailedMatingsCount] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados de estratégia do banco de dados (se não for demo)
  const loadStrategy = useCallback(async () => {
    if (isDemo || !farmId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('herd_strategy')
        .select('*')
        .eq('farm_id', farmId)
        .maybeSingle();

      if (error) {
        console.error('Error loading strategy:', error);
      } else if (data) {
        setStrategyState({
          ...data,
          semen_costs: data.semen_costs || DEFAULT_HERD_STRATEGY.semen_costs,
        });
        setHasUnsavedChanges(false);
      } else {
        // Se não existir, criar com os valores default
        const newStrategy = { ...DEFAULT_HERD_STRATEGY, farm_id: farmId };
        const { error: insertError } = await supabase
          .from('herd_strategy')
          .insert(newStrategy);
        if (insertError) {
          console.error('Error creating default strategy:', insertError);
        } else {
          setStrategyState(newStrategy as HerdStrategy);
          setHasUnsavedChanges(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, farmId]);

  // Carregar contagem de matings falhos para determinar insemination_order
  const loadFailedMatings = useCallback(async () => {
    if (isDemo || !farmId) {
      // Para o modo demo, podemos simular que não há falhas ou ler de algum local
      setFailedMatingsCount({});
      return;
    }
    try {
      const { data, error } = await supabase
        .from('matings')
        .select('female_id, status')
        .eq('farm_id', farmId)
        .eq('status', 'failed');

      if (error) {
        console.error('Error loading failed matings:', error);
      } else if (data) {
        const counts: Record<string, number> = {};
        data.forEach((m: Partial<MatingRow>) => {
          if (m.female_id) {
            counts[m.female_id] = (counts[m.female_id] || 0) + 1;
          }
        });
        setFailedMatingsCount(counts);
      }
    } catch (err) {
      console.error(err);
    }
  }, [isDemo, farmId]);

  useEffect(() => {
    loadStrategy();
    loadFailedMatings();
  }, [loadStrategy, loadFailedMatings]);

  // Atualizar estratégia local (apenas estado do React, marcando como não salvo)
  const updateStrategy = useCallback(
    (newStrategy: Partial<HerdStrategy>) => {
      setStrategyState((prev) => {
        const updated = { ...prev, ...newStrategy };
        setHasUnsavedChanges(true);
        return updated;
      });
      return Promise.resolve(null);
    },
    []
  );

  // Salvar estratégia no banco de dados ou localStorage
  const saveStrategy = useCallback(async () => {
    setIsSaving(true);
    try {
      if (isDemo) {
        localStorage.setItem(LS_STRATEGY, JSON.stringify(strategy));
        setHasUnsavedChanges(false);
        return null;
      } else if (farmId) {
        const { error } = await supabase
          .from('herd_strategy')
          .upsert({ ...strategy, farm_id: farmId, updated_at: new Date().toISOString() });
        if (error) {
          console.error('Error saving strategy:', error);
          return error;
        }
        setHasUnsavedChanges(false);
        return null;
      }
      return null;
    } catch (err) {
      console.error(err);
      return err;
    } finally {
      setIsSaving(false);
    }
  }, [isDemo, farmId, strategy]);

  // ─── CÁLCULOS CENTRALIZADOS EM MEMÓRIA ──────────────────────────────────────
  const { assignments, replacementPlan, economics, groupCounts } = useMemo(() => {
    if (!females.length) {
      return {
        assignments: [],
        replacementPlan: {
          replacements_needed_per_year: 0,
          heifers_to_generate: 0,
          additional_cows_for_target: 0,
          total_heifers_needed: 0,
          heifers_available_from_herd: 0,
          surplus_for_sale: 0,
          deficit: 0,
          months_to_reach_target: 0,
        },
        economics: {
          scenario_conventional: {
            label: 'Convencional',
            beef_calves_revenue: 0,
            heifers_sold_revenue: 0,
            dairy_calves_revenue: 0,
            semen_cost: 0,
            raising_cost: 0,
            net_revenue: 0,
          },
          scenario_beef_on_dairy: {
            label: 'Beef on Dairy',
            beef_calves_revenue: 0,
            heifers_sold_revenue: 0,
            dairy_calves_revenue: 0,
            semen_cost: 0,
            raising_cost: 0,
            net_revenue: 0,
          },
          annual_gain: 0,
          gain_per_cow: 0,
          gain_per_liter: 0,
        },
        groupCounts: {
          elite_replacement: 0,
          sale_heifer: 0,
          conventional: 0,
          beef_cross: 0,
        },
      };
    }

    // 1. Calcular composite_merit_score para todas as fêmeas e ordenar (ranking)
    const scoredFemales = females.map((female) => {
      const dbFemaleRow = femaleRows.find((fr) => fr.animal_id === female.id);
      const score = calculateFemaleMeritScore(female, weights);
      const failedCount = dbFemaleRow ? failedMatingsCount[dbFemaleRow.id] || 0 : 0;

      return {
        female,
        dbId: dbFemaleRow?.id || female.id,
        score,
        inseminationOrder: failedCount + 1,
      };
    });

    // Ordenar decrescente por score
    scoredFemales.sort((a, b) => b.score - a.score);

    const totalFemales = scoredFemales.length;

    // 2. Classificação em grupos usando elite_percentile e mid_percentile
    const tempAssignments: FemaleAssignment[] = scoredFemales.map((sf, index) => {
      const rank = index + 1;
      const percentile = totalFemales > 1 ? ((totalFemales - rank) / (totalFemales - 1)) * 100 : 100;

      let group: AssignmentGroup = 'conventional';
      let recSemen: SemenType = 'conventional';

      const isElite = percentile >= 100 - strategy.elite_percentile;
      const isMid = !isElite && percentile >= 100 - strategy.mid_percentile;
      const isBottom = !isElite && !isMid;

      const isPrimiparous = sf.female.lact === 0 || sf.female.is_primiparous;

      if (isElite) {
        group = 'elite_replacement';
        if (sf.inseminationOrder <= strategy.max_sexed_inseminations) {
          recSemen = isPrimiparous ? 'sexed_premium' : 'sexed_budget';
        } else {
          recSemen = 'conventional';
        }
      } else if (isMid) {
        if (isPrimiparous) {
          group = 'sale_heifer';
          recSemen = sf.inseminationOrder <= strategy.max_sexed_inseminations ? 'sexed_budget' : 'conventional';
        } else {
          group = 'conventional';
          recSemen = 'conventional';
        }
      } else if (isBottom) {
        group = 'beef_cross';
        recSemen = 'beef';
      }

      return {
        female_id: sf.female.id,
        db_id: sf.dbId,
        assignment_group: group,
        merit_rank: rank,
        merit_percentile: parseFloat(percentile.toFixed(1)),
        composite_merit_score: sf.score,
        recommended_semen_type: recSemen,
        insemination_order: sf.inseminationOrder,
        economic_value_brl: 0, // Será preenchido na etapa econômica individual
      };
    });

    // 3. Contagem de grupos
    const counts = {
      elite_replacement: 0,
      sale_heifer: 0,
      conventional: 0,
      beef_cross: 0,
    };
    tempAssignments.forEach((a) => {
      counts[a.assignment_group]++;
    });

    // 4. Planejamento de Reposição
    const replacements_needed_per_year = strategy.total_cows * (strategy.replacement_rate_pct / 100);

    const avg_milk_per_cow = strategy.total_cows > 0 ? strategy.current_daily_milk_liters / strategy.total_cows : 0;
    const target_cows = avg_milk_per_cow > 0 ? strategy.target_daily_milk_liters / avg_milk_per_cow : strategy.total_cows;
    const additional_cows_for_target = Math.max(0, target_cows - strategy.total_cows);

    // O produtor precisa de novilhas para reposição estável + expansão.
    // Assumimos que o total de novilhas necessárias por ano inclui a reposição mais a expansão desejada.
    // No entanto, a expansão é uma meta pontual. Se considerarmos uma expansão anualizada ou direta,
    // vamos definir o total de novilhas necessárias como a reposição estável + a expansão total necessária (para indicar a meta).
    const total_heifers_needed = replacements_needed_per_year + additional_cows_for_target;

    // Calcular taxa de sobrevivência das bezerras leiteiras até se tornarem novilhas paridas (reposição)
    const heifer_survival_rate = (1 - strategy.calf_mortality_pct / 100) * (1 - strategy.heifer_mortality_pct / 100);

    // Calcular calvings por ano do rebanho: total_cows * (365 / calving_interval_days)
    const calvings_per_year = strategy.total_cows * (365 / strategy.calving_interval_days);

    // Heifers disponíveis geradas pelo próprio rebanho na estratégia Beef on Dairy
    let total_heifers_born_bod = 0;
    tempAssignments.forEach((a) => {
      const calvingRate = 365 / strategy.calving_interval_days;
      const heiferProb = a.recommended_semen_type === 'sexed_premium' || a.recommended_semen_type === 'sexed_budget' ? 0.90 :
                         a.recommended_semen_type === 'conventional' ? 0.50 : 0.00;
      total_heifers_born_bod += calvingRate * heiferProb;
    });

    const total_assigned = tempAssignments.length || 1;
    const scaling_factor = strategy.total_cows / total_assigned;

    const heifers_available_from_herd = (total_heifers_born_bod * scaling_factor) * heifer_survival_rate;

    const surplus_for_sale = Math.max(0, heifers_available_from_herd - replacements_needed_per_year);
    const deficit = Math.max(0, total_heifers_needed - heifers_available_from_herd);

    // Quantidade de bezerras fêmeas que precisam ser geradas por ano
    const heifers_to_generate = total_heifers_needed / heifer_survival_rate;

    // Tempo estimado para atingir a meta
    const growth_heifers_per_year = heifers_available_from_herd - replacements_needed_per_year;
    const months_to_reach_target = growth_heifers_per_year > 0
      ? (additional_cows_for_target / growth_heifers_per_year) * 12
      : additional_cows_for_target > 0 ? Infinity : 0;

    const plan: ReplacementPlan = {
      replacements_needed_per_year: Math.round(replacements_needed_per_year),
      heifers_to_generate: Math.round(heifers_to_generate),
      additional_cows_for_target: Math.round(additional_cows_for_target),
      total_heifers_needed: Math.round(total_heifers_needed),
      heifers_available_from_herd: Math.round(heifers_available_from_herd),
      surplus_for_sale: Math.round(surplus_for_sale),
      deficit: Math.round(deficit),
      months_to_reach_target: isFinite(months_to_reach_target) ? parseFloat(months_to_reach_target.toFixed(1)) : -1,
    };

    // 5. Retorno Econômico
    const calving_factor = 365 / strategy.calving_interval_days;

    // --- CENÁRIO A: CONVENCIONAL ---
    // Toda vaca inseminada com convencional (concepção padrão)
    const calvings_conv = strategy.total_cows * calving_factor;
    const dairy_heifers_born_conv = calvings_conv * 0.5;
    const dairy_bulls_born_conv = calvings_conv * 0.5;
    const surviving_heifers_conv = dairy_heifers_born_conv * heifer_survival_rate;

    // Custos semen convencional: 1 dose por inseminação. Inseminações = calvings / (conception_rate/100)
    const inseminations_conv = calvings_conv / (strategy.conception_rate_pct / 100);
    const semen_cost_conv = inseminations_conv * strategy.semen_costs.conventional;

    // Custos de recria convencional: criamos o que precisamos ou o que nasce?
    // Se nasce mais do que precisamos, criamos até o limite de reposição estável e vendemos o resto como bezerra,
    // ou criamos todas as sobreviventes e vendemos como novilha parida. O padrão é criar tudo e vender como novilha de reposição.
    const raising_cost_conv = surviving_heifers_conv * strategy.heifer_raising_cost;

    const dairy_calves_rev_conv = dairy_bulls_born_conv * strategy.dairy_calf_sale_price;
    const heifers_sold_rev_conv = surviving_heifers_conv * strategy.heifer_sale_price;

    const net_revenue_conv = (dairy_calves_rev_conv + heifers_sold_rev_conv) - semen_cost_conv - raising_cost_conv;

    // --- CENÁRIO B: BEEF ON DAIRY ---
    let raw_semen_cost_bod = 0;
    let raw_dairy_heifers_born_bod = 0;
    let raw_dairy_bulls_born_bod = 0;
    let raw_beef_calves_born_bod = 0;

    tempAssignments.forEach((a) => {
      const calvings_cow = calving_factor;
      const st = a.recommended_semen_type;
      const semenCost = strategy.semen_costs[st] || 0;

      // Ajustar taxa de concepção para sexado (90% do padrão)
      const isSexed = st === 'sexed_premium' || st === 'sexed_budget';
      const cr = isSexed ? strategy.conception_rate_pct * 0.9 : strategy.conception_rate_pct;

      const ins_cow = calvings_cow / (cr / 100);
      raw_semen_cost_bod += ins_cow * semenCost;

      if (isSexed) {
        raw_dairy_heifers_born_bod += calvings_cow * 0.90;
        raw_dairy_bulls_born_bod += calvings_cow * 0.10;
      } else if (st === 'conventional') {
        raw_dairy_heifers_born_bod += calvings_cow * 0.50;
        raw_dairy_bulls_born_bod += calvings_cow * 0.50;
      } else if (st === 'beef') {
        raw_beef_calves_born_bod += calvings_cow * 1.00;
      }
    });

    const total_semen_cost_bod = raw_semen_cost_bod * scaling_factor;
    const total_dairy_heifers_born_bod = raw_dairy_heifers_born_bod * scaling_factor;
    const total_dairy_bulls_born_bod = raw_dairy_bulls_born_bod * scaling_factor;
    const total_beef_calves_born_bod = raw_beef_calves_born_bod * scaling_factor;

    const surviving_heifers_bod = total_dairy_heifers_born_bod * heifer_survival_rate;
    const raising_cost_bod = surviving_heifers_bod * strategy.heifer_raising_cost;

    const dairy_calves_rev_bod = total_dairy_bulls_born_bod * strategy.dairy_calf_sale_price;
    const beef_calves_rev_bod = total_beef_calves_born_bod * strategy.beef_calf_sale_price;
    const heifers_sold_rev_bod = surviving_heifers_bod * strategy.heifer_sale_price;

    const net_revenue_bod = (dairy_calves_rev_bod + beef_calves_rev_bod + heifers_sold_rev_bod) - total_semen_cost_bod - raising_cost_bod;

    // Calcular valores individuais para a fêmea
    const assignmentsWithEconomic: FemaleAssignment[] = tempAssignments.map((a) => {
      const st = a.recommended_semen_type;
      const semenCost = strategy.semen_costs[st] || 0;
      const isSexed = st === 'sexed_premium' || st === 'sexed_budget';
      const cr = isSexed ? strategy.conception_rate_pct * 0.9 : strategy.conception_rate_pct;

      // Lucro individual convencional
      const calvs = calving_factor;
      const ins_conv = calvs / (strategy.conception_rate_pct / 100);
      const sem_cost_conv = ins_conv * strategy.semen_costs.conventional;
      const rev_conv = calvs * (
        0.5 * heifer_survival_rate * (strategy.heifer_sale_price - strategy.heifer_raising_cost) +
        0.5 * strategy.dairy_calf_sale_price
      );
      const profit_conv = rev_conv - sem_cost_conv;

      // Lucro individual planejado
      const ins_bod = calvs / (cr / 100);
      const sem_cost_bod = ins_bod * semenCost;

      let rev_bod = 0;
      if (isSexed) {
        rev_bod = calvs * (
          0.9 * heifer_survival_rate * (strategy.heifer_sale_price - strategy.heifer_raising_cost) +
          0.1 * strategy.dairy_calf_sale_price
        );
      } else if (st === 'conventional') {
        rev_bod = calvs * (
          0.5 * heifer_survival_rate * (strategy.heifer_sale_price - strategy.heifer_raising_cost) +
          0.5 * strategy.dairy_calf_sale_price
        );
      } else if (st === 'beef') {
        rev_bod = calvs * strategy.beef_calf_sale_price;
      }
      const profit_bod = rev_bod - sem_cost_bod;

      return {
        ...a,
        economic_value_brl: parseFloat((profit_bod - profit_conv).toFixed(1)),
      };
    });

    const annual_gain = net_revenue_bod - net_revenue_conv;
    const gain_per_cow = strategy.total_cows > 0 ? annual_gain / strategy.total_cows : 0;
    const annual_milk_liters = strategy.current_daily_milk_liters * 365;
    const gain_per_liter = annual_milk_liters > 0 ? annual_gain / annual_milk_liters : 0;

    const economicsResult: BeefOnDairyEconomics = {
      scenario_conventional: {
        label: 'Convencional',
        beef_calves_revenue: 0,
        heifers_sold_revenue: Math.round(heifers_sold_rev_conv),
        dairy_calves_revenue: Math.round(dairy_calves_rev_conv),
        semen_cost: Math.round(semen_cost_conv),
        raising_cost: Math.round(raising_cost_conv),
        net_revenue: Math.round(net_revenue_conv),
      },
      scenario_beef_on_dairy: {
        label: 'Beef on Dairy',
        beef_calves_revenue: Math.round(beef_calves_rev_bod),
        heifers_sold_revenue: Math.round(heifers_sold_rev_bod),
        dairy_calves_revenue: Math.round(dairy_calves_rev_bod),
        semen_cost: Math.round(total_semen_cost_bod),
        raising_cost: Math.round(raising_cost_bod),
        net_revenue: Math.round(net_revenue_bod),
      },
      annual_gain: Math.round(annual_gain),
      gain_per_cow: parseFloat(gain_per_cow.toFixed(1)),
      gain_per_liter: parseFloat(gain_per_liter.toFixed(4)),
    };

    return {
      assignments: assignmentsWithEconomic,
      replacementPlan: plan,
      economics: economicsResult,
      groupCounts: counts,
    };
  }, [females, femaleRows, weights, strategy, failedMatingsCount]);

  return {
    strategy,
    assignments,
    replacementPlan,
    economics,
    groupCounts,
    updateStrategy,
    saveStrategy,
    hasUnsavedChanges,
    isSaving,
    isLoading,
    reload: loadStrategy,
  };
}
