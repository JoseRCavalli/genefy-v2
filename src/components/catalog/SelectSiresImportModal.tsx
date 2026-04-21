import { useState, useRef } from 'react';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { parseSelectSiresCSV } from '../../lib/select-sires-parser';
import type { SelectSiresBull } from '../../lib/select-sires-parser';

interface Props {
  farmId: string;
  onDone: () => void;
  onClose: () => void;
}

export function SelectSiresImportModal({ farmId, onDone, onClose }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [parsed, setParsed] = useState<SelectSiresBull[]>([]);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'importing' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setFiles(selected);
    setStatus('parsing');
    setMessage('');

    const seenCodes = new Set<string>();
    const all: SelectSiresBull[] = [];

    for (const file of selected) {
      const text = await file.text();
      const rows = parseSelectSiresCSV(text);
      for (const row of rows) {
        if (!seenCodes.has(row.code)) {
          seenCodes.add(row.code);
          all.push(row);
        }
      }
    }

    setParsed(all);
    setStatus('idle');
    if (all.length === 0) {
      setMessage('Nenhum touro reconhecido nos arquivos. Verifique se são os CSVs corretos da Select Sires.');
    }
  }

  async function handleImport() {
    if (!parsed.length) return;
    setStatus('importing');
    setMessage('');

    const BATCH = 50;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < parsed.length; i += BATCH) {
      const batch = parsed.slice(i, i + BATCH).map(({ _matched, ...bull }) => ({
        ...bull,
        farm_id: farmId,
      }));

      const { error } = await supabase
        .from('bulls')
        .upsert(batch, { onConflict: 'farm_id,code' });

      if (error) {
        // Fallback: try individual inserts
        for (const row of batch) {
          const { error: e2 } = await supabase.from('bulls').upsert(row, { onConflict: 'farm_id,code' });
          if (e2) errors++;
          else inserted++;
        }
      } else {
        inserted += batch.length;
      }
    }

    if (errors > 0) {
      setStatus('error');
      setMessage(`${inserted} touros importados, ${errors} com erro.`);
    } else {
      setStatus('done');
      setMessage(`✅ ${inserted} touros Select Sires importados com sucesso!`);
      onDone();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-blue-dark">Importar Catálogo Select Sires</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>Antes de importar:</strong> execute o SQL de limpeza no Supabase para remover touros 250HO falsos (veja Correção 3 no prompt). Depois faça upload dos 3 CSVs da Select Sires juntos.
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Arquivos CSV (selecione os 3 de uma vez)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-mid transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {files.length > 0
                  ? files.map(f => f.name).join(', ')
                  : 'Clique para selecionar os arquivos CSV'}
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                multiple
                className="hidden"
                onChange={handleFilesChange}
              />
            </div>
          </div>

          {parsed.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <strong>{parsed.length} touros</strong> reconhecidos e prontos para importar.
              <div className="mt-1 text-xs text-green-700 max-h-24 overflow-y-auto">
                {parsed.slice(0, 10).map(b => `${b.code} ${b.short_name}`).join(' · ')}
                {parsed.length > 10 && ` · +${parsed.length - 10} mais...`}
              </div>
            </div>
          )}

          {message && (
            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
              status === 'done' ? 'bg-green-50 text-green-800 border border-green-200' :
              status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {status === 'done' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> :
               status === 'error' ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> : null}
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleImport}
              disabled={parsed.length === 0 || status === 'importing' || status === 'done'}
              className="flex-1 py-2.5 bg-blue-mid text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40"
            >
              {status === 'importing' ? 'Importando…' : status === 'done' ? 'Importado!' : `Importar ${parsed.length} touros`}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
