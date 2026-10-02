import { reorderHandler } from "@/lib/api/crud";
import { certificationResource } from "@/lib/resources";

export const PATCH = reorderHandler(certificationResource);
