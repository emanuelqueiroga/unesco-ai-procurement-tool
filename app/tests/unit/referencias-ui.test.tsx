// REF-06, REF-08: o controle do país e o bloco "Dados do país" montam sem erro (renderToString, sem DOM) e mostram
// os países, "Outro país ou não listado", os 9 campos do perfil e "sem dado" onde a base não tem valor.
// (No servidor, o zustand lê o estado inicial do store: as marcas de origem com valores editados estão testadas em
// referencias.test.js, por perfilDoPais e valorEfetivoCampo.)
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { useCaso } from '../../src/store/caso';
import { Pais, textoNotaPais } from '../../src/percurso/Pais';
import { DadosPais } from '../../src/screens/refinar/DadosPais';

const S = () => useCaso.getState();
beforeEach(() => { S().carregarExemplo('novo'); });

describe('país e dados do país na interface', () => {
  it('seletor com todos os países e "outro"; nota com moeda, região e renda', () => {
    const html = renderToString(<Pais />);
    ['BRA', 'MEX', 'KEN', 'MAR', 'IDN', 'outro'].forEach((v) => expect(html).toContain(`value="${v}"`));
    expect(html).toContain('Planejamento no nível do país.');
    expect(html).toContain('value="CAN"');
    expect(html).toContain('value="USA"');
    expect(html).toContain('value="AGO"');
    expect(textoNotaPais('BRA')).toMatch(/^Moeda do país: BRL · .+\.( 1 US\$ = .+ BRL\.)? Região: América Latina e Caribe\. Grupo de renda: renda média-alta \(Banco Mundial, a verificar\)\.$/);
    expect(textoNotaPais('')).toBe('Selecione o país para iniciar o planejamento nacional.');
    expect(textoNotaPais('outro')).toMatch(/^Sem dados de país/);
  });
  it('"Dados do país" aberto: 9 campos, 7 "sem dado" e inflação e desconto com valor ilustrativo; fechado por padrão', () => {
    const html = renderToString(<DadosPais aberto />);
    expect((html.match(/rf-dpais-item/g) || []).length).toBe(9);
    expect((html.match(/sem dado/g) || []).length).toBe(7);
    expect((html.match(/valor ilustrativo/g) || []).length).toBe(2);
    expect(html).toContain('aria-expanded="true"');
    const fechado = renderToString(<DadosPais />);
    expect(fechado).toContain('aria-expanded="false"');
    expect(fechado).not.toContain('rf-dpais-item');
  });
});
