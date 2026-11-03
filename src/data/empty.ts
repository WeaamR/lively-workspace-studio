import type { AppData } from "@/lib/types";

/** Starting state before the signed-in user's records load. No demo rows. */
export const emptyData: AppData = {
  profile: {
    id: "",
    full_name: "",
    email: "",
    phone: "",
    specialty: "",
    bio: "",
    location: "",
    years_experience: 0,
    currency: "USD",
  },
  services: [],
  projects: [],
  messages: [],
  scopeVersions: [],
  scopeItems: [],
};
