"use client";

import dynamic from "next/dynamic";

// Both read localStorage/IndexedDB and speechSynthesis on first render, so
// they only render in the browser.
const loading = () => <div className="card flex items-center justify-center p-10 text-sm text-muted">A carregar…</div>;

export const DobragemBoardClient = dynamic(() => import("./DobragemBoard").then((m) => m.DobragemBoard), {
  ssr: false,
  loading,
});
export const DubPlayerClient = dynamic(() => import("./DubPlayer").then((m) => m.DubPlayer), { ssr: false, loading });
