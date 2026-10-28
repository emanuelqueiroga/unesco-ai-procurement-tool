// Tipos do estado do caso no formato 14 (design/redesign/02-especificacao-reimplementacao.md, "Modelo de dados do caso").
// O formato 14 é o 13 mais `origem`, `modo` e `capitulo` (e `sugestoes`, de quem veio cada valor sugerido);
// `dadosCaso()` continua sendo o contrato de exportação.

export type Origem = 'padrao' | 'sugerido' | 'informado' | 'refinado';
export type Modo = 'essencial' | 'refinar';
export type Capitulo = 1 | 2 | 3 | 4;

/** Caso no formato de CASO_VAZIO (casos.js); os campos são os da v13, sem tipagem fina nesta etapa. */
export type Caso = Record<string, any>;
export type Ctx = Record<string, any>;
export type RespGov = Record<string, string | undefined>;
export type RespDet = Record<string, { qual?: string; falta?: string } | undefined>;

export interface Custo { base: string; cfg: any; editado: boolean; pendente?: boolean }
export interface Moeda { cod: string; taxa: string | number; taxaDe?: string }

export interface Estado14 {
  formato: 14;
  versao: 14;
  caso: Caso;
  ctx: Ctx;
  resp: RespGov;
  respC: Record<string, boolean>;
  respDet: RespDet;
  revisar: string[];
  /** sugestões que a pessoa dispensou com "Manter a minha": campo → valor sugerido (JSON); não voltam a pedir revisão enquanto a sugestão for a mesma (PER-07) */
  mantidas?: Record<string, string>;
  feitos: Record<string, boolean>;
  custo: Custo;
  moeda: Moeda;
  lang: string;
  /** origem de cada campo e subcampo ('piloto.escolas'); ausente = 'padrao' */
  origem: Record<string, Origem>;
  /** de quem veio o valor sugerido ('problemas', 'tarefas', 'testes', 'tipoTec', 'usuarios', 'modeloDisp', 'elegiveis', 'estimativa') */
  sugestoes: Record<string, string>;
  modo: Modo;
  capitulo: { atual: Capitulo; pergunta: string };
  exemplo: string;
}

/** Exportação (dadosCaso formato 14): o estado mais a identificação do arquivo. */
export interface DadosCaso14 extends Estado14 {
  app: 'ai-education-procurement-tool';
  v10: true;
  salvo: string;
}

export interface Sugestao { campo: string; valor: any; deQuem: string }
