// Pacote B (perguntas e calculadora do motor): as perguntas 4.1.4 a 4.1.7 no Refinar do capítulo 4 (ondas, casas decimais,
// opcionais, KPIs que mudam), a síntese do capítulo 4 (como o uso cresce) e as fases nas sínteses 2, 3 e 4, o custo por fase
// e o pagamento único × recorrente por insumo na calculadora (árvore, CSV, foco) e a edição da cfg (reposição, rotatividade).
import { describe, it, expect, beforeEach } from 'vitest';
import { useCaso } from '../../src/store/caso';
import { ESSENCIAL, CAMPOS_ESSENCIAIS, afetadosPor, capituloDoCampo, CAMPOS_MOTOR, FONTES_MOTOR, fonteMotor, motorQueAfeta } from '../../src/store/perguntas';
import { numerosDe, camposRefinar, cfgDe, respostaReal } from '../../src/store/selectors';
import { lacunasDe } from '../../src/percurso/painel';
import { CAMPO_POR_ID, CAMPOS_CUSTO, avaliar, calcular, setMoeda, setTabelaMoedas } from '../../src/domain';
import { TIPOS_SIMPLES } from '../../src/percurso/Controles';
import {
  MAX_ONDAS, linhasDeOndas, compactarOndas, ondaEditada, errosDaOnda, avisoOndas, casasDoCampo, valorComCasas, erroDeIntervalo,
  curvaEfetiva, crescimentoDoCaso, horizonteDoCaso,
} from '../../src/percurso/motor';
import { sinteseCapitulo, textoCrescimento, fraseDaFase } from '../../src/percurso/sintese';
import {
  linhasArvore, todosAbertos, pagamentoDaLinha, etiquetasPagamento, tabelaFases, detalhePorFase, csvCustosMoeda, resultados, abaDoFoco, candidatosFoco, focoNormal,
} from '../../src/screens/refinar/calc';
import moedas from '../../../data/moedas.json';

const S = () => useCaso.getState();
beforeEach(() => { setTabelaMoedas(moedas); setMoeda({ cod: 'USD', taxa: '' }); S().carregarExemplo('B'); S().setModo('refinar'); });
const ctEco = () => numerosDe(S().estado()).av.ctEco as number;

describe('MOT-02: as quatro perguntas no Refinar do capítulo 4', () => {
  it('estão no capítulo 4, fora do Essencial, e a de ondas tem controle (tipo em TIPOS_SIMPLES)', () => {
    CAMPOS_MOTOR.forEach((c) => {
      expect(CAMPOS_ESSENCIAIS).not.toContain(c);
      expect(capituloDoCampo(c)).toBe(4);
      expect(camposRefinar(4)).toContain(c);
      expect(TIPOS_SIMPLES).toContain((CAMPO_POR_ID as any)[c].tipo);
    });
    expect(ESSENCIAL.length).toBe(25);
    expect((CAMPO_POR_ID as any).ondas.tipo).toBe('ondas');
    expect(casasDoCampo((CAMPO_POR_ID as any).rotacaoFormacao)).toBe(1);
    expect(casasDoCampo((CAMPO_POR_ID as any).elegiveis)).toBe(0);
  });
  it('a pergunta das ondas só aparece quando a curva é "em ondas"', () => {
    const f: any = (CAMPO_POR_ID as any).ondas;
    expect(f.se({ curva: 'linear' })).toBe(false);
    expect(f.se({ curva: 's' })).toBe(false);
    expect(f.se({ curva: 'ondas' })).toBe(true);
  });
  it('são opcionais: nunca contam como lacuna, nem em branco nem respondidas', () => {
    S().carregarExemplo('novo');
    // a 4.1.5 é condicional (só com curva em ondas) e não tem a marca `opcional`, mas também fica fora da contagem: ver abaixo
    ['curva', 'reposicaoDisp', 'rotacaoFormacao'].forEach((c) => expect((CAMPO_POR_ID as any)[c].opcional, c).toBe(true));
    const ids = (e: any) => lacunasDe(e).itens.map((x) => x.campo);
    CAMPOS_MOTOR.forEach((c) => expect(ids(S().estado())).not.toContain(c));
    S().refinar('curva', 'ondas');   // em ondas e sem nenhuma onda: continua fora das lacunas
    CAMPOS_MOTOR.forEach((c) => expect(ids(S().estado())).not.toContain(c));
    S().refinar('ondas', [{ ano: 2, pct: 40 }]);
    CAMPOS_MOTOR.forEach((c) => expect(ids(S().estado())).not.toContain(c));
  });
  it('mudam os KPIs do plano: dotação anual, custo total e A2 (afetadosPor)', () => {
    CAMPOS_MOTOR.forEach((c) => { const a = afetadosPor(c); expect(a, c).toEqual(expect.arrayContaining(['kpi.anual', 'kpi.total', 'A2'])); });
    expect(motorQueAfeta('kpi.total')).toEqual(CAMPOS_MOTOR);
    expect(motorQueAfeta('kpi.ano0')).toEqual([]);
  });
  it('alimentam o custo: estão em CAMPOS_CUSTO, e responder muda os números de verdade', () => {
    CAMPOS_MOTOR.forEach((c) => expect(CAMPOS_CUSTO).toContain(c));
    S().responder('horizonte', 5);
    const antes = ctEco();
    expect(antes).toBeCloseTo(2664806, -1);   // exemplo B, H=5, expansão em 1 ano (MOT.md, seção 0: 2.607.806; R7: + 57 mil de K3.4 e K5.4 no Ano 0)
    S().refinar('curva', 'ondas');
    S().refinar('ondas', ondaEditada(ondaEditada(S().estado().caso.ondas, 0, 'ano', 2), 0, 'pct', 50));
    S().refinar('ondas', ondaEditada(ondaEditada(S().estado().caso.ondas, 1, 'ano', 4), 1, 'pct', 100));
    expect(S().estado().origem.curva).toBe('refinado');
    expect(S().estado().origem.ondas).toBe('refinado');
    expect(ctEco()).toBeCloseTo(2569891, -1);   // MOT.md: 2.512.891 (−3,6%); R7: + 57 mil no Ano 0
  });
  it('4.1.7 aceita uma casa decimal e zero; em branco é diferente de zero', () => {
    S().responder('horizonte', 5);
    const emBranco = ctEco();
    S().refinar('rotacaoFormacao', valorComCasas(12.55, 1) as number);
    expect(S().estado().caso.rotacaoFormacao).toBe(12.6);
    S().refinar('rotacaoFormacao', 0);
    expect(S().estado().caso.rotacaoFormacao).toBe(0);
    expect(ctEco()).not.toBeCloseTo(emBranco, 0);
    S().refinar('rotacaoFormacao', '' as any);
    expect(ctEco()).toBeCloseTo(emBranco, 0);
  });
  it('4.1.6 liga a reposição: A com dispositivos a comprar não é testado aqui, mas a cfg recebe o ciclo', () => {
    S().refinar('reposicaoDisp', '4');
    expect(cfgDe(S().estado()).reposicao).toEqual({ ciclo: 4 });
    S().refinar('reposicaoDisp', 'nao');
    expect(cfgDe(S().estado()).reposicao).toBeUndefined();
  });
  it('valor da resposta de ondas conta como resposta real (lista preenchida)', () => {
    S().carregarExemplo('novo');
    S().refinar('curva', 'ondas');
    expect(respostaReal(S().estado(), 'ondas')).toBe(true);   // as 4 linhas em branco do caso vazio contam como lista; o motor as ignora
    expect(avisoOndas(S().estado().caso.ondas)).toEqual({ tipo: 'sem_validas' });
  });
});

describe('ondas (4.1.5): lógica das linhas', () => {
  const vazias = [{ ano: '', pct: '' }, { ano: '', pct: '' }, { ano: '', pct: '' }, { ano: '', pct: '' }];
  it('sempre 4 linhas na tela, completando o que está guardado', () => {
    expect(linhasDeOndas(undefined)).toEqual(vazias);
    expect(linhasDeOndas([{ ano: 2, pct: 50 }]).length).toBe(MAX_ONDAS);
    expect(linhasDeOndas([{ ano: '2', pct: '50' }])[0]).toEqual({ ano: 2, pct: 50 });
    expect(linhasDeOndas([{ ano: 'x' }])[0]).toEqual({ ano: '', pct: '' });
  });
  it('guarda só até a última linha preenchida', () => {
    expect(compactarOndas(vazias as any)).toEqual([]);
    let o: any = ondaEditada([], 0, 'ano', 2);
    expect(o).toEqual([{ ano: 2, pct: '' }]);
    o = ondaEditada(o, 2, 'pct', 80);
    expect(o).toEqual([{ ano: 2, pct: '' }, { ano: '', pct: '' }, { ano: '', pct: 80 }]);
    o = ondaEditada(o, 2, 'pct', '');
    expect(o).toEqual([{ ano: 2, pct: '' }]);
    expect(ondaEditada(o, 9, 'ano', 5)).toEqual([{ ano: 2, pct: '' }]);   // linha fora de 0–3: ignorada
  });
  it('ano arredonda para inteiro e não fica negativo; porcentagem acima de 100 fica (o erro avisa)', () => {
    expect(ondaEditada([], 0, 'ano', 2.6)[0].ano).toBe(3);
    expect(ondaEditada([], 0, 'ano', -4)[0].ano).toBe(0);
    expect(ondaEditada([], 0, 'pct', 150)[0].pct).toBe(150);
  });
  it('erros por campo: Ano 1, depois do horizonte, falta o par, 0%, acima de 100%', () => {
    expect(errosDaOnda({ ano: 1, pct: 50 })).toEqual({ ano: { k: 'Use o Ano 2 ou depois: o Ano 1 é a primeira etapa.' } });
    expect(errosDaOnda({ ano: 2, pct: 50 }, 3)).toEqual({});
    expect(errosDaOnda({ ano: 6, pct: 50 }, 5).ano?.k).toMatch(/Depois do horizonte/);
    expect(errosDaOnda({ ano: 6, pct: 50 }, 5).ano?.vars).toEqual({ n: 5 });
    expect(errosDaOnda({ ano: 3, pct: '' }).pct?.k).toMatch(/também a porcentagem/);
    expect(errosDaOnda({ ano: '', pct: 40 }).ano?.k).toMatch(/também o ano/);
    expect(errosDaOnda({ ano: 3, pct: 0 }).pct?.k).toMatch(/maior que zero/);
    expect(errosDaOnda({ ano: 3, pct: 120 }).pct?.k).toBe('Não pode passar de 100%.');
    expect(errosDaOnda({ ano: '', pct: '' })).toEqual({});
  });
  it('aviso: sem ondas válidas cai na linear; última onda abaixo de 100% avisa o patamar', () => {
    expect(avisoOndas([])).toEqual({ tipo: 'sem_validas' });
    expect(avisoOndas([{ ano: 1, pct: 100 }])).toEqual({ tipo: 'sem_validas' });   // Ano 1 não vale
    expect(avisoOndas([{ ano: 2, pct: 50 }, { ano: 4, pct: 100 }])).toBeNull();
    expect(avisoOndas([{ ano: 2, pct: 50 }, { ano: 4, pct: 80 }])).toEqual({ tipo: 'ultima_abaixo', ano: 4, pct: 80 });
    expect(avisoOndas([{ ano: 2, pct: 150 }])).toBeNull();   // acima de 100 vale 100
    // o uso nunca diminui: vale o maior patamar
    expect(avisoOndas([{ ano: 2, pct: 90 }, { ano: 3, pct: 60 }])).toEqual({ tipo: 'ultima_abaixo', ano: 3, pct: 90 });
  });
});

describe('campos numéricos com casas (4.1.7)', () => {
  it('valorComCasas arredonda, não deixa negativo e mantém o vazio', () => {
    expect(valorComCasas(12.34, 1)).toBe(12.3);
    expect(valorComCasas(12.35, 1)).toBe(12.4);
    expect(valorComCasas(7.9, 0)).toBe(8);
    expect(valorComCasas(-3, 1)).toBe(0);
    expect(valorComCasas('', 1)).toBe('');
    expect(valorComCasas(0, 1)).toBe(0);
  });
  it('erro de intervalo: 0 vale, negativo e acima do teto não', () => {
    expect(erroDeIntervalo(0, 100)).toBeUndefined();
    expect(erroDeIntervalo(100, 100)).toBeUndefined();
    expect(erroDeIntervalo(12.5, 100)).toBeUndefined();
    expect(erroDeIntervalo('', 100)).toBeUndefined();
    expect(erroDeIntervalo(100.1, 100)).toEqual({ k: 'Informe um número entre 0 e {n}.', vars: { n: 100 } });
    expect(erroDeIntervalo(-1, 100)?.k).toMatch(/entre 0 e/);
  });
});

describe('curva efetiva e crescimento do caso (MOT-13)', () => {
  it('ondas sem onda válida valem a curva linear, como no motor', () => {
    expect(curvaEfetiva({})).toBe('linear');
    expect(curvaEfetiva({ curva: 's' })).toBe('s');
    expect(curvaEfetiva({ curva: 'ondas', ondas: [] })).toBe('linear');
    expect(curvaEfetiva({ curva: 'ondas', ondas: [{ ano: 3, pct: 60 }] })).toBe('ondas');
    expect(horizonteDoCaso({})).toBe(3);
    expect(horizonteDoCaso({ horizonte: '5' })).toBe(5);
  });
  it('a curva efetiva do texto coincide com meta.curva do motor', () => {
    S().responder('horizonte', 5);
    S().refinar('curva', 'ondas');
    expect(numerosDe(S().estado()).av.r.cfg).toBeTruthy();
    S().refinar('ondas', [{ ano: 3, pct: 60 }]);
    expect(crescimentoDoCaso(S().estado().caso)).toEqual({ tipo: 'ondas', ondas: [{ ano: 3, pct: 60 }], patamar: 60 });
  });
  it('textoCrescimento: passos iguais, curva em S e ondas com anos e porcentagens', () => {
    expect(textoCrescimento({ curva: 'linear' })).toBe('o uso cresce em passos iguais');
    expect(textoCrescimento({ curva: 's' })).toMatch(/curva em S/);
    const o = textoCrescimento({ curva: 'ondas', ondas: [{ ano: 2, pct: 50 }, { ano: 4, pct: 100 }] });
    expect(o).toBe('o uso cresce em ondas (Ano 2: 50%; Ano 4: 100%)');
    expect(textoCrescimento({ curva: 'ondas', ondas: [{ ano: 2, pct: 50 }, { ano: 4, pct: 80 }] })).toMatch(/80% das pessoas da rede/);
  });
});

describe('MOT-13: sínteses dos capítulos', () => {
  it('capítulo 4 diz como o uso cresce, e com ondas não repete a meta do 4.1.2', () => {
    S().responder('expansao', '3anos');
    const p0 = sinteseCapitulo(4, S().estado()).paragrafos.join(' ');
    expect(p0).toMatch(/passos iguais/);
    expect(p0).toMatch(/a meta é chegar/);
    S().refinar('curva', 's');
    expect(sinteseCapitulo(4, S().estado()).paragrafos.join(' ')).toMatch(/curva em S/);
    S().refinar('curva', 'ondas');
    S().refinar('ondas', [{ ano: 2, pct: 50 }, { ano: 4, pct: 100 }]);
    const p1 = sinteseCapitulo(4, S().estado()).paragrafos.join(' ');
    expect(p1).toMatch(/Ano 2: 50%; Ano 4: 100%/);
    expect(p1).not.toMatch(/a meta é chegar/);
  });
  it('com a rede toda no primeiro ano não há curva para descrever', () => {
    S().responder('expansao', 'ano1');
    expect(sinteseCapitulo(4, S().estado()).paragrafos.join(' ')).not.toMatch(/o uso cresce/);
  });
  it('fases: capítulos 2 e 3 dizem a parte única e a recorrente, o 4 o custo da expansão; a soma das partes é 100%', () => {
    const av = numerosDe(S().estado()).av;
    const f2 = fraseDaFase(2, av.fases), f3 = fraseDaFase(3, av.fases), f4 = fraseDaFase(4, av.fases);
    expect(f2).toMatch(/prova de conceito ou piloto/);
    expect(f3).toMatch(/implantação/);
    expect(f4).toMatch(/expansão \(Anos 2 a 3\)/);
    expect(f4).toMatch(/pagamento único/);
    const p = av.fases.porFase.piloto;
    expect(p.unico + p.recorrente).toBeCloseTo(p.total, 6);
    expect(sinteseCapitulo(2, S().estado()).paragrafos.join(' ')).toContain(f2);
    expect(sinteseCapitulo(4, S().estado()).paragrafos.join(' ')).toContain(f4);
    expect(fraseDaFase(1, av.fases)).toBe('');
    expect(fraseDaFase(2, undefined)).toBe('');
  });
  it('horizonte de 1 ano não tem Expansão: o capítulo 4 não inventa a frase', () => {
    S().carregarExemplo('B');
    S().responder('horizonte', 1);
    const fs = numerosDe(S().estado()).av.fases;
    expect(fs.porFase.expansao.anos.length).toBe(0);
    expect(fraseDaFase(4, fs)).toBe('');
  });
  it('sem números (caso em branco) a síntese não traz frase de fase', () => {
    S().carregarExemplo('novo');
    expect(sinteseCapitulo(2, S().estado()).paragrafos.join(' ')).not.toMatch(/pagamento único/);
  });
});

describe('MOT-09: pagamento único × recorrente por insumo', () => {
  it('pagamentoDaLinha: tudo único, tudo recorrente ou os dois', () => {
    expect(pagamentoDaLinha({ v: [100, 0, 0], vu: [100, 0, 0] })).toBe('unico');
    expect(pagamentoDaLinha({ v: [0, 50, 50], vu: [0, 0, 0] })).toBe('recorrente');
    expect(pagamentoDaLinha({ v: [100, 50, 50], vu: [100, 10, 0] })).toBe('misto');
    expect(pagamentoDaLinha({ v: [0, 0], vu: [0, 0] })).toBe('recorrente');
    expect(pagamentoDaLinha({})).toBe('recorrente');
    expect(etiquetasPagamento('misto').length).toBe(2);
    expect(etiquetasPagamento('unico')).toEqual(['Pagamento único']);
  });
  it('a árvore aberta traz uma etiqueta de pagamento em cada insumo e a classificação bate com o motor', () => {
    const r: any = resultados(cfgDe(S().estado()));
    expect(r.ok).toBe(true);
    const { linhas } = linhasArvore(r.av, r.ind, 'eco', todosAbertos());
    const insumos = linhas.filter((l) => l.nivel === 2);
    expect(insumos.length).toBeGreaterThan(5);
    insumos.forEach((l) => {
      expect(l.pagamento).toBeTruthy();
      expect(l.tags!.some((x) => x === 'Pagamento único' || x === 'Recorrente')).toBe(true);
    });
    // K3 (implantação e adaptação) é pagamento único; licenças (K2.1) são recorrentes
    const k3 = insumos.filter((l) => /^K3\./.test(l.id)); k3.forEach((l) => expect(l.pagamento).toBe('unico'));
    const k21 = insumos.filter((l) => /^K2\.1:/.test(l.id)); k21.forEach((l) => expect(l.pagamento).toBe('recorrente'));
  });
  it('o CSV ganha a coluna "Pagamento" e uma coluna de total por fase; o total econômico continua na última', () => {
    const csv = csvCustosMoeda(cfgDe(S().estado())).slice(1).split('\n');
    const cab = csv[0].split(';');
    expect(cab).toContain('"Pagamento"');
    expect(cab.slice(-4, -1).map((x) => x.replace(/"/g, ''))).toEqual(['Prova de conceito ou piloto (USD)', 'Implantação (USD)', 'Expansão (USD)']);
    const num = (x: string) => +x.replace(',', '.');
    csv.slice(1).forEach((l) => {
      const c = l.split(';');
      const fases = c.slice(-4, -1).map(num).reduce((a, b) => a + b, 0);
      expect(fases).toBeCloseTo(num(c[c.length - 1]), 1);   // as fases somam o total econômico da linha
      expect(c.length).toBe(cab.length);
    });
    // a soma das fases do CSV é o custo total, como a tabela do Refinar
    const av = numerosDe(S().estado()).av;
    const soma = csv.slice(1).reduce((s, l) => s + num(l.split(';').at(-1)!), 0);
    expect(soma).toBeCloseTo(av.ctEco + av.vr, -1);
  });
});

describe('MOT-10: custo por fase na calculadora', () => {
  it('a tabela de fases soma o custo total e o único + recorrente de cada fase', () => {
    const av = numerosDe(S().estado()).av;
    const tab = tabelaFases(av)!;
    expect(tab.linhas.map((l) => l.id)).toEqual(['piloto', 'implantacao', 'expansao']);
    expect(tab.linhas.reduce((s, l) => s + l.total, 0)).toBeCloseTo(av.ctEco, 4);
    tab.linhas.forEach((l) => expect(l.unico + l.recorrente).toBeCloseTo(l.total, 4));
    expect(tab.total.total).toBeCloseTo(av.ctEco, 4);
    expect(tab.total.pessoas).toBe(Math.max(...tab.linhas.map((l) => l.pessoas)));   // máximo, não a soma
    expect(tab.linhas[2].rotuloAnos).toBe('Anos 2 a 3');
    expect(tab.linhas[0].rotuloAnos).toBe('Ano 0');
    expect(tab.linhas[0].pUnico).toBeGreaterThan(0);
  });
  // R7 (seção 8, E2 e E3): o piloto do B sobe US$ 57 mil (K3.4 12 mil + K5.4 45 mil); implantação e expansão não mudam
  it('referência do exemplo B (H=3): piloto 393.234 (era 336.234) e implantação 416.803', () => {
    const tab = tabelaFases(numerosDe(S().estado()).av)!;
    expect(tab.linhas[0].total).toBeCloseTo(393234, -1);
    expect(tab.linhas[0].unico).toBeCloseTo(239880, -1);   // R7: 227.880 + 12 mil de K3.4 (único); K5.4 é recorrente
    expect(tab.linhas[1].total).toBeCloseTo(416803, -1);
    expect(tab.linhas[2].total).toBeCloseTo(1017095, -1);
    expect(tab.total.total).toBeCloseTo(1827133, -1);
  });
  it('detalhe por camada e por componente: cada coluna soma o total da fase', () => {
    const av = numerosDe(S().estado()).av;
    (['camada', 'componente'] as const).forEach((tipo) => {
      const d = detalhePorFase(av, tipo)!;
      expect(d.linhas.length).toBeGreaterThan(2);
      d.fases.forEach((f) => {
        const col = d.linhas.reduce((s, l) => s + l.porFase[f.id], 0);
        expect(col, tipo + ' ' + f.id).toBeCloseTo(av.fases.porFase[f.id].total, 4);
      });
      expect(d.linhas.reduce((s, l) => s + l.total, 0)).toBeCloseTo(av.ctEco, 4);
    });
    expect(detalhePorFase(av, 'camada')!.linhas.length).toBeLessThanOrEqual(7);
    expect(detalhePorFase(av, 'componente')!.linhas.length).toBeLessThanOrEqual(6);
  });
  it('horizonte de 1 ano: a fase sem anos some da tabela e do detalhe', () => {
    S().responder('horizonte', 1);
    const av = numerosDe(S().estado()).av;
    const tab = tabelaFases(av)!;
    expect(tab.linhas.map((l) => l.id)).toEqual(['piloto', 'implantacao']);
    expect(detalhePorFase(av, 'camada')!.fases.map((f) => f.id)).toEqual(['piloto', 'implantacao']);
    expect(tab.total.total).toBeCloseTo(av.ctEco, 4);
  });
  it('sem av.fases devolve null (cfg antiga ou resultado quebrado)', () => {
    expect(tabelaFases(undefined)).toBeNull();
    expect(tabelaFases({})).toBeNull();
    expect(detalhePorFase({}, 'camada')).toBeNull();
  });
});

describe('MOT-12: foco dos números do motor', () => {
  it('os KPIs novos levam à seção ou ao campo da premissa', () => {
    expect(focoNormal('kpi.fases')).toBe('fases');
    expect(abaDoFoco('kpi.fases')).toBe('cenarios');
    expect(focoNormal('kpi.unicoRecorrente')).toBe('fases');
    expect(abaDoFoco('kpi.regime')).toBe('cenarios');
    expect(focoNormal('kpi.curva')).toBe('demanda.E');
    expect(abaDoFoco('kpi.curva')).toBe('premissas');
    expect(candidatosFoco('kpi.curva')).toEqual(['rf-demanda.E', 'rf-demanda']);
    expect(focoNormal('kpi.reposicao')).toBe('reposicao.ciclo');
    expect(abaDoFoco('kpi.reposicao')).toBe('premissas');
    expect(focoNormal('kpi.rotatividade')).toBe('formacaoTempo');
    // os que já existiam continuam iguais
    expect(focoNormal('kpi.total')).toBe('contas');
    expect(abaDoFoco('kpi.porAluno')).toBe('cenarios');
  });
  it('FONTES_MOTOR aponta a pergunta (curva → 4.1.4/4.1.5, reposição → 4.1.6) ou a nota da convenção', () => {
    expect(fonteMotor('curva')!.campos).toEqual(['curva', 'ondas']);
    expect(fonteMotor('reposicao')!.campos).toEqual(['reposicaoDisp']);
    expect(fonteMotor('rotatividade')!.campos).toEqual(['rotacaoFormacao']);
    expect(fonteMotor('fases')!.campos).toEqual([]);
    expect(fonteMotor('fases')!.nota).toMatch(/Ano 0/);
    expect(fonteMotor('unicoRecorrente')!.nota).toMatch(/pagamento único/);
    expect(fonteMotor('nao-existe')).toBeNull();
    Object.values(FONTES_MOTOR).forEach((f) => f.campos.forEach((c) => expect((CAMPO_POR_ID as any)[c], c).toBeTruthy()));
  });
});

describe('MOT-11: edição da cfg (reposição e rotatividade no modo razão)', () => {
  it('editarCfg de reposicao.ciclo liga a reposição e null a desliga; o caso fica pendente ao mudar a resposta', () => {
    S().editarCfg('reposicao.ciclo', 3);
    expect(S().custo.cfg.reposicao.ciclo).toBe(3);
    S().editarCfg('reposicao.ciclo', null);
    expect(S().custo.cfg.reposicao.ciclo).toBeNull();
    const av = avaliar(calcular(cfgDe(S().estado())));
    expect(av.ctEco).toBeGreaterThan(0);
    // CUS-10: mudar uma das respostas 4.1.4 a 4.1.7 com a cfg editada pede escolha, não descarta em silêncio
    S().refinar('reposicaoDisp', '5');
    expect(S().custo.cfg).toBeTruthy();
    expect((S().custo as any).pendente).toBe(true);
  });
  it('rotEstoque em branco (null) reproduz a v13 e um valor liga o modelo novo (exemplo B)', () => {
    S().responder('horizonte', 5);
    const emBranco = ctEco();
    S().editarCfg('formacaoTempo.rotEstoque', 0.1);
    const comValor = numerosDe(S().estado()).av.ctEco as number;
    expect(comValor).toBeLessThan(emBranco);
    expect(comValor).toBeCloseTo(2446214, -1);   // MOT.md: B, H=5, 10% digitado (2.389.214; R7: + 57 mil no Ano 0)
    S().editarCfg('formacaoTempo.rotEstoque', null);
    expect(numerosDe(S().estado()).av.ctEco).toBeCloseTo(emBranco, 0);
  });
});
