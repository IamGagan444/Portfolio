import { itemHandlers } from "@/lib/api/crud";
import { educationResource } from "@/lib/resources";

export const { GET, PATCH, DELETE } = itemHandlers(educationResource);
