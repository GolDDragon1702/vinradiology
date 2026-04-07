import html2pdf from "html2pdf.js";

export async function exportReportToPdf(
  reportContent: string,
  clinicalNotes: string,
  imagePreview: string | null,
) {
  const container = document.createElement("div");
  container.style.padding = "40px";
  container.style.fontFamily = "'Inter', sans-serif";
  container.style.color = "#1a1a2e";
  container.style.maxWidth = "800px";

  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  container.innerHTML = `
    <div style="text-align:center; margin-bottom:24px; border-bottom:2px solid #1a6fb5; padding-bottom:16px;">
      <h1 style="font-size:22px; color:#1a6fb5; margin:0;">MedVision AI</h1>
      <p style="font-size:12px; color:#666; margin:4px 0 0;">Báo cáo y khoa tự động — ${dateStr}</p>
    </div>

    ${imagePreview ? `<div style="text-align:center; margin-bottom:20px;"><img src="${imagePreview}" style="max-height:240px; border-radius:8px; border:1px solid #ddd;" /></div>` : ""}

    ${clinicalNotes ? `
      <div style="background:#f0f7ff; padding:12px 16px; border-radius:8px; margin-bottom:20px; border-left:4px solid #1a6fb5;">
        <p style="font-size:11px; font-weight:600; color:#1a6fb5; margin:0 0 4px;">GHI CHÚ LÂM SÀNG</p>
        <p style="font-size:13px; margin:0; white-space:pre-wrap;">${clinicalNotes}</p>
      </div>
    ` : ""}

    <div style="font-size:13px; line-height:1.7;">
      ${markdownToHtml(reportContent)}
    </div>

    <div style="margin-top:32px; padding-top:12px; border-top:1px solid #ddd; font-size:10px; color:#999; text-align:center;">
      Báo cáo được tạo bởi MedVision AI. Chỉ mang tính chất tham khảo, không thay thế chẩn đoán của bác sĩ.
    </div>
  `;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `MedVision_Report_${now.toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
  };

  await html2pdf().set(opt).from(container).save();
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3 style="font-size:15px; color:#1a6fb5; margin:16px 0 6px;">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="font-size:17px; color:#1a6fb5; margin:20px 0 8px;">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 style="font-size:19px; color:#1a6fb5; margin:20px 0 8px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.*$)/gm, '<li style="margin-left:16px;">$1</li>')
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
