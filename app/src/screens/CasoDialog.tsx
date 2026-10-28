// Caixa "Caso": exportar e importar o caso (JSON, formato 14; arquivo ou dados colados), carregar um exemplo,
// começar em branco, país da rede (opcional, REF-06), moeda, idioma e tema; a versão da base de referências (REF-05). Tudo fica no navegador; nada é enviado. Antes de substituir um caso
// com respostas (exemplos, em branco, importar) pede confirmação (acoes.ts).
import { useRef, useState } from 'react';
import { CASOS, tr, LOC, versaoReferencias } from '../domain';
import { useCaso } from '../store';
import { Dialog, Button, Alert, Segmented, TextField, useTheme } from '../ui';
import { t } from '../percurso/textos';
import { SeletorMoeda } from './refinar/SeletorMoeda';
import { Pais } from '../percurso/Pais';
import {
  baixarArquivo, exportarCaso, copiarDadosCaso, importarArquivo, importarTexto, abrirExemplo, comecarEmBranco, temDownloads, confirmacaoAberta,
  type ResultadoImportacao,
} from './acoes';
import './transversal.css';

// `baixarArquivo` e `importarArquivo` moram em acoes.ts; continuam exportados daqui para quem já os importava (Plano.tsx).
export { baixarArquivo, importarArquivo };

/** Arquivo .json ou dados colados (o que "Copiar dados do caso" copia). `onPronto` recebe o erro, se houver. */
export function CampoImportar({ onPronto, rotulo }: { onPronto?: (erro: string | null) => void; rotulo?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [colando, setColando] = useState(false);
  const [texto, setTexto] = useState('');
  const [erroColar, setErroColar] = useState<string | undefined>();
  const fim = (r: ResultadoImportacao) => {
    if ('cancelado' in r) return;
    onPronto?.(r.ok ? null : r.erro);
    if (r.ok) { setColando(false); setTexto(''); setErroColar(undefined); }
  };
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
          fim(await importarArquivo(f));
        }}
      />
      <Button variant="secondary" onClick={() => setColando((x) => !x)} aria-expanded={colando}>{t('Colar dados')}</Button>
      {colando ? (
        <div className="pc-colar">
          <TextField
            multiline
            label={t('Dados do caso')}
            value={texto}
            onChange={(v) => { setTexto(v); setErroColar(undefined); }}
            hint={t('Cole aqui o texto copiado com "Copiar dados do caso".')}
            error={erroColar}
          />
          <div className="pc-botoes">
            <Button
              size="sm"
              onClick={async () => {
                if (!texto.trim()) { setErroColar(t('Cole antes os dados do caso.')); return; }
                const r = await importarTexto(texto.trim());
                if (!r.ok && 'erro' in r) setErroColar(r.erro);
                fim(r);
              }}
            >{t('Importar dados colados')}</Button>
            <Button size="sm" variant="secondary" onClick={() => { setColando(false); setErroColar(undefined); }}>{t('Cancelar')}</Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** "Base de referências v1.0.0 (18/10/2026); países v1.0.0 (18/10/2026)." */
function textoVersao(): string {
  const v = versaoReferencias();
  const data = (d: string) => { try { return d ? new Date(d + 'T12:00:00').toLocaleDateString(String(LOC())) : '?'; } catch (e) { return d; } };
  return t('Base de referências v{0} ({1}); países v{2} ({3}).', { 0: v.referencias, 1: data(v.atualizado), 2: v.paises, 3: data(v.paisesAtualizado) });
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
      // com uma confirmação aberta por cima, o Esc fecha só a confirmação
      onClose={() => { if (!confirmacaoAberta()) fechar(); }}
      title={t('Caso e preferências')}
      actions={<Button variant="secondary" onClick={fechar}>{t('Fechar')}</Button>}
    >
      <div className="pc-dialogo">
        {msg ? <Alert kind={msg.tipo} title={msg.texto} /> : null}
        <section>
          <h3 className="pc-dialogo-titulo">{t('Este caso')}</h3>
          <p className="pc-dialogo-texto">{t('As respostas ficam salvas só neste navegador. Exporte o caso para guardar uma cópia ou abrir em outro computador.')}</p>
          <div className="pc-botoes">
            <Button onClick={async () => { if (await exportarCaso()) setMsg({ tipo: 'info', texto: t('Caso exportado.') }); }}>{t('Exportar caso (.json)')}</Button>
            <Button variant="secondary" onClick={() => { void copiarDadosCaso(); }}>{t('Copiar dados do caso')}</Button>
          </div>
          {temDownloads() ? null : <p className="pc-dialogo-texto">{t('Se o download não funcionar neste ambiente, copie os dados do caso e guarde o texto; para abrir de novo, use "Colar dados".')}</p>}
          <div className="pc-botoes">
            <CampoImportar
              onPronto={(erro) => {
                setMsg(erro ? { tipo: 'atencao', texto: erro } : { tipo: 'info', texto: t('Caso importado.') });
              }}
            />
          </div>
        </section>
        <section>
          <h3 className="pc-dialogo-titulo">{t('Exemplos ilustrativos')}</h3>
          <p className="pc-dialogo-texto">{t('Abrir um exemplo ou começar em branco apaga o caso salvo. Para guardá-lo, exporte antes.')}</p>
          <div className="pc-botoes">
            {exemplos.map((k) => (
              <Button key={k} variant="secondary" onClick={async () => { if (await abrirExemplo(k)) fechar(); }}>
                {String(tr((CASOS as any)[k].titulo))}
              </Button>
            ))}
          </div>
          <div className="pc-botoes">
            <Button variant="link" onClick={async () => { if (await comecarEmBranco()) fechar(); }}>{t('Começar um caso em branco')}</Button>
          </div>
        </section>
        <section>
          <h3 className="pc-dialogo-titulo">{t('Modo')}</h3>
          <Segmented label={t('Modo')} value={s.modo} onChange={(m) => s.setModo(m)} options={[{ value: 'essencial', label: t('Essencial') }, { value: 'refinar', label: t('Refinar') }]} />
          <p className="pc-dialogo-texto">{t('Essencial: as perguntas que mudam o plano, com premissas padrão no resto. Refinar: as mesmas telas, com as premissas de cada capítulo abertas para ajuste.')}</p>
        </section>
        <section>
          <h3 className="pc-dialogo-titulo">{t('País e moeda')}</h3>
          <Pais />
          <SeletorMoeda compacto semNota />
          <p className="pc-dialogo-texto">{textoVersao()}</p>
        </section>
        <section>
          <h3 className="pc-dialogo-titulo">{t('Aparência')}</h3>
          <Segmented label={t('Aparência')} value={theme} onChange={(v) => setTheme(v)} options={[{ value: 'light', label: t('Claro') }, { value: 'dark', label: t('Escuro') }]} />
        </section>
      </div>
    </Dialog>
  );
}
