import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Image as ImageIcon,
} from "lucide-react";

const ReportPage: React.FC = () => {
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftReport, setDraftReport] = useState("");
  const [refinedReport, setRefinedReport] = useState("");
  const [refinementLog, setRefinementLog] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

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
      toast({ title: "Lỗi", description: "Vui lòng upload hình ảnh X-quang.", variant: "destructive" });
      return;
    }
    if (!clinicalNotes.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập ghi chú lâm sàng.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setDraftReport("");
    setRefinedReport("");
    setRefinementLog([]);
    setCurrentStep(0);

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(imageFile);
      });

      // Simulate steps for UX
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

      // Save to database
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

      toast({ title: "Thành công!", description: "Báo cáo đã được tạo và lưu vào lịch sử." });
    } catch (error: any) {
      console.error("Report generation error:", error);
      toast({ title: "Lỗi", description: error.message || "Không thể tạo báo cáo.", variant: "destructive" });
    } finally {
      setLoading(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Tạo báo cáo X-quang</h1>
        <p className="text-muted-foreground mt-1">
          Upload ảnh X-quang và ghi chú lâm sàng để tạo báo cáo tự động bằng AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-6">
          {/* Image upload */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Hình ảnh y khoa
              </CardTitle>
              <CardDescription>Upload ảnh X-quang, CT, hoặc MRI</CardDescription>
            </CardHeader>
            <CardContent>
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Medical image"
                    className="w-full rounded-lg border object-contain max-h-80 bg-foreground/5"
                  />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-52 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Kéo thả hoặc click để upload</span>
                  <span className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, DICOM (tối đa 20MB)</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Clinical notes */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Ghi chú lâm sàng
              </CardTitle>
              <CardDescription>Nhập thông tin bệnh nhân, triệu chứng, tiền sử bệnh</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ví dụ: Bệnh nhân nam, 55 tuổi. Ho kéo dài 2 tuần, sốt nhẹ. Tiền sử: hút thuốc 20 năm. Khám: ran ẩm đáy phổi phải..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="min-h-[150px] resize-none"
              />
              <Button
                onClick={handleSubmit}
                disabled={loading || !imageFile}
                className="mt-4 w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Tạo báo cáo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Progress */}
          {loading && (
            <Card className="shadow-card border-primary/20">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-foreground mb-3">Tiến trình xử lý</p>
                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <div key={step} className="flex items-center gap-3 text-sm">
                      {i < currentStep ? (
                        <CheckCircle2 className="h-4 w-4 text-medical-success flex-shrink-0" />
                      ) : i === currentStep ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span className={i <= currentStep ? "text-foreground" : "text-muted-foreground"}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Output panel */}
        <div className="space-y-6">
          {draftReport && (
            <Card className="shadow-card animate-slide-in-right">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-medical-warning" />
                  Báo cáo nháp (Draft)
                </CardTitle>
                <CardDescription>Kết quả ban đầu từ VLM trước khi refinement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground bg-secondary/30 p-4 rounded-lg">
                  <ReactMarkdown>{draftReport}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {refinedReport && (
            <Card className="shadow-card border-medical-success/30 animate-slide-in-right">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-medical-success" />
                  Báo cáo hoàn chỉnh (Tiếng Việt)
                </CardTitle>
                <CardDescription>Đã qua Self-Refinement Agent kiểm tra và cải thiện</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground bg-medical-success/5 p-4 rounded-lg border border-medical-success/20">
                  <ReactMarkdown>{refinedReport}</ReactMarkdown>
                </div>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Tải báo cáo
                </Button>
              </CardContent>
            </Card>
          )}

          {refinementLog.length > 0 && (
            <Card className="shadow-card animate-slide-in-right">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  Nhật ký Refinement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {refinementLog.map((log, i) => (
                    <div key={i} className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                      <span className="font-medium text-foreground">Bước {i + 1}:</span> {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!draftReport && !loading && (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Upload hình ảnh và nhập ghi chú lâm sàng để bắt đầu tạo báo cáo
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
