/**
 * Domain types. Each interface mirrors a future Supabase table so the
 * local store can be swapped for real queries without touching the UI:
 *   profiles, services, projects, project_messages, scope_versions, scope_items
 */

export type ID = string;

export interface Profile {
  id: ID;
  full_name: string;
  email: string;
  phone: string;
  specialty: string;
  bio: string;
  location: string;
  years_experience: number;
  currency: string;
}

export type PricingModel = "fixed" | "hourly" | "package";

export interface Service {
  id: ID;
  user_id: ID;
  name: string;
  description: string;
  deliverables: string[];
  exclusions: string[];
  /** Services explicitly included in the price. Optional for older saved data. */
  inclusions?: string[];
  revision_limit: number;
  delivery_days: number;
  pricing_model: PricingModel;
  base_price: number;
  pricing_rules: string;
  is_active: boolean;
  created_at: string;
}

export type ProjectStatus = "pending" | "needs_clarification" | "in_progress" | "completed";

export interface Attachment {
  name: string;
  size: number;
  type: string;
}

/** Where a structured result came from. "demo" results are seeded examples, never real AI output. */
export type ResultSource = "demo" | "manual" | "ai";

export interface RequestAnalysis {
  confirmed: string[];
  missing: string[];
  ambiguous: string[];
  risks: string[];
  questions: string[];
  client_message: string;
  source: ResultSource;
  updated_at: string;
}

export interface Project {
  id: ID;
  user_id: ID;
  service_id: ID | null;
  title: string;
  client_name: string;
  status: ProjectStatus;
  original_request: string;
  attachments: Attachment[];
  /** Stored as jsonb on projects in phase 2. */
  analysis: RequestAnalysis | null;
  created_at: string;
  updated_at: string;
  is_demo: boolean;
}

export type MessageAuthor = "client" | "freelancer";
export type MessageKind = "original_request" | "message" | "change_request";

export type ChangeClassification = "within_scope" | "additional_work" | "needs_clarification";

export interface ChangeItem {
  id: ID;
  request_text: string;
  classification: ChangeClassification;
  /** Supporting clause in the approved scope version. */
  scope_item_id: ID | null;
  note: string;
}

export interface ChangeAnalysis {
  scope_version_id: ID;
  items: ChangeItem[];
  suggested_response: string;
  source: ResultSource;
  created_at: string;
}

export interface ProjectMessage {
  id: ID;
  project_id: ID;
  author: MessageAuthor;
  kind: MessageKind;
  content: string;
  created_at: string;
  /** Stored as jsonb on project_messages in phase 2. */
  change_analysis: ChangeAnalysis | null;
}

export type ScopeStatus = "draft" | "pending_approval" | "approved" | "superseded";

export interface ScopeVersion {
  id: ID;
  project_id: ID;
  version_number: number;
  status: ScopeStatus;
  delivery_deadline: string | null;
  revision_rounds: number;
  /** Whether the client confirmed the exact delivery date. Missing = confirmed if a date is set. */
  deadline_status?: "confirmed" | "pending_clarification";
  /** Clarification question / note shown while the date is unconfirmed. */
  deadline_note?: string;
  notes: string;
  created_at: string;
  sent_at: string | null;
  approved_at: string | null;
}

export type ScopeCategory =
  | "deliverable"
  | "included"
  | "excluded"
  | "client_responsibility"
  | "condition"
  | "open_item";

export interface ScopeItem {
  id: ID;
  scope_version_id: ID;
  category: ScopeCategory;
  content: string;
  position: number;
}

export interface AppData {
  profile: Profile;
  services: Service[];
  projects: Project[];
  messages: ProjectMessage[];
  scopeVersions: ScopeVersion[];
  scopeItems: ScopeItem[];
}
