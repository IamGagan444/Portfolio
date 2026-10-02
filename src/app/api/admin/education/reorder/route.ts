import { reorderHandler } from "@/lib/api/crud";
import { educationResource } from "@/lib/resources";

export const PATCH = reorderHandler(educationResource);
