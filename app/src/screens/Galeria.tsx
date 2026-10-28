// Galeria do Prumo: todos os componentes com todos os estados, como os previews em design/redesign/prumo/components.
// É a fixture visual da etapa 3 da especificação.
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Button,
  ChapterBar,
  ChapterNav,
  ChapterOpening,
  ChapterSummary,
  Chip,
  ChipGroup,
  DataTable,
  Dialog,
  Header,
  IconMenu,
  KpiTile,
  LayerBars,
  OptionCard,
  OptionCardField,
  OptionCardGroup,
  PilotSize,
  PlanDrawer,
  PlanIndex,
  PlanPanel,
  QuestionFrame,
  Recommendation,
  RiskPill,
  SchoolsGrid,
  Segmented,
  SourceLine,
  SourceLink,
  SourceTag,
  TextField,
  Toast,
  useTheme,
} from '../ui';
import type { PilotValues, SchoolStage } from '../ui';
// Os logos vêm da pasta do design system até serem copiados para public/ (etapa 6).
import logoCatedra from '../assets/logos/catedra-unesco-unitwin.png';
import logoIaedu from '../assets/logos/iaedu.png';
import './Galeria.css';

const LOGOS = [
  { src: logoCatedra, alt: 'Cátedra UNESCO UNITWIN' },
  { src: logoIaedu, alt: 'IA.EDU' },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="gal-section" id={id}>
      <h2 className="gal-section-title">{title}</h2>
      {children}
    </section>
  );
}

function Sample({ title, children, wide, surface }: { title: string; children: ReactNode; wide?: boolean; surface?: 'surface-0' | 'surface-plan' }) {
  return (
    <div className={['gal-sample', wide ? 'gal-sample--wide' : ''].filter(Boolean).join(' ')}>
      <h3 className="gal-sample-title">{title}</h3>
      <div className="gal-sample-body" style={surface ? { background: `var(--${surface})` } : undefined}>
        {children}
      </div>
    </div>
  );
}

const SEG_OPTIONS = [
  { value: 'sim', label: 'Sim' },
  { value: 'parcial', label: 'Em parte' },
  { value: 'nao', label: 'Não' },
  { value: 'nao_sei', label: 'Não sei' },
];

const LAYERS = [
  { label: 'Aplicações', value: 46, display: '46%', layer: 2 },
  { label: 'Internet e dispositivos', value: 25, display: '25%', layer: 3 },
  { label: 'Formação', value: 11, display: '11%', layer: 6 },
  { label: 'Operação e suporte', value: 8, display: '8%', layer: 7 },
  { label: 'Governança', value: 5, display: '5%', layer: 1 },
  { label: 'Dados e sistemas', value: 3, display: '3%', layer: 4 },
  { label: 'Segurança e privacidade', value: 2, display: '2%', layer: 5 },
];

const STAGES_INIT: SchoolStage[] = [
  { id: 'infantil', label: 'Educação infantil', sub: 'Creche e pré-escola', on: false },
  { id: 'fund1', label: 'Ensino fundamental: anos iniciais', sub: 'Do 1º ao 5º ano', on: true, schools: '48', students: '14200' },
  { id: 'fund2', label: 'Ensino fundamental: anos finais', sub: 'Do 6º ao 9º ano', on: true, schools: '30', students: '', suggested: true, hint: '~ sugerido · 400 por escola' },
  { id: 'medio', label: 'Ensino médio', sub: 'Da 1ª à 3ª série', on: false },
  { id: 'eja', label: 'Educação de jovens e adultos', sub: 'Escolarização de quem não concluiu na idade prevista', on: false },
];

export function Galeria() {
  const [theme, , toggleTheme] = useTheme();

  // Estados interativos das amostras.
  const [escolas, setEscolas] = useState('12');
  const [meses, setMeses] = useState('4');
  const [rede, setRede] = useState('');
  const [participantes, setParticipantes] = useState('-3');
  const [descricao, setDescricao] = useState('');
  const [internet, setInternet] = useState('parcial');
  const [quantas, setQuantas] = useState('30');
  const [usuarios, setUsuarios] = useState<string[]>(['professores']);
  const [impactos, setImpactos] = useState<string[]>(['defasagem', 'avaliacao']);
  const [outro, setOutro] = useState('');
  const [gov, setGov] = useState<string>('parcial');
  const [govFull, setGovFull] = useState<string>('nao');
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogBtn = useRef<HTMLButtonElement>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [stages, setStages] = useState<SchoolStage[]>(STAGES_INIT);
  const [pilotMode, setPilotMode] = useState<'poc' | 'piloto' | 'ambos'>('piloto');
  const [pilot, setPilot] = useState<PilotValues>({
    poc: { participants: '15', months: '2' },
    piloto: { schools: '3', participants: '180', months: '4' },
  });

  const toggleIn = (list: string[], v: string, set: (l: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const impactChips = [
    { id: 'defasagem', label: 'Reduzir a defasagem em matemática' },
    { id: 'avaliacao', label: 'Melhorar o desempenho na avaliação da rede' },
    { id: 'tempo', label: 'Aumentar o tempo de estudo com apoio', suggested: true },
    { id: 'planejar', label: 'Ampliar o tempo do professor para planejar' },
    { id: 'reprovacao', label: 'Reduzir a reprovação' },
    { id: 'familias', label: 'Melhorar a comunicação com famílias' },
    { id: 'abandono', label: 'Reduzir o abandono' },
    { id: 'dificuldades', label: 'Apoiar estudantes com dificuldades específicas' },
  ];

  const planKpis = [
    { id: 'ano0', label: 'Custo do teste (Ano 0)', value: 'R$ 184 mil', fullValue: 'R$ 184.000', fresh: true },
    { id: 'total', label: 'Custo total, 3 anos' },
    { id: 'ano', label: 'Por ano de operação' },
    { id: 'estudante', label: 'Por estudante por ano' },
  ];
  const planRecs = [
    { id: 'internet', text: 'Escolher para o piloto escolas que já têm internet' },
    { id: 'responsavel', text: 'Definir quem responde pela IA na rede antes do teste' },
  ];
  const planSections = [
    { id: 'custa', title: 'Quanto custa', note: 'aparece no capítulo 4' },
    { id: 'exigir', title: 'O que exigir', note: '4 cláusulas já definidas' },
  ];

  return (
    <div className="gal">
      <header className="gal-header">
        <div>
          <div className="t-label-12 gal-muted">Prumo · galeria de componentes</div>
          <h1 className="t-title-32">Todos os componentes, todos os estados</h1>
          <p className="t-body-14 gal-muted">
            Fixture visual da etapa 3. Tema atual: {theme === 'dark' ? 'escuro' : 'claro'}.
          </p>
        </div>
        <div className="gal-header-actions">
          <Button variant="secondary" size="sm" onClick={toggleTheme} aria-pressed={theme === 'dark'}>
            {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </Button>
          <a className="t-caption-13" href="#/">
            Página inicial
          </a>
        </div>
      </header>

      <nav className="gal-toc" aria-label="Seções da galeria">
        {[
          ['tipografia', 'Tipografia'],
          ['formulario', 'Formulário'],
          ['origem', 'Origem e números'],
          ['percurso', 'Percurso'],
          ['plano', 'Plano'],
          ['leitura', 'Leitura'],
          ['estrutura', 'Estrutura'],
          ['sobreposicao', 'Cabeçalho, diálogo e toast'],
        ].map(([id, label]) => (
          <a key={id} href={`#/galeria#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView(); }}>
            {label}
          </a>
        ))}
      </nav>

      <Section id="tipografia" title="Tipografia">
        <Sample title="Títulos do plano (serif) e interface (sans)" wide>
          <div className="gal-type">
            <div className="t-display-48">Tutor de matemática para estudantes</div>
            <div className="t-title-32">Até aqui, o que você já sabe</div>
            <div className="t-title-24">Quanto custa</div>
            <div className="t-question-26">De que tamanho e por quanto tempo será o piloto?</div>
            <div className="t-heading-18">Em resumo</div>
            <div className="t-body-16">Um piloto pequeno ensina quase tanto quanto um grande e custa muito menos.</div>
            <div className="t-body-14">Esta resposta muda no plano: custo do teste (Ano 0).</div>
            <div className="t-caption-13">Estimativa com premissas padrão · de onde vem?</div>
            <div className="t-label-12 gal-muted">Seu plano · escrevendo</div>
            <div className="t-kpi-32">R$ 184 mil</div>
            <div className="t-kpi-20">R$ 184 mil</div>
          </div>
        </Sample>
      </Section>

      <Section id="formulario" title="Formulário">
        <Sample title="Button: primário, secundário, link, desabilitado, compacto" wide>
          <div className="gal-row">
            <Button>Aceitar a sugestão e continuar</Button>
            <Button variant="secondary">Pular por agora</Button>
            <Button variant="link">Por que perguntamos isso?</Button>
            <Button disabled>Baixar PDF · 12 lacunas</Button>
          </div>
          <div className="gal-row">
            <Button variant="secondary" size="sm">Idioma</Button>
            <Button variant="secondary" size="sm">Modo: Essencial</Button>
            <Button size="sm">Baixar PDF</Button>
            <Button variant="secondary" size="sm" icon={<IconMenu />} aria-label="Menu" />
            <Button href="#/galeria" variant="secondary">Voltar</Button>
          </div>
          <div className="gal-narrow">
            <Button fullWidth>Continuar</Button>
          </div>
        </Sample>

        <Sample title="TextField: informado, sugerido, padrão em branco, erro, desabilitado, texto longo" wide>
          <div className="gal-row gal-row--top">
            <TextField label="Escolas" value={escolas} onChange={setEscolas} type="number" hint="informado" />
            <TextField label="Duração (meses)" value={meses} onChange={setMeses} type="number" suggested hint="~ sugerido · 5% de 48 escolas" />
            <TextField label="Nome da rede" value={rede} onChange={setRede} placeholder="Ex.: Rede Municipal de Exemplo" hint="padrão: em branco" />
            <TextField label="Participantes" value={participantes} onChange={setParticipantes} type="number" error="Informe um número maior que zero" />
            <TextField label="Horizonte (anos)" value="3" hint="padrão: 3 anos" disabled />
          </div>
          <div className="gal-narrow">
            <TextField
              label="Situação atual"
              multiline
              value={descricao}
              onChange={setDescricao}
              placeholder="Na rede, __ dos estudantes dos anos finais estão abaixo do esperado em matemática."
              hint="padrão: modelo com lacunas"
            />
          </div>
        </Sample>

        <Sample title="OptionCard: rádio com subtexto e campo condicional; caixas de marcar">
          <OptionCardGroup label="As escolas têm internet adequada?">
            <OptionCard name="net" value="sim" label="Sim, em todas as escolas" checked={internet === 'sim'} onChange={setInternet} />
            <OptionCard name="net" value="parcial" label="Parcialmente" checked={internet === 'parcial'} onChange={setInternet} subtext={internet === 'parcial' ? undefined : 'em 30 de 48 escolas'}>
              <OptionCardField label="Em quantas?" value={quantas} onChange={setQuantas} suffix="de 48" />
            </OptionCard>
            <OptionCard name="net" value="nao" label="Não" checked={internet === 'nao'} onChange={setInternet} />
            <OptionCard name="net" value="nao_sei" label="Não sei" checked={false} disabled />
          </OptionCardGroup>
          <div className="gal-gap" />
          <OptionCardGroup label="Quem usa a ferramenta?" type="checkbox">
            {[
              ['professores', 'Professores'],
              ['estudantes', 'Estudantes'],
              ['gestores', 'Gestores escolares'],
            ].map(([v, l]) => (
              <OptionCard key={v} type="checkbox" name="usuarios" value={v} label={l} checked={usuarios.includes(v)} onChange={(val) => toggleIn(usuarios, val, setUsuarios)} />
            ))}
          </OptionCardGroup>
        </Sample>

        <Sample title="Chip: selecionado, sugerido, pendente, desabilitado, Outro…">
          <ChipGroup
            label="Que impacto você quer alcançar?"
            counter={`${impactos.length} de 3 marcados`}
            after={
              impactos.includes('outro') ? (
                <TextField label="Qual?" value={outro} onChange={setOutro} placeholder="Descreva em poucas palavras" />
              ) : null
            }
          >
            {impactChips.map((c) => (
              <Chip key={c.id} label={c.label} pressed={impactos.includes(c.id)} suggested={c.suggested} onToggle={() => toggleIn(impactos, c.id, setImpactos)} />
            ))}
            <Chip label="Apoiar a alfabetização" pressed={false} disabled />
            <Chip label="Outro…" pressed={impactos.includes('outro')} onToggle={() => toggleIn(impactos, 'outro', setImpactos)} />
          </ChipGroup>
        </Sample>

        <Sample title="Segmented: quatro respostas, largura toda, desabilitado">
          <div className="gal-col">
            <div className="gal-q">Sua rede tem uma equipe responsável por IA na educação?</div>
            <Segmented label="Equipe responsável" options={SEG_OPTIONS} value={gov} onChange={setGov} />
            <div className="gal-q">Política ou diretriz para o uso de IA nas escolas</div>
            <Segmented label="Política de IA" options={SEG_OPTIONS} value={govFull} onChange={setGovFull} fullWidth />
            <Segmented label="Regulamentação" options={SEG_OPTIONS.slice(0, 3)} value="sim" disabled />
          </div>
        </Sample>
      </Section>

      <Section id="origem" title="Origem e números">
        <Sample title="SourceTag: os quatro estados e o link companheiro">
          <div className="gal-row">
            <SourceTag origin="padrao" />
            <SourceTag origin="sugerido" />
            <SourceTag origin="informado" />
            <SourceTag origin="refinado" />
            <span className="gal-muted">·</span>
            <SourceLink href="#/galeria" />
          </div>
          <div className="gal-row">
            <SourceLine origin="padrao" note="em 4 premissas" href="#/galeria" />
            <SourceLine origin="informado" onWhence={() => undefined} />
          </div>
        </Sample>

        <Sample title="KpiTile: recém-atualizado, padrão, vazio, destacado (síntese), compacto (painel)" wide>
          <div className="gal-kpis">
            <KpiTile label="Custo do teste (Ano 0)" value="R$ 184 mil" fullValue="R$ 184.000" fresh origin={<SourceLink href="#/galeria" />} />
            <KpiTile label="Custo total, 3 anos" value="R$ 2,1 mi" fullValue="R$ 2.120.000" origin={<SourceLine origin="padrao" note="em 4 premissas" href="#/galeria" />} />
            <KpiTile label="Por estudante por ano" origin="aparece no capítulo 4" />
          </div>
          <div className="gal-kpis gal-kpis--mixed">
            <KpiTile highlight kicker="O primeiro número do seu plano" label="Custo do teste (Ano 0)" value="R$ 184 mil" origin={<>estimativa com premissas padrão · <SourceLink href="#/galeria" /></>} />
            <div className="gal-kpis-compact">
              <KpiTile compact label="Custo do teste (Ano 0)" value="R$ 184 mil" fresh />
              <KpiTile compact label="Custo total, 3 anos" />
            </div>
          </div>
        </Sample>
      </Section>

      <Section id="percurso" title="Percurso">
        <Sample title="ChapterNav: capítulo concluído, atual com perguntas, pendentes">
          <ChapterNav
            zoneLabel="Seu percurso · 11 de 24"
            chapters={[
              { n: 1, title: 'Sua rede e o problema', state: 'done', href: '#/capitulo/1' },
              {
                n: 2,
                title: 'O teste',
                state: 'current',
                href: '#/capitulo/2',
                questions: [
                  { id: 'tarefas', title: 'O que a IA faz', state: 'done', href: '#/capitulo/2/tarefas' },
                  { id: 'usuarios', title: 'Quem usa', state: 'done', href: '#/capitulo/2/usuarios' },
                  { id: 'tec', title: 'Tecnologia · pagamento', state: 'suggested', href: '#/capitulo/2/tec' },
                  { id: 'tamanho', title: 'Tamanho do teste', state: 'current', href: '#/capitulo/2/tamanho' },
                  { id: 'internet', title: 'Internet e dispositivos', state: 'todo', href: '#/capitulo/2/internet' },
                  { id: 'formacao', title: 'Formação', state: 'todo', href: '#/capitulo/2/formacao' },
                ],
              },
              { n: 3, title: 'Primeira etapa', state: 'todo', href: '#/capitulo/3' },
              { n: 4, title: 'Toda a rede', state: 'todo', href: '#/capitulo/4' },
            ]}
            onNavigate={(_, e) => e.preventDefault()}
          />
        </Sample>

        <Sample title="ChapterBar: completa, compacta (400 px) e só trilhos" wide>
          <ChapterBar
            chapters={[
              { n: 1, label: 'Sua rede', progress: 1, state: 'done', href: '#/capitulo/1' },
              { n: 2, label: 'O teste', progress: 0.55, state: 'current', href: '#/capitulo/2' },
              { n: 3, label: 'Primeira etapa', progress: 0, state: 'todo', href: '#/capitulo/3' },
              { n: 4, label: 'Toda a rede', progress: 0, state: 'todo', href: '#/capitulo/4' },
            ]}
            onNavigate={(_, e) => e.preventDefault()}
          />
          <div className="gal-narrow">
            <ChapterBar
              compact
              chapters={[
                { n: 1, label: 'Sua rede', progress: 1, state: 'done', href: '#/capitulo/1' },
                { n: 2, label: 'O teste', progress: 0.55, state: 'current', href: '#/capitulo/2' },
                { n: 3, label: 'Primeira etapa', progress: 0, state: 'todo', href: '#/capitulo/3' },
                { n: 4, label: 'Toda a rede', progress: 0, state: 'todo', href: '#/capitulo/4' },
              ]}
              onNavigate={(_, e) => e.preventDefault()}
            />
            <ChapterBar
              bare
              chapters={[
                { n: 1, label: 'Sua rede', progress: 1, href: '#/capitulo/1' },
                { n: 2, label: 'O teste', progress: 0.55, state: 'current', href: '#/capitulo/2' },
                { n: 3, label: 'Primeira etapa', progress: 0, href: '#/capitulo/3' },
                { n: 4, label: 'Toda a rede', progress: 0, href: '#/capitulo/4' },
              ]}
              onNavigate={(_, e) => e.preventDefault()}
            />
          </div>
        </Sample>

        <Sample title="ChapterOpening" wide>
          <ChapterOpening
            n={2}
            title="O teste"
            guide="Como aprender o máximo sobre a ferramenta, com o menor risco e o menor custo?"
            questions={11}
            minutes={8}
            action={<Button>Começar o capítulo</Button>}
          >
            Antes de contratar para a rede inteira, vale testar em poucas escolas. No fim deste capítulo aparece o primeiro número do plano: quanto custa testar.
          </ChapterOpening>
        </Sample>

        <Sample title="ChapterSummary: com KPI (capítulo 2) e sem número (capítulo 1)" wide>
          <ChapterSummary
            n={2}
            title="Até aqui, o que você já sabe"
            paragraphs={[
              'A Rede Municipal de Exemplo tem 48 escolas e quer reduzir a defasagem em matemática nos anos finais. A governança de IA ainda é parcial.',
              'O teste será um piloto de um tutor para estudantes em 3 escolas, por 4 meses, com internet em parte das escolas.',
            ]}
            kpi={{
              kicker: 'O primeiro número do seu plano',
              label: 'Custo do teste (Ano 0)',
              value: 'R$ 184 mil',
              origin: <>estimativa com premissas padrão · <SourceLink href="#/galeria" /></>,
            }}
            recommendations={
              <>
                <b>Já apareceram 3 recomendações</b> <span className="gal-muted">· definir quem responde pela IA · registrar a linha de base · escolher escolas com internet</span> · <a href="#/plano/fazer">ver no plano</a>
              </>
            }
            next={{ title: 'Próximo capítulo: a primeira etapa', text: 'Uma pergunta: quantas escolas e pessoas começam de verdade. Você sai sabendo o custo do primeiro ano de uso real.' }}
            actions={
              <>
                <Button variant="secondary">Revisar o capítulo</Button>
                <Button>Capítulo 3: Primeira etapa</Button>
              </>
            }
          />
          <ChapterSummary
            n={1}
            title="Até aqui, o que você já sabe"
            paragraphs={['A Rede Municipal de Exemplo tem 48 escolas nos anos iniciais e finais e quer reduzir a defasagem em matemática. Ainda não há equipe responsável por IA.']}
            actions={
              <>
                <Button variant="secondary">Revisar o capítulo</Button>
                <Button>Capítulo 2: O teste</Button>
              </>
            }
          />
        </Sample>
      </Section>

      <Section id="plano" title="Plano">
        <Sample title="PlanPanel: escrevendo (com KPI recém-atualizado), em branco, recomendação nova" wide>
          <div className="gal-panels">
            <PlanPanel
              state="writing"
              openHref="#/plano"
              title="Tutor de matemática · Rede Municipal de Exemplo"
              facts="Piloto em 3 escolas por 4 meses · anos finais"
              kpis={planKpis}
              originLine={<>estimativa com premissas padrão · <SourceLink href="#/galeria" /></>}
              recommendations={planRecs}
              recommendationsCount={3}
              sections={planSections}
            />
            <PlanPanel
              state="empty"
              kpis={planKpis.map((k) => ({ id: k.id, label: k.label }))}
              sections={[
                { id: 'custa', title: 'Quanto custa' },
                { id: 'fazer', title: 'O que fazer' },
                { id: 'exigir', title: 'O que exigir' },
              ]}
            />
            <PlanPanel
              state="writing"
              openHref="#/plano"
              title="Tutor de matemática · Rede Municipal de Exemplo"
              facts="Piloto em 3 escolas por 4 meses · anos finais"
              kpis={planKpis.map((k) => ({ ...k, fresh: false }))}
              originLine={<>estimativa com premissas padrão · <SourceLink href="#/galeria" /></>}
              recommendations={[{ id: 'internet', text: 'Escolher para o piloto escolas que já têm internet', fresh: true }, planRecs[1]]}
              recommendationsCount={3}
              sections={planSections}
              footer={<Button variant="secondary" size="sm" href="#/plano">Abrir o plano inteiro</Button>}
            />
          </div>
        </Sample>

        <Sample title="Recommendation: numerada com etiquetas (recém-criada e normal), compacta" wide>
          <div className="gal-col gal-col--720">
            <Recommendation
              n={1}
              fresh
              action="Escolher para o piloto escolas que já têm internet, ou incluir a conexão no custo do teste"
              why="Por quê: você respondeu que 30 de 48 escolas têm internet adequada (pergunta 2.4)."
              priority="alta"
              moment="Antes do teste"
              kind="Custo e compra"
              link={{ href: '#/capitulo/2/internet' }}
            />
            <Recommendation
              n={2}
              action="Definir quem responde pela IA na rede antes do teste"
              why="Por quê: sua rede ainda não tem equipe responsável por IA (pergunta 1.3)."
              priority="alta"
              moment="Antes do teste"
              kind="Política e governança"
              link={{ href: '#/capitulo/1/governanca' }}
            />
            <Recommendation
              n={6}
              action="Prever no contrato a exportação dos dados ao fim do uso"
              why="Por quê: a ferramenta é SaaS e os dados ficam no fornecedor (pergunta 2.3)."
              priority="media"
              moment="Antes de contratar"
              kind="Dados e privacidade"
              link={{ onClick: () => undefined }}
            />
            <Recommendation n={3} compact action="Registrar a medida atual do problema antes de começar" />
          </div>
        </Sample>

        <Sample title="PlanIndex: lateral e faixa de chips (abaixo de 1100 px)" wide>
          <div className="gal-row gal-row--top">
            <div className="gal-planindex">
              <PlanIndex
                strip={false}
                items={[
                  { id: 'resumo', label: 'Em resumo', href: '#/plano', active: true },
                  { id: 'custa', label: 'Quanto custa', href: '#/plano/custa' },
                  { id: 'fazer', label: 'O que fazer', href: '#/plano/fazer', count: 9 },
                  { id: 'exigir', label: 'O que exigir', href: '#/plano/exigir', count: 7 },
                ]}
                secondary={[
                  { id: 'apendice', label: 'Apêndice · perfil do caso', href: '#/plano/apendice', dim: true },
                  { id: 'refs', label: 'Referências e créditos', href: '#/plano/apendice', dim: true },
                  { id: 'faltam', label: 'Respostas que faltam', href: '#/plano/apendice', count: 12, dim: true },
                ]}
                note="Clique em qualquer número para ver de onde vem."
                onNavigate={(_, e) => e.preventDefault()}
              />
            </div>
            <div className="gal-narrow">
              <PlanIndex
                strip
                items={[
                  { id: 'resumo', label: 'Em resumo', href: '#/plano', active: true },
                  { id: 'custa', label: 'Quanto custa', href: '#/plano/custa' },
                  { id: 'fazer', label: 'O que fazer', href: '#/plano/fazer', count: 9 },
                  { id: 'exigir', label: 'O que exigir', href: '#/plano/exigir', count: 7 },
                ]}
                secondary={[{ id: 'faltam', label: 'Faltam', href: '#/plano/apendice', count: 12, dim: true }]}
                onNavigate={(_, e) => e.preventDefault()}
              />
            </div>
          </div>
        </Sample>

        <Sample title="PlanDrawer: barra fechada e gaveta aberta (celular)" wide>
          <div className="gal-row gal-row--top">
            <div className="gal-narrow gal-narrow--tall">
              <PlanDrawer
                inline
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                zoneLabel="Seu plano · escrevendo"
                highlight="1 número novo"
                summary="2 recomendações · 13 lacunas"
                kpi="R$ 184 mil"
              >
                <PlanPanel
                  paperOnly
                  state="writing"
                  title="Tutor de matemática · Rede Municipal de Exemplo"
                  facts="Piloto em 3 escolas por 4 meses"
                  kpis={planKpis}
                  originLine={<>estimativa com premissas padrão · <SourceLink href="#/galeria" /></>}
                  recommendations={planRecs}
                  recommendationsCount={2}
                  sections={planSections}
                  footer={<Button variant="secondary" size="sm" href="#/plano">Abrir o plano inteiro</Button>}
                />
              </PlanDrawer>
            </div>
            <div className="gal-narrow">
              <PlanDrawer inline open={false} onOpenChange={() => undefined} zoneLabel="Seu plano · em branco" summary="24 lacunas">
                <span />
              </PlanDrawer>
            </div>
          </div>
        </Sample>
      </Section>

      <Section id="leitura" title="Leitura">
        <Sample title="RiskPill: níveis de risco e estados de célula">
          <div className="gal-row">
            <RiskPill level="limitado" />
            <RiskPill level="moderado" />
            <RiskPill level="elevado" />
            <RiskPill level="critico" />
            <RiskPill level="orientacao" />
            <RiskPill level="nao-se-aplica" />
          </div>
          <div className="gal-row">
            <RiskPill level="respondido" />
            <RiskPill level="em-andamento" />
            <RiskPill level="pendente" />
          </div>
        </Sample>

        <Sample title="Alert: informação, atenção, bloqueio">
          <div className="gal-col">
            <Alert kind="info" title="Você está vendo um caso ilustrativo">As respostas são fictícias. Comece um caso em branco para usar os seus dados.</Alert>
            <Alert kind="atencao" title="Plano parcial: 12 perguntas sem resposta">A estimativa usa premissas padrão onde faltam respostas.</Alert>
            <Alert kind="bloqueio" title="Nenhum problema marcado pede uma tarefa de IA">Volte ao capítulo 1 ou escolha a tarefa manualmente.</Alert>
          </div>
        </Sample>

        <Sample title="DataTable: camadas, total, linha destacada com origem; abaixo de 640 px vira cartões" wide>
          <DataTable
            caption="Custo por camada e ano, valores ilustrativos"
            columns={[
              { key: 'camada', label: 'Camada' },
              { key: 'ano0', label: 'Ano 0', numeric: true },
              { key: 'anos', label: 'Anos 1–3', numeric: true },
              { key: 'pct', label: '% do total', numeric: true },
              { key: 'origem', label: 'Origem' },
            ]}
            rows={[
              { key: 'ap', layer: 2, cells: { camada: 'Aplicações', ano0: 'R$ 62 mil', anos: 'R$ 980 mil', pct: '46%', origem: <SourceLine origin="refinado" href="#/galeria" linkLabel="ver" /> } },
              { key: 'in', layer: 3, selected: true, cells: { camada: 'Internet e dispositivos', ano0: 'R$ 41 mil', anos: 'R$ 520 mil', pct: '25%', origem: <SourceLine origin="padrao" href="#/galeria" linkLabel="ver" /> } },
              { key: 'fo', layer: 6, cells: { camada: 'Formação', ano0: 'R$ 30 mil', anos: 'R$ 210 mil', pct: '11%', origem: <SourceLine origin="informado" href="#/galeria" linkLabel="ver" /> } },
              { key: 'tot', total: true, cells: { camada: 'Total', ano0: 'R$ 184 mil', anos: 'R$ 2,1 mi', pct: '100%', origem: '' } },
            ]}
          />
          <div className="gal-narrow gal-cards-demo">
            <DataTable
              className="gal-force-cards"
              columns={[
                { key: 'camada', label: 'Camada' },
                { key: 'ano0', label: 'Ano 0', numeric: true },
                { key: 'anos', label: 'Anos 1–3', numeric: true },
              ]}
              rows={[
                { key: 'ap', layer: 2, cells: { camada: 'Aplicações', ano0: 'R$ 62 mil', anos: 'R$ 980 mil' } },
                { key: 'tot', total: true, cells: { camada: 'Total', ano0: 'R$ 184 mil', anos: 'R$ 2,1 mi' } },
              ]}
            />
          </div>
        </Sample>

        <Sample title="LayerBars" wide>
          <LayerBars
            title="Custo por camada, 3 anos"
            items={LAYERS}
            conclusion="Aplicações e internet somam 71% do custo em 3 anos"
            caption="Sete camadas de Krueger e Jackson (2026). Valores ilustrativos."
          />
        </Sample>
      </Section>

      <Section id="estrutura" title="Estrutura">
        <Sample title="QuestionFrame com PilotSize (modo piloto, valores sugeridos)" wide>
          <div className="gal-frame">
            <QuestionFrame
              kicker="Capítulo 2 · O teste · pergunta 6 de 11"
              title="De que tamanho e por quanto tempo será o piloto?"
              explanation="Um piloto pequeno ensina quase tanto quanto um grande e custa muito menos. Sugerimos cerca de 5% das escolas por 4 meses; mude se já tiver um plano."
              actions={
                <>
                  <Button>Aceitar a sugestão e continuar</Button>
                  <Button variant="secondary">Pular por agora</Button>
                  <Button variant="link">Por que perguntamos isso?</Button>
                </>
              }
              affects="custo do teste (Ano 0) · regras do piloto (seção A1)"
            >
              <div className="gal-col">
                <Segmented label="Modo do teste" options={[{ value: 'poc', label: 'Prova de conceito' }, { value: 'piloto', label: 'Piloto' }, { value: 'ambos', label: 'Ambos' }]} value={pilotMode} onChange={setPilotMode} />
                <PilotSize
                  mode={pilotMode}
                  values={pilot}
                  onChange={(b, f, v) => setPilot((p) => ({ ...p, [b]: { ...(p[b] as Record<string, string>), [f]: v } }))}
                  suggested
                  hints={{ poc: { participants: '~ sugerido · 15 pessoas', months: '~ sugerido' }, piloto: { schools: '~ sugerido · 5% de 48', participants: '~ sugerido · 60 por escola', months: '~ sugerido' } }}
                />
              </div>
            </QuestionFrame>
          </div>
        </Sample>

        <Sample title="SchoolsGrid: etapas marcadas, com valores informados e sugeridos" wide>
          <SchoolsGrid
            label="Etapas atendidas e tamanho da rede"
            stages={stages}
            onChange={(id, patch) => setStages((s) => s.map((st) => (st.id === id ? { ...st, ...patch, suggested: patch.schools !== undefined || patch.students !== undefined ? false : st.suggested } : st)))}
            totals={{ schools: '78', students: '26.200' }}
            detailHref="#/refinar/rede"
            onDetail={(e) => e.preventDefault()}
          />
        </Sample>
      </Section>

      <Section id="sobreposicao" title="Cabeçalho, diálogo e toast">
        <Sample title="Header: desktop com contexto e ações; compacto (celular)" wide>
          <Header
            logos={LOGOS}
            href="#/"
            context="Rede Municipal de Exemplo · salvo neste navegador"
            actions={
              <>
                <Button variant="secondary" size="sm">Idioma</Button>
                <Button variant="secondary" size="sm">Modo: Essencial</Button>
              </>
            }
          />
          <div className="gal-gap" />
          <div className="gal-narrow">
            <Header compact logos={LOGOS} name="" actions={<><Button size="sm">Baixar PDF</Button><Button variant="secondary" size="sm" icon={<IconMenu />} aria-label="Menu" /></>} />
          </div>
        </Sample>

        <Sample title="Dialog: aberto (amostra presa ao contêiner) e ao vivo" wide>
          <div className="gal-dialog-stage">
            <Dialog
              inline
              open
              onClose={() => undefined}
              title="Começar um caso em branco?"
              actions={
                <>
                  <Button variant="secondary">Cancelar</Button>
                  <Button>Começar em branco</Button>
                </>
              }
            >
              As respostas do caso atual continuam salvas neste navegador até você exportar ou apagar. Dá para voltar a ele pela página inicial.
            </Dialog>
          </div>
          <div className="gal-row">
            <Button ref={dialogBtn} variant="secondary" onClick={() => setDialogOpen(true)}>
              Abrir o diálogo ao vivo
            </Button>
          </div>
          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            returnFocusTo={dialogBtn}
            title="Começar um caso em branco?"
            actions={
              <>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => setDialogOpen(false)}>Começar em branco</Button>
              </>
            }
          >
            As respostas do caso atual continuam salvas neste navegador até você exportar ou apagar. Dá para voltar a ele pela página inicial.
          </Dialog>
        </Sample>

        <Sample title="Toast: amostra no fluxo e ao vivo (some em 4 s)">
          <div className="gal-col">
            <Toast inline open message="Caso exportado como tutor-matematica.json" action={{ label: 'Desfazer', onClick: () => undefined }} duration={0} />
            <div className="gal-row">
              <Button variant="secondary" onClick={() => setToastOpen(true)}>Mostrar o toast ao vivo</Button>
            </div>
            <Toast open={toastOpen} onClose={() => setToastOpen(false)} message="Caso salvo neste navegador" />
          </div>
        </Sample>
      </Section>

      <footer className="gal-footer t-caption-13 gal-muted">
        Valores ilustrativos. A ferramenta não fala em nome da UNESCO ou de outra instituição.
      </footer>
    </div>
  );
}
