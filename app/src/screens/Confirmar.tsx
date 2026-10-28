// Confirmação antes de ações que apagam algo (substituir o caso por um exemplo, começar em branco, importar
// por cima): `await confirmar({...})` devolve true/false. Um só <ConfirmacaoHost/> montado em App.tsx.
// Avisos breves de status ("Caso exportado."): `avisar(texto)` e <AvisosHost/>.
import { create } from 'zustand';
import { useRef } from 'react';
import { Dialog, Button, Toast } from '../ui';
import { t } from '../percurso/textos';

interface Pedido {
  titulo: string;
  texto: string;
  ok: string;
  /** botão extra antes de confirmar (ex.: "Exportar o caso antes") */
  extra?: { rotulo: string; acao: () => void };
  resolver: (v: boolean) => void;
}
const usePedido = create<{ pedido: Pedido | null }>(() => ({ pedido: null }));

export function confirmar(o: { titulo: string; texto: string; ok: string; extra?: Pedido['extra'] }): Promise<boolean> {
  return new Promise((resolver) => usePedido.setState({ pedido: { ...o, resolver } }));
}

export function ConfirmacaoHost() {
  const pedido = usePedido((s) => s.pedido);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  if (!pedido) return null;
  const fechar = (v: boolean) => { usePedido.setState({ pedido: null }); pedido.resolver(v); };
  return (
    <Dialog
      open
      onClose={() => fechar(false)}
      title={pedido.titulo}
      actions={
        <div className="pc-botoes">
          <Button ref={cancelarRef} variant="secondary" onClick={() => fechar(false)} autoFocus>{t('Cancelar')}</Button>
          {pedido.extra ? <Button variant="secondary" onClick={() => pedido.extra!.acao()}>{pedido.extra.rotulo}</Button> : null}
          <Button onClick={() => fechar(true)}>{pedido.ok}</Button>
        </div>
      }
    >
      <p className="pc-paragrafo">{pedido.texto}</p>
    </Dialog>
  );
}

const useAviso = create<{ texto: string; n: number }>(() => ({ texto: '', n: 0 }));
export function avisar(texto: string) { useAviso.setState((s) => ({ texto, n: s.n + 1 })); }
export function AvisosHost() {
  const { texto, n } = useAviso();
  return <Toast key={n} open={!!texto} message={texto} onClose={() => useAviso.setState({ texto: '' })} />;
}
