import { itemHandlers } from "@/lib/api/crud";
import { hackathonResource } from "@/lib/resources";

export const { GET, PATCH, DELETE } = itemHandlers(hackathonResource);
