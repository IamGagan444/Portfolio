import { itemHandlers } from "@/lib/api/crud";
import { experienceResource } from "@/lib/resources";

export const { GET, PATCH, DELETE } = itemHandlers(experienceResource);
