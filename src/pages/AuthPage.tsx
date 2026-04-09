import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import VinmecLogo from "@/components/VinmecLogo";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/dashboard");
      } else {
        await signUp(email, password, fullName);
        toast({
          title: "Đăng ký thành công!",
          description: "Vui lòng kiểm tra email để xác nhận tài khoản.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary-foreground/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md text-primary-foreground">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
              <VinmecLogo size={40} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-heading font-bold tracking-wide">VINMEC</h1>
              <p className="text-primary-foreground/80 text-sm">Medical AI System</p>
            </div>
          </div>
          <p className="text-xl font-heading font-semibold mb-2">
            Chăm sóc bằng Tài năng, Y đức và Sự thấu cảm
          </p>
          <p className="text-primary-foreground/80 leading-relaxed">
            Hệ thống AI phân tích hình ảnh y khoa tiên tiến. Sử dụng Vision-Language Model 
            để tạo báo cáo X-quang tự động và trả lời câu hỏi trực quan về hình ảnh y tế.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "Báo cáo X-quang", value: "Tự động" },
              { label: "Hỏi đáp VQA", value: "Trực quan" },
              { label: "Self-Refinement", value: "Tối ưu" },
              { label: "Ngôn ngữ", value: "Tiếng Việt" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
                <p className="text-sm text-primary-foreground/70">{item.label}</p>
                <p className="font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <Card className="w-full max-w-md border-0 shadow-none lg:shadow-card lg:border">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
              <VinmecLogo size={28} className="text-primary" />
              <span className="text-xl font-heading font-bold text-foreground">VINMEC</span>
            </div>
            <CardTitle className="text-2xl font-heading">
              {isLogin ? "Đăng nhập" : "Đăng ký tài khoản"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Đăng nhập để sử dụng hệ thống phân tích hình ảnh y khoa"
                : "Tạo tài khoản mới để bắt đầu sử dụng Vinmec Medical AI"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@vinmec.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="animate-pulse-gentle">Đang xử lý...</span>
                ) : (
                  <>
                    {isLogin ? "Đăng nhập" : "Đăng ký"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              </span>{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
