import { reorderHandler } from "@/lib/api/crud";
import { experienceResource } from "@/lib/resources";

export const PATCH = reorderHandler(experienceResource);
