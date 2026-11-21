"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";

/**
 * How-to for the iOS Shortcuts automation that sends every Apple Pay payment
 * to /api/hooks/apple-pay. Shows the URL and token with copy buttons.
 */
export function ApplePaySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cfg, setCfg] = useState<{ url: string; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || cfg) return;
    let cancelled = false;
    fetch("/api/wallet/apple-pay", { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json()) as { url?: string; token?: string; error?: string };
        if (cancelled) return;
        if (r.ok && j.url && j.token) setCfg({ url: j.url, token: j.token });
        else setError(j.error ?? `HTTP ${r.status}`);
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Erro"));
    return () => {
      cancelled = true;
    };
  }, [open, cfg]);

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="-mx-1 max-h-[78dvh] space-y-4 overflow-y-auto px-1 pb-1">
        <div className="px-1">
          <h2 className="text-lg font-semibold tracking-tight">Apple Pay automático</h2>
          <p className="mt-1 text-sm text-muted">
            Cada vez que pagas com o iPhone ou o Watch, o atalho envia o valor e o
            comerciante para aqui e a despesa fica registada, com a categoria adivinhada
            pelo nome. Pagamentos com o cartão físico não entram.
          </p>
        </div>

        {error && <p className="px-1 text-sm text-danger">{error}</p>}

        <div className="space-y-2">
          <CopyRow label="URL" value={cfg?.url} />
          <CopyRow label="Cabeçalho Authorization" value={cfg ? `Bearer ${cfg.token}` : undefined} secret />
        </div>

        <ol className="space-y-3 px-1 text-sm text-ink">
          <Step n={1}>
            Abre a app <b>Atalhos</b> → separador <b>Automação</b> → <b>+</b> →{" "}
            <b>Transação</b>.
          </Step>
          <Step n={2}>
            Em <b>Cartão</b> escolhe o Revolut (e outros que queiras). Deixa
            comerciantes e categorias em “Qualquer”. Marca <b>Executar imediatamente</b>{" "}
            e carrega em <b>Seguinte</b> → <b>Nova automação vazia</b>.
          </Step>
          <Step n={3}>
            Adiciona a ação <b>Obter conteúdo do URL</b> e cola o <b>URL</b> de cima.
            Toca na seta para ver mais opções:
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted">
              <li>
                <b className="text-ink">Método:</b> POST
              </li>
              <li>
                <b className="text-ink">Cabeçalhos:</b> + → chave <code>Authorization</code>,
                valor: o cabeçalho de cima (começa por “Bearer”)
              </li>
              <li>
                <b className="text-ink">Corpo do pedido:</b> JSON, com três campos de texto:
                <br />
                <code>amount</code> → variável <b className="text-ink">Montante</b>
                <br />
                <code>merchant</code> → variável <b className="text-ink">Comerciante</b>
                <br />
                <code>card</code> → variável <b className="text-ink">Cartão</b>
              </li>
            </ul>
            <span className="mt-1.5 block text-muted">
              As variáveis aparecem por cima do teclado ao tocar no valor (vêm da
              “Entrada do atalho”).
            </span>
          </Step>
          <Step n={4}>
            (Opcional) Adiciona <b>Mostrar notificação</b> com o <b>Conteúdo do URL</b> —
            recebes “Despesa registada: 4,50 € · Pingo Doce (Comida, Revolut)”.
          </Step>
        </ol>

        <p className="px-1 text-xs text-muted">
          A despesa vai para a conta da Wallet com o mesmo nome do cartão (ex.: uma
          conta chamada “Revolut”); se nenhuma corresponder, vai para a primeira conta.
          Podes sempre editar a categoria depois. Não partilhes o cabeçalho: quem o tiver
          consegue criar despesas na tua Wallet.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-elevated px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98]"
        >
          Fechar
        </button>
      </div>
    </Sheet>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </li>
  );
}

function CopyRow({ label, value, secret }: { label: string; value?: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const shown = value && secret ? `${value.slice(0, 14)}••••••••${value.slice(-4)}` : value;
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-canvas-soft/50 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate font-mono text-xs text-ink">{shown ?? "A carregar…"}</p>
      </div>
      <button
        type="button"
        disabled={!value}
        onClick={async () => {
          if (!value) return;
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked */
          }
        }}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-elevated px-3 text-xs font-medium text-white transition active:scale-95 disabled:opacity-40"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
