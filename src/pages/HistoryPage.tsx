import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, FileText, MessageSquareText, Clock } from "lucide-react";

const HistoryPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Lịch sử phân tích</h1>
        <p className="text-muted-foreground mt-1">Xem lại các báo cáo và câu trả lời VQA đã tạo</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-heading font-medium text-foreground">Chưa có lịch sử</p>
          <p className="text-muted-foreground text-sm mt-1">
            Các báo cáo và câu trả lời sẽ được lưu tại đây sau khi bạn sử dụng hệ thống.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryPage;
