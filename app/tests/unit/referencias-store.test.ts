// REF-04, REF-06 a REF-12 no store e no painel: escolher o país (moeda só se ainda for o dólar), perfil do país no
// custo, troca de país com a calculadora editada (aviso `pendente`, nunca descarte silencioso), "restaurar" na
// calculadora, importação de um caso da 0.0.15 com país e edições, e a linha de fontes do "de onde vem?".
import { describe, it, expect, beforeEach } from 'vitest';
import { useCaso } from '../../src/store/caso';
import { cfgDe, numerosDe } from '../../src/store/selectors';
import { migrar } from '../../src/store/migracoes';
import { dadosCaso } from '../../src/export/json';
import { explicacaoKpi, textoFontesPremissas, KPI_IDS } from '../../src/percurso/painel';
import { premissasDoCaso } from '../../src/domain';
import { ESSENCIAL as TELAS } from '../../src/store/perguntas';

const S = () => useCaso.getState();
beforeEach(() => { S().carregarExemplo('novo'); S().setMoeda({ cod: 'USD', taxa: '' }); });

describe('escolher o país', () => {
  it('grava o país, ajusta a moeda (ainda em dólar) e devolve a moeda nova; é a primeira pergunta do Essencial', () => {
    const r = S().escolherPais('BRA');
    expect(r.moeda).toBe('BRL');
    expect(S().caso.pais).toBe('BRA');
    expect(S().moeda).toEqual({ cod: 'BRL', taxa: '', taxaDe: '', doPais: 'BRA' });
    expect(TELAS.some((t: any) => t.campos.includes('pais'))).toBe(true);
    expect(TELAS.length).toBe(24);
    expect(S().origem.pais).toBe('informado');
    // outro país: a moeda posta pelo país segue o país novo; "outro" volta ao dólar
    expect(S().escolherPais('MEX').moeda).toBe('MXN');
    expect(S().escolherPais('outro').moeda).toBe('USD');
    expect(S().moeda.cod).toBe('USD');
  });
  it('a moeda escolhida pela pessoa não muda', () => {
    S().setMoeda({ cod: 'EUR', taxa: '', taxaDe: '' });
    expect(S().escolherPais('KEN').moeda).toBeNull();
    expect(S().moeda.cod).toBe('EUR');
  });
  it('com os dados globais de hoje, escolher o país não muda nenhum número', () => {
    S().carregarExemplo('A');
    const antes = numerosDe(S());
    S().escolherPais('BRA');
    const depois = numerosDe(S());
    expect(depois.total).toBe(antes.total);
    expect(depois.ano0).toBe(antes.ano0);
    expect(cfgDe(S()).escopos).toEqual(['BRA', 'LAC', 'global']);
    expect(S().exemplo).toBe('editado');
  });
  it('com a calculadora editada, trocar de país deixa o aviso pendente e mantém as edições', () => {
    S().carregarExemplo('A');
    S().editarCfg('saas.preco', 11);
    S().escolherPais('BRA');
    expect(S().custo.editado).toBe(true);
    expect((S().custo as any).pendente).toBe(true);
    expect(S().custo.cfg.saas.preco).toBe(11);
    // "Refazer a partir das respostas" monta a cfg do país
    S().refazerCfg();
    expect(cfgDe(S()).escopos).toEqual(['BRA', 'LAC', 'global']);
  });
  it('perfil do país editado entra no custo e "restaurar" o tira', () => {
    S().carregarExemplo('A');
    expect(cfgDe(S()).opc.pi).toBeUndefined();
    S().editarCampoPais('inflacao', 0.05);
    expect(S().caso.editados).toEqual({ inflacao: 0.05 });
    expect(cfgDe(S()).opc.pi).toBe(0.05);
    S().editarCampoPais('salarioProfessor', 17600);
    expect(cfgDe(S()).formacaoTempo.custoHora).toBe(10);
    S().restaurarCampoPais('inflacao');
    S().restaurarCampoPais('salarioProfessor');
    expect(S().caso.editados).toEqual({});
    expect(cfgDe(S()).opc.pi).toBeUndefined();
    expect(cfgDe(S()).formacaoTempo.custoHora).toBe(12);
  });
  it('trocar de país descarta as edições do perfil (a tela pede confirmação antes)', () => {
    S().escolherPais('BRA');
    S().editarCampoPais('escolas', 500);
    S().escolherPais('MEX');
    expect(S().caso.editados).toEqual({});
  });
});

describe('restaurar na calculadora (REF-04)', () => {
  it('volta o valor das respostas; sem outra edição, a calculadora deixa de estar editada', () => {
    S().carregarExemplo('A');
    S().editarCfg('saas.preco', 20);
    S().editarCfg('salarios.eng_ml', 70000);
    S().restaurarCfg('saas.preco');
    expect(S().custo.editado).toBe(true);
    expect(S().custo.cfg.saas.preco).toBe(9);
    S().restaurarCfg('salarios.eng_ml');
    expect(S().custo.editado).toBe(false);
    expect(S().custo.cfg).toBeNull();
  });
  it('séries por ano voltam inteiras', () => {
    S().carregarExemplo('A');
    const i = cfgDe(S()).itens.findIndex((x: any) => x.s === 'K4.3');
    const antes = cfgDe(S()).itens[i].v;
    S().editarCfg('itens.' + i + '.v.1', 99999);
    S().restaurarCfg('itens.' + i + '.v');
    expect(S().custo.editado).toBe(false);
    expect(cfgDe(S()).itens[i].v).toEqual(antes);
  });
});

describe('importação e exportação (REF-11)', () => {
  it('um caso da 0.0.15 com país, edições do perfil e cfg com escopos abre sem perder nada e volta no JSON', () => {
    S().carregarExemplo('B');
    S().escolherPais('BRA');
    S().editarCampoPais('inflacao', 0.04);
    S().editarCfg('api.Pin', 2.4);
    const json = dadosCaso(S().estado());
    const e = migrar(JSON.parse(JSON.stringify(json)));
    expect(e.caso.pais).toBe('BRA');
    expect(e.caso.editados).toEqual({ inflacao: 0.04 });
    expect(e.custo.cfg.escopos).toEqual(['BRA', 'LAC', 'global']);
    expect(e.custo.cfg.api.Pin).toBe(2.4);
    expect(e.moeda.doPais).toBe('BRA');
    // arquivo antigo, sem país: pais '' e editados {}; editados malformado vira {}
    const v13 = migrar({ app: 'ai-education-procurement-tool', formato: 13, caso: { titulo: 'x', editados: [1] } });
    expect([v13.caso.pais, v13.caso.editados]).toEqual(['', {}]);
  });
  it('exemplo genérico declara país não informado e não inventa dados locais', () => {
    S().carregarExemplo('C');
    expect(S().caso.pais).toBe('outro');
    expect(S().origem.editados).toBeUndefined();
    expect(S().origem.pais).toBe('informado');
    expect(S().respC.editados).toBeUndefined();
  });
});

describe('"de onde vem?" com as fontes das premissas (REF-12)', () => {
  it('diz quantas premissas de custo vêm da base, quantas são convenção de grau C e quantas estão fora da faixa', () => {
    S().carregarExemplo('A');
    const n = premissasDoCaso(S().estado()).length;
    KPI_IDS.forEach((id) => expect(explicacaoKpi(S().estado(), id).fontes).toBe(n + ' premissas de custo vêm da base de referências: ' + n + ' ainda são convenções da ferramenta (grau C).'));
    S().editarCfg('saas.preco', 20);
    expect(explicacaoKpi(S().estado(), 'kpi.total').fontes).toBe(n + ' premissas de custo vêm da base de referências: ' + (n - 1) + ' ainda são convenções da ferramenta (grau C); 1 alterada por você; 1 fora da faixa de referência.');
    expect(textoFontesPremissas({ total: 0, convencao: 0, pais: 0, regiao: 0, usuario: 0, fora: 0 })).toBe('');
  });
});
