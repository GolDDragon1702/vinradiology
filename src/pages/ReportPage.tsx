import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import ReportChat from "@/components/ReportChat";
import { exportReportToPdf } from "@/lib/exportPdf";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Image as ImageIcon,
} from "lucide-react";

const ReportPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [draftReport, setDraftReport] = useState("");
  const [refinedReport, setRefinedReport] = useState("");
  const [refinementLog, setRefinementLog] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const imageBase64Ref = useRef<string | null>(null);

  const steps = [
    "Tiền xử lý hình ảnh",
    "Phân tích VLM",
    "Tạo báo cáo nháp",
    "Self-Refinement",
    "Xuất báo cáo tiếng Việt",
  ];

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      setDraftReport("");
      setRefinedReport("");
      setRefinementLog([]);
    }
  }, []);

  const handleSubmit = async () => {
    if (!imageFile) {
      toast({ title: "Lỗi", description: "Vui lòng upload hình ảnh.", variant: "destructive" });
      return;
    }

    if (!clinicalNotes.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập ghi chú.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setDraftReport("");
    setRefinedReport("");
    setRefinementLog([]);
    setCurrentStep(0);

    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(imageFile);
      });

      imageBase64Ref.current = base64;

      // simulate steps
      for (let i = 0; i < 3; i++) {
        setCurrentStep(i);
        await new Promise((r) => setTimeout(r, 800));
      }

      const { data, error } = await supabase.functions.invoke("medical-ai", {
        body: {
          task_type: "report_generation",
          image_base64: base64,
          image_type: imageFile.type,
          clinical_notes: clinicalNotes,
        },
      });

      if (error) throw error;

      setCurrentStep(3);
      await new Promise((r) => setTimeout(r, 500));

      setDraftReport(data.draft_report || "");

      setCurrentStep(4);
      await new Promise((r) => setTimeout(r, 500));

      setRefinedReport(data.refined_report || "");
      setRefinementLog(data.refinement_log || []);

      if (user) {
        await supabase.from("medical_reports").insert({
          user_id: user.id,
          image_type: imageFile.type,
          clinical_notes: clinicalNotes,
          draft_report: data.draft_report || "",
          refined_report: data.refined_report || "",
          refinement_log: data.refinement_log || [],
          task_type: "report_generation",
        });
      }

      toast({ title: "Thành công!", description: "Đã tạo báo cáo." });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tạo báo cáo X-quang</h1>
        <p className="text-muted-foreground">
          Upload ảnh X-quang và ghi chú lâm sàng để tạo báo cáo tự động
        </p>
      </div>

      {/* TOP: Input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <ImageIcon className="w-5 h-5" /> Hình ảnh
            </CardTitle>
            <CardDescription>Upload ảnh X-quang</CardDescription>
          </CardHeader>
          <CardContent>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} className="rounded-lg max-h-80 w-full object-contain" />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2"
                >
                  <AlertCircle className="text-red-500" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-52 border-2 border-dashed rounded-lg cursor-pointer">
                <Upload />
                <input type="file" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <FileText className="w-5 h-5" /> Ghi chú
            </CardTitle>
            <CardDescription>Nhập thông tin bệnh nhân, triệu chứng, tiền sử bệnh</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ví dụ: Bệnh nhân nam, 55 tuổi. Ho kéo dài 2 tuần, sốt nhẹ. Tiền sử: hút thuốc 20 năm. Khám: ran ẩm đáy phổi phải..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="min-h-[150px]"
            />
            <Button onClick={handleSubmit} className="w-full mt-4" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Tạo báo cáo"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {loading && (
        <Card>
          <CardContent className="p-4 space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                {i < currentStep ? (
                  <CheckCircle2 className="text-green-500" />
                ) : i === currentStep ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <div className="w-4 h-4 border rounded-full" />
                )}
                {step}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* BOTTOM: Reports */}
      {(draftReport || refinedReport) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Draft EN */}
          {draftReport && (
            <Card>
              <CardHeader>
                <CardTitle>Draft Report</CardTitle>
              </CardHeader>
              <CardContent>
                <ReactMarkdown>{draftReport}</ReactMarkdown>
              </CardContent>
            </Card>
          )}

          {/* Refined VI */}
          {refinedReport && (
            <Card>
              <CardHeader>
                <CardTitle>Báo cáo hoàn chỉnh</CardTitle>
              </CardHeader>
              <CardContent>
                <ReactMarkdown>{refinedReport}</ReactMarkdown>

                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    exportReportToPdf(refinedReport, clinicalNotes, imagePreview)
                  }
                >
                  <Download className="mr-2" /> Tải PDF
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Chat */}
      {refinedReport && (
        <ReportChat
          currentReport={refinedReport}
          clinicalNotes={clinicalNotes}
          imageBase64={imageBase64Ref.current}
          imageType={imageFile?.type || null}
          onReportUpdate={(r) => setRefinedReport(r)}
        />
      )}
    </div>
  );
};

export default ReportPage;