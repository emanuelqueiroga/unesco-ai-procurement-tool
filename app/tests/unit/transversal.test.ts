// Pacote transversal: confirmação antes de substituir o caso, idioma ao importar e ao trocar (exemplo A–D
// retraduzido), erros de importação no idioma da interface, árabe com k/M/bn, rodapé (versão e data), título da
// aba, "continuar de onde parei", aviso de armazenamento e download por capacidade de artefato.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCaso, ESSENCIAL } from '../../src/store';
import { CASOS, setDicionarios, getDicionarios, setLang, getLang, tr, grande, magnitudes } from '../../src/domain';
import { usarIdioma, corrigirMagnitudes } from '../../src/i18n';
import {
  precisaConfirmar, exemploIlustrativo, deveRetraduzirExemplo, mensagemErroImportacao, versaoVisivel, dataDoBuild, textoVersao,
  tituloDaAba, destinoContinuar, NOME_FERRAMENTA,
} from '../../src/screens/transversal';
import { armazenamentoFunciona } from '../../src/screens/salvamento';
import { importarTexto, trocarIdioma, iniciarCapacidades, baixarArquivo } from '../../src/screens/acoes';
import { DATA_BUILD } from '../../src/screens/Rodape';
import { textoCaso } from '../../src/export/json';

const S = () => useCaso.getState();
beforeEach(async () => { await usarIdioma('pt'); S().carregarExemplo('novo'); S().setLang('pt'); });
afterEach(() => { delete (globalThis as any).window; });

describe('TRA-01/TRA-13: quando pedir confirmação', () => {
  it('caso em branco: não pede', () => { expect(precisaConfirmar(S())).toBe(false); });
  it('com respostas da pessoa: pede', () => {
    S().escolherPais('CAN');
    expect(precisaConfirmar(S())).toBe(true);
  });
  it('exemplo A–D aberto e não editado: nada a perder, não pede', () => {
    S().carregarExemplo('B');
    expect(exemploIlustrativo(S())).toBe(true);
    expect(precisaConfirmar(S())).toBe(false);
  });
  it('exemplo editado vira caso da pessoa: pede', () => {
    S().carregarExemplo('B');
    S().responder('local', 'Rede X');
    expect(S().exemplo).toBe('editado');
    expect(exemploIlustrativo(S())).toBe(false);
    expect(precisaConfirmar(S())).toBe(true);
  });
});

describe('TRA-08: erros de importação no idioma da interface', () => {
  const erro = (texto: string) => { try { S().importar(texto); } catch (e) { return e; } throw new Error('não falhou'); };
  const casos: [string, string][] = [
    ['json inválido', 'isto não é json'],
    ['não é objeto', '[1, 2]'],
    ['sem a chave caso', '{"x": 1}'],
    ['outro aplicativo', '{"app": "outra-coisa", "caso": {}}'],
    ['formato não aceito', '{"app": "ai-education-procurement-tool", "formato": 99, "caso": {}}'],
  ];
  for (const [nome, json] of casos) {
    it(`${nome}: diz o que fazer, em português`, () => {
      const m = mensagemErroImportacao(erro(json));
      expect(m).toMatch(/Escolha um arquivo exportado por esta ferramenta\.$/);
      expect(m.length).toBeGreaterThan(40);
    });
  }
  it('passa pelo dicionário do idioma corrente e leva o valor (aplicativo, formato)', () => {
    const antes = getDicionarios();
    setDicionarios({ ...antes, en: {
      'O arquivo pertence a outro aplicativo ("{app}").': 'The file belongs to another application ("{app}").',
      'Formato {f} não é aceito (aceitos: {a}).': 'Format {f} is not accepted (accepted: {a}).',
      'Escolha um arquivo exportado por esta ferramenta.': 'Choose a file exported by this tool.',
    } });
    setLang('en');
    try {
      expect(mensagemErroImportacao(erro(casos[3][1]))).toBe('The file belongs to another application ("outra-coisa"). Choose a file exported by this tool.');
      expect(mensagemErroImportacao(erro(casos[4][1]))).toBe('Format 99 is not accepted (accepted: 9, 11, 13, 14). Choose a file exported by this tool.');
    } finally { setLang('pt'); setDicionarios(antes); }
  });
  it('erro que não é de importação cai na mensagem de leitura', () => {
    expect(mensagemErroImportacao(new Error('boom'))).toMatch(/^Não foi possível ler o arquivo\. Escolha/);
  });
  it('importarTexto devolve o erro sem pedir confirmação nem tocar no caso', async () => {
    S().escolherPais('CAN');
    const antes = S().caso;
    const r = await importarTexto('isto não é json');
    expect(r.ok).toBe(false);
    expect('erro' in r && r.erro).toMatch(/JSON válido/);
    expect(S().caso).toBe(antes);
  });
});

describe('TRA-09: importar um caso de outro idioma troca a interface', () => {
  it('lang do arquivo vira idioma do store e do domínio (sem respostas, sem confirmação)', async () => {
    const e = { ...S().estado(), lang: 'fr' };
    const r = await importarTexto(textoCaso(e));
    expect(r.ok).toBe(true);
    expect(S().lang).toBe('fr');
    expect(getLang()).toBe('fr');
    expect(String(tr('Quanto custa'))).not.toBe('Quanto custa');
  });
});

describe('TRA-10: exemplo A–D não editado é retraduzido ao trocar de idioma', () => {
  it('troca o título do exemplo; com o exemplo editado, os textos da pessoa ficam', async () => {
    S().carregarExemplo('B');
    const pt = S().caso.titulo;
    expect(pt).toBe(String(tr((CASOS as any).B.titulo)));
    await trocarIdioma('en');
    const en = S().caso.titulo;
    expect(en).not.toBe(pt);
    expect(en).toBe(String(tr((CASOS as any).B.titulo)));
    expect(S().exemplo).toBe('B');
    // editado: trocar o idioma não mexe nos textos
    S().responder('titulo', 'Meu título');
    await trocarIdioma('pt');
    expect(S().caso.titulo).toBe('Meu título');
    expect(S().lang).toBe('pt');
  });
  it('mantém a pergunta em que a pessoa estava', async () => {
    S().carregarExemplo('B');
    S().irPara(2, 'piloto');
    await trocarIdioma('es');
    expect(S().capitulo).toEqual({ atual: 2, pergunta: 'piloto' });
  });
  it('custo editado no Refinar: o exemplo fica como está', () => {
    S().carregarExemplo('B');
    expect(deveRetraduzirExemplo(S())).toBe(true);
    S().setCusto({ editado: true });
    expect(deveRetraduzirExemplo(S())).toBe(false);
  });
});

describe('TRA-11: árabe com magnitudes k/M/bn', () => {
  it('corrigirMagnitudes troca só a palavra que vem depois de um número', () => {
    const mags = magnitudes('ar');
    const d = corrigirMagnitudes({
      'US$ {0} mil': 'US$ {0} ألف',
      'US$ {0} mi': 'US$ {0} مليون',
      'K2 Tecnologia e uso: {0} USD mil': 'K2 التكنولوجيا والاستخدام: {0} ألف USD',
      'API (US$ {0} / {1} por milhão de tokens)': 'API (US$ {0} / {1} لكل مليون رمز)',
      'milhão de tokens': 'مليون رمز',
    }, mags);
    expect(d['US$ {0} mil']).toBe('US$ {0} k');
    expect(d['US$ {0} mi']).toBe('US$ {0} M');
    expect(d['K2 Tecnologia e uso: {0} USD mil']).toBe('K2 التكنولوجيا والاستخدام: {0} k USD');
    expect(d['API (US$ {0} / {1} por milhão de tokens)']).toContain('لكل مليون رمز');
    expect(d['milhão de tokens']).toBe('مليون رمز');
  });
  it('depois de carregar o dicionário árabe, nenhum valor sai com ألف ou مليون', async () => {
    await usarIdioma('ar');
    for (const v of [336234, 1770133, 2.5e9]) {
      const g = grande(v);
      expect(g).toMatch(/^US\$ [\d.,]+ (k|M|bn)$/);
      expect(String(tr(g))).not.toMatch(/ألف|مليون|مليار/);
    }
    expect(String(tr('US$ {0} mil'))).not.toMatch(/ألف/);
  });
});

describe('TRA-03/TRA-04: rodapé', () => {
  it('versão: estável sem o sufixo de pré-lançamento, revisão completa', () => {
    expect(versaoVisivel('0.1.0-alpha.3', 'estavel')).toBe('0.1.0');
    expect(versaoVisivel('0.1.0-alpha.3', 'revisao')).toBe('0.1.0-alpha.3');
    expect(versaoVisivel('1.2.3', 'estavel')).toBe('1.2.3');
  });
  it('data do build em AAAA-MM-DD', () => {
    expect(dataDoBuild('2026-10-28T12:00:00.000Z')).toBe('2026-10-28');
    expect(dataDoBuild('amanhã')).toBe('');
    expect(DATA_BUILD).toMatch(/^\d{4}-\d{2}-\d{2}$/);   // injetada pelo vite.config.ts (define)
  });
  it('texto "Versão 0.1.0 · AAAA-MM-DD"', () => {
    expect(textoVersao('0.1.0-alpha.3', 'estavel', '2026-10-28')).toBe('Versão 0.1.0 · 2026-10-28');
    expect(textoVersao('0.1.0-alpha.3', 'revisao', '2026-10-28')).toBe('Versão 0.1.0-alpha.3 · 2026-10-28');
    expect(textoVersao('0.1.0', 'estavel', '')).toBe('Versão 0.1.0');
  });
});

describe('TRA-17: título da aba por tela', () => {
  it('início: só o nome da ferramenta', () => { expect(tituloDaAba({ tipo: 'inicio' })).toBe(NOME_FERRAMENTA); });
  it('pergunta: número, total e nome curto', () => {
    const t = tituloDaAba({ tipo: 'pergunta', n: 1, tela: ESSENCIAL[0].id });
    expect(t).toBe(`Pergunta 1 de ${ESSENCIAL.length} · País · ${NOME_FERRAMENTA}`);
  });
  it('plano, abertura, síntese e refinar identificam a tela', () => {
    expect(tituloDaAba({ tipo: 'plano', pagina: 'custa' })).toBe(`Seu plano · Quanto custa · ${NOME_FERRAMENTA}`);
    expect(tituloDaAba({ tipo: 'abertura', n: 2 })).toBe(`Prova de conceito ou piloto · ${NOME_FERRAMENTA}`);
    expect(tituloDaAba({ tipo: 'sintese', n: 3 })).toBe(`Implantação · ${NOME_FERRAMENTA}`);
    expect(tituloDaAba({ tipo: 'refinar', aba: 'premissas' })).toBe(`Refinar · ${NOME_FERRAMENTA}`);
  });
  it('as 23 telas têm títulos diferentes', () => {
    const ts = new Set(ESSENCIAL.map((x) => tituloDaAba({ tipo: 'pergunta', n: x.capitulo, tela: x.id })));
    expect(ts.size).toBe(ESSENCIAL.length);
  });
});

describe('PER-23: continuar de onde parei', () => {
  const faltam = [{ capitulo: 2, id: 'piloto' }];
  it('volta à última pergunta vista', () => {
    expect(destinoContinuar({ capitulo: { atual: 1, pergunta: 'problemas' } }, faltam)).toEqual({ href: '#/capitulo/1/problemas', pendente: true });
  });
  it('sem pergunta vista (ou inválida), vai à primeira pendente', () => {
    expect(destinoContinuar({ capitulo: { atual: 1, pergunta: '' } }, faltam).href).toBe('#/capitulo/2/piloto');
    expect(destinoContinuar({ capitulo: { atual: 3, pergunta: 'problemas' } }, faltam).href).toBe('#/capitulo/2/piloto');
  });
  it('sem pendências, abre o plano', () => {
    expect(destinoContinuar({ capitulo: { atual: 1, pergunta: 'problemas' } }, [])).toEqual({ href: '#/plano', pendente: false });
  });
});

describe('TRA-18: aviso quando o navegador não salva', () => {
  const mem = () => { const d: Record<string, string> = {}; return { getItem: (k: string) => (k in d ? d[k] : null), setItem: (k: string, v: string) => { d[k] = v; }, removeItem: (k: string) => { delete d[k]; } }; };
  it('armazenamento que funciona', () => { const m = mem(); expect(armazenamentoFunciona(m)).toBe(true); expect(m.getItem('aiedu-teste-gravacao')).toBeNull(); });
  it('cheio ou bloqueado (setItem lança)', () => {
    expect(armazenamentoFunciona({ ...mem(), setItem: () => { throw new Error('QuotaExceededError'); } })).toBe(false);
  });
  it('que aceita mas não guarda', () => {
    expect(armazenamentoFunciona({ getItem: () => null, setItem: () => {}, removeItem: () => {} })).toBe(false);
  });
  it('indisponível (null)', () => { expect(armazenamentoFunciona(null)).toBe(false); });
});

describe('PLA-10/TRA-19: download por capacidade de artefato', () => {
  it('usa window.claude.use("downloads") quando existe e devolve "capacidade"', async () => {
    const salvos: any[] = [];
    (globalThis as any).window = { claude: { use: async (n: string) => (n === 'downloads' ? { save: async (o: any) => { salvos.push(o); } } : null) } };
    await iniciarCapacidades();
    expect(await baixarArquivo('caso.json', '{"a":1}')).toBe('capacidade');
    expect(salvos).toEqual([{ filename: 'caso.json', data: '{"a":1}' }]);
  });
  it('se a pessoa recusa o download, devolve false sem cair no link', async () => {
    (globalThis as any).window = { claude: { use: async () => ({ save: async () => { throw Object.assign(new Error('x'), { code: 'declined' }); } }) } };
    await iniciarCapacidades();
    expect(await baixarArquivo('caso.json', '{}')).toBe(false);
  });
});
