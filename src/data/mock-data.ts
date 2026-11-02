/**
 * DEMO DATA — clearly labeled in the UI as "بيانات تجريبية".
 * Replaced by Supabase queries in phase 2.
 */
import type {
  AppData,
  Profile,
  Project,
  ProjectMessage,
  ScopeCategory,
  ScopeItem,
  ScopeVersion,
  Service,
} from "@/lib/types";

export const DEMO_USER_ID = "demo-user";

const profile: Profile = {
  id: DEMO_USER_ID,
  full_name: "ليان المصري",
  email: "layan@example.com",
  phone: "+962 7 9000 0000",
  specialty: "مصممة هوية بصرية وواجهات رقمية",
  bio: "أساعد المشاريع الناشئة والمقاهي والعيادات على بناء حضور بصري واضح ومتّسق، من الشعار حتى واجهة الموقع.",
  location: "عمّان، الأردن",
  years_experience: 7,
  currency: "دولار",
};

const services: Service[] = [
  {
    id: "svc-brand",
    user_id: DEMO_USER_ID,
    name: "تصميم هوية بصرية متكاملة",
    description: "شعار ونظام بصري كامل مع دليل استخدام.",
    deliverables: [
      "شعار رئيسي مع 3 نسخ بديلة",
      "لوحة ألوان وخطوط معتمدة",
      "دليل استخدام الهوية بصيغة PDF",
      "تطبيق الهوية على 3 مطبوعات أساسية",
    ],
    exclusions: ["الطباعة والإنتاج", "تصميم الموقع الإلكتروني", "تصاميم التغليف والمنتجات", "تصوير المنتجات"],
    revision_limit: 3,
    delivery_days: 21,
    pricing_model: "fixed",
    base_price: 1200,
    pricing_rules: "50% مقدمًا و50% عند التسليم. كل جولة تعديل إضافية بـ 80 دولار.",
    is_active: true,
    created_at: "2026-03-10T09:00:00Z",
  },
  {
    id: "svc-web",
    user_id: DEMO_USER_ID,
    name: "تصميم واجهة موقع تعريفي",
    description: "تصميم واجهات موقع على Figma جاهزة للتطوير.",
    deliverables: [
      "تصميم حتى 5 صفحات على Figma",
      "نسخة الجوال لكل صفحة",
      "مكتبة مكونات قابلة لإعادة الاستخدام",
      "ملف تسليم للمطوّر",
    ],
    exclusions: ["البرمجة والاستضافة", "كتابة المحتوى", "الصور المدفوعة", "تحسين محركات البحث"],
    revision_limit: 2,
    delivery_days: 14,
    pricing_model: "package",
    base_price: 900,
    pricing_rules: "الصفحة الإضافية بـ 150 دولار. يبدأ العمل بعد استلام المحتوى كاملًا.",
    is_active: true,
    created_at: "2026-04-02T09:00:00Z",
  },
  {
    id: "svc-social",
    user_id: DEMO_USER_ID,
    name: "تصاميم سوشيال ميديا شهرية",
    description: "باقة تصاميم شهرية متوافقة مع الهوية.",
    deliverables: ["12 تصميمًا شهريًا", "قالب قصص قابل للتعديل", "الملفات المصدرية"],
    exclusions: ["إدارة الحسابات والنشر", "الإعلانات الممولة", "الموشن جرافيك"],
    revision_limit: 1,
    delivery_days: 7,
    pricing_model: "package",
    base_price: 450,
    pricing_rules: "اشتراك شهري يُجدَّد تلقائيًا ما لم يُلغَ قبل 7 أيام من نهاية الشهر.",
    is_active: true,
    created_at: "2026-05-15T09:00:00Z",
  },
  {
    id: "svc-motion",
    user_id: DEMO_USER_ID,
    name: "فيديو موشن جرافيك إعلاني",
    description: "فيديو إعلاني موشن جرافيك بمدة تصل إلى 30 ثانية.",
    deliverables: ["فيديو موشن جرافيك عمودي واحد بمقاس 1080×1920، بمدة تصل إلى 30 ثانية."],
    inclusions: ["تصميم وتحريك فيديو موشن جرافيك إعلاني واحد", "جولتا تعديل على الفيديو"],
    exclusions: ["تسجيل التعليق الصوتي", "ملفات المشروع المصدرية"],
    revision_limit: 2,
    delivery_days: 10,
    pricing_model: "fixed",
    base_price: 600,
    pricing_rules: "بيانات تجريبية قابلة للتعديل. السعر يشمل فيديو واحدًا؛ النسخ أو المقاسات الإضافية تُسعّر منفصلة.",
    is_active: true,
    created_at: "2026-06-01T09:00:00Z",
  },
];

const projects: Project[] = [
  {
    id: "prj-habba",
    user_id: DEMO_USER_ID,
    service_id: "svc-brand",
    title: "هوية بصرية لمقهى «حبّة»",
    client_name: "أحمد السالم",
    status: "in_progress",
    original_request:
      "مرحبا، عندنا مقهى مختص جديد اسمه حبّة في جبل عمّان وبدنا هوية كاملة: شعار وألوان وكروت. بدنا إحساس دافئ وبسيط. الافتتاح أول ديسمبر. الميزانية تقريبًا ألف دولار.",
    attachments: [{ name: "صور-المكان.zip", size: 4_820_000, type: "application/zip" }],
    analysis: {
      confirmed: [
        "اسم المشروع: مقهى «حبّة» — مقهى مختص في جبل عمّان.",
        "المطلوب: شعار، ألوان، بطاقات عمل.",
        "الطابع المطلوب: دافئ وبسيط.",
        "موعد الافتتاح: 1 ديسمبر.",
        "الميزانية التقريبية التي ذكرها العميل: 1000 دولار.",
      ],
      missing: [
        "عدد نسخ الشعار المطلوبة.",
        "هل يحتاج العميل دليل استخدام للهوية؟",
        "الجمهور المستهدف للمقهى.",
      ],
      ambiguous: ["عبارة «هوية كاملة» قد تشمل مطبوعات أو تغليفًا غير مذكور."],
      risks: [
        "الميزانية المذكورة أقل من السعر الأساسي للخدمة (1200 دولار).",
        "ضيق الوقت قبل الافتتاح إذا تأخرت الموافقات.",
      ],
      questions: [
        "ما المطبوعات التي تحتاجونها بالتحديد إلى جانب بطاقة العمل؟",
        "هل تشمل «الهوية الكاملة» تصاميم الأكواب والتغليف؟",
        "هل لديكم أمثلة لهويات تعجبكم؟",
      ],
      client_message: "",
      source: "demo",
      updated_at: "2026-10-06T10:00:00Z",
    },
    created_at: "2026-10-05T08:30:00Z",
    updated_at: "2026-10-28T14:10:00Z",
    is_demo: true,
  },
  {
    id: "prj-smile",
    user_id: DEMO_USER_ID,
    service_id: "svc-web",
    title: "موقع تعريفي لعيادة «ابتسامة» لطب الأسنان",
    client_name: "د. هالة يوسف",
    status: "needs_clarification",
    original_request:
      "نحتاج موقع للعيادة فيه صفحة رئيسية وخدمات وفريق الأطباء وحجز مواعيد. بدنا التصميم يكون عصري ومريح. هل ممكن يكون جاهز خلال أسبوعين؟",
    attachments: [],
    analysis: {
      confirmed: [
        "نوع المشروع: موقع تعريفي لعيادة أسنان.",
        "الصفحات المذكورة: الرئيسية، الخدمات، فريق الأطباء، حجز المواعيد.",
        "المدة المطلوبة: أسبوعان.",
      ],
      missing: [
        "هل المحتوى والصور جاهزة؟",
        "الميزانية المتاحة.",
        "هل المطلوب تصميم فقط أم تصميم وبرمجة؟",
      ],
      ambiguous: [
        "«حجز مواعيد» قد يعني نموذج تواصل بسيط أو نظام حجز متكامل.",
        "«عصري ومريح» يحتاج أمثلة مرجعية.",
      ],
      risks: ["نظام الحجز المتكامل خارج خدمة تصميم الواجهات ويتطلب برمجة."],
      questions: [
        "هل المطلوب تصميم الواجهات فقط، أم تصميم وبرمجة؟",
        "هل تقصدون بحجز المواعيد نموذج طلب موعد، أم نظام حجز بتقويم ومواعيد متاحة؟",
        "هل النصوص وصور الأطباء جاهزة؟",
        "ما الميزانية التقريبية للمشروع؟",
      ],
      client_message: "",
      source: "demo",
      updated_at: "2026-10-30T11:20:00Z",
    },
    created_at: "2026-10-30T09:00:00Z",
    updated_at: "2026-10-30T11:20:00Z",
    is_demo: true,
  },
  {
    id: "prj-soap",
    user_id: DEMO_USER_ID,
    service_id: "svc-web",
    title: "واجهات متجر إلكتروني لصابون يدوي",
    client_name: "ريم العتيبي",
    status: "pending",
    original_request:
      "السلام عليكم، أبيع صابون طبيعي مصنوع يدويًا عبر إنستغرام وأريد متجر إلكتروني بسيط. عندي حوالي 20 منتج. أحتاج تصميم جميل يناسب المنتجات الطبيعية.",
    attachments: [{ name: "قائمة-المنتجات.xlsx", size: 38_000, type: "application/vnd.ms-excel" }],
    analysis: null,
    created_at: "2026-11-01T16:45:00Z",
    updated_at: "2026-11-01T16:45:00Z",
    is_demo: true,
  },
  {
    id: "prj-masar",
    user_id: DEMO_USER_ID,
    service_id: "svc-brand",
    title: "إعادة تصميم شعار شركة «مسار» للنقل",
    client_name: "خالد منصور",
    status: "completed",
    original_request:
      "شركتنا للنقل عمرها 15 سنة وبدنا نحدّث الشعار ليكون أوضح على الشاحنات واللوحات. بدنا نحافظ على اللون الأزرق.",
    attachments: [],
    analysis: null,
    created_at: "2026-08-10T10:00:00Z",
    updated_at: "2026-09-14T12:00:00Z",
    is_demo: true,
  },
  {
    id: "prj-nafas",
    user_id: DEMO_USER_ID,
    service_id: "svc-web",
    title: "صفحة هبوط لتطبيق «نَفَس» للياقة",
    client_name: "فريق تطبيق نَفَس",
    status: "needs_clarification",
    original_request:
      "نطلق تطبيق لياقة الشهر القادم ونحتاج صفحة هبوط تشرح المزايا وفيها روابط التحميل. ممكن كمان نحتاج كم صفحة ثانية.",
    attachments: [{ name: "لقطات-التطبيق.pdf", size: 2_150_000, type: "application/pdf" }],
    analysis: {
      confirmed: ["المطلوب: صفحة هبوط لتطبيق لياقة.", "المحتوى: شرح المزايا وروابط التحميل.", "الإطلاق: الشهر القادم."],
      missing: ["عدد الصفحات الإضافية ونوعها.", "اللغات المطلوبة للصفحة."],
      ambiguous: ["«كم صفحة ثانية» غير محددة العدد ولا المحتوى."],
      risks: ["صفحات غير محددة قد تتوسع خارج الباقة (5 صفحات)."],
      questions: ["كم عدد الصفحات الإضافية وما محتواها؟", "هل الصفحة بالعربية فقط أم بلغتين؟"],
      client_message: "",
      source: "demo",
      updated_at: "2026-10-20T13:00:00Z",
    },
    created_at: "2026-10-19T09:10:00Z",
    updated_at: "2026-10-21T15:00:00Z",
    is_demo: true,
  },
  {
    id: "prj-ghiras",
    user_id: DEMO_USER_ID,
    service_id: "svc-social",
    title: "تصاميم سوشيال ميديا لجمعية «غِراس»",
    client_name: "جمعية غِراس الخيرية",
    status: "in_progress",
    original_request:
      "نحتاج تصاميم شهرية لحساباتنا على إنستغرام وفيسبوك للتعريف بحملاتنا وتوثيق الأنشطة.",
    attachments: [],
    analysis: null,
    created_at: "2026-08-28T08:00:00Z",
    updated_at: "2026-09-25T10:00:00Z",
    is_demo: true,
  },
];

function buildItems(versionId: string, map: Partial<Record<ScopeCategory, string[]>>): ScopeItem[] {
  const out: ScopeItem[] = [];
  (Object.keys(map) as ScopeCategory[]).forEach((category) => {
    map[category]!.forEach((content, i) => {
      out.push({ id: `${versionId}-${category}-${i + 1}`, scope_version_id: versionId, category, content, position: i });
    });
  });
  return out;
}

const scopeVersions: ScopeVersion[] = [
  {
    id: "sv-habba-1",
    project_id: "prj-habba",
    version_number: 1,
    status: "approved",
    delivery_deadline: "2026-11-25",
    revision_rounds: 3,
    notes: "تم الاتفاق على تعديل السعر إلى 1100 دولار مقابل الاكتفاء بمطبوعات أساسية.",
    created_at: "2026-10-08T09:00:00Z",
    sent_at: "2026-10-09T09:00:00Z",
    approved_at: "2026-10-12T17:30:00Z",
  },
  {
    id: "sv-masar-1",
    project_id: "prj-masar",
    version_number: 1,
    status: "approved",
    delivery_deadline: "2026-09-10",
    revision_rounds: 2,
    notes: "",
    created_at: "2026-08-14T09:00:00Z",
    sent_at: "2026-08-15T09:00:00Z",
    approved_at: "2026-08-20T11:00:00Z",
  },
  {
    id: "sv-nafas-1",
    project_id: "prj-nafas",
    version_number: 1,
    status: "draft",
    delivery_deadline: null,
    revision_rounds: 2,
    notes: "بانتظار تحديد عدد الصفحات الإضافية.",
    created_at: "2026-10-21T15:00:00Z",
    sent_at: null,
    approved_at: null,
  },
  {
    id: "sv-ghiras-1",
    project_id: "prj-ghiras",
    version_number: 1,
    status: "superseded",
    delivery_deadline: "2026-09-30",
    revision_rounds: 1,
    notes: "",
    created_at: "2026-08-30T09:00:00Z",
    sent_at: "2026-08-31T09:00:00Z",
    approved_at: "2026-09-02T12:00:00Z",
  },
  {
    id: "sv-ghiras-2",
    project_id: "prj-ghiras",
    version_number: 2,
    status: "approved",
    delivery_deadline: "2026-11-30",
    revision_rounds: 1,
    notes: "رفع عدد التصاميم الشهرية من 12 إلى 16 بعد طلب الجمعية.",
    created_at: "2026-09-22T09:00:00Z",
    sent_at: "2026-09-23T09:00:00Z",
    approved_at: "2026-09-25T10:00:00Z",
  },
];

const scopeItems: ScopeItem[] = [
  ...buildItems("sv-habba-1", {
    deliverable: [
      "شعار رئيسي مع 3 نسخ بديلة (أفقي، مختصر، أيقونة).",
      "لوحة ألوان من 5 درجات وخطّان معتمدان.",
      "دليل استخدام الهوية بصيغة PDF.",
    ],
    included: [
      "تقديم 3 اتجاهات أولية للشعار.",
      "ثلاث جولات تعديل على الاتجاه المختار.",
      "تطبيق الهوية على 3 مطبوعات أساسية: بطاقة عمل، ورق رسمي، ظرف.",
    ],
    excluded: ["الطباعة والإنتاج.", "تصاميم التغليف والأكواب والمنتجات.", "تصميم الموقع والسوشيال ميديا."],
    client_responsibility: ["تزويدي بصور المكان والمراجع خلال 3 أيام.", "الرد على المسودات خلال 48 ساعة."],
    condition: ["الدفع: 50% مقدمًا و50% عند التسليم.", "تنتقل الملكية الكاملة للعميل بعد الدفعة الأخيرة."],
  }),
  ...buildItems("sv-masar-1", {
    deliverable: ["شعار محدّث بنسختين: ملونة وأحادية اللون.", "ملفات جاهزة للشاحنات واللوحات."],
    included: ["جولتا تعديل.", "اختبار وضوح الشعار على مسافة."],
    excluded: ["تنفيذ الملصقات على الشاحنات."],
    client_responsibility: ["تزويدي بالشعار الحالي بصيغة مفتوحة."],
    condition: ["الدفع كاملًا قبل تسليم الملفات النهائية."],
  }),
  ...buildItems("sv-nafas-1", {
    deliverable: ["تصميم صفحة هبوط بنسختي سطح المكتب والجوال."],
    included: ["قسم المزايا وروابط متاجر التطبيقات.", "جولتا تعديل."],
    excluded: ["البرمجة والاستضافة.", "كتابة المحتوى."],
    client_responsibility: ["توفير لقطات التطبيق والنصوص النهائية."],
    condition: [],
  }),
  ...buildItems("sv-ghiras-1", {
    deliverable: ["12 تصميمًا شهريًا.", "قالب قصص قابل للتعديل."],
    included: ["جولة تعديل واحدة لكل تصميم."],
    excluded: ["النشر وإدارة الحسابات."],
    client_responsibility: ["إرسال جدول الحملات في بداية كل شهر."],
    condition: ["اشتراك شهري."],
  }),
  ...buildItems("sv-ghiras-2", {
    deliverable: ["16 تصميمًا شهريًا.", "قالب قصص قابل للتعديل.", "الملفات المصدرية."],
    included: ["جولة تعديل واحدة لكل تصميم."],
    excluded: ["النشر وإدارة الحسابات.", "الإعلانات الممولة.", "الموشن جرافيك."],
    client_responsibility: ["إرسال جدول الحملات في بداية كل شهر.", "اعتماد التصاميم خلال يومي عمل."],
    condition: ["اشتراك شهري بقيمة 560 دولار.", "يُجدَّد تلقائيًا ما لم يُلغَ قبل 7 أيام."],
  }),
];

const messages: ProjectMessage[] = [
  ...projects.map<ProjectMessage>((p) => ({
    id: `msg-${p.id}-original`,
    project_id: p.id,
    author: "client",
    kind: "original_request",
    content: p.original_request,
    created_at: p.created_at,
    change_analysis: null,
  })),
  {
    id: "msg-habba-2",
    project_id: "prj-habba",
    author: "freelancer",
    kind: "message",
    content:
      "مرحبًا أحمد، شكرًا لتواصلك. هل تشمل «الهوية الكاملة» تصاميم الأكواب والتغليف؟ وما المطبوعات المطلوبة إلى جانب بطاقة العمل؟",
    created_at: "2026-10-06T10:30:00Z",
    change_analysis: null,
  },
  {
    id: "msg-habba-3",
    project_id: "prj-habba",
    author: "client",
    kind: "message",
    content: "حاليًا نكتفي بالشعار والكروت والورق الرسمي. التغليف نشوفه لاحقًا.",
    created_at: "2026-10-07T18:05:00Z",
    change_analysis: null,
  },
  {
    id: "msg-habba-4",
    project_id: "prj-habba",
    author: "client",
    kind: "change_request",
    content:
      "أهلين ليان، الشعار رائع! بس بدنا نغمّق درجة الأخضر شوي. وكمان بدنا تصميم للأكواب وأكياس البن، وإذا ممكن قائمة المشروبات للمقهى.",
    created_at: "2026-10-28T14:10:00Z",
    change_analysis: {
      scope_version_id: "sv-habba-1",
      items: [
        {
          id: "chg-habba-1",
          request_text: "تغميق درجة اللون الأخضر في الشعار.",
          classification: "within_scope",
          scope_item_id: "sv-habba-1-included-2",
          note: "تُحتسب كجولة تعديل من الجولات الثلاث المتفق عليها.",
        },
        {
          id: "chg-habba-2",
          request_text: "تصميم الأكواب وأكياس البن.",
          classification: "additional_work",
          scope_item_id: "sv-habba-1-excluded-2",
          note: "التغليف والأكواب مستثناة صراحةً من النطاق.",
        },
        {
          id: "chg-habba-3",
          request_text: "تصميم قائمة المشروبات.",
          classification: "needs_clarification",
          scope_item_id: "sv-habba-1-included-3",
          note: "القائمة غير مذكورة ضمن المطبوعات الثلاث؛ يجب سؤال العميل إن كانت بديلًا عن إحداها أو إضافة.",
        },
      ],
      suggested_response: "",
      source: "demo",
      created_at: "2026-10-28T15:00:00Z",
    },
  },
  {
    id: "msg-ghiras-2",
    project_id: "prj-ghiras",
    author: "client",
    kind: "change_request",
    content: "نحتاج زيادة عدد التصاميم إلى 16 شهريًا بسبب حملة الشتاء.",
    created_at: "2026-09-20T09:00:00Z",
    change_analysis: null,
  },
];

export const initialData: AppData = {
  profile,
  services,
  projects,
  messages,
  scopeVersions,
  scopeItems,
};
