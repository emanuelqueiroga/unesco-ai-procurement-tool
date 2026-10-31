// Modelo nacional de formação/currículo. Seleções são intenções declaradas, nunca evidências presumidas.
import { PRIORIDADES, ETAPAS_ENS, LOC, nomePais, paisDoCaso } from '../domain';
import { orcamentoGovernanca, moedaGovernanca } from './governanca';
import { t } from './textos';
import type { Estado14 } from '../store/tipos';
type Estado = Pick<Estado14, 'ctx'>;
export interface OpcaoLit { id: string; texto: string }
export interface CampoLit { caminho: string; tela: string; label: string; opcoes?: OpcaoLit[]; multipla?: boolean; numero?: 'inteiro'|'decimal'; evidencia?: boolean }
export const L = (pt: string, _en: string) => pt;
const o = (id: string, pt: string, _en: string): OpcaoLit => ({ id, texto: pt });
const PENDENTE = o('_pendente', 'Informação a levantar', 'Information to collect');
const DONOS = [o('ministerio','Ministério da Educação','Ministry of Education'),o('curriculo','Autoridade curricular','Curriculum authority'),o('formacao','Área de formação','Training department'),o('superior','Instituições de ensino superior','Higher education institutions'),o('escolas','Equipes escolares','School teams'),o('parceiros','Instituições parceiras','Partner institutions')];
export { TITULOS_LIT } from './letramentoTitulos';
import { TITULOS_LIT } from './letramentoTitulos';
export const TEMAS_LIT: Record<string, { nome: string; competencias: OpcaoLit[] }> = {
 A11: { nome:L('Professores','Teachers'), competencias:[o('fundamentos','Explicar fundamentos e limites da IA','Explain AI foundations and limitations'),o('ensinar','Planejar o ensino sobre IA','Plan teaching about AI'),o('avaliar','Avaliar criticamente materiais e respostas de IA','Critically assess AI materials and outputs')] },
 A12: { nome:L('Estudantes','Students'), competencias:[o('fundamentos','Compreender como a IA funciona e erra','Understand how AI works and makes mistakes'),o('critica','Analisar criticamente informações e vieses','Critically analyse information and bias'),o('criar','Criar e explicar projetos sobre IA','Create and explain projects about AI')] },
 A13: { nome:L('Formuladores de políticas e equipes técnicas','Policy makers and staff'), competencias:[o('evidencias','Avaliar evidências e propostas sobre IA','Assess AI evidence and proposals'),o('decisoes','Tomar decisões públicas informadas sobre IA','Make informed public decisions about AI'),o('direitos','Reconhecer limites, direitos e riscos da IA','Recognise AI limitations, rights and risks')] },
 A14: { nome:L('Diretores escolares','School principals'), competencias:[o('liderar','Liderar o uso responsável de IA na escola','Lead responsible AI use at school'),o('apoiar','Apoiar professores e comunicar com famílias','Support teachers and communicate with families'),o('avaliar','Avaliar propostas e riscos no contexto escolar','Assess proposals and risks in the school context')] },
 A15: { nome:L('Estudantes e egressos do ensino superior','Higher education students and graduates'), competencias:[o('critica','Analisar aplicações e impactos da IA na área de estudo','Analyse AI applications and impacts in the field of study'),o('pesquisa','Avaliar evidências, autoria e integridade acadêmica','Assess evidence, authorship and academic integrity'),o('continuada','Aplicar conhecimentos de IA na formação continuada','Apply AI knowledge in lifelong learning')] },
};
const curriculo = (s: Estado) => idsTemas(s).some(id => ['A16','A3'].includes(id));
const idsTemas = (s: Estado): string[] => { const permitidos = new Set((PRIORIDADES as any[]).find(p=>p.id==='sobre').problemas.map((q:any)=>q.id)); return [...new Set<string>((s.ctx.problemas || []).filter((id:string)=>permitidos.has(id)))]; };
export function publicosLetramento(s: Estado) {
 const cat = (PRIORIDADES as any[]).find(p => p.id === 'sobre').problemas;
 return idsTemas(s).filter(id => !['A16','A3'].includes(id)).map(id => ({ id, ...(TEMAS_LIT[id] || { nome: cat.find((q: any) => q.id === id)?.t || id, competencias:TEMAS_LIT.A12.competencias }) }));
}
export function lerLit(s: Estado, caminho: string): any { return caminho.split('.').reduce((v,k) => v?.[k], s.ctx.letramento); }
export function alterarLit(base: any, caminho: string, valor: any): any {
 const ks = caminho.split('.'); if (ks.some(k => !k || ['__proto__','prototype','constructor'].includes(k))) throw new Error('Campo inválido');
 const raiz = { ...(base || {}) }; let alvo = raiz, origem = base;
 ks.forEach((k,i) => { if (i === ks.length - 1) alvo[k] = valor; else { alvo[k] = { ...(origem?.[k] || {}) }; alvo = alvo[k]; origem = origem?.[k]; } });
 return raiz;
}
export const selecoesLit = (s:Estado,caminho:string):string[] => { const v=lerLit(s,caminho)?.escolhas; return Array.isArray(v)?v.filter(id=>typeof id==='string'):[]; };
const inclui = (s: Estado, caminho: string, valor: string) => selecoesLit(s,caminho).includes(valor);
const adicionaisAtivos = (s:Estado) => Object.keys(lerLit(s,'orcamento.adicionais')||{}).filter(id=>/^adicional-[1-9]\d*$/.test(id));
export const digitalLit = (s: Estado) => ['online','hibrida'].some(id => inclui(s,'oferta.modalidade',id)) || ['materiais','plataforma','ia'].some(id => inclui(s,'oferta.recursos',id));
export function telasLetramento(s: Estado): string[] {
 return ['local','prioridades','problemas','lit-alcance','lit-diagnostico','lit-desenho',...(curriculo(s) ? ['lit-curriculo'] : []),'lit-oferta','lit-acoes',...(inclui(s,'oferta.validacao','sim') ? ['lit-validacao'] : []),...(digitalLit(s) ? ['lit-digital'] : []),...(inclui(s,'oferta.recursos','ia') ? ['lit-projeto'] : []),'lit-recursos','lit-revisao'];
}
export function camposLetramento(s: Estado): CampoLit[] {
 const campos: CampoLit[] = [];
 const f = (tela: string,caminho: string,label: string,opcoes: OpcaoLit[],multipla=false,evidencia=false) => campos.push({tela,caminho,label,opcoes:[...opcoes,PENDENTE],multipla,evidencia});
 const n = (tela:string,caminho:string,label:string,numero:'inteiro'|'decimal'='inteiro') => campos.push({tela,caminho,label,numero});
 const pubs=publicosLetramento(s);
 if (pubs.some(p => ['A12','A1','A4','A5','A6','A9','A10'].includes(p.id))) {
  f('lit-alcance','alcance.etapas',L('Etapas atendidas','Education levels served'),(ETAPAS_ENS as any[]).filter(([id]:string[])=>id!=='superior').map(([id,nome]:string[])=>({id,texto:nome})),true);
  n('lit-alcance','alcance.escolas',L('Total exato de escolas atendidas','Exact number of schools served'));
 }
 for (const p of pubs) {
  n('lit-alcance',`publicos.${p.id}.elegiveis`,(p.id==='A12'?L('Total exato de estudantes no público-alvo','Exact number of students in the target population'):L('Público elegível','Eligible audience'))+' · '+t(p.nome));
  n('lit-alcance',`publicos.${p.id}.participantes`,L('Participantes previstos','Planned participants')+' · '+t(p.nome));
 }
 if (pubs.length>1) n('lit-alcance','alcance.totalUnico',L('Total de participantes distintos, sem contar a mesma pessoa duas vezes','Total unique participants, counting each person once'));
 if (pubs.some(p=>p.id==='A15')) f('lit-alcance','alcance.superior',L('Grupos do ensino superior e egressos','Higher education and graduate groups'),[o('graduacao','Graduação','Undergraduate students'),o('pos','Pós-graduação','Postgraduate students'),o('egressos','Egressos','Graduates')],true);
 if (pubs.some(p=>p.id==='A15')) for(const [id,nome] of [['graduacao',L('Graduação','Undergraduate students')],['pos',L('Pós-graduação','Postgraduate students')],['egressos',L('Egressos','Graduates')]]) if(inclui(s,'alcance.superior',id)) n('lit-alcance',`publicos.A15.subgrupos.${id}`,L('Participantes por subgrupo','Participants by subgroup')+' · '+t(nome));
 f('lit-alcance','alcance.inclusao',L('Condições de inclusão e participação','Conditions for inclusion and participation'),[o('acessibilidade','Acessibilidade e adaptações','Accessibility and accommodations'),o('linguas','Línguas locais','Local languages'),o('territorio','Áreas rurais e remotas','Rural and remote areas'),o('horarios','Horários e liberação para participar','Schedules and time to participate'),o('avaliado','Condições já avaliadas','Conditions already assessed')],true);
 f('lit-diagnostico','diagnostico.situacao',L('Situação do programa','Programme status'),[o('nenhum','Ainda não existe programa','No programme yet'),o('isoladas','Há ações isoladas','Isolated activities exist'),o('elaboracao','Programa em elaboração','Programme under development'),o('existente','Programa existente a revisar','Existing programme to review')]);
 f('lit-diagnostico','diagnostico.base',L('Diagnóstico das competências atuais','Assessment of current competencies'),[o('nenhum','Diagnóstico ainda não realizado','Assessment not yet conducted'),o('andamento','Diagnóstico em andamento','Assessment in progress'),o('parcial','Diagnóstico parcial disponível','Partial assessment available'),o('completo','Diagnóstico disponível','Assessment available')]);
 f('lit-diagnostico','diagnostico.evidencias',L('Fontes e instrumentos do diagnóstico','Assessment sources and instruments'),[o('questionario','Questionário de competências','Competency questionnaire'),o('pratica','Atividades e tarefas práticas','Practical activities and tasks'),o('inventario','Inventário de cursos e materiais','Course and materials inventory'),o('consulta','Consulta aos públicos selecionados','Consultation with selected audiences'),o('documentos','Documentos oficiais','Official documents')],true,true);
 f('lit-diagnostico','diagnostico.lacunas',L('Lacunas a enfrentar','Gaps to address'),[o('fundamentos','Conhecimentos básicos de IA','Basic AI knowledge'),o('critica','Pensamento crítico e verificação','Critical thinking and verification'),o('etica','Ética, direitos e proteção de dados','Ethics, rights and data protection'),o('materiais','Materiais acessíveis e contextualizados','Accessible and contextualised materials'),o('formadores','Disponibilidade de formadores','Availability of trainers')],true);
 for (const p of pubs) {
  f('lit-desenho',`publicos.${p.id}.objetivos`,L('Objetivos de aprendizagem','Learning objectives')+' · '+t(p.nome),p.competencias,true);
  f('lit-desenho',`publicos.${p.id}.avaliacao`,L('Como demonstrar as competências','How competencies will be demonstrated')+' · '+t(p.nome),[o('diagnostica','Comparação de atividades antes e depois','Compare activities before and after'),o('portfolio','Portfólio ou projeto aplicado','Portfolio or applied project'),o('casos','Análise de casos e decisões justificadas','Case analysis and justified decisions'),o('pratica','Demonstração prática com critérios','Practical demonstration against criteria')],true);
 }
 f('lit-desenho','desenho.abordagem',L('Abordagens de aprendizagem','Learning approaches'),[o('desplugada','Atividades desplugadas','Unplugged activities'),o('oficinas','Oficinas e situações-problema','Workshops and problem scenarios'),o('cursos','Cursos e percursos de aprendizagem','Courses and learning pathways'),o('integracao','Integração às atividades e componentes existentes','Integration into existing activities and subjects')],true);
 f('lit-desenho','desenho.salvaguardas',L('Salvaguardas da formação e do currículo','Safeguards for training and curriculum'),[o('dados','Proteção de dados dos participantes','Protection of participants’ data'),o('acesso','Participação acessível e contextualizada','Accessible and contextualised participation'),o('revisao','Revisão humana de materiais e avaliações','Human review of materials and assessments'),...(pubs.some(p=>p.id==='A12')?[o('criancas','Segurança e direitos de crianças e adolescentes','Safety and rights of children and adolescents')]:[])],true);
 if (curriculo(s)) {
  f('lit-curriculo','curriculo.situacao',L('Situação curricular','Curriculum status'),[o('novo','Elaborar currículo de IA','Develop an AI curriculum'),o('revisar','Revisar currículo existente','Review the existing curriculum'),o('integrar','Integrar IA ao currículo existente','Integrate AI into the existing curriculum')]);
  f('lit-curriculo','curriculo.etapas',L('Etapas abrangidas pelo currículo','Levels covered by the curriculum'),(ETAPAS_ENS as any[]).map(([id,nome]:string[])=>({id,texto:nome})),true);
  f('lit-curriculo','curriculo.progressao',L('Competências e progressão curricular','Competencies and curriculum progression'),[o('compreender','Compreender fundamentos e limites','Understand foundations and limitations'),o('analisar','Analisar ética, dados e impactos','Analyse ethics, data and impacts'),o('aplicar','Aplicar conhecimentos em atividades','Apply knowledge in activities'),o('criar','Criar e avaliar projetos progressivamente','Progressively create and assess projects')],true);
  f('lit-curriculo','curriculo.integracao',L('Forma de integração curricular','Form of curriculum integration'),[o('transversal','Integração transversal','Cross-curricular integration'),o('componente','Componente curricular específico','Dedicated curriculum subject'),o('combinada','Abordagem combinada','Combined approach')]);
  f('lit-curriculo','curriculo.participacao',L('Elaboração e participação','Development and participation'),[o('especialistas','Grupo de especialistas e professores','Expert and teacher group'),o('publica','Consulta pública','Public consultation'),o('estudantes','Escuta de estudantes com salvaguardas','Student consultation with safeguards'),o('superior','Participação de instituições formadoras','Participation of teacher education institutions')],true);
  f('lit-curriculo','curriculo.aprovacao',L('Instância responsável pela aprovação curricular','Body responsible for curriculum approval'),DONOS);
  f('lit-curriculo','curriculo.apoio',L('Apoio à implementação curricular','Support for curriculum implementation'),[o('guias','Guias e materiais didáticos','Guides and teaching materials'),o('formacao','Preparação dos professores','Teacher preparation'),o('orientacao','Orientação às instituições de ensino','Guidance for education institutions')],true);
 }
 f('lit-oferta','oferta.modalidade',L('Modalidade de realização','Delivery mode'),[o('presencial','Presencial','In person'),o('online','On-line','Online'),o('hibrida','Híbrida','Hybrid')]);
 f('lit-oferta','oferta.formadores',(pubs.length?L('Formadores e parceiros','Trainers and partners'):L('Equipe curricular e parceiros','Curriculum team and partners')),DONOS,true);
 f('lit-oferta','oferta.materiais',L('Materiais e apoio pedagógico','Materials and pedagogical support'),[o('abertos','Materiais educacionais abertos','Open educational resources'),o('adaptados','Adaptação e tradução de materiais','Adapt and translate materials'),o('novos','Produção de novos materiais','Develop new materials'),o('tutoria','Tutoria e comunidades de prática','Tutoring and communities of practice')],true);
 f('lit-oferta','oferta.validacao',L('Realizar validação pedagógica antes de ampliar?','Conduct pedagogical validation before expanding?'),[o('nao','Não nesta etapa','Not at this stage'),o('sim','Sim, validar curso ou material','Yes, validate a course or materials')]);
 f('lit-oferta','oferta.recursos',L('Recursos digitais necessários','Digital resources needed'),[o('nenhum','Sem recurso digital necessário','No digital resource needed'),o('materiais','Materiais digitais','Digital materials'),o('plataforma','Plataforma de aprendizagem','Learning platform'),o('ia','Há um projeto concreto de uso de IA','There is a specific AI use project')],true);
 for (const p of pubs) n('lit-oferta',`publicos.${p.id}.horas`,L('Horas previstas por participante','Planned hours per participant')+' · '+t(p.nome),'decimal');
 const acoes=[...pubs.map(p=>({id:p.id,nome:p.nome})),...(curriculo(s)?[{id:'curriculo',nome:L('Currículo nacional de IA','National AI curriculum')}]:[])];
 for (const a of acoes) {
  f('lit-acoes',`acoes.${a.id}.responsavel`,L('Responsável pela ação','Action owner')+' · '+t(a.nome),DONOS);
  f('lit-acoes',`acoes.${a.id}.prazo`,L('Prazo a partir da aprovação do plano','Timeline from plan approval')+' · '+t(a.nome),[o('3','Até 3 meses','Within 3 months'),o('6','Até 6 meses','Within 6 months'),o('12','Até 12 meses','Within 12 months'),o('24','Até 24 meses','Within 24 months')]);
  f('lit-acoes',`acoes.${a.id}.marcos`,L('Marcos da ação','Action milestones')+' · '+t(a.nome),a.id==='curriculo'?[o('elaboracao','Elaboração','Development'),o('consulta','Consulta e revisão','Consultation and review'),o('aprovacao','Aprovação competente','Approval by the competent body'),o('publicacao','Publicação e apoio à implementação','Publication and implementation support')]:[o('preparar','Preparar formadores e materiais','Prepare trainers and materials'),o('realizar','Realizar as atividades formativas','Deliver learning activities'),o('avaliar','Avaliar competências e revisar','Assess competencies and review')],true);
 }
 if (inclui(s,'oferta.validacao','sim')) {
  f('lit-validacao','validacao.objeto',L('O que será validado pedagogicamente?','What will be pedagogically validated?'),[o('curso','Curso ou sequência de atividades','Course or activity sequence'),o('material','Materiais didáticos','Teaching materials')],true);
  n('lit-validacao','validacao.participantes',L('Participantes da validação pedagógica','Pedagogical validation participants'));
  f('lit-validacao','validacao.criterios',L('Critérios para revisar ou ampliar','Criteria for revision or expansion'),[o('competencias','Competências demonstradas','Demonstrated competencies'),o('acessibilidade','Acessibilidade e adequação ao público','Accessibility and audience suitability'),o('viabilidade','Viabilidade de realização e apoio','Delivery and support feasibility')],true);
  f('lit-validacao','validacao.responsavel',L('Responsável pela validação pedagógica','Pedagogical validation owner'),DONOS);
 }
 if (digitalLit(s)) {
  f('lit-digital','digital.conexao',L('Conectividade necessária','Connectivity needed'),[o('existente','Conectividade existente suficiente','Existing connectivity is sufficient'),o('offline','Materiais e acesso sem conexão contínua','Materials and access without continuous connectivity'),o('ampliar','Ampliar conectividade para a ação','Improve connectivity for this activity')]);
  f('lit-digital','digital.dispositivos',L('Dispositivos necessários','Devices needed'),[o('existentes','Usar dispositivos existentes','Use existing devices'),o('compartilhados','Uso compartilhado com planejamento','Planned shared use'),o('comprar','Compra necessária para a ação','Purchase required for this activity')]);
  f('lit-digital','digital.salvaguardas',L('Salvaguardas e apoio digital','Safeguards and digital support'),[o('dados','Minimização e proteção de dados','Data minimisation and protection'),o('acessibilidade','Acessibilidade digital','Digital accessibility'),o('apoio','Apoio técnico e alternativa de participação','Technical support and alternative participation')],true);
 }
 if (inclui(s,'oferta.recursos','ia')) {
  f('lit-projeto','projeto.decisao',L('Incluir um projeto separado de uso de IA?','Include a separate AI use project?'),[o('nao','Planejar apenas formação e currículo por enquanto','Plan only training and curriculum for now'),o('sim','Sim, identificar o projeto e manter orçamento separado','Yes, identify the project and keep a separate budget')]);
  if (inclui(s,'projeto.decisao','sim')) f('lit-projeto','projeto.descricao',L('Projeto identificado','Identified project'),[o('assistente','Assistente de IA para apoiar atividades formativas','AI assistant to support learning activities'),o('materiais','Ferramenta de IA para apoiar produção de materiais','AI tool to support materials development')]);
 }
 f('lit-recursos','orcamento.periodo',L('Período do orçamento','Budget period'),[o('12','Próximos 12 meses após aprovação','Next 12 months after approval'),o('24','Próximos 24 meses após aprovação','Next 24 months after approval')]);
 f('lit-recursos','orcamento.fonte',L('Fonte dos valores','Source of amounts'),[o('orcamento','Orçamento informado pela equipe','Budget provided by the team'),o('cotacao','Cotações ou referências documentadas','Documented quotations or benchmarks')]);
 for (const id of adicionaisAtivos(s)) f('lit-recursos',`orcamento.adicionais.${id}.nome`,L('Tipo do recurso adicional','Additional resource type'),[o('transporte','Transporte e participação','Travel and participation'),o('certificacao','Certificação','Certification'),o('outro','Recurso adicional','Additional resource')]);
 f('lit-revisao','revisao.indicadores',L('Indicadores do programa','Programme indicators'),[o('cobertura','Participação e cobertura por público','Participation and coverage by audience'),o('conclusao','Conclusão das atividades','Completion of activities'),o('competencias','Competências demonstradas por avaliação','Competencies demonstrated through assessment'),o('equidade','Inclusão e diferenças de acesso','Inclusion and access gaps'),...(curriculo(s)?[o('curriculo','Adoção e implementação do currículo','Curriculum adoption and implementation')]:[])],true);
 f('lit-revisao','revisao.evidencias',L('Evidências de acompanhamento','Monitoring evidence'),[o('registros','Registros de participação e conclusão','Participation and completion records'),o('tarefas','Avaliações, projetos e portfólios','Assessments, projects and portfolios'),o('consulta','Consulta aos participantes e instituições','Consultation with participants and institutions')],true,true);
 f('lit-revisao','revisao.responsavel',L('Responsável pelo acompanhamento','Monitoring owner'),DONOS);
 f('lit-revisao','revisao.periodicidade',L('Periodicidade de revisão','Review frequency'),[o('trimestral','Trimestral','Quarterly'),o('semestral','Semestral','Every six months'),o('anual','Anual','Annually')]);
 f('lit-revisao','revisao.continuidade',L('Continuidade e atualização','Continuity and updates'),[o('materiais','Revisar conteúdos e materiais periodicamente','Periodically review content and materials'),o('formadores','Manter formação e apoio aos formadores','Maintain training and support for trainers'),o('publicar','Publicar resultados e ações de melhoria','Publish results and improvement actions')],true);
 return campos;
}
export const rotuloLit = (label:string) => label.split(' · ').map(parte=>t(parte)).join(' · ');
const textoValido = (v:any) => typeof v==='string' && v.trim().length>0 && !v.includes('__');
export function campoLitRespondido(s:Estado,f:CampoLit):boolean {
 const v=lerLit(s,f.caminho);
 if(f.numero) return v?.situacao==='a_levantar' || typeof v?.valor==='number' && Number.isFinite(v.valor) && v.valor>0 && (f.numero==='decimal'||Number.isSafeInteger(v.valor));
 return textoValido(v?.detalhe) || Array.isArray(v?.escolhas) && v.escolhas.length>0 && v.escolhas.every((id:string)=>f.opcoes?.some(o=>o.id===id));
}
export function valorCampoLit(s:Estado,f:CampoLit):string {
 const v=lerLit(s,f.caminho); let principal='';
 if(f.numero) principal=v?.situacao==='a_levantar'?t(PENDENTE.texto):campoLitRespondido(s,f)&&typeof v?.valor==='number'&&Number.isFinite(v.valor)&&v.valor>0?new Intl.NumberFormat(String(LOC())).format(v.valor):'';
 else principal=(f.opcoes||[]).filter(o=>selecoesLit(s,f.caminho).includes(o.id)).map(o=>t(o.texto)).join('; ');
 if(f.evidencia&&principal) principal=t('Tipo de evidência selecionado: {tipo}. Identificação do documento: a verificar.',{tipo:principal});
 return [principal,textoValido(v?.detalhe)?v.detalhe:''].filter(Boolean).join('\n') || t('Não informado');
}
export function errosAlcance(s:Estado):string[] {
 const pubs=publicosLetramento(s), erros:string[]=[];
 for(const p of pubs) { const a=lerLit(s,`publicos.${p.id}.elegiveis`),b=lerLit(s,`publicos.${p.id}.participantes`);
  if(a?.situacao!=='a_levantar'&&b?.situacao!=='a_levantar'&&typeof a?.valor==='number'&&typeof b?.valor==='number'&&b.valor>a.valor) erros.push(L('Participantes previstos não podem superar o público elegível.','Planned participants cannot exceed the eligible audience.'));
 }
 const vals=pubs.map(p=>lerLit(s,`publicos.${p.id}.participantes`)), u=lerLit(s,'alcance.totalUnico');
 if(pubs.length>1&&u?.situacao!=='a_levantar'&&typeof u?.valor==='number'&&vals.every(v=>v?.situacao!=='a_levantar'&&Number.isSafeInteger(v?.valor)&&v.valor>0)) {
  const ns=vals.map(v=>v.valor);if(u.valor<Math.max(...ns)||u.valor>ns.reduce((a,b)=>a+b,0)) erros.push(L('O total de pessoas distintas deve ficar entre o maior público e a soma dos públicos.','The unique participant total must be between the largest audience and the sum of audiences.'));
 }
 const grupos=['graduacao','pos','egressos'].filter(id=>inclui(s,'alcance.superior',id)).map(id=>lerLit(s,`publicos.A15.subgrupos.${id}`));
 const un=lerLit(s,'publicos.A15.participantes');
 if(grupos.length&&un?.situacao!=='a_levantar'&&Number.isSafeInteger(un?.valor)&&grupos.every(v=>v?.situacao!=='a_levantar'&&Number.isSafeInteger(v?.valor)&&v.valor>0)) { const vals=grupos.map(v=>v.valor); if(un.valor<Math.max(...vals)||un.valor>vals.reduce((a,b)=>a+b,0)) erros.push(L('Confira o total distinto do ensino superior em relação aos subgrupos.','Check the unique higher education total against its subgroups.')); }
 return [...new Set(erros)];
}
export function custosLetramento(s:Estado):[string,string][] {
 const itens:[string,string][]=[['diagnostico',L('Diagnóstico e avaliação de competências','Assessment and competency evaluation')],['desenho',L('Desenho pedagógico e curricular','Pedagogical and curriculum design')],['materiais',L('Materiais, tradução e acessibilidade','Materials, translation and accessibility')],['equipe',L('Equipe e coordenação do programa','Programme staff and coordination')],['apoio',L('Apoio e acompanhamento pedagógico','Pedagogical support and monitoring')]];
 if(publicosLetramento(s).length) itens.push(['formadores',L('Formação de formadores','Training of trainers')],['oferta',L('Realização da formação e tempo das equipes','Training delivery and staff time')]);
 if(curriculo(s)) itens.push(['consulta',L('Consulta e participação curricular','Curriculum consultation and participation')]);
 if(digitalLit(s)) itens.push(['digital',L('Recursos digitais necessários à ação','Digital resources required for the activity')]);
 if(inclui(s,'oferta.validacao','sim')) itens.push(['validacao',L('Validação pedagógica de cursos e materiais','Pedagogical validation of courses and materials')]);
 for(const id of adicionaisAtivos(s)) itens.push([id, L('Recurso adicional','Additional resource')+' '+id.split('-').pop()]);
 return itens;
}
export function orcamentoLetramento(s:Pick<Estado14,'ctx'|'moeda'>) {
 const o=s.ctx.letramento?.orcamento||{}, gov=orcamentoGovernanca(s);
 const itens=custosLetramento(s).map(([id,nome])=>{
  const x=o.itens?.[id]||{}, compartilhado=x.situacao==='compartilhado'&&s.ctx.prioridades?.includes('governar');
  const origem=compartilhado?gov.itens.find(i=>i.id===x.referencia):null;
  const valor=compartilhado?null:x.situacao==='sem_custo'?0:x.situacao==='informado'&&typeof x.valor==='number'&&Number.isFinite(x.valor)&&x.valor>=0?x.valor:null;
  return {id,nome:t(nome),valor,compartilhado,origem,detalhe:String(x.detalhe||''),respondido:compartilhado?!!origem:['a_estimar','sem_custo'].includes(x.situacao)||valor!==null};
 });
 const faltam=itens.filter(i=>i.compartilhado?i.origem?.valor===null||!i.origem:i.valor===null).length;
 const propios=itens.filter(i=>!i.compartilhado&&i.valor!==null);
 return {itens,moeda:String(o.moeda||s.moeda.cod||'USD'),periodo:o.periodo,fonte:o.fonte,subtotal:propios.reduce((a,b)=>a+b.valor!,0),informados:propios.length,temSubtotal:propios.length>0||itens.some(i=>i.compartilhado&&i.origem?.valor!=null),faltam,total:faltam?null:propios.reduce((a,b)=>a+b.valor!,0)};
}
export function letramentoRespondido(s:Estado14,id:string):boolean {
 if(id==='lit-alcance'&&errosAlcance(s).length)return false;
 const campos=camposLetramento(s).filter(f=>f.tela===id);
 if(!campos.length)return false;
 return campos.every(f=>campoLitRespondido(s,f)) && (id!=='lit-recursos'||orcamentoLetramento(s).itens.every(i=>i.respondido));
}
export function planoLetramento(s:Estado14) {
 const campos=camposLetramento(s),o=orcamentoLetramento(s), qs=idsTemas(s),pubs=publicosLetramento(s);
 const faltam=telasLetramento(s).filter(id=>id.startsWith('lit-')&&!letramentoRespondido(s,id));
 if(!s.respC.pais||!s.caso.pais)faltam.unshift('local');if(!qs.length||!s.respC.problemas)faltam.unshift('problemas');
 const indefinidos=campos.filter(f=>{const v=lerLit(s,f.caminho);return v?.situacao==='a_levantar'||selecoesLit(s,f.caminho).includes('_pendente')||f.caminho==='diagnostico.base'&&selecoesLit(s,f.caminho).some(id=>['nenhum','andamento','parcial'].includes(id));}).length;
 const blocos=[{titulo:t('Contexto'),linhas:[{rotulo:t('País'),valor:nomePais(paisDoCaso(s.caso))},{rotulo:t('Instituição responsável'),valor:String(s.ctx.local||t('Não informado'))},...(textoValido(s.ctx.problemaOutro)?[{rotulo:t('Informações adicionais'),valor:s.ctx.problemaOutro}]:[]),{rotulo:t(L('Públicos selecionados','Selected audiences')),valor:[...pubs.map(p=>t(p.nome)),...(curriculo(s)?[t(L('Currículo nacional de IA','National AI curriculum'))]:[])].join('; ')||t('Não informado')}]},...telasLetramento(s).filter(id=>id.startsWith('lit-')).map(id=>({titulo:t(TITULOS_LIT[id]),linhas:campos.filter(f=>f.tela===id).map(f=>({rotulo:rotuloLit(f.label),valor:valorCampoLit(s,f)}))}))];
 const recursos=blocos.find(b=>b.titulo===t(TITULOS_LIT['lit-recursos']))!;
 recursos.linhas.push(...o.itens.map(i=>({rotulo:i.nome,valor:i.compartilhado?t(L('Custeado na governança: {item} — {valor}. Não somado novamente.','Funded under governance: {item} — {valor}. Not counted again.'),{item:i.origem?.nome||t('Não informado'),valor:moedaGovernanca(i.origem?.valor??null,orcamentoGovernanca(s).moeda,String(LOC()))}):moedaGovernanca(i.valor,o.moeda,String(LOC()))+(i.detalhe?'\n'+i.detalhe:'')})),{rotulo:t(L('Subtotal desta frente, sem custos compartilhados','Workstream subtotal, excluding shared costs')),valor:o.temSubtotal?moedaGovernanca(o.subtotal,o.moeda,String(LOC())):t('Não informado')},{rotulo:t('Itens sem valor informado'),valor:String(o.faltam)});
 return {titulo:t(L('Plano nacional de letramento em IA e currículo','National AI literacy and curriculum plan')),pais:nomePais(paisDoCaso(s.caso)),blocos,faltam,pendentes:indefinidos+o.faltam,orcamento:o,projeto:null,acoes:[],escopo:t(L('Alcance, competências e recursos de formação e currículo. Valores desconhecidos permanecem pendentes.','Scope, competencies and resources for training and curriculum. Unknown amounts remain pending.')),proxima:t(faltam.length||indefinidos||o.faltam?L('Complete as informações e resolva as pendências antes de aprovar o programa.','Complete the information and resolve pending items before approving the programme.'):L('Revise o plano com os responsáveis e acompanhe a execução e os resultados.','Review the plan with its owners and monitor delivery and outcomes.'))};
}
export function telaLetramentoLegada(id:string):string {
 const mapa:Record<string,string>={etapas:'lit-alcance',problema:'lit-diagnostico',impactos:'lit-desenho',linhaBase:'lit-diagnostico',alternativa:'lit-desenho',governanca:'lit-diagnostico',testes:'lit-oferta',tarefas:'lit-desenho',usuarios:'lit-alcance',afetados:'lit-alcance',tipoTec:'lit-oferta',pagamento:'lit-recursos',piloto:'lit-validacao',internet:'lit-digital',modeloDisp:'lit-digital',formados:'lit-oferta',suporteNivel:'lit-oferta',implantacao:'lit-acoes',elegiveis:'lit-alcance',expansao:'lit-revisao'};
 return mapa[id]||id;
}
