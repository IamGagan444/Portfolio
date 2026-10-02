import { collectionHandlers } from "@/lib/api/crud";
import { skillResource } from "@/lib/resources";

export const { GET, POST } = collectionHandlers(skillResource);
