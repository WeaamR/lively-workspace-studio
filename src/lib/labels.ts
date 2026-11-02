import type {
  ChangeClassification,
  PricingModel,
  ProjectStatus,
  ResultSource,
  ScopeCategory,
  ScopeStatus,
} from "./types";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  pending: "طلب قيد المراجعة",
  needs_clarification: "يحتاج توضيحًا",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
};

export const SCOPE_STATUS_LABEL: Record<ScopeStatus, string> = {
  draft: "مسودة",
  pending_approval: "بانتظار موافقة العميل",
  approved: "معتمد",
  superseded: "نسخة سابقة",
};

export const CLASSIFICATION_LABEL: Record<ChangeClassification, string> = {
  within_scope: "ضمن النطاق المتفق عليه",
  additional_work: "عمل إضافي",
  needs_clarification: "يحتاج توضيحًا",
};

export const PRICING_MODEL_LABEL: Record<PricingModel, string> = {
  fixed: "سعر ثابت",
  hourly: "بالساعة",
  package: "باقات",
};

export const SOURCE_LABEL: Record<ResultSource, string> = {
  demo: "بيانات تجريبية",
  manual: "إدخال يدوي",
  ai: "تحليل ذكي",
};

export const SCOPE_CATEGORY_ORDER: ScopeCategory[] = [
  "deliverable",
  "included",
  "excluded",
  "client_responsibility",
  "condition",
  "open_item",
];

export const SCOPE_CATEGORY_LABEL: Record<ScopeCategory, string> = {
  deliverable: "المخرجات",
  included: "الخدمات المشمولة",
  excluded: "الخدمات المستثناة",
  client_responsibility: "مسؤوليات العميل",
  condition: "شروط المشروع",
  open_item: "نقاط بانتظار التوضيح",
};

export const SCOPE_CATEGORY_HINT: Record<ScopeCategory, string> = {
  deliverable: "ما سيستلمه العميل في نهاية المشروع.",
  included: "الأعمال التي يشملها السعر المتفق عليه.",
  excluded: "ما لا يشمله المشروع ويُسعَّر بشكل منفصل.",
  client_responsibility: "ما يجب على العميل تقديمه أو الالتزام به.",
  condition: "شروط الدفع والتسليم والملكية وغيرها.",
  open_item: "معلومات غير مؤكدة بعد — ليست جزءًا من الاتفاق حتى يؤكدها العميل.",
};
