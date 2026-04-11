import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  ArrowLeftRight,
  FileText,
} from "lucide-react";

interface ImageSlot {
  file: File | null;
  preview: string | null;
  base64: string | null;
}

const emptySlot: ImageSlot = { file: null, preview: null, base64: null };

const ComparisonPage: React.FC = () => {
  const { toast } = useToast();
  const [before, setBefore] = useState<ImageSlot>(emptySlot);
  const [after, setAfter] = useState<ImageSlot>(emptySlot);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");

  const handleImage = useCallback(
    (setter: React.Dispatch<React.SetStateAction<ImageSlot>>) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setter({ file, preview: result, base64: result.split(",")[1] });
        };
        reader.readAsDataURL(file);
        setReport("");
      },
    [],
  );

  const clearSlot = (setter: React.Dispatch<React.SetStateAction<ImageSlot>>) => () =>
    setter(emptySlot);

  const handleSubmit = async () => {
    if (!before.base64 || !after.base64) {
      toast({ title: "Lỗi", description: "Vui lòng upload cả 2 ảnh.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setReport("");
    try {
      const { data, error } = await supabase.functions.invoke("medical-ai", {
        body: {
          task_type: "comparison",
          image_base64: before.base64,
          image_type: before.file?.type || "image/png",
          image_base64_after: after.base64,
          image_type_after: after.file?.type || "image/png",
          clinical_notes: clinicalNotes,
        },
      });
      if (error) throw error;
      setReport(data.refined_report || data.draft_report || "");
      toast({ title: "Thành công!", description: "Đã tạo báo cáo so sánh." });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadCard = ({
    label,
    slot,
    setter,
  }: {
    label: string;
    slot: ImageSlot;
    setter: React.Dispatch<React.SetStateAction<ImageSlot>>;
  }) => (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex gap-2 items-center">
          <ImageIcon className="w-4 h-4" /> {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {slot.preview ? (
          <div className="relative">
            <img src={slot.preview} className="rounded-lg max-h-64 w-full object-contain bg-muted" alt={label} />
            <button onClick={clearSlot(setter)} className="absolute top-2 right-2">
              <AlertCircle className="text-red-500" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Upload ảnh</span>
            <input type="file" accept="image/*" onChange={handleImage(setter)} className="hidden" />
          </label>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">So sánh X-quang</h1>
        <p className="text-muted-foreground">
          Upload 2 ảnh X-quang (trước và sau điều trị) để AI phân tích so sánh
        </p>
      </div>

      {/* Two image uploads side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageUploadCard label="Ảnh TRƯỚC điều trị" slot={before} setter={setBefore} />
        <ImageUploadCard label="Ảnh SAU điều trị" slot={after} setter={setAfter} />
      </div>

      {/* Clinical notes + submit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex gap-2 items-center">
            <FileText className="w-4 h-4" /> Ghi chú lâm sàng
          </CardTitle>
          <CardDescription>Thông tin bệnh nhân, phương pháp điều trị, thời gian...</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ví dụ: Bệnh nhân nam 45 tuổi. Gãy xương đùi phải. Phẫu thuật kết hợp xương 3 tháng trước..."
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleSubmit} className="w-full mt-4" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <ArrowLeftRight className="mr-2 h-4 w-4" />
            )}
            {loading ? "Đang phân tích..." : "So sánh"}
          </Button>
        </CardContent>
      </Card>

      {/* Report */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Báo cáo so sánh</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{report}</ReactMarkdown>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComparisonPage;
