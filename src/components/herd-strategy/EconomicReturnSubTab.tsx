import type { HerdStrategy, BeefOnDairyEconomics } from '../../types/herd-strategy.types';
import { NumericInput } from './NumericInput';

interface Props {
  strategy: HerdStrategy;
  economics: BeefOnDairyEconomics;
  groupCounts: Record<string, number>;
  onUpdate: (newStrategy: Partial<HerdStrategy>) => Promise<unknown>;
}

export function EconomicReturnSubTab({ strategy, economics, onUpdate }: Props) {
  const handleInputChange = (field: keyof HerdStrategy, value: number) => {
    onUpdate({ [field]: value });
  };

  const handleSemenCostChange = (field: string, value: number) => {
    const updatedCosts = { ...strategy.semen_costs, [field]: value };
    onUpdate({ semen_costs: updatedCosts });
  };

  // Formatar valores financeiros
  const formatCurrency = (val: number) => {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatCurrencyDecimal = (val: number, decimals = 2) => {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const formatAxisLabel = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${Math.round(val / 1000)}k`;
    return `R$ ${val}`;
  };

  // Dados para o Gráfico SVG
  const convNet = economics.scenario_conventional.net_revenue;
  const bodNet = economics.scenario_beef_on_dairy.net_revenue;
  const maxNet = Math.max(convNet, bodNet, 1);

  // Normalizar alturas das barras (máximo 115px para dar margem ao balão superior)
  const convHeight = Math.max(20, (convNet / maxNet) * 115);
  const bodHeight = Math.max(20, (bodNet / maxNet) * 115);

  return (
    <div className="space-y-8">
      {/* 3 Cards de KPI Econômicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-dark text-white p-5 rounded-xl border border-blue-dark shadow-sm">
          <div className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
            Ganho Anual Adicional
          </div>
          <div className="text-3xl font-bold mt-2">
            +{formatCurrency(economics.annual_gain)}
          </div>
          <p className="text-[10px] text-white/60 mt-1">
            Receita líquida incremental projetada para o rebanho com o Módulo Beef on Dairy.
          </p>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200/60">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Ganho Adicional por Vaca/Ano
          </div>
          <div className="text-2xl font-bold text-blue-dark mt-2">
            {formatCurrencyDecimal(economics.gain_per_cow)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Melhoria média no lucro líquido anual por vaca ativa no rebanho.
          </p>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200/60">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Ganho Adicional por Litro Produzido
          </div>
          <div className="text-2xl font-bold text-blue-dark mt-2">
            {formatCurrencyDecimal(economics.gain_per_liter, 4)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Acréscimo de margem líquida em cada litro de leite comercializado pela fazenda.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Coluna 1: Parâmetros Financeiros */}
        <div className="lg:col-span-6 space-y-6">
          <h3 className="text-sm font-bold text-blue-dark uppercase tracking-wider border-b pb-2">Preços e Custos</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Preço do Leite (R$/Litro)
              </label>
              <NumericInput
                min={0}
                value={strategy.milk_price_per_liter}
                onChange={(val) => handleInputChange('milk_price_per_liter', val)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Custo de Recria da Novilha (R$)
              </label>
              <NumericInput
                min={0}
                value={strategy.heifer_raising_cost}
                onChange={(val) => handleInputChange('heifer_raising_cost', val)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Preço de Venda de Novilha Parida (R$)
              </label>
              <NumericInput
                min={0}
                value={strategy.heifer_sale_price}
                onChange={(val) => handleInputChange('heifer_sale_price', val)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Venda do Bezerro Leite Macho (R$)
              </label>
              <NumericInput
                min={0}
                value={strategy.dairy_calf_sale_price}
                onChange={(val) => handleInputChange('dairy_calf_sale_price', val)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Venda do Bezerro Cruzado de Corte (R$)
              </label>
              <NumericInput
                min={0}
                value={strategy.beef_calf_sale_price}
                onChange={(val) => handleInputChange('beef_calf_sale_price', val)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
              />
              <span className="text-[10px] text-gray-400 block mt-0.5">
                Valor médio de venda de bezerro meio-sangue corte (F1 Angus/Holandês).
              </span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-blue-dark uppercase tracking-wider border-b pb-2 pt-2">Custos das Doses de Sêmen (R$)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sexado Premium
              </label>
              <NumericInput
                min={0}
                value={strategy.semen_costs.sexed_premium}
                onChange={(val) => handleSemenCostChange('sexed_premium', val)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sexado Budget
              </label>
              <NumericInput
                min={0}
                value={strategy.semen_costs.sexed_budget}
                onChange={(val) => handleSemenCostChange('sexed_budget', val)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Convencional Leite
              </label>
              <NumericInput
                min={0}
                value={strategy.semen_costs.conventional}
                onChange={(val) => handleSemenCostChange('conventional', val)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Corte (Beef)
              </label>
              <NumericInput
                min={0}
                value={strategy.semen_costs.beef}
                onChange={(val) => handleSemenCostChange('beef', val)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-mid"
              />
            </div>
          </div>
        </div>

        {/* Coluna 2: Gráfico e Tabela de Comparação */}
        <div className="lg:col-span-6 space-y-6">
          <h3 className="text-sm font-bold text-blue-dark uppercase tracking-wider border-b pb-2">Comparativo de Rentabilidade</h3>

          {/* Gráfico de Barras SVG Puro */}
          <div className="flex flex-col items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-200/50 shadow-inner">
            <span className="text-[11px] font-extrabold text-gray-500 mb-4 tracking-wide">MARGEM LÍQUIDA ANUAL DO SISTEMA (R$)</span>
            <svg width="380" height="200" viewBox="0 0 380 200" className="w-full max-w-[380px]">
              <defs>
                {/* Gradiente Convencional */}
                <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94A3B8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                {/* Gradiente Beef on Dairy */}
                <linearGradient id="bodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="50%" stopColor="#C9A84C" />
                  <stop offset="100%" stopColor="#854D0E" />
                </linearGradient>
                {/* Sombra suave para barras e tooltips */}
                <filter id="shadow" x="-8%" y="-8%" width="116%" height="116%">
                  <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.1" />
                </filter>
              </defs>

              {/* Grid Lines */}
              <g stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3">
                <line x1="65" y1="45" x2="345" y2="45" />
                <line x1="65" y1="102.5" x2="345" y2="102.5" />
              </g>
              {/* Linha base */}
              <line x1="65" y1="160" x2="345" y2="160" stroke="#9CA3AF" strokeWidth="1.5" />

              {/* Rótulos do Eixo Y */}
              <g fontSize="9" fontWeight="bold" fill="#6B7280" textAnchor="end">
                <text x="55" y="48">{formatAxisLabel(maxNet)}</text>
                <text x="55" y="105.5">{formatAxisLabel(maxNet / 2)}</text>
                <text x="55" y="163">R$ 0</text>
              </g>

              {/* Barra 1: Convencional */}
              <rect
                x="100"
                y={160 - convHeight}
                width="50"
                height={convHeight}
                fill="url(#convGradient)"
                filter="url(#shadow)"
                rx="6"
                className="transition-all duration-300 hover:opacity-90 cursor-pointer"
              />

              {/* Barra 2: Beef on Dairy */}
              <rect
                x="215"
                y={160 - bodHeight}
                width="50"
                height={bodHeight}
                fill="url(#bodGradient)"
                filter="url(#shadow)"
                rx="6"
                className="transition-all duration-300 hover:brightness-105 cursor-pointer"
              />

              {/* Tooltip Convencional */}
              <g transform={`translate(125, ${145 - convHeight})`} filter="url(#shadow)">
                <rect x="-35" y="-12" width="70" height="17" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
                <text textAnchor="middle" fontSize="8" fontWeight="extrabold" fill="#475569" y="0">
                  {formatCurrency(convNet)}
                </text>
              </g>

              {/* Tooltip Beef on Dairy */}
              <g transform={`translate(240, ${145 - bodHeight})`} filter="url(#shadow)">
                <rect x="-40" y="-12" width="80" height="17" rx="4" fill="#FEF08A" stroke="#EAB308" strokeWidth="1" />
                <text textAnchor="middle" fontSize="8" fontWeight="extrabold" fill="#854D0E" y="0">
                  {formatCurrency(bodNet)}
                </text>
              </g>

              {/* Eixos */}
              <g fontSize="10" fontWeight="bold" fill="#4B5563" textAnchor="middle">
                <text x="125" y="178">Convencional</text>
                <text x="240" y="178">Beef on Dairy</text>
              </g>
            </svg>

            <div className="flex gap-4 text-[10px] text-gray-500 mt-4 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 bg-gradient-to-b from-gray-400 to-gray-600 rounded shadow-sm" />
                <span>Cenário Convencional</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 bg-gradient-to-b from-yellow-500 to-amber-700 rounded shadow-sm" />
                <span>Cenário Beef on Dairy</span>
              </div>
            </div>
          </div>

          {/* Tabela Comparativa Detalhada */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 font-bold text-gray-500 uppercase tracking-wider text-[10px] border-b">
                <tr>
                  <th className="px-4 py-2.5 text-left">Indicador Econômico</th>
                  <th className="px-4 py-2.5 text-right">Convencional</th>
                  <th className="px-4 py-2.5 text-right text-gold">Beef on Dairy</th>
                  <th className="px-4 py-2.5 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr>
                  <td className="px-4 py-2.5 font-medium text-gray-700">Custo de Sêmen Total</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">-{formatCurrency(economics.scenario_conventional.semen_cost)}</td>
                  <td className="px-4 py-2.5 text-right text-gold">-{formatCurrency(economics.scenario_beef_on_dairy.semen_cost)}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${
                    economics.scenario_beef_on_dairy.semen_cost < economics.scenario_conventional.semen_cost
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(economics.scenario_conventional.semen_cost - economics.scenario_beef_on_dairy.semen_cost)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-gray-700">Custo de Recria de Novilhas</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">-{formatCurrency(economics.scenario_conventional.raising_cost)}</td>
                  <td className="px-4 py-2.5 text-right text-gold">-{formatCurrency(economics.scenario_beef_on_dairy.raising_cost)}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${
                    economics.scenario_beef_on_dairy.raising_cost < economics.scenario_conventional.raising_cost
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(economics.scenario_conventional.raising_cost - economics.scenario_beef_on_dairy.raising_cost)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-gray-700">Receita Bezerros de Leite</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">+{formatCurrency(economics.scenario_conventional.dairy_calves_revenue)}</td>
                  <td className="px-4 py-2.5 text-right text-gold">+{formatCurrency(economics.scenario_beef_on_dairy.dairy_calves_revenue)}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${
                    economics.scenario_beef_on_dairy.dairy_calves_revenue >= economics.scenario_conventional.dairy_calves_revenue
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(economics.scenario_beef_on_dairy.dairy_calves_revenue - economics.scenario_conventional.dairy_calves_revenue)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-gray-700">Receita Bezerros de Corte (F1)</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">+R$ 0</td>
                  <td className="px-4 py-2.5 text-right text-gold">+{formatCurrency(economics.scenario_beef_on_dairy.beef_calves_revenue)}</td>
                  <td className="px-4 py-2.5 text-right text-green-600 font-semibold">+{formatCurrency(economics.scenario_beef_on_dairy.beef_calves_revenue)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-gray-700">Receita Novilhas Excedentes</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">+{formatCurrency(economics.scenario_conventional.heifers_sold_revenue)}</td>
                  <td className="px-4 py-2.5 text-right text-gold">+{formatCurrency(economics.scenario_beef_on_dairy.heifers_sold_revenue)}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${
                    economics.scenario_beef_on_dairy.heifers_sold_revenue >= economics.scenario_conventional.heifers_sold_revenue
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(economics.scenario_beef_on_dairy.heifers_sold_revenue - economics.scenario_conventional.heifers_sold_revenue)}
                  </td>
                </tr>
                <tr className="bg-gray-50/50 font-bold border-t border-gray-200">
                  <td className="px-4 py-3 text-blue-dark">Margem Líquida Estimada</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(economics.scenario_conventional.net_revenue)}</td>
                  <td className="px-4 py-3 text-right text-gold">{formatCurrency(economics.scenario_beef_on_dairy.net_revenue)}</td>
                  <td className="px-4 py-3 text-right text-green-600">+{formatCurrency(economics.annual_gain)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
