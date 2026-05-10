"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import type { NewsPost } from "@/lib/news/types";

const dayMonthFmt = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function shortHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Pull a tweet ID out of an x.com / twitter.com status URL, if any. */
function tweetIdFromUrl(url: string): string | null {
  const m = url.match(/(?:x\.com|twitter\.com)\/[^/]+\/status\/(\d+)/i);
  return m ? m[1] : null;
}

const isMobile = () =>
  typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function NewsFeed() {
  const [posts, setPosts] = useState<NewsPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storageMissing, setStorageMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news?limit=50", { cache: "no-store" })
      .then(async (r) => {
        const json = (await r.json()) as {
          posts?: NewsPost[];
          note?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
        setStorageMissing(json.note === "storage_not_configured");
        setPosts(json.posts ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="card p-5 text-sm text-danger">
        Erro ao carregar: {error}
      </div>
    );
  }

  if (posts === null) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-muted">
        A carregar…
      </div>
    );
  }

  if (storageMissing) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <Sparkles className="h-6 w-6 text-accent" strokeWidth={2.25} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          Backend ainda não configurado
        </h2>
        <p className="max-w-xs text-sm text-muted">
          Falta criar o projeto Supabase e adicionar as variáveis de ambiente no
          Vercel para o feed começar a aparecer aqui.
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <Sparkles className="h-6 w-6 text-accent" strokeWidth={2.25} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Sem posts ainda</h2>
        <p className="max-w-xs text-sm text-muted">
          Assim que a routine correr e empurrar os tweets traduzidos, aparecem
          aqui — primeiro os mais recentes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <NewsCard key={p.id} post={p} />
      ))}
    </div>
  );
}

function NewsCard({ post }: { post: NewsPost }) {
  /**
   * On mobile, try to open the X/Twitter app via its `twitter://` URL scheme.
   * If the app isn't installed (or the deep link is silently ignored), fall
   * back to the regular https URL after a short delay. On desktop, just use
   * the default new-tab behaviour.
   */
  const onSourceClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const tweetId = tweetIdFromUrl(post.source);
    if (!tweetId || !isMobile()) return;

    e.preventDefault();
    const before = Date.now();
    const fallback = () => {
      // If the X app handled the deep link, the page would have lost focus —
      // and most browsers pause setTimeouts in backgrounded tabs, so we only
      // hit this if we're still here (≈no app installed / link rejected).
      if (document.visibilityState === "visible" && Date.now() - before < 2500) {
        window.location.href = post.source;
      }
    };
    window.location.href = `twitter://status?id=${tweetId}`;
    setTimeout(fallback, 1200);
  };

  return (
    <article className="card p-5">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
          {post.author && (
            <span className="font-medium text-ink/80">{post.author}</span>
          )}
          <span>·</span>
          <time dateTime={post.postedAt}>
            {dayMonthFmt.format(new Date(post.postedAt))}
          </time>
        </div>
        <a
          href={post.source}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onSourceClick}
          className="flex shrink-0 items-center gap-1 rounded-full bg-canvas-soft px-2.5 py-1 text-[11px] font-medium text-ink/80"
        >
          <ExternalLink className="h-3 w-3" />
          {shortHost(post.source)}
        </a>
      </header>

      <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-ink">
        {post.translation}
      </p>

      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-medium text-muted transition group-open:text-ink">
          Ver original
        </summary>
        <p className="mt-2 whitespace-pre-line text-sm text-muted">
          {post.originalText}
        </p>
      </details>
    </article>
  );
}
