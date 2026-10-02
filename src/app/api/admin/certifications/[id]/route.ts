import { itemHandlers } from "@/lib/api/crud";
import { certificationResource } from "@/lib/resources";

export const { GET, PATCH, DELETE } = itemHandlers(certificationResource);
