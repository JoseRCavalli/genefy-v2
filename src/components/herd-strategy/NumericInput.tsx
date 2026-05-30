import { useState, useEffect } from 'react';

interface Props {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  min?: number;
  max?: number;
  isInteger?: boolean;
}

export function NumericInput({
  value,
  onChange,
  className = '',
  min,
  max,
  isInteger = false,
}: Props) {
  const [localVal, setLocalVal] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  // Sync if value prop changes from outside (e.g. database load), but only when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalVal(value.toString());
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    
    // Permitir digitar números, pontos, vírgulas (que serão convertidas para ponto) e campo vazio
    let normalized = raw.replace(',', '.');
    
    // Validar caracteres permitidos para número decimal ou inteiro
    const regex = isInteger ? /^-?[0-9]*$/ : /^-?[0-9]*\.?[0-9]*$/;
    if (!regex.test(normalized)) {
      return; // Rejeitar caracteres inválidos
    }

    setLocalVal(normalized);

    // Tenta converter e emitir se for um número válido diferente do valor atual
    const parsed = isInteger ? parseInt(normalized, 10) : parseFloat(normalized);
    if (!isNaN(parsed)) {
      let constrained = parsed;
      if (min !== undefined) constrained = Math.max(min, constrained);
      if (max !== undefined) constrained = Math.min(max, constrained);
      
      if (constrained !== value) {
        onChange(constrained);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Se o input foi deixado em branco ou inválido, restaura o valor prop original
    const parsed = isInteger ? parseInt(localVal, 10) : parseFloat(localVal);
    if (isNaN(parsed)) {
      setLocalVal(value.toString());
    } else {
      let constrained = parsed;
      if (min !== undefined) constrained = Math.max(min, constrained);
      if (max !== undefined) constrained = Math.min(max, constrained);
      setLocalVal(constrained.toString());
    }
  };

  return (
    <input
      type="text"
      inputMode={isInteger ? 'numeric' : 'decimal'}
      value={localVal}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      className={className}
    />
  );
}
