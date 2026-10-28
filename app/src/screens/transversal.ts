// Lógica pura do pacote transversal (sem React nem DOM, para testar em Vitest): quando pedir confirmação antes de
// substituir o caso, mensagens de erro de importação no idioma da interface, versão e data do rodapé, título da
// aba por tela, "continuar de onde parei" e a regra de retradução do exemplo ao trocar de idioma.
import { CASOS, tr } from '../domain';
import { ESSENCIAL, temRespostas, ErroImportacao } from '../store';
import { CAPITULOS_INFO, CURTO, t } from '../percurso/textos';
import { href, type Rota } from '../percurso/rota';

export const NOME_FERRAMENTA = 'AI in Education Procurement Tool';
export const EXEMPLOS = ['A', 'B', 'C', 'D'] as const;

type EstadoMin = { exemplo?: string; custo?: { editado?: boolean } | null; caso?: unknown; [k: string]: any };

/** Exemplo A–D ainda sem nenhuma edição: não há trabalho da pessoa a perder. */
export function exemploIlustrativo(s: EstadoMin): boolean {
  return (EXEMPLOS as readonly string[]).includes(String(s.exemplo));
}

/** Substituir o caso (em branco, exemplo, importar) pede confirmação quando há respostas da pessoa. Um exemplo
 *  não editado (`exemplo` A–D; o primeiro `responder` o marca como "editado") pode ser trocado sem perguntar. */
export function precisaConfirmar(s: EstadoMin): boolean {
  return temRespostas(s) && !exemploIlustrativo(s);
}

/** Ao trocar de idioma, o exemplo A–D não editado é recarregado no novo idioma (como textosExemplo na v13);
 *  se a pessoa mexeu nas premissas de custo (`custo.editado`) o exemplo deixa de ser o original e fica como está. */
export function deveRetraduzirExemplo(s: EstadoMin): boolean {
  return exemploIlustrativo(s) && !(s.custo && s.custo.editado);
}

/** Título do exemplo aberto, no idioma da interface (ou '' fora de um exemplo). */
export function nomeDoExemplo(k: string): string {
  const ex: any = (CASOS as any)[k];
  return ex && ex.titulo ? String(tr(ex.titulo)) : '';
}

// ----------------------------------------------------------- importação (TRA-08)
/** A mensagem de um erro de importação no idioma da interface, com o que fazer. As mensagens da camada de
 *  migração são portuguesas (as chaves de tradução); as com valor (aplicativo, formato) levam o valor. */
export function mensagemErroImportacao(err: unknown): string {
  const dica = t('Escolha um arquivo exportado por esta ferramenta.');
  if (!(err instanceof ErroImportacao)) return `${t('Não foi possível ler o arquivo.')} ${dica}`;
  const m = String(err.message);
  let corpo: string;
  let r: RegExpMatchArray | null;
  if (/JSON válido/.test(m)) corpo = t('O texto não é um JSON válido.');
  else if (/esperava um objeto JSON/.test(m)) corpo = t('O arquivo não é um caso exportado pela ferramenta (esperava um objeto JSON).');
  else if (/falta a chave "caso"/.test(m)) corpo = t('O arquivo não é um caso exportado pela ferramenta (falta a chave "caso").');
  else if ((r = m.match(/^O arquivo pertence a outro aplicativo \("(.*)"\)\.$/))) corpo = t('O arquivo pertence a outro aplicativo ("{app}").', { app: r[1] });
  else if ((r = m.match(/^Formato (.+) não é aceito \(aceitos: (.+)\)\.$/))) corpo = t('Formato {f} não é aceito (aceitos: {a}).', { f: r[1], a: r[2] });
  else corpo = t('Não foi possível ler o arquivo.');
  return `${corpo} ${dica}`;
}

// ----------------------------------------------------------- rodapé (TRA-04)
/** Versão mostrada no rodapé: "0.1.0" na estável, a versão completa ("0.1.0-alpha.3") na de revisão. */
export function versaoVisivel(versao: string, canal: 'estavel' | 'revisao'): string {
  return canal === 'revisao' ? versao : String(versao).split('-')[0];
}
/** Data do build como AAAA-MM-DD (aceita ISO completo). */
export function dataDoBuild(bruta: string | undefined | null): string {
  const m = String(bruta ?? '').match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : '';
}
export function textoVersao(versao: string, canal: 'estavel' | 'revisao', data: string | undefined | null): string {
  const v = versaoVisivel(versao, canal), d = dataDoBuild(data);
  return d ? t('Versão {v} · {d}', { v, d }) : t('Versão {v}', { v });
}

// ----------------------------------------------------------- título da aba (TRA-17)
/** Título da aba para a rota: "Pergunta 3 de 25 · Nome da rede · AI in Education Procurement Tool". */
export function tituloDaAba(rota: Rota): string {
  let parte = '';
  switch (rota.tipo) {
    case 'abertura': parte = `${t('Capítulo {n}', { n: rota.n })} · ${t(CAPITULOS_INFO[rota.n].titulo)}`; break;
    case 'pergunta': {
      const i = ESSENCIAL.findIndex((x) => x.id === rota.tela);
      parte = `${t('Pergunta {n} de {total}', { n: i + 1, total: ESSENCIAL.length })} · ${t(CURTO[rota.tela] || rota.tela)}`;
      break;
    }
    case 'sintese': parte = `${t('Capítulo {n}', { n: rota.n })} · ${t('Resumo do capítulo')}`; break;
    case 'plano': parte = `${t('Seu plano')} · ${t(({ resumo: 'Em resumo', custa: 'Quanto custa', fazer: 'O que fazer', exigir: 'O que exigir', apendice: 'Apêndice', faltam: 'Respostas que faltam' } as Record<string, string>)[rota.pagina] || 'Em resumo')}`; break;
    case 'refinar': parte = t('Refinar'); break;
    case 'galeria': parte = 'Prumo'; break;
    default: parte = '';
  }
  return parte ? `${parte} · ${NOME_FERRAMENTA}` : NOME_FERRAMENTA;
}

// ----------------------------------------------------------- continuar de onde parei (PER-23)
/** Destino de "Continuar de onde parei": a última pergunta vista (`capitulo`), senão a primeira pendente, senão o plano. */
export function destinoContinuar(
  s: { capitulo?: { atual?: number; pergunta?: string } | null },
  faltam: { capitulo: number; id: string }[],
): { href: string; pendente: boolean } {
  if (!faltam.length) return { href: href.plano(), pendente: false };
  const c = s.capitulo;
  const tela = c && c.pergunta ? ESSENCIAL.find((x) => x.id === c.pergunta && x.capitulo === c.atual) : undefined;
  if (tela) return { href: href.pergunta(tela.capitulo, tela.id), pendente: true };
  return { href: href.pergunta(faltam[0].capitulo, faltam[0].id), pendente: true };
}
