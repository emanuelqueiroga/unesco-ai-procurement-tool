import { telasAtivas, telasDoCapitulo, telaRespondida, type Capitulo, type Estado14 } from '../store';
import { camposLetramento, campoLitRespondido, publicosLetramento, orcamentoLetramento, rotuloLit, somenteCurriculoLit, type CampoLit } from './letramento';
import { t } from './textos';
import { href } from './rota';

export function entradaEtapaLit(s: Estado14, n: Capitulo): string {
  const telas = telasDoCapitulo(n, s);
  const alvo = telas.find(q => !telaRespondida(s, q)) || telas[0];
  return alvo ? href.pergunta(alvo.capitulo, alvo.id) : href.plano();
}

/** Sequência contínua: atravessa as etapas sem uma segunda abertura ou síntese vazia. */
export function vizinhosLit(s: Estado14, id: string) {
  const telas = telasAtivas(s), i = telas.findIndex(q => q.id === id);
  const link = (q: typeof telas[number] | undefined, fim: string) => q ? href.pergunta(q.capitulo, q.id) : fim;
  return { anterior: telas[i - 1]?.id === 'prioridades' && s.ctx.prioridades?.length > 1 ? href.frentes() : link(telas[i - 1], href.inicio()), proxima: link(telas[i + 1], href.plano()) };
}

export function selecionarLit(ids: string[], id: string, on: boolean, multipla = false): string[] {
  if (!on) return ids.filter(x => x !== id);
  return !multipla || ['_pendente', 'nenhum', 'nao'].includes(id) ? [id]
    : [...ids.filter(x => !['_pendente', 'nenhum', 'nao', id].includes(x)), id];
}

export interface GrupoCamposLit { id: string; titulo?: string; campos: CampoLit[]; recolhivel?: boolean }
/** Retira somente o público já identificado pelo cartão; mantém o nome de cada subgrupo. */
export function rotuloVisivelLit(f: CampoLit, contexto?: string) {
  const label = rotuloLit(f.label), sufixo = contexto ? ' · ' + t(contexto) : '';
  return sufixo && label.endsWith(sufixo) ? label.slice(0, -sufixo.length) : label;
}
/** Mantém a ordem dos públicos, reúne seus campos e deixa decisões gerais fora dos cartões de cada público. */
export function gruposCamposLit(s: Estado14, tela: string): GrupoCamposLit[] {
  const campos = camposLetramento(s).filter(f => f.tela === tela && !f.caminho.startsWith('orcamento.adicionais.'));
  const pubs = publicosLetramento(s), grupos: GrupoCamposLit[] = [];
  const atribuidos = new Set<string>();
  const grupo = (id: string, titulo: string | undefined, escolher: (f: CampoLit) => boolean, recolhivel = false) => {
    const fs = campos.filter(f => !atribuidos.has(f.caminho) && escolher(f));
    fs.forEach(f => atribuidos.add(f.caminho));
    if (fs.length) grupos.push({ id, titulo, campos: fs, recolhivel });
  };
  if (tela === 'lit-alcance') grupo('escolas', 'Escolas atendidas', f => ['alcance.etapas', 'alcance.escolas'].includes(f.caminho));
  if (tela === 'lit-oferta') grupo('geral', undefined, f => !f.caminho.startsWith('publicos.'));
  for (const p of pubs) grupo(p.id, p.nome, f => f.caminho.startsWith(`publicos.${p.id}.`) || f.caminho.startsWith(`acoes.${p.id}.`)
    || p.id === 'A15' && f.caminho === 'alcance.superior', pubs.length > 1);
  if (tela === 'lit-acoes') grupo('curriculo', 'Currículo nacional de IA', f => f.caminho.startsWith('acoes.curriculo.'), pubs.length > 0);
  grupo('comum', tela === 'lit-alcance' ? 'Participação e inclusão' : undefined, () => true);
  return grupos;
}

export function pendenciasCamposLit(s: Estado14, tela: string) {
  return camposLetramento(s).filter(f => f.tela === tela && !campoLitRespondido(s, f));
}
export function pendenciasCustosLit(s: Estado14, tela: string) {
  return tela === 'lit-recursos' ? orcamentoLetramento(s).itens.filter(i => !i.respondido) : [];
}

export const GUIAS_LIT: Record<string, string> = {
  'lit-alcance': 'Defina quem será atendido. Informe os números exatos ou marque o que ainda precisa levantar.',
  'lit-diagnostico': 'Selecione o que já existe e as lacunas que o programa deve enfrentar.',
  'lit-desenho': 'Escolha o que cada público precisa aprender e como demonstrará essa aprendizagem.',
  'lit-curriculo': 'Defina a abrangência, a progressão e a elaboração do currículo de IA.',
  'lit-oferta': 'Escolha como realizar a formação. As próximas perguntas se ajustam aos recursos selecionados.',
  'lit-acoes': 'Organize as ações de cada público e do currículo, com responsáveis e prazos.',
  'lit-validacao': 'Defina uma validação pedagógica de cursos ou materiais. Esta etapa não é um teste de contratação.',
  'lit-digital': 'Defina apenas as condições digitais necessárias às atividades escolhidas.',
  'lit-projeto': 'Confirme se existe um projeto de uso de IA. Ele terá ações e orçamento separados.',
  'lit-recursos': 'Revise cada categoria. Valores desconhecidos ficam pendentes e não são tratados como zero.',
  'lit-revisao': 'Escolha como acompanhar a aprendizagem e quando revisar o programa.',
};

export function guiaTelaLit(s: Estado14, id: string) {
  const curriculo: Record<string,string> = {
    'lit-desenho': 'Escolha as abordagens de aprendizagem e os cuidados que orientarão o currículo.',
    'lit-oferta': 'Defina a equipe, os materiais e os recursos para elaborar e apoiar o currículo.',
    'lit-acoes': 'Defina os responsáveis, os prazos e os marcos do currículo nacional.',
    'lit-revisao': 'Escolha como acompanhar a implementação e a atualização do currículo.',
  };
  return somenteCurriculoLit(s) && curriculo[id] || GUIAS_LIT[id];
}
