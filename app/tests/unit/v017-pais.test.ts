// Versão de teste v017: país pré-selecionado pelo fuso horário do navegador (sem rede); idioma só desempata.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { paisDoNavegador } from '../../src/percurso/paisLocal';

const fuso = (tz: string) => vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ timeZone: tz } as any);
const idiomas = (l: string[]) => vi.spyOn(navigator, 'languages', 'get').mockReturnValue(l);
const TODOS = new Set(['KE', 'BR', 'IN', 'GB', 'US', 'CN']);

describe('v017: país pelo fuso horário', () => {
  afterEach(() => vi.restoreAllMocks());
  it('fuso indica o país', () => { fuso('Africa/Nairobi'); idiomas(['en-US']); expect(paisDoNavegador(TODOS)).toBe('KE'); });
  it('nome antigo do fuso ainda funciona', () => { fuso('Asia/Calcutta'); expect(paisDoNavegador(TODOS)).toBe('IN'); });
  it('fuso sem país: vale a região do idioma', () => { fuso('Etc/UTC'); idiomas(['zh-Hans-CN', 'en']); expect(paisDoNavegador(TODOS)).toBe('CN'); });
  it('idioma sem região não sugere', () => { fuso('UTC'); idiomas(['en']); vi.spyOn(navigator, 'language', 'get').mockReturnValue('en'); expect(paisDoNavegador(TODOS)).toBeNull(); });
  it('país fora da lista não sugere', () => { fuso('America/Sao_Paulo'); idiomas(['pt']); vi.spyOn(navigator, 'language', 'get').mockReturnValue('pt'); expect(paisDoNavegador(new Set(['KE']))).toBeNull(); });
});
