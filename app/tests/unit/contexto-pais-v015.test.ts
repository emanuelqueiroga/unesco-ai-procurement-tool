import { beforeEach, describe, expect, it } from 'vitest';
import { useCaso, ESSENCIAL, telasDoCapitulo, camposRefinar, faltamDe, numerosDe } from '../../src/store';
import { estadoInicial, migrar, temRespostas } from '../../src/store/migracoes';
import { paisesOrdenados, paisPorIso, escoposDeCaso, notaPais, valorEfetivoCampo, setLang, nomeContexto } from '../../src/domain';
import { href, lerRota } from '../../src/percurso/rota';

const S = () => useCaso.getState();
beforeEach(() => { setLang('pt'); S().carregarExemplo('novo'); });

describe('v015: planejamento nacional e catálogo de países', () => {
  it('começa por país, sem nível de decisão nem pergunta escondida em Refinar', () => {
    expect(ESSENCIAL).toHaveLength(24);
    expect(telasDoCapitulo(1)[0].campos).toEqual(['pais']);
    expect(ESSENCIAL.some(t => t.id === 'nivel')).toBe(false);
    expect(camposRefinar(1)).not.toContain('nivel');
    expect(S().ctx.nivel).toBe('pais');
    expect(temRespostas(S().estado())).toBe(false);
    expect(faltamDe(S().estado())).toHaveLength(24);
  });
  it('a instituição opcional não responde à pergunta sobre o país', () => {
    S().responder('local', 'Ministério da Educação');
    expect(faltamDe(S().estado())[0].id).toBe('local');
    S().escolherPais('CAN');
    expect(S().respC.pais).toBe(true);
    expect(faltamDe(S().estado()).some(t => t.id === 'local')).toBe(false);
    S().responder('nivel', 'municipio');
    S().refinar('nivel', 'estado');
    expect(S().ctx.nivel).toBe('pais');
  });
  it('lista 249 identidades sem duplicação, inclusive países fora dos cinco perfis locais', () => {
    const paises = paisesOrdenados();
    expect(paises).toHaveLength(249);
    expect(new Set(paises.map(p => p.iso3)).size).toBe(249);
    for (const iso of ['CAN', 'USA', 'FRA', 'AGO', 'JPN', 'PSE']) expect(paisPorIso(iso)?.iso3).toBe(iso);
  });
  it('país sem perfil usa referências globais e não ganha dados ou moeda inventados', () => {
    const antes = numerosDe(S().estado()).total;
    S().escolherPais('CAN');
    expect(escoposDeCaso(S().caso)).toEqual(['CAN', 'global']);
    expect(notaPais(S().caso)).toBeNull();
    expect(valorEfetivoCampo(S().caso, 'escolas')).toBeNull();
    expect(S().moeda.cod).toBe('USD');
    expect(numerosDe(S().estado()).total).toBeCloseTo(antes, 8);
  });
  it('importa escopo legado sem perder instituição, cálculos editados ou o original', () => {
    const original = estadoInicial();
    original.ctx = { nivel: 'municipio', nivelOutro: '', local: 'Instituição legada' };
    original.capitulo = { atual: 1, pergunta: 'nivel' };
    original.custo = { base: 'caso', cfg: { exemplo: 'valor preservado' }, editado: true };
    const copia = JSON.stringify(original);
    const convertido = migrar(original);
    expect(JSON.stringify(original)).toBe(copia);
    expect(convertido.ctx.nivel).toBe('pais');
    expect(convertido.ctx.escopoLegado.nivel).toBe('municipio');
    expect(convertido.ctx.local).toBe('Instituição legada');
    expect(convertido.custo).toEqual(original.custo);
    expect(convertido.capitulo.pergunta).toBe('local');
    expect(convertido.caso.pais).toBe('');
    expect(migrar(convertido).ctx).toEqual(convertido.ctx);
  });
  it('exporta e reimporta o ISO escolhido, sem depender do idioma do nome', () => {
    S().escolherPais('FRA');
    S().responder('local', 'Ministère de l’Éducation');
    const exp = S().exportar();
    S().carregarExemplo('novo');
    S().importar(exp);
    setLang('en'); expect(nomeContexto(S().estado())).toBe('France');
    setLang('pt'); expect(nomeContexto(S().estado())).toBe('França');
    expect(S().caso.pais).toBe('FRA');
    expect(S().ctx.local).toBe('Ministère de l’Éducation');
    expect(S().ctx.nivel).toBe('pais');
  });
  it('o endereço antigo e suas referências levam ao país', () => {
    expect(lerRota('#/capitulo/1/nivel')).toEqual({ tipo: 'pergunta', n: 1, tela: 'local' });
    expect(href.campo('nivel')).toBe('#/capitulo/1/local');
    expect(href.tela('nivel')).toBe('#/capitulo/1/local');
  });
  it('país desconhecido importado fica pendente, preservado como dado legado', () => {
    const antigo = estadoInicial(); antigo.caso.pais = 'XXX'; antigo.respC.pais = true; antigo.origem.pais = 'informado';
    const e = migrar(antigo);
    expect(e.caso.pais).toBe(''); expect(e.caso.paisLegado).toBe('XXX');
    expect(e.respC.pais).toBeUndefined();
    expect(faltamDe(e).some(t => t.id === 'local')).toBe(true);
  });
});
