import { reorderHandler } from "@/lib/api/crud";
import { projectResource } from "@/lib/resources";

export const PATCH = reorderHandler(projectResource);
