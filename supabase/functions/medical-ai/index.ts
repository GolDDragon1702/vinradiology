import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============ ORCHESTRATOR AGENT ============
interface OrchestratorPlan {
  task_type: "report_generation" | "vqa";
  steps: string[];
  tools: string[];
}

function orchestrate(taskType: string, hasNotes: boolean, hasQuestion: boolean): OrchestratorPlan {
  const steps: string[] = [];
  const tools: string[] = [];

  // Step 1: Always preprocess image
  steps.push("Preprocess and validate medical image");
  tools.push("ImagePreprocessor");

  // Step 2: Parse clinical notes if provided
  if (hasNotes) {
    steps.push("Parse and structure clinical notes");
    tools.push("ClinicalNoteParser");
  }

  if (taskType === "report_generation") {
    steps.push("Analyze image with VLM for radiology findings");
    tools.push("VLM_ReportMode");
    steps.push("Generate structured radiology report");
    tools.push("ReportFormatter");
  } else {
    steps.push("Process visual question with VLM");
    tools.push("VLM_VQAMode");
  }

  // Step 4: Always self-refine
  steps.push("Validate and refine output via Self-Refinement Agent");
  tools.push("SelfRefinementAgent");

  // Step 5: Translate to Vietnamese
  steps.push("Generate final report in Vietnamese");
  tools.push("VietnameseTranslator");

  return { task_type: taskType as any, steps, tools };
}

// ============ VLM INFERENCE (via Lovable AI Gateway) ============
async function callVLM(
  apiKey: string,
  systemPrompt: string,
  userContent: any[],
): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (response.status === 402) throw new Error("Payment required. Please add credits.");
    const text = await response.text();
    throw new Error(`AI gateway error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ============ SELF-REFINEMENT AGENT ============
async function selfRefine(
  apiKey: string,
  draftReport: string,
  taskType: string,
  clinicalNotes: string,
  imageBase64: string,
  imageType: string,
): Promise<{ refined: string; log: string[] }> {
  const log: string[] = [];

  const validationPrompt = `You are a Medical Self-Refinement Agent. Review this ${
    taskType === "report_generation" ? "radiology report" : "VQA answer"
  } and check for:

1. Medical terminology correctness
2. Structural completeness (Findings, Impression, Recommendations for reports)
3. Consistency between findings and conclusions
4. Whether findings are well-supported

Draft to review:
${draftReport}

Clinical context: ${clinicalNotes || "None provided"}

Respond in this exact JSON format:
{
  "issues_found": true/false,
  "issues": ["list of issues"],
  "suggestions": ["list of improvements"],
  "quality_score": 0-100
}`;

  // Validation step
  const validationResult = await callVLM(apiKey, "You are a medical quality assurance agent. Always respond with valid JSON.", [
    { type: "text", text: validationPrompt },
  ]);

  let issues: any = {};
  try {
    const jsonMatch = validationResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) issues = JSON.parse(jsonMatch[0]);
  } catch {
    issues = { issues_found: false, quality_score: 80 };
  }

  log.push(`Đánh giá chất lượng: ${issues.quality_score || "N/A"}/100`);

  if (issues.issues?.length) {
    log.push(`Phát hiện ${issues.issues.length} vấn đề: ${issues.issues.join("; ")}`);
  }

  // Refinement step - generate improved Vietnamese report
  const refinementPrompt = `You are a senior Vietnamese radiologist. Based on the following analysis and refinement feedback, produce a polished, professional medical report IN VIETNAMESE.

Original draft:
${draftReport}

${issues.issues?.length ? `Issues to fix:\n${issues.issues.join("\n")}` : "No major issues found."}
${issues.suggestions?.length ? `Suggestions:\n${issues.suggestions.join("\n")}` : ""}

Requirements:
- Write entirely in Vietnamese
- Use proper Vietnamese medical terminology
- Structure with: Kết quả (Findings), Kết luận (Impression), Khuyến nghị (Recommendations)
- Be precise and professional
- Include relevant measurements and anatomical references`;

  const userContent: any[] = [{ type: "text", text: refinementPrompt }];

  // Include image for context in refinement
  if (imageBase64) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${imageType};base64,${imageBase64}` },
    });
  }

  const refined = await callVLM(
    apiKey,
    "You are a senior Vietnamese radiologist and medical report specialist. Write professional medical reports in Vietnamese.",
    userContent,
  );

  log.push("Đã tạo báo cáo hoàn chỉnh bằng tiếng Việt");
  if (issues.suggestions?.length) {
    log.push(`Đã áp dụng ${issues.suggestions.length} cải thiện`);
  }

  return { refined, log };
}

// ============ MAIN HANDLER ============
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { task_type, image_base64, image_type, clinical_notes, question, chat_message, current_report, chat_history } = await req.json();

    // ===== REPORT CHAT: Doctor interacts with generated report =====
    if (task_type === "report_chat") {
      if (!chat_message || !current_report) {
        return new Response(JSON.stringify({ error: "Missing required fields: chat_message, current_report" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const historyMessages = (chat_history || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

      const systemPrompt = `Bạn là bác sĩ X-quang cao cấp (senior radiologist) hỗ trợ bác sĩ lâm sàng.
Bạn đang thảo luận về một báo cáo y khoa đã được tạo. Khi bác sĩ yêu cầu chỉnh sửa, bạn phải:

1. Trả lời câu hỏi hoặc thảo luận bằng tiếng Việt
2. Nếu bác sĩ yêu cầu thay đổi báo cáo, hãy tạo lại BÁO CÁO ĐẦY ĐỦ ĐÃ CẬP NHẬT trong block:
\`\`\`updated_report
[toàn bộ báo cáo đã cập nhật ở đây]
\`\`\`

Báo cáo hiện tại:
${current_report}

${clinical_notes ? `Ghi chú lâm sàng: ${clinical_notes}` : ""}`;

      const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: chat_message },
      ];

      // Include image if available
      if (image_base64) {
        messages[messages.length - 1] = {
          role: "user",
          content: [
            { type: "text", text: chat_message },
            { type: "image_url", image_url: { url: `data:${image_type || "image/png"};base64,${image_base64}` } },
          ],
        };
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI gateway error (${response.status}): ${text}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "";

      // Extract updated report if present
      const reportMatch = aiResponse.match(/```updated_report\n([\s\S]*?)```/);
      const updatedReport = reportMatch ? reportMatch[1].trim() : null;
      const chatResponse = reportMatch
        ? aiResponse.replace(/```updated_report\n[\s\S]*?```/, "").trim()
        : aiResponse;

      return new Response(
        JSON.stringify({
          chat_response: chatResponse,
          updated_report: updatedReport,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ===== EXISTING FLOWS =====
    if (!task_type || !image_base64) {
      return new Response(JSON.stringify({ error: "Missing required fields: task_type, image_base64" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Orchestrator plans the task
    const plan = orchestrate(task_type, !!clinical_notes, !!question);
    console.log("Orchestrator plan:", JSON.stringify(plan));

    // Step 2: VLM Inference
    let systemPrompt: string;
    const userContent: any[] = [];

    if (task_type === "report_generation") {
      systemPrompt = `You are an expert radiologist AI assistant. Analyze the provided medical image along with clinical notes to generate a comprehensive radiology report.

Structure your report as follows:
## Findings
- Detailed observations from the image
- Include anatomical references and measurements where visible

## Impression
- Summary of key findings
- Differential diagnosis if applicable

## Recommendations
- Suggested follow-up studies or actions

Be thorough, precise, and use proper medical terminology.`;

      userContent.push({
        type: "text",
        text: `Please analyze this medical image and generate a radiology report.\n\nClinical Notes: ${clinical_notes || "No clinical notes provided."}`,
      });
    } else {
      systemPrompt = `You are an expert medical VQA (Visual Question Answering) AI assistant. You analyze medical images and answer questions about them accurately and professionally.

Provide clear, evidence-based answers referencing specific findings visible in the image. Use proper medical terminology.`;

      userContent.push({
        type: "text",
        text: `Clinical Notes: ${clinical_notes || "None"}\n\nQuestion: ${question}`,
      });
    }

    // Add image
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${image_type || "image/png"};base64,${image_base64}` },
    });

    const draftReport = await callVLM(LOVABLE_API_KEY, systemPrompt, userContent);
    console.log("Draft report generated");

    // Step 3: Self-Refinement
    const { refined, log } = await selfRefine(
      LOVABLE_API_KEY,
      draftReport,
      task_type,
      clinical_notes || "",
      image_base64,
      image_type || "image/png",
    );
    console.log("Refinement complete");

    return new Response(
      JSON.stringify({
        task_type,
        plan,
        draft_report: draftReport,
        refined_report: refined,
        refinement_log: log,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("medical-ai error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message.includes("Rate limit") ? 429 : message.includes("Payment") ? 402 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
