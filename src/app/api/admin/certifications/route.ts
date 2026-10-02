import { collectionHandlers } from "@/lib/api/crud";
import { certificationResource } from "@/lib/resources";

export const { GET, POST } = collectionHandlers(certificationResource);
