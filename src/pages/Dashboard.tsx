import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, MessageSquareText, Activity, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: "Báo cáo đã tạo", value: "0", icon: FileText, color: "text-primary" },
    { label: "Câu hỏi VQA", value: "0", icon: MessageSquareText, color: "text-accent" },
    { label: "Thời gian TB", value: "~30s", icon: Clock, color: "text-medical-warning" },
    { label: "Độ chính xác", value: "~92%", icon: TrendingUp, color: "text-medical-success" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Xin chào, {user?.user_metadata?.full_name || "Bác sĩ"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Chào mừng đến với MedVision AI — hệ thống phân tích hình ảnh y khoa thông minh.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-heading font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer group" onClick={() => navigate("/report")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl gradient-primary">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="font-heading">Tạo báo cáo X-quang</CardTitle>
                <CardDescription>Upload ảnh X-quang và ghi chú lâm sàng để tạo báo cáo tự động</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-medical-success" />
              <span>Hỗ trợ Chest X-ray, CT, MRI</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <CheckCircle2 className="h-4 w-4 text-medical-success" />
              <span>Self-refinement tự động cải thiện kết quả</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <CheckCircle2 className="h-4 w-4 text-medical-success" />
              <span>Xuất báo cáo tiếng Việt</span>
            </div>
            <Button className="mt-4 w-full group-hover:shadow-elevated transition-shadow">
              Bắt đầu tạo báo cáo
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer group" onClick={() => navigate("/vqa")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent">
                <MessageSquareText className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="font-heading">Hỏi đáp VQA</CardTitle>
                <CardDescription>Đặt câu hỏi về hình ảnh y tế và nhận câu trả lời trực quan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-medical-success" />
              <span>Trả lời bằng ngôn ngữ tự nhiên</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <CheckCircle2 className="h-4 w-4 text-medical-success" />
              <span>Highlight vùng quan trọng trên ảnh</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <CheckCircle2 className="h-4 w-4 text-medical-success" />
              <span>Hỗ trợ tiếng Việt</span>
            </div>
            <Button variant="outline" className="mt-4 w-full group-hover:shadow-elevated transition-shadow">
              Bắt đầu hỏi đáp
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System info */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-lg">Kiến trúc hệ thống</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Orchestrator Agent", desc: "Lập kế hoạch, chọn công cụ phù hợp, điều phối luồng xử lý" },
              { title: "Medical VLM", desc: "Vision-Language Model phân tích ảnh kết hợp ghi chú lâm sàng" },
              { title: "Self-Refinement", desc: "Tự kiểm tra, cải thiện kết quả theo ontology y khoa" },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-lg bg-secondary/50 border">
                <h3 className="font-heading font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
