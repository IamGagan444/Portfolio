import { collectionHandlers } from "@/lib/api/crud";
import { projectResource } from "@/lib/resources";

export const { GET, POST } = collectionHandlers(projectResource);
