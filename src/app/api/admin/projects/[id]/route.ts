import { itemHandlers } from "@/lib/api/crud";
import { projectResource } from "@/lib/resources";

export const { GET, PATCH, DELETE } = itemHandlers(projectResource);
