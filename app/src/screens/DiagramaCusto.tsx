// Versão de teste v016: diagrama do modelo de custo (no estilo da arquitetura de referência):
// Prioridades → Desafios e categorias (dimensões) → Fases → Custo. Também exportado como imagem (PNG) para o guia.
import type { ReactNode } from 'react';
import { t } from '../percurso/textos';
import './diagrama.css';

const ic = (d: ReactNode) => <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const ICONE = {
  governar: ic(<><path d="M24 5 9 11v11c0 10 6.5 17.5 15 21 8.5-3.5 15-11 15-21V11L24 5Z" /><path d="m17 24 5 5 9-10" /></>),
  sobre: ic(<><path d="M6 10c6-2 12-1 18 3v27c-6-4-12-5-18-3V10Z" /><path d="M42 10c-6-2-12-1-18 3v27c6-4 12-5 18-3V10Z" /></>),
  com: ic(<><path d="M5 20 24 9l19 11-19 11L5 20Z" /><path d="M13 25v9c3 3 7 4.5 11 4.5s8-1.5 11-4.5v-9" /></>),
  camadas: ic(<><path d="M24 6 4 16l20 10 20-10L24 6Z" /><path d="m4 24 20 10 20-10" /><path d="m4 32 20 10 20-10" /></>),
  fases: ic(<><path d="M6 38h10V26H6zM19 38h10V18H19zM32 38h10V8H32z" /></>),
  custo: ic(<><circle cx="24" cy="24" r="18" /><path d="M30 17c-1.5-2-4-3-6.5-3-3.5 0-6 2-6 5 0 7 13 3.5 13 10.5 0 3-2.7 5-6.5 5-2.8 0-5.3-1.2-6.8-3.3M24 10v4M24 34v4" /></>),
};

function Bloco({ n, titulo, sub, icone, children, cor }: { n: number; titulo: string; sub: string; icone: ReactNode; children: ReactNode; cor: string }) {
  return <section className={'dg-bloco dg-' + cor}>
    <header className="dg-cab"><span className="dg-cab-top"><span className="dg-num">{n}</span><span className="dg-icone">{icone}</span></span><b className="dg-titulo">{titulo}</b><span className="dg-sub">{sub}</span></header>
    <div className="dg-corpo">{children}</div>
  </section>;
}
const Item = ({ titulo, texto }: { titulo: string; texto?: string }) => <div className="dg-item"><b>{titulo}</b>{texto ? <span>{texto}</span> : null}</div>;
const Seta = () => <span className="dg-seta" aria-hidden="true">→</span>;

export function DiagramaCusto() {
  return <figure className="dg" aria-labelledby="dg-legenda">
    <figcaption id="dg-legenda" className="dg-legenda"><span className="dg-kicker">{t('Diagrama do modelo de custo')}</span>{t('Prioridades, dimensões e fases do custo')}</figcaption>
    <div className="dg-fluxo">
      <Bloco n={1} cor="azul" icone={ICONE.governar} titulo={t('Prioridades')} sub={t('Escolha uma ou mais')}>
        <Item titulo={t('Governando a IA na educação')} />
        <Item titulo={t('Educando sobre a IA')} />
        <Item titulo={t('Educando com e sem IA')} />
      </Bloco>
      <Seta />
      <Bloco n={2} cor="verde" icone={ICONE.camadas} titulo={t('Desafios e dimensões')} sub={t('Cada desafio traz suas categorias de custo')}>
        <Item titulo={t('Governança')} texto={t('3 desafios · 9 categorias: direitos, soberania, capacidade do setor público')} />
        <Item titulo={t('Letramento em IA')} texto={t('3 desafios · 11 categorias: professores, estudantes, currículo')} />
        <Item titulo={t('Educação com e sem IA')} texto={t('8 desafios × 4 dimensões: escala, infraestrutura, formação docente, recursos')} />
      </Bloco>
      <Seta />
      <Bloco n={3} cor="lilas" icone={ICONE.fases} titulo={t('Fases')} sub={t('Duração e alcance de cada fase')}>
        <Item titulo={t('Piloto')} texto={t('4 meses · 5% das pessoas')} />
        <Item titulo={t('Implantação')} texto={t('12 meses · 33% das pessoas')} />
        <Item titulo={t('Expansão')} texto={t('12 meses · 100% das pessoas')} />
      </Bloco>
      <Seta />
      <Bloco n={4} cor="ambar" icone={ICONE.custo} titulo={t('Custo')} sub={t('Por categoria e por fase')}>
        <Item titulo={t('Informado')} texto={t('valores que a equipe já tem')} />
        <Item titulo={t('Estimado')} texto={t('estimativas de referência (equipe, formação, licenças)')} />
        <Item titulo={t('A levantar')} texto={t('itens ainda sem valor')} />
      </Bloco>
    </div>
    <div className="dg-faixa">
      <span><b>{t('Estimativas de referência')}</b> {t('pessoas × horas × custo por hora; pessoas em tempo integral × meses; usuários × licença × meses')}</span>
      <span><b>{t('Resultado')}</b> {t('custo por fase e total, com o que falta levantar')}</span>
    </div>
  </figure>;
}
