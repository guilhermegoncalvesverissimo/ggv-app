import { SectionTitle } from "@/components/SectionCard";
import { ProjectsBoard } from "@/components/projects/ProjectsBoard";

export default function ProjectsPage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Projetos</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Portfolio do que estás a fazer — toca num projeto para editar.
      </p>

      <ProjectsBoard />
    </div>
  );
}
