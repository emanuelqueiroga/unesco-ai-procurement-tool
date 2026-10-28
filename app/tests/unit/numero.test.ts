// Campo numérico: formatação enquanto se digita nos separadores do idioma (porte de formatarCampoNum da v13).
import { describe, it, expect } from 'vitest';
import { formatarDigitando, lerDigitado, paraTexto, separadores } from '../../src/ui/NumeroField/formatar';

const nb = (s: string) => s.replace(/[  ]/g, ' ');

describe('campo numérico por idioma', () => {
  it('separadores', () => {
    expect(separadores('pt-BR')).toEqual({ grupo: '.', decimal: ',' });
    expect(separadores('en')).toEqual({ grupo: ',', decimal: '.' });
  });
  it('agrupa milhares enquanto digita', () => {
    expect(formatarDigitando('1600000', 7, 'pt-BR').texto).toBe('1.600.000');
    expect(formatarDigitando('1600000', 7, 'en').texto).toBe('1,600,000');
    expect(nb(formatarDigitando('1600000', 7, 'fr').texto)).toBe('1 600 000');
    expect(formatarDigitando('1600000', 7, 'pt-BR').valor).toBe(1600000);
  });
  it('mantém o cursor depois do mesmo dígito', () => {
    // "1.600|00" com um 5 digitado no meio → 1.600.500… o cursor fica depois do 5
    const r = formatarDigitando('1.60050', 6, 'pt-BR');
    expect(r.texto).toBe('160.050');
    expect(r.texto.slice(0, r.caret).replace(/\D/g, '')).toBe('16005');
  });
  it('decimais: preserva a vírgula e os zeros digitados', () => {
    expect(formatarDigitando('0,', 2, 'pt-BR', true)).toMatchObject({ texto: '0,', valor: 0 });
    expect(formatarDigitando('0,05', 4, 'pt-BR', true)).toMatchObject({ texto: '0,05', valor: 0.05 });
    expect(formatarDigitando('1234.5', 6, 'en', true)).toMatchObject({ texto: '1,234.5', valor: 1234.5 });
    expect(formatarDigitando('12,5', 4, 'pt-BR', false).valor).toBe(125);   // sem decimais, a vírgula some
  });
  it('vazio e lixo', () => {
    expect(formatarDigitando('', 0, 'pt-BR')).toEqual({ texto: '', caret: 0, valor: '' });
    expect(formatarDigitando('abc', 3, 'pt-BR').valor).toBe('');
  });
  it('leitura e exibição', () => {
    expect(lerDigitado('1.600.000', 'pt-BR')).toBe(1600000);
    expect(lerDigitado('1,600,000.5', 'en')).toBe(1600000.5);
    expect(lerDigitado('2,5', 'pt-BR')).toBe(2.5);
    expect(paraTexto(1600000, 'pt-BR')).toBe('1.600.000');
    expect(paraTexto('', 'pt-BR')).toBe('');
  });
});
