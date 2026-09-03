import { Construction } from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AdminPageBody } from "@/components/admin-page-body";
import { DEFERRED_MODULES, isDeferredModule } from "@/lib/deferred-modules";

export default async function DeferredModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleKey } = await params;
  if (!isDeferredModule(moduleKey)) notFound();

  const moduleConfig = DEFERRED_MODULES[moduleKey];

  return (
    <AdminPageBody>
      <Card>
        <EmptyState
          icon={<Construction className="size-5" />}
          title={`${moduleConfig.title} is coming soon`}
          description="This module is part of the admin roadmap. Its navigation is in place, but no workflows or patient data are available here yet."
          action={<Badge variant="secondary">Planned module</Badge>}
          className="min-h-80 justify-center"
        />
      </Card>
    </AdminPageBody>
  );
}
