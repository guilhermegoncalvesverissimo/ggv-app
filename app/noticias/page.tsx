import { SectionTitle } from "@/components/SectionCard";
import { NewsFeed } from "@/components/noticias/NewsFeed";

export default function NoticiasPage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Notícias</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Posts do Boris Cherny e outras fontes, traduzidos para português pela
        routine que corre todos os dias.
      </p>

      <NewsFeed />
    </div>
  );
}
