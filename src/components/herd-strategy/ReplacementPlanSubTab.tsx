import type { HerdStrategy, ReplacementPlan } from '../../types/herd-strategy.types';
import { NumericInput } from './NumericInput';

interface Props {
  strategy: HerdStrategy;
  plan: ReplacementPlan;
  onUpdate: (newStrategy: Partial<HerdStrategy>) => Promise<unknown>;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  onSave?: () => Promise<void>;
}

export function ReplacementPlanSubTab({ strategy, plan, onUpdate, hasUnsavedChanges, isSaving, onSave }: Props) {
  const handleInputChange = (field: keyof HerdStrategy, value: number) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* Coluna 1: Parâmetros (Formulário) */}
      <div className="lg:col-span-7 space-y-6">
        <h3 className="text-md font-bold text-blue-dark border-b pb-2">Parâmetros do Planejamento</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Total de Vacas no Rebanho
            </label>
            <NumericInput
              min={1}
              isInteger={true}
              value={strategy.total_cows}
              onChange={(val) => handleInputChange('total_cows', val)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
            />
            <span className="text-[10px] text-gray-400">Total de vacas em lactação e secas na fazenda.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Taxa de Reposição Anual (%)
            </label>
            <NumericInput
              min={0}
              max={100}
              value={strategy.replacement_rate_pct}
              onChange={(val) => handleInputChange('replacement_rate_pct', val)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
            />
            <span className="text-[10px] text-gray-400">Porcentagem anual de descarte involuntário e voluntário de vacas.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Produção de Leite Atual (Litros/dia)
            </label>
            <NumericInput
              min={0}
              value={strategy.current_daily_milk_liters}
              onChange={(val) => handleInputChange('current_daily_milk_liters', val)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
            />
            <span className="text-[10px] text-gray-400">Volume total diário produzido pelo rebanho atual.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Produção de Leite Alvo (Litros/dia)
            </label>
            <NumericInput
              min={0}
              value={strategy.target_daily_milk_liters}
              onChange={(val) => handleInputChange('target_daily_milk_liters', val)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
            />
            <span className="text-[10px] text-gray-400">Meta de produção total diária desejada para a fazenda.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mortalidade de Bezerras 0-12m (%)
            </label>
            <NumericInput
              min={0}
              max={100}
              value={strategy.calf_mortality_pct}
              onChange={(val) => handleInputChange('calf_mortality_pct', val)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
            />
            <span className="text-[10px] text-gray-400">Taxa de perda esperada de bezerras desde o nascimento até 1 ano.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mortalidade de Novilhas 12-24m (%)
            </label>
            <NumericInput
              min={0}
              max={100}
              value={strategy.heifer_mortality_pct}
              onChange={(val) => handleInputChange('heifer_mortality_pct', val)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
            />
            <span className="text-[10px] text-gray-400">Taxa de perda de novilhas de recria até a idade do primeiro parto.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mortalidade de Vacas (%)
            </label>
            <NumericInput
              min={0}
              max={100}
              value={strategy.cow_mortality_pct}
              onChange={(val) => handleInputChange('cow_mortality_pct', val)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
            />
            <span className="text-[10px] text-gray-400">Perdas/descartes por morte no rebanho de vacas adultas.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Concepção Geral (%)
            </label>
            <NumericInput
              min={1}
              max={100}
              value={strategy.conception_rate_pct}
              onChange={(val) => handleInputChange('conception_rate_pct', val)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
            />
            <span className="text-[10px] text-gray-400">Taxa de sucesso médio de prenhez por inseminação com sêmen convencional.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Intervalo entre Partos (Dias)
            </label>
            <NumericInput
              min={180}
              isInteger={true}
              value={strategy.calving_interval_days}
              onChange={(val) => handleInputChange('calving_interval_days', val)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
            />
            <span className="text-[10px] text-gray-400">Média de dias decorridos entre calvings consecutivos das vacas.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Idade 1º Parto (Meses)
            </label>
            <NumericInput
              min={12}
              isInteger={true}
              value={strategy.age_first_calving_months}
              onChange={(val) => handleInputChange('age_first_calving_months', val)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
            />
            <span className="text-[10px] text-gray-400">Idade média ideal em que as novilhas entram em lactação (primeiro parto).</span>
          </div>
        </div>

        {/* Botão de Salvar Alterações */}
        {onSave && (
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {hasUnsavedChanges ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-[11px] font-medium text-gray-500">Você tem alterações não salvas</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-[11px] font-medium text-gray-500">Alterações salvas com sucesso</span>
                </>
              )}
            </div>
            <button
              onClick={onSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-blue-dark text-white border-blue-dark hover:bg-blue-mid shadow-md active:scale-95'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Alterações</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Coluna 2: Resultados (KPI Cards) */}
      <div className="lg:col-span-5 space-y-6">
        <h3 className="text-md font-bold text-blue-dark border-b pb-2">Diagnóstico de Reposição</h3>

        <div className="grid gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Reposição Estável Necessária
            </div>
            <div className="text-2xl font-bold text-blue-dark mt-1">
              {plan.replacements_needed_per_year} <span className="text-xs font-normal text-gray-500">novilhas/ano</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Número de fêmeas parindo necessárias para manter o tamanho atual do rebanho estável.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Novilhas Produzidas no Planejamento
            </div>
            <div className="text-2xl font-bold text-blue-dark mt-1">
              {plan.heifers_available_from_herd} <span className="text-xs font-normal text-gray-500">novilhas/ano</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Número esperado de novilhas de reposição geradas com a estratégia atual de sêmen sexado + convencional.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Vacas Adicionais para Meta
            </div>
            <div className="text-2xl font-bold text-blue-dark mt-1">
              {plan.additional_cows_for_target} <span className="text-xs font-normal text-gray-500">animais</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Acréscimo necessário no tamanho do rebanho para atingir a meta de leite de {strategy.target_daily_milk_liters} L/dia.
            </p>
          </div>

          {/* Card de Balanço (Saldo) */}
          <div className={`p-4 rounded-xl border ${
            plan.deficit > 0
              ? 'bg-red-50 border-red-200 text-red-800'
              : plan.surplus_for_sale > 0
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="text-[10px] font-semibold uppercase tracking-wider">
              {plan.deficit > 0 ? 'Déficit de Novilhas' : plan.surplus_for_sale > 0 ? 'Superávit de Novilhas' : 'Balanço Equilibrado'}
            </div>
            <div className="text-2xl font-bold mt-1">
              {plan.deficit > 0 ? `-${plan.deficit}` : `+${plan.surplus_for_sale}`}
              <span className="text-xs font-normal opacity-80 ml-1">novilhas/ano</span>
            </div>
            <p className="text-[10px] opacity-75 mt-1">
              {plan.deficit > 0
                ? 'Você precisará comprar animais ou aumentar os limiares de sêmen sexado para gerar mais novilhas.'
                : plan.surplus_for_sale > 0
                  ? 'Você possui excedente de novilhas de alta genética que podem ser vendidas para engordar a receita.'
                  : 'Sua estratégia gera exatamente as novilhas necessárias para a reposição estável.'}
            </p>
          </div>

          {/* Tempo para Atingir a Meta */}
          {plan.additional_cows_for_target > 0 && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Tempo para Atingir Meta de Leite
              </div>
              <div className="text-2xl font-bold text-blue-dark mt-1">
                {plan.months_to_reach_target === -1 || plan.months_to_reach_target === Infinity
                  ? 'Indeterminado'
                  : `${plan.months_to_reach_target} meses`}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {plan.months_to_reach_target === -1 || plan.months_to_reach_target === Infinity
                  ? 'O crescimento é nulo ou negativo. Aumente o sêmen sexado para acumular novilhas e crescer o rebanho.'
                  : 'Tempo necessário de retenção do superávit de novilhas próprio até atingir o número necessário de vacas.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
