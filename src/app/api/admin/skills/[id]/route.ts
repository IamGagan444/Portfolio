import { itemHandlers } from "@/lib/api/crud";
import { skillResource } from "@/lib/resources";

export const { GET, PATCH, DELETE } = itemHandlers(skillResource);
