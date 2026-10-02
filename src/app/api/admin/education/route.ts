import { collectionHandlers } from "@/lib/api/crud";
import { educationResource } from "@/lib/resources";

export const { GET, POST } = collectionHandlers(educationResource);
