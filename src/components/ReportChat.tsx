import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { MessageSquare, Send, Loader2, FileEdit } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  updatedReport?: string | null;
}

interface ReportChatProps {
  currentReport: string;
  clinicalNotes: string;
  imageBase64: string | null;
  imageType: string | null;
  onReportUpdate: (newReport: string) => void;
}

const ReportChat: React.FC<ReportChatProps> = ({
  currentReport,
  clinicalNotes,
  imageBase64,
  imageType,
  onReportUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("medical-ai", {
        body: {
          task_type: "report_chat",
          chat_message: msg,
          current_report: currentReport,
          clinical_notes: clinicalNotes,
          image_base64: imageBase64,
          image_type: imageType,
          chat_history: chatHistory,
        },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.chat_response || "Không có phản hồi.",
        updatedReport: data.updated_report,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.updated_report) {
        onReportUpdate(data.updated_report);
        toast({ title: "Báo cáo đã cập nhật", description: "Báo cáo đã được chỉnh sửa theo yêu cầu." });
      }
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Không thể gửi tin nhắn.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card animate-slide-in-right">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Trao đổi với AI về báo cáo
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Yêu cầu chỉnh sửa, hỏi thêm chi tiết, hoặc bổ sung thông tin — báo cáo sẽ tự động cập nhật.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={scrollRef} className="h-64 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Hãy gửi tin nhắn để bắt đầu trao đổi về báo cáo
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.updatedReport && (
                  <div className="mt-2 flex items-center gap-1 text-xs opacity-80 border-t pt-1">
                    <FileEdit className="h-3 w-3" />
                    Báo cáo đã được cập nhật
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ví dụ: Thêm chi tiết về vùng đáy phổi phải..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportChat;
