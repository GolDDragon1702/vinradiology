# MedVision AI — Hệ thống AI Hỗ trợ Chẩn đoán Hình ảnh Y khoa

## 📋 Tổng quan

MedVision AI là ứng dụng web hỗ trợ bác sĩ trong việc:

- **Sinh báo cáo X-quang tự động** — Upload ảnh y khoa + ghi chú lâm sàng → AI sinh báo cáo chẩn đoán tiếng Việt, tự tinh chỉnh (Self-Refinement Agent).
- **Hỏi đáp hình ảnh y khoa (VQA)** — Chat trực tiếp với AI về ảnh y khoa đã upload.
- **Chat chỉnh sửa báo cáo** — Bác sĩ tương tác qua chat để yêu cầu AI cập nhật nội dung báo cáo theo ý kiến chuyên môn.
- **Xuất PDF** — Tải báo cáo hoàn chỉnh dưới dạng PDF chuyên nghiệp.
- **Lịch sử báo cáo & VQA** — Lưu trữ và tra cứu lại toàn bộ lịch sử trên cloud.

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5 |
| UI Framework | Tailwind CSS v3, shadcn/ui |
| State Management | TanStack React Query |
| Routing | React Router v6 |
| Backend & Auth | Lovable Cloud (Supabase) |
| AI / LLM | Lovable AI Gateway (GPT-5 / Gemini) |
| Edge Functions | Deno (Supabase Edge Functions) |
| PDF Export | html2pdf.js |

## 📁 Cấu trúc thư mục

```
medvision-ai/
├── public/                          # Static assets
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── main.tsx                     # Entry point
│   ├── App.tsx                      # Router & providers setup
│   ├── index.css                    # Design tokens & global styles
│   ├── components/
│   │   ├── AppLayout.tsx            # Layout chính (sidebar + content)
│   │   ├── NavLink.tsx              # Navigation link component
│   │   ├── ProtectedRoute.tsx       # Auth guard cho route
│   │   ├── ReportChat.tsx           # Chat chỉnh sửa báo cáo
│   │   └── ui/                      # shadcn/ui components (button, card, dialog, ...)
│   ├── contexts/
│   │   └── AuthContext.tsx          # Auth state management (login/register/logout)
│   ├── hooks/
│   │   ├── use-mobile.tsx           # Responsive detection
│   │   └── use-toast.ts             # Toast notifications
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts            # Supabase client (auto-generated)
│   │       └── types.ts             # Database types (auto-generated)
│   ├── lib/
│   │   ├── exportPdf.ts             # Xuất báo cáo ra PDF
│   │   └── utils.ts                 # Utility functions (cn, ...)
│   ├── pages/
│   │   ├── AuthPage.tsx             # Trang đăng nhập / đăng ký
│   │   ├── Dashboard.tsx            # Trang chính - tổng quan
│   │   ├── ReportPage.tsx           # Sinh báo cáo X-quang + chat chỉnh sửa
│   │   ├── VQAPage.tsx              # Hỏi đáp hình ảnh y khoa
│   │   ├── HistoryPage.tsx          # Lịch sử báo cáo & VQA
│   │   ├── Index.tsx                # Landing page
│   │   └── NotFound.tsx             # 404
│   └── test/
│       ├── setup.ts                 # Test setup (vitest)
│       └── example.test.ts          # Example test
├── supabase/
│   ├── config.toml                  # Supabase project config
│   ├── migrations/                  # Database migrations (auto-managed)
│   └── functions/
│       └── medical-ai/
│           └── index.ts             # Edge Function: Orchestrator Agent + Self-Refinement
├── .env                             # Environment variables (auto-generated)
├── tailwind.config.ts               # Tailwind config + design tokens
├── vite.config.ts                   # Vite config
├── tsconfig.json                    # TypeScript config
├── components.json                  # shadcn/ui config
└── package.json                     # Dependencies
```

## 🗄️ Database Schema

| Bảng | Mô tả |
|---|---|
| `medical_reports` | Lưu báo cáo X-quang (draft, refined, refinement_log, image_url, ...) |
| `vqa_sessions` | Phiên hỏi đáp VQA (ảnh, ghi chú lâm sàng) |
| `vqa_messages` | Tin nhắn trong phiên VQA (role, content) |

## 🚀 Hướng dẫn cài đặt & chạy

### Yêu cầu

- **Node.js** >= 18
- **Bun** hoặc **npm** (khuyến nghị Bun)
- Tài khoản Lovable (để sử dụng Lovable Cloud & AI Gateway)

### Bước 1 — Clone repository

```bash
git clone <repository-url>
cd medvision-ai
```

### Bước 2 — Cài đặt dependencies

```bash
# Dùng Bun (nhanh hơn)
bun install

# Hoặc dùng npm
npm install
```

### Bước 3 — Cấu hình environment

File `.env` đã được tự động tạo bởi Lovable Cloud với các biến:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

> **Lưu ý:** Nếu chạy ngoài Lovable, bạn cần tạo project Supabase riêng và cập nhật các biến này.

### Bước 4 — Chạy development server

```bash
# Dùng Bun
bun run dev

# Hoặc dùng npm
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:8080**

### Bước 5 — Build production

```bash
bun run build
# hoặc
npm run build
```

Output nằm trong thư mục `dist/`.

## 🔐 Luồng xác thực

1. Người dùng truy cập → redirect đến `/auth`
2. Đăng ký bằng email + password (xác nhận email) hoặc Google OAuth
3. Sau khi đăng nhập → redirect đến `/dashboard`
4. Mọi route đều được bảo vệ bởi `ProtectedRoute`

## 🤖 Kiến trúc AI Pipeline

```
Upload ảnh + Ghi chú lâm sàng
        ↓
  Orchestrator Agent (Edge Function)
        ↓
  VLM Analysis (Lovable AI Gateway)
        ↓
  Draft Report Generation
        ↓
  Self-Refinement Agent (đánh giá & cải thiện)
        ↓
  Refined Report (tiếng Việt)
        ↓
  Bác sĩ chat chỉnh sửa ↔ AI cập nhật báo cáo
        ↓
  Xuất PDF
```

## 📝 Scripts

| Lệnh | Mô tả |
|---|---|
| `bun run dev` | Chạy dev server (port 8080) |
| `bun run build` | Build production |
| `bun run preview` | Preview bản build |
| `bun run test` | Chạy tests (vitest) |
| `bun run lint` | Kiểm tra lỗi code (ESLint) |

## 📄 License

MIT
