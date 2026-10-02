import { reorderHandler } from "@/lib/api/crud";
import { hackathonResource } from "@/lib/resources";

export const PATCH = reorderHandler(hackathonResource);
