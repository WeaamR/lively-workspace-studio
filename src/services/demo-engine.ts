/**
 * DEMO ENGINE — simple keyword rules, NOT artificial intelligence.
 * Results are always saved with source "demo" and labeled as such in the UI.
 * Used only while the real AI service (src/services/ai.ts) is not connected.
 */
import { composeChangeResponse, composeClarificationMessage, clauseRef } from "@/lib/scope";
import type { ChangeItem, RequestAnalysis, ScopeItem, ScopeVersion, Service } from "@/lib/types";

const STOP = new Set([
  "في", "من", "على", "الى", "إلى", "عن", "مع", "هذا", "هذه", "ذلك", "التي", "الذي", "او", "أو", "ثم",
  "بدنا", "نحتاج", "احتاج", "أحتاج", "اريد", "أريد", "نريد", "ممكن", "كمان", "ايضا", "أيضا", "شوي", "عندنا",
  "عندي", "لنا", "لي", "يكون", "تكون", "كل", "بس", "اذا", "إذا", "هل", "انا", "أنا", "نحن", "لو", "مرحبا", "اهلين",
]);

export function normalize(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase();
}

export function tokens(s: string): string[] {
  return normalize(s)
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.replace(/^(وال|بال|لل|ال|و)/, ""))
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

/** Shared-token score; 4-letter prefixes absorb simple Arabic morphology. */
export function overlap(a: string, b: string): number {
  const pa = new Set(tokens(a).map((t) => t.slice(0, 4)));
  return new Set(tokens(b).map((t) => t.slice(0, 4)).filter((t) => pa.has(t))).size;
}

export function splitRequests(text: string): string[] {
  return text
    .split(/[.!؟?\n؛]+|،\s*و|\s(?:و?كمان|وأيضا|وايضا|بالإضافة إلى|بالاضافة الى)\s/)
    .map((s) => s.trim().replace(/^و\s*/, ""))
    .filter((s) => s.length > 6);
}

const has = (text: string, re: RegExp) => re.test(normalize(text));

const VAGUE = ["بسيط", "عصري", "جميل", "مريح", "احترافي", "كامل", "كم", "شوي", "تقريبا", "حوالي", "وغيرها", "الخ", "مميز", "حلو"];

export function demoAnalyzeRequest(message: string, service: Service | null): Omit<RequestAnalysis, "updated_at"> {
  const sentences = splitRequests(message);
  const confirmed = sentences.map((s) => `ذكر العميل: «${s}»`);

  const budgetMatch = normalize(message).match(/(\d[\d,]*)\s*(دولار|\$|دينار|ريال|درهم|جنيه)/);
  const budget = budgetMatch ? Number(budgetMatch[1]!.replace(/,/g, "")) : null;

  const missing: string[] = [];
  const questions: string[] = [];
  if (!has(message, /ميزاني|دولار|\$|سعر|تكلف|دينار|ريال|درهم/)) {
    missing.push("الميزانية المتاحة للمشروع.");
    questions.push("ما الميزانية التقريبية المخصصة لهذا المشروع؟");
  }
  if (!has(message, /موعد|اسبوع|شهر|يوم|تاريخ|خلال|افتتاح|اطلاق|قبل/)) {
    missing.push("موعد التسليم المطلوب.");
    questions.push("ما موعد التسليم المطلوب؟");
  }
  if (!has(message, /مثال|امثل|مرجع|يعجب|زي|مثل|نموذج/)) {
    missing.push("أمثلة أو مراجع للأسلوب المطلوب.");
    questions.push("هل لديكم أمثلة لأعمال تعجبكم في نفس المجال؟");
  }
  if (!has(message, /محتوي|نصوص|نص|صور|ملفات|شعار|تعليق/)) {
    missing.push("جاهزية المحتوى والملفات من طرف العميل.");
    questions.push("هل المحتوى (النصوص، الصور، الشعار) جاهز وسيتم تزويدي به؟");
  }
  if (!/\d/.test(message)) {
    missing.push("الكميات أو الأعداد المطلوبة.");
    questions.push("كم العدد المطلوب بالتحديد (صفحات / تصاميم / نسخ / مدة)؟");
  }

  const ambiguous: string[] = [];
  for (const s of sentences) {
    const words = VAGUE.filter((w) => tokens(s).some((t) => t.startsWith(normalize(w))) || normalize(s).includes(` ${normalize(w)} `));
    if (words.length) {
      ambiguous.push(`«${s}» — ${words.map((w) => `«${w}»`).join("، ")} غير محدد بمعيار واضح.`);
      questions.push(`ماذا تقصدون بالتحديد بـ «${s}»؟`);
    }
  }

  const risks: string[] = [];
  if (service && budget !== null && budget < service.base_price) {
    risks.push(`الميزانية المذكورة (${budget}) أقل من السعر الأساسي للخدمة (${service.base_price}).`);
  }
  if (service) {
    for (const s of sentences) {
      const ex = service.exclusions.find((e) => overlap(s, e) > 0);
      if (ex) risks.push(`«${s}» قد يقع ضمن استثناءات الخدمة: «${ex}».`);
    }
    if (has(message, /اسبوع|ايام|يومين|عاجل|بسرعه|مستعجل/) && service.delivery_days > 7) {
      risks.push(`قد تكون المدة المطلوبة أقصر من مدة التسليم المعتادة (${service.delivery_days} يومًا).`);
    }
  }
  if (ambiguous.length >= 2) risks.push("كثرة العبارات غير المحددة قد تؤدي إلى توسع النطاق لاحقًا.");

  return {
    confirmed,
    missing,
    ambiguous,
    risks,
    questions,
    client_message: "",
    source: "demo",
  };
}

export function withDraftMessage(
  a: Omit<RequestAnalysis, "updated_at">,
  clientName: string,
  freelancerName: string,
): Omit<RequestAnalysis, "updated_at"> {
  return { ...a, client_message: composeClarificationMessage(clientName, a.questions, freelancerName) };
}

const REVISION = /تعديل|غير|تغيير|غمق|فتح|كبر|صغر|بدل|عدل/;

export function demoCompare(
  message: string,
  version: ScopeVersion,
  items: ScopeItem[],
  clientName: string,
  freelancerName: string,
): { items: ChangeItem[]; suggested_response: string } {
  const result: ChangeItem[] = splitRequests(message).map((req, i) => {
    let best: ScopeItem | null = null;
    let score = 0;
    for (const it of items) {
      const sc = overlap(req, it.content);
      if (sc > score) {
        score = sc;
        best = it;
      }
    }
    const id = `demo-${Date.now()}-${i}`;
    if (best && best.category === "excluded") {
      return { id, request_text: req, classification: "additional_work", scope_item_id: best.id, note: "يطابق بندًا مستثنى من النطاق (مطابقة كلمات تجريبية)." };
    }
    if (has(req, REVISION) && version.revision_rounds > 0) {
      const rev = items.find((it) => has(it.content, /تعديل/)) ?? best;
      return {
        id,
        request_text: req,
        classification: "within_scope",
        scope_item_id: rev?.id ?? null,
        note: `يبدو طلب تعديل؛ يُحتسب من جولات التعديل المتفق عليها (${version.revision_rounds}).`,
      };
    }
    if (best && score >= 2 && (best.category === "deliverable" || best.category === "included")) {
      return { id, request_text: req, classification: "within_scope", scope_item_id: best.id, note: "يطابق بندًا مشمولًا في النطاق (مطابقة كلمات تجريبية)." };
    }
    return {
      id,
      request_text: req,
      classification: best ? "needs_clarification" : "additional_work",
      scope_item_id: best?.id ?? null,
      note: best ? "تشابه جزئي مع بند في النطاق؛ يحتاج تأكيدًا من العميل." : "لا يوجد بند في النطاق يغطي هذا الطلب.",
    };
  });
  const suggested_response = composeChangeResponse(
    clientName,
    result,
    (sid) => {
      const it = items.find((x) => x.id === sid);
      return it ? clauseRef(it, items) : null;
    },
    freelancerName,
  );
  return { items: result, suggested_response };
}
