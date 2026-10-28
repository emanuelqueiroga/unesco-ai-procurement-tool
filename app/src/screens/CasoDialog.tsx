// Caixa "Caso": exportar e importar o caso (JSON, formato 14), carregar um exemplo, começar em branco,
// idioma e tema. Tudo fica no navegador; nada é enviado.
import { useRef, useState } from 'react';
import { CASOS, tr } from '../domain';
import { useCaso, ErroImportacao } from '../store';
import { textoCaso, nomeArqCaso } from '../export/json';
import { Dialog, Button, Alert, Segmented, useTheme } from '../ui';
import { href, ir } from '../percurso/rota';
import { t } from '../percurso/textos';

export function baixarArquivo(nome: string, conteudo: string | Blob, tipo = 'application/json') {
  const blob = typeof conteudo === 'string' ? new Blob([conteudo], { type: tipo + ';charset=utf-8' }) : conteudo;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lê um arquivo .json e importa no store; devolve a mensagem de erro, se houver. */
export async function importarArquivo(f: File): Promise<string | null> {
  try {
    const texto = await f.text();
    useCaso.getState().importar(texto);
    return null;
  } catch (err) {
    return err instanceof ErroImportacao ? err.message : t('Não foi possível ler o arquivo.');
  }
}

export function CampoImportar({ onPronto, rotulo }: { onPronto?: (erro: string | null) => void; rotulo?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant="secondary" onClick={() => ref.current?.click()}>{rotulo || t('Importar caso')}</Button>
      <input
        ref={ref}
        type="file"
        accept=".json,application/json"
        hidden
        data-testid="importar-arquivo"
        onChange={async (ev) => {
          const f = ev.target.files?.[0];
          ev.target.value = '';
          if (!f) return;
          onPronto?.(await importarArquivo(f));
        }}
      />
    </>
  );
}

export function CasoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useCaso();
  const [theme, setTheme] = useTheme();
  const [msg, setMsg] = useState<{ tipo: 'info' | 'atencao'; texto: string } | null>(null);
  const exemplos = (['A', 'B', 'C', 'D'] as const).filter((k) => (CASOS as any)[k]);
  const fechar = () => { setMsg(null); onClose(); };
  return (
    <Dialog
      open={open}
      onClose={fechar}
      title={t('Caso e preferências')}
      actions={<Button variant="secondary" onClick={fechar}>{t('Fechar')}</Button>}
    >
      <div className="pc-dialogo">
        {msg ? <Alert kind={msg.tipo} title={msg.texto} /> : null}
        <section>
          <h3 className="pc-dialogo-titulo">{t('Este caso')}</h3>
          <p className="pc-dialogo-texto">{t('As respostas ficam salvas só neste navegador. Exporte o caso para guardar uma cópia ou abrir em outro computador.')}</p>
          <div className="pc-botoes">
            <Button onClick={() => { baixarArquivo(nomeArqCaso(s.estado()), textoCaso(s.estado())); setMsg({ tipo: 'info', texto: t('Caso exportado.') }); }}>{t('Exportar caso (.json)')}</Button>
            <CampoImportar onPronto={(erro) => setMsg(erro ? { tipo: 'atencao', texto: erro } : { tipo: 'info', texto: t('Caso importado.') })} />
          </div>
        </section>
        <section>
          <h3 className="pc-dialogo-titulo">{t('Exemplos ilustrativos')}</h3>
          <div className="pc-botoes">
            {exemplos.map((k) => (
              <Button key={k} variant="secondary" onClick={() => { s.carregarExemplo(k); fechar(); ir(href.plano()); }}>
                {String(tr((CASOS as any)[k].titulo))}
              </Button>
            ))}
          </div>
          <div className="pc-botoes">
            <Button variant="link" onClick={() => { s.limpar(); fechar(); ir(href.inicio()); }}>{t('Começar um caso em branco')}</Button>
          </div>
        </section>
        <section>
          <h3 className="pc-dialogo-titulo">{t('Modo')}</h3>
          <Segmented label={t('Modo')} value={s.modo} onChange={(m) => s.setModo(m)} options={[{ value: 'essencial', label: t('Essencial') }, { value: 'refinar', label: t('Refinar') }]} />
          <p className="pc-dialogo-texto">{t('Essencial: as perguntas que mudam o plano, com premissas padrão no resto. Refinar: as mesmas telas, com as premissas de cada capítulo abertas para ajuste.')}</p>
        </section>
        <section>
          <h3 className="pc-dialogo-titulo">{t('Aparência')}</h3>
          <Segmented label={t('Aparência')} value={theme} onChange={(v) => setTheme(v)} options={[{ value: 'light', label: t('Claro') }, { value: 'dark', label: t('Escuro') }]} />
        </section>
      </div>
    </Dialog>
  );
}
