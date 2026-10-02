import { collectionHandlers } from "@/lib/api/crud";
import { experienceResource } from "@/lib/resources";

export const { GET, POST } = collectionHandlers(experienceResource);
