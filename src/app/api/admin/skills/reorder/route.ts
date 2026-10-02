import { reorderHandler } from "@/lib/api/crud";
import { skillResource } from "@/lib/resources";

export const PATCH = reorderHandler(skillResource);
