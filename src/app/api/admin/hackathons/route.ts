import { collectionHandlers } from "@/lib/api/crud";
import { hackathonResource } from "@/lib/resources";

export const { GET, POST } = collectionHandlers(hackathonResource);
