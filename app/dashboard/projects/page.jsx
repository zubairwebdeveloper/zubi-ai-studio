import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectsManager } from "@/components/dashboard/projects-manager";
import { requireUser } from "@/lib/auth/session";
import { listProjects } from "@/lib/data/dashboard";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await listProjects(user.uid);
  return (
    <>
      <PageHeader title="Projects" description="Group your generations and assets by client, campaign or idea." />
      <ProjectsManager projects={projects} />
    </>
  );
}
