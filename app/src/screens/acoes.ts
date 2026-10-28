// Ações da moldura que mexem no caso: baixar arquivo, exportar, copiar os dados, importar (arquivo ou texto colado),
// substituir o caso com confirmação e trocar de idioma. Os avisos de status saem por `avisar` (Toast).
import { useCaso, migrar } from '../store';
import { textoCaso, nomeArqCaso } from '../export/json';
import { usarIdioma } from '../i18n';
import { t } from '../percurso/textos';
import { href, ir } from '../percurso/rota';
import { ESSENCIAL } from '../store';
import { confirmar, avisar } from './Confirmar';
import { precisaConfirmar, deveRetraduzirExemplo, mensagemErroImportacao } from './transversal';

// ----------------------------------------------------------- download
/** Capacidade `downloads` do ambiente de artefato (window.claude.use('downloads')); null fora dele. */
let capDownloads: { save(o: { filename: string; data: unknown }): Promise<unknown> } | null = null;

/** Pede ao ambiente de artefato a capacidade de baixar arquivos; fora dele (GitHub Pages) não faz nada. */
export async function iniciarCapacidades(): Promise<void> {
  const w: any = typeof window !== 'undefined' ? window : null;
  if (!w || !w.claude || typeof w.claude.use !== 'function') return;
  try { capDownloads = await w.claude.use('downloads'); } catch { capDownloads = null; }
}
export const temDownloads = () => !!capDownloads;

function baixarPorLink(nome: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Entrega o arquivo: pela capacidade `downloads` quando o ambiente tem (artefato, onde `<a download>` não
 *  funciona) e, senão, por `<a download>`. Devolve como foi entregue, ou false se não foi. */
export async function baixarArquivo(nome: string, conteudo: string | Blob, tipo = 'application/json'): Promise<'capacidade' | 'link' | false> {
  const blob = typeof conteudo === 'string' ? new Blob([conteudo], { type: tipo + ';charset=utf-8' }) : conteudo;
  if (capDownloads) {
    try { await capDownloads.save({ filename: nome, data: conteudo }); avisar(t('Arquivo enviado para download.')); return 'capacidade'; }
    catch (e: any) {
      if (e && e.code === 'declined') return false;
      // o ambiente recusou o formato: tenta o link comum antes de desistir
      try { baixarPorLink(nome, blob); return 'link'; } catch { avisar(t('Não foi possível baixar agora.')); return false; }
    }
  }
  baixarPorLink(nome, blob);
  return 'link';
}

// ----------------------------------------------------------- exportar e copiar
export async function exportarCaso(): Promise<boolean> {
  const e = useCaso.getState().estado();
  const como = await baixarArquivo(nomeArqCaso(e), textoCaso(e));
  if (como === 'link') avisar(t('Caso exportado.'));
  return !!como;
}

/** Copia os dados do caso (JSON em uma linha) para colar depois em "Colar dados". */
export async function copiarDadosCaso(): Promise<boolean> {
  const txt = JSON.stringify(JSON.parse(textoCaso(useCaso.getState().estado())));
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(txt); avisar(t('Dados do caso copiados.')); return true; }
  } catch { /* cai no aviso abaixo */ }
  avisar(t('Não foi possível copiar.'));
  return false;
}

// ----------------------------------------------------------- substituir o caso
export type TipoSubstituicao = 'branco' | 'exemplo' | 'importar';

// Enquanto a confirmação está aberta, o diálogo por baixo (Caso) não deve fechar junto com o Esc.
let confirmando = 0;
export const confirmacaoAberta = () => confirmando > 0;

/** Pede confirmação antes de apagar um caso com respostas (TRA-01, TRA-13): diz que as respostas saem deste
 *  navegador, oferece "Exportar o caso antes" e deixa o foco em "Cancelar". Sem respostas da pessoa, só segue. */
export async function confirmarSubstituicao(tipo: TipoSubstituicao): Promise<boolean> {
  if (!precisaConfirmar(useCaso.getState())) return true;
  const ok = tipo === 'branco' ? t('Apagar e começar em branco') : tipo === 'exemplo' ? t('Apagar e abrir o exemplo') : t('Apagar e importar');
  confirmando++;
  // o foco volta ao botão de origem ao cancelar (a confirmação guarda como "origem" o botão Cancelar, que já
  // nasce focado por autoFocus; por isso o guardamos aqui)
  const origem = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
  let ok2 = false;
  try {
    ok2 = await confirmar({
      titulo: t('Apagar o caso atual?'),
      texto: t('As respostas deste caso serão apagadas deste navegador e não há como desfazer. Se quiser guardá-las, exporte o caso antes.'),
      ok,
      extra: { rotulo: t('Exportar o caso antes'), acao: () => { void exportarCaso(); } },
    });
    return ok2;
  } finally {
    // depois do Esc que a fechou terminar de passar pelos outros diálogos
    setTimeout(() => { confirmando--; if (!ok2 && origem && origem.isConnected) origem.focus(); }, 0);
  }
}

/** "Começar em branco": confirma, limpa e vai ao início. Devolve false se a pessoa cancelou. */
export async function comecarEmBranco(): Promise<boolean> {
  if (!(await confirmarSubstituicao('branco'))) return false;
  useCaso.getState().limpar();
  avisar(t('Caso em branco.'));
  ir(href.inicio());
  return true;
}

/** Abre um exemplo A–D (confirmando se houver respostas) e vai ao plano ou, com `destino`, à pergunta 1.1. */
export async function abrirExemplo(k: string, destino: 'plano' | 'percurso' = 'plano'): Promise<boolean> {
  if (!(await confirmarSubstituicao('exemplo'))) return false;
  useCaso.getState().carregarExemplo(k);
  avisar(t('Exemplo carregado.'));
  ir(destino === 'plano' ? href.plano() : href.pergunta(ESSENCIAL[0].capitulo, ESSENCIAL[0].id));
  return true;
}

// ----------------------------------------------------------- importar
export type ResultadoImportacao = { ok: true } | { ok: false; erro: string } | { ok: false; cancelado: true };

/** Importa o texto de um caso: valida antes de perguntar (um arquivo ruim não apaga nada nem pede confirmação),
 *  confirma a substituição, importa e põe a interface no idioma do caso importado (TRA-09). */
export async function importarTexto(texto: string): Promise<ResultadoImportacao> {
  try { migrar(texto); } catch (err) { return { ok: false, erro: mensagemErroImportacao(err) }; }
  if (!(await confirmarSubstituicao('importar'))) return { ok: false, cancelado: true };
  try { useCaso.getState().importar(texto); } catch (err) { return { ok: false, erro: mensagemErroImportacao(err) }; }
  await aplicarIdiomaDoCaso();
  avisar(t('Caso importado.'));
  return { ok: true };
}

export async function importarArquivo(f: File): Promise<ResultadoImportacao> {
  let texto: string;
  try { texto = await f.text(); } catch (err) { return { ok: false, erro: mensagemErroImportacao(err) }; }
  return importarTexto(texto);
}

// ----------------------------------------------------------- idioma
/** Põe a interface (texto, <html lang>, dir, fontes, dicionário) no idioma guardado no caso. */
export async function aplicarIdiomaDoCaso(): Promise<string> {
  const st = useCaso.getState();
  const l = await usarIdioma(st.lang || 'en');
  useCaso.getState().setLang(l);
  return l;
}

/** Troca o idioma da interface. Com um exemplo A–D não editado aberto, recarrega o exemplo no novo idioma
 *  (título, problema, resultado e demais textos), mantendo a pergunta em que a pessoa estava (TRA-10). */
export async function trocarIdioma(l: string): Promise<string> {
  const novo = await usarIdioma(l);
  const antes = useCaso.getState();
  const reexemplo = deveRetraduzirExemplo(antes) ? antes.exemplo : null;
  const pos = antes.capitulo;
  antes.setLang(novo);
  if (reexemplo) {
    const s = useCaso.getState();
    s.carregarExemplo(reexemplo);
    if (pos && pos.pergunta) useCaso.getState().irPara(pos.atual, pos.pergunta);
  }
  return novo;
}
