import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import {
  History,
  FileText,
  MessageSquareText,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface Report {
  id: string;
  clinical_notes: string | null;
  draft_report: string | null;
  refined_report: string | null;
  refinement_log: string[] | null;
  image_type: string | null;
  created_at: string;
}

interface VQASession {
  id: string;
  clinical_notes: string | null;
  image_type: string | null;
  created_at: string;
  messages?: { role: string; content: string; created_at: string }[];
}

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [sessions, setSessions] = useState<VQASession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [reportsRes, sessionsRes] = await Promise.all([
      supabase
        .from("medical_reports")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("vqa_sessions")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    setReports((reportsRes.data as Report[]) || []);
    setSessions((sessionsRes.data as VQASession[]) || []);
    setLoading(false);
  };

  const loadMessages = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    const { data } = await supabase
      .from("vqa_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, messages: data || [] } : s))
    );
    setExpandedId(sessionId);
  };

  const deleteReport = async (id: string) => {
    await supabase.from("medical_reports").delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Đã xóa báo cáo" });
  };

  const deleteSession = async (id: string) => {
    await supabase.from("vqa_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Đã xóa phiên VQA" });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Lịch sử phân tích</h1>
        <p className="text-muted-foreground mt-1">Xem lại các báo cáo và câu trả lời VQA đã tạo</p>
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            Báo cáo ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="vqa" className="gap-2">
            <MessageSquareText className="h-4 w-4" />
            VQA ({sessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4 mt-4">
          {reports.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Chưa có báo cáo nào</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-heading text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Báo cáo X-quang
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(report.created_at)}
                        {report.image_type && (
                          <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded">
                            {report.image_type}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                      >
                        {expandedId === report.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteReport(report.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expandedId === report.id && (
                  <CardContent className="space-y-4">
                    {report.clinical_notes && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Ghi chú lâm sàng:</p>
                        <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                          {report.clinical_notes}
                        </p>
                      </div>
                    )}
                    {report.refined_report && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Báo cáo hoàn chỉnh:</p>
                        <div className="prose prose-sm max-w-none text-foreground bg-medical-success/5 p-4 rounded-lg border border-medical-success/20">
                          <ReactMarkdown>{report.refined_report}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="vqa" className="space-y-4 mt-4">
          {sessions.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquareText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Chưa có phiên VQA nào</p>
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-heading text-base flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4 text-accent" />
                        Phiên VQA
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(session.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => loadMessages(session.id)}>
                        {expandedId === session.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSession(session.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expandedId === session.id && session.messages && (
                  <CardContent>
                    <div className="space-y-3">
                      {session.messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`text-sm p-3 rounded-lg ${
                            msg.role === "user"
                              ? "bg-primary/10 text-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          <span className="font-medium text-xs uppercase text-muted-foreground">
                            {msg.role === "user" ? "Câu hỏi" : "Trả lời"}
                          </span>
                          <div className="mt-1 prose prose-sm max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                      {session.messages.length === 0 && (
                        <p className="text-sm text-muted-foreground">Không có tin nhắn</p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoryPage;
