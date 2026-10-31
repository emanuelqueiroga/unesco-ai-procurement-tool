import { beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { gerarBrief } from '../../src/plano/pdf_brief.js';
import { gerarPDF } from '../../src/plano/pdf.js';
import { useCaso, faltamDe, telasAtivas, telaRespondida, migrar } from '../../src/store';
import { setLang, tamanhoRedeValido } from '../../src/domain';
import { presetGovernanca, textoSelecaoGov, valorGov, contextoGovProjetado } from '../../src/percurso/governancaPresets';
import { planoGovernanca, governancaRespondida, orcamentoGovernanca, CUSTOS_GOV } from '../../src/percurso/governanca';
import { capitulosNav } from '../../src/screens/Shell';
import { tituloDaAba } from '../../src/screens/transversal';
import { dadosCaso } from '../../src/export/json';
import { usarIdioma } from '../../src/i18n';
const S=()=>useCaso.getState();
function escolher(campo:string, ids?:string[]) {
 const s=S(), selected=ids || [presetGovernanca(s,campo).opcoes[0].id];
 s.responder('govSelecoes',{...s.ctx.govSelecoes,[campo]:selected});
 S().responder(campo,textoSelecaoGov(S(),campo,selected,''));
}
function contexto() {
 S().escolherPais('BRA');S().responder('prioridades',['governar']);S().responder('problemas',['G11','G16']);
 S().responder('redeNacional',{escolas:12345,estudantes:1600000});
}
beforeEach(()=>{setLang('pt');S().carregarExemplo('novo');});
describe('v015: sugestões e seleção sem redação obrigatória',()=>{
 it('antes da prioridade, só revela país e prioridades, sem antecipar os percursos',()=>{
  const nav=capitulosNav(S(),{capitulo:1,tela:'prioridades'});
  expect(nav.map(n=>n.n)).toEqual([1]);expect(nav[0].questions?.map(q=>q.id)).toEqual(['local','prioridades']);
  expect(tituloDaAba({tipo:'pergunta',n:1,tela:'prioridades'},S())).not.toContain('23');
  contexto();expect(capitulosNav(S(),{}).map(n=>n.title)).toEqual(['Contexto','Diagnóstico institucional','Plano de ação e recursos','Acompanhamento e revisão']);
  S().responder('prioridades',['com']);expect(capitulosNav(S(),{})[1].title).toBe('Prova de conceito ou piloto');
 });
 it('resultados, instrumentos, entregas e indicadores variam conforme os desafios',()=>{
  contexto();
  expect(presetGovernanca(S(),'govDiagnostico.resultado').opcoes.map(o=>o.id)).toContain('G16');
  expect(presetGovernanca(S(),'govAcoes.G11.entrega').opcoes[0].texto).toContain('regulamentação');
  expect(presetGovernanca(S(),'govInstrumentos.G16.instrumento').opcoes[0].texto).toContain('crianças');
  S().responder('problemas',['G13']);expect(presetGovernanca(S(),'govRevisao.indicadores').opcoes.map(o=>o.id)).toEqual(expect.arrayContaining(['G13']));
  expect(presetGovernanca(S(),'govDiagnostico.resultado').opcoes.map(o=>o.id)).not.toContain('G16');
 });
 it('IDs não trocam de significado quando os desafios mudam',()=>{
  contexto();const antes=presetGovernanca(S(),'govCapacidade.formacao').opcoes;
  S().responder('problemas',['G13']);const depois=presetGovernanca(S(),'govCapacidade.formacao').opcoes;
  for(const a of antes) { const mesma=depois.find(b=>b.id===a.id);if(mesma)expect(mesma.texto).toBe(a.texto); }
 });
 it('completa as demais perguntas escolhendo opções, com os totais exatos da rede informados',()=>{
  contexto();
  for(const k of ['atual','resultado','linhaBase','fonte'])escolher('govDiagnostico.'+k);
  for(const id of ['G11','G16']) {
   S().responder('govInstrumentos.'+id+'.situacao','ausente');
   for(const k of ['responsavel','lacuna'])escolher('govInstrumentos.'+id+'.'+k);
   for(const k of ['entrega','responsavel','prazo','marco','indicador'])escolher('govAcoes.'+id+'.'+k);
  }
  S().responder('govSolucoes.instrumentos',['Regulamentação']);escolher('govSolucoes.justificativa');
  for(const k of ['coordenacao','instituicoes','grupos','participacao'])escolher('govAtores.'+k);
  for(const k of ['equipe','formacao','orientacao','supervisao','incidentes'])escolher('govCapacidade.'+k);
  for(const k of ['periodo','fonte'])escolher('govOrcamento.'+k);
  for(const [id] of CUSTOS_GOV)S().responder('govOrcamento.itens.'+id+'.situacao','a_estimar');
  for(const k of ['indicadores','responsavel','periodicidade','data','alcance','progresso','canal'])escolher('govRevisao.'+k);
  expect(faltamDe(S()).map(t=>t.id)).toEqual([]);
  const p=planoGovernanca(S());expect(p.orcamento.total).toBeNull();expect(p.orcamento.informados).toBe(0);
  expect(p.proxima).not.toContain('Submeta');expect(p.pendentes).toBeGreaterThan(0);
  expect(p.blocos[0].linhas.find(l=>l.rotulo==='Total de escolas')?.valor).toBe('12.345');
 });
 it('exige totais exatos; uma faixa antiga não substitui escolas e estudantes',()=>{
  contexto();S().responder('redeNacional',{faixaEscolas:'10001a50000',faixaEstudantes:'1000001a10000000'});
  expect(tamanhoRedeValido(S().ctx)).toBe(false);
  expect(faltamDe(S()).some(t=>t.id==='problemas')).toBe(true);
  const p=planoGovernanca(S());expect(JSON.stringify(p)).not.toContain('NaN');
  const total=p.blocos[0].linhas.find(l=>l.rotulo==='Total de escolas');expect(total?.valor).toBe('Não informado');
  expect(orcamentoGovernanca(S()).total).toBeNull();
 });
 it('um clique em custo desconhecido não apaga o valor previamente informado',()=>{
  contexto();S().responder('govOrcamento.itens.equipe.valor',1200);S().responder('govOrcamento.itens.equipe.situacao','a_estimar');
  expect(orcamentoGovernanca(S()).informados).toBe(0);expect(S().ctx.govOrcamento.itens.equipe.valor).toBe(1200);
  S().responder('govOrcamento.itens.equipe.situacao','sem_custo');expect(orcamentoGovernanca(S()).itens[0].valor).toBe(0);
  S().responder('govOrcamento.itens.equipe.situacao','informado');expect(orcamentoGovernanca(S()).itens[0].valor).toBe(1200);
 });
 it('preserva informação livre, seleções e custos no JSON',()=>{
  contexto();escolher('govDiagnostico.atual');S().responder('govDetalhes',{'govDiagnostico.atual':'Observação anterior'});
  const e=migrar(dadosCaso(S()));expect(e.ctx.govSelecoes).toEqual(S().ctx.govSelecoes);
  expect(valorGov(e,'govDiagnostico.atual')).toContain('Observação anterior');
  const antes=JSON.stringify(e.ctx);contextoGovProjetado(e);expect(JSON.stringify(e.ctx)).toBe(antes);
 });
 it('não leva uma sugestão de um desafio removido para outro desafio',()=>{
  contexto();escolher('govDiagnostico.resultado',['G16']);S().responder('problemas',['G13']);
  expect(valorGov(S(),'govDiagnostico.resultado')).toBe('');expect(governancaRespondida(S(),'gov-diagnostico')).toBe(false);
  expect(S().ctx.govSelecoes['govDiagnostico.resultado']).toEqual(['G16']);
 });
 it('traduz seleções por ID quando muda o idioma, preservando as notas da pessoa',async()=>{
  contexto();escolher('govAcoes.G11.prazo');S().responder('govDetalhes',{'govAcoes.G11.prazo':'Nota pessoal'});
  await usarIdioma('en');expect(valorGov(S(),'govAcoes.G11.prazo')).toContain('Within 3 months');
  expect(valorGov(S(),'govAcoes.G11.prazo')).toContain('Nota pessoal');
  await usarIdioma('pt');
 });
 it('exporta as seleções e notas nos dois PDFs', async () => {
  contexto();
  for (const k of ['atual', 'resultado', 'linhaBase', 'fonte']) escolher('govDiagnostico.' + k);
  for (const k of ['entrega', 'responsavel', 'prazo', 'marco', 'indicador']) escolher('govAcoes.G11.' + k);
  S().responder('govDetalhes', { 'govDiagnostico.fonte': 'Nota sintética para verificar a preservação das informações.' });
  const a = await gerarBrief(S(), { fontes: null }), b = await gerarPDF(S(), { fontes: null });
  expect(a.getNumberOfPages()).toBeGreaterThan(1);
  expect(b.getNumberOfPages()).toBeGreaterThanOrEqual(a.getNumberOfPages());
  if (process.env.V015_PRESET_QA) {
   const dir = process.env.V015_PRESET_QA;
   mkdirSync(dir, { recursive: true });
   writeFileSync(dir + '/brief-presets.pdf', Buffer.from(a.output('arraybuffer')));
   writeFileSync(dir + '/anexo-presets.pdf', Buffer.from(b.output('arraybuffer')));
   writeFileSync(dir + '/modelo.json', JSON.stringify(planoGovernanca(S()), null, 2));
  }
 });
});
