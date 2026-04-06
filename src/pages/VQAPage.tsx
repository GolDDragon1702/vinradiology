import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  MessageSquareText,
  Loader2,
  Send,
  Image as ImageIcon,
  AlertCircle,
  Bot,
  User,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const VQAPage: React.FC = () => {
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageBase64(result.split(",")[1]);
      };
      reader.readAsDataURL(file);
      setMessages([]);
      sessionIdRef.current = null;
    }
  }, []);

  const handleAsk = async () => {
    if (!imageFile || !question.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng upload hình ảnh và nhập câu hỏi.",
        variant: "destructive",
      });
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: question, timestamp: new Date() };
    const currentQuestion = question;
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      // Create VQA session if first message
      if (!sessionIdRef.current && user) {
        const { data: session } = await supabase.from("vqa_sessions").insert({
          user_id: user.id,
          image_type: imageFile.type,
          clinical_notes: clinicalNotes || null,
        }).select("id").single();
        if (session) sessionIdRef.current = session.id;
      }

      // Save user message
      if (sessionIdRef.current) {
        await supabase.from("vqa_messages").insert({
          session_id: sessionIdRef.current,
          role: "user",
          content: currentQuestion,
        });
      }

      const { data, error } = await supabase.functions.invoke("medical-ai", {
        body: {
          task_type: "vqa",
          image_base64: imageBase64,
          image_type: imageFile.type,
          clinical_notes: clinicalNotes,
          question: currentQuestion,
        },
      });

      if (error) throw error;

      const answerContent = data.refined_report || data.draft_report || "Không thể trả lời câu hỏi.";
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: answerContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message
      if (sessionIdRef.current) {
        await supabase.from("vqa_messages").insert({
          session_id: sessionIdRef.current,
          role: "assistant",
          content: answerContent,
        });
      }
    } catch (error: any) {
      console.error("VQA error:", error);
      toast({ title: "Lỗi", description: error.message || "Không thể xử lý câu hỏi.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Hỏi đáp VQA y khoa</h1>
        <p className="text-muted-foreground mt-1">
          Upload hình ảnh y tế và đặt câu hỏi bằng ngôn ngữ tự nhiên
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image + Notes */}
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Hình ảnh
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imagePreview ? (
                <div className="relative group">
                  <img src={imagePreview} alt="Medical" className="w-full rounded-lg border object-contain max-h-64 bg-foreground/5" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); setImageBase64(null); setMessages([]); }}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Upload ảnh y khoa</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base">Ghi chú lâm sàng</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Thông tin bệnh nhân (tùy chọn)..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Chat */}
        <div className="lg:col-span-2">
          <Card className="shadow-card h-full flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-accent" />
                Hỏi đáp
              </CardTitle>
              <CardDescription>Đặt câu hỏi về hình ảnh y khoa bằng tiếng Việt hoặc tiếng Anh</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4 min-h-[350px] max-h-[500px]">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Upload ảnh và đặt câu hỏi để bắt đầu
                    </p>
                    <div className="mt-4 space-y-2">
                      {[
                        "Ảnh X-quang này có bất thường gì không?",
                        "Có dấu hiệu viêm phổi không?",
                        "Mô tả các phát hiện trên ảnh này",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuestion(q)}
                          className="block text-sm text-primary hover:underline mx-auto"
                        >
                          "{q}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""} animate-fade-in`}>
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                        <User className="h-4 w-4 text-accent-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="bg-secondary rounded-xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập câu hỏi về hình ảnh..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading || !imageFile}
                    className="flex-1"
                  />
                  <Button onClick={handleAsk} disabled={loading || !imageFile || !question.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VQAPage;
