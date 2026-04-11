# VINMEC Medical AI — Hệ thống AI Hỗ trợ Chẩn đoán Hình ảnh Y khoa

## 📋 Tổng quan

VINMEC Medical AI là ứng dụng web hỗ trợ bác sĩ trong việc phân tích hình ảnh X-quang, được xây dựng trên kiến trúc **Orchestrator Agent** điều phối toàn bộ pipeline AI.

### Tính năng chính

| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | **Sinh báo cáo X-quang** | Upload ảnh + ghi chú lâm sàng → AI sinh báo cáo chẩn đoán tiếng Việt |
| 2 | **So sánh X-quang** | So sánh 2 ảnh trước/sau điều trị → AI phân tích tiến triển |
| 3 | **Hỏi đáp VQA** | Chat trực tiếp với AI về ảnh y khoa |
| 4 | **Chat chỉnh sửa báo cáo** | Bác sĩ yêu cầu AI cập nhật báo cáo qua chat |
| 5 | **Xuất PDF** | Tải báo cáo hoàn chỉnh dưới dạng PDF chuyên nghiệp |
| 6 | **Lịch sử** | Lưu trữ và tra cứu toàn bộ báo cáo & VQA trên cloud |

---

## 🤖 Kiến trúc AI — Orchestrator Agent

Toàn bộ logic AI được điều phối bởi **Orchestrator Agent** trong một Edge Function duy nhất (`medical-ai`). Orchestrator nhận `task_type` từ client và tự động lên kế hoạch pipeline phù hợp.

### Sơ đồ kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React)                       │
│                                                         │
│  ReportPage   ComparisonPage   VQAPage   ReportChat     │
│      │              │             │           │         │
│      └──────────────┴─────────────┴───────────┘         │
│                         │                               │
│              supabase.functions.invoke("medical-ai")    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              ORCHESTRATOR AGENT (Edge Function)         │
│                                                         │
│  1. Nhận request + task_type                            │
│  2. orchestrate() → lên kế hoạch pipeline               │
│  3. Route đến executor tương ứng                        │
│                                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │              TASK EXECUTORS                        │  │
│  │                                                    │  │
│  │  ┌──────────────────┐  ┌───────────────────────┐  │  │
│  │  │ Report Generation│  │ Comparison (2 images) │  │  │
│  │  │ → VLM_Report     │  │ → VLM_Comparison      │  │  │
│  │  │ → SelfRefine     │  │ → SelfRefine          │  │  │
│  │  └──────────────────┘  └───────────────────────┘  │  │
│  │                                                    │  │
│  │  ┌──────────────────┐  ┌───────────────────────┐  │  │
│  │  │ VQA (Q&A)        │  │ Report Chat (Edit)    │  │  │
│  │  │ → GuardrailCheck │  │ → GuardrailCheck      │  │  │
│  │  │ → VLM_VQA        │  │ → ContextBuilder      │  │  │
│  │  │ → SelfRefine     │  │ → VLM_Chat            │  │  │
│  │  └──────────────────┘  │ → ReportExtractor     │  │  │
│  │                        └───────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│            Lovable AI Gateway (Gemini / GPT-5)           │
└─────────────────────────────────────────────────────────┘
```

### Task Types & Pipeline

| task_type | Pipeline | Tools |
|-----------|----------|-------|
| `report_generation` | Validate → Preprocess → Parse Notes → VLM Report → Self-Refine → Format | InputValidator, ImagePreprocessor, ClinicalNoteParser, VLM_Report, SelfRefinementAgent, ReportFormatter |
| `comparison` | Validate → Preprocess x2 → Parse Notes → VLM Compare → Self-Refine → Format | InputValidator, ImagePreprocessor x2, ClinicalNoteParser, VLM_Comparison, SelfRefinementAgent, ComparisonFormatter |
| `vqa` | Validate → Guardrail → Preprocess → Parse Notes → VLM VQA → Self-Refine | InputValidator, GuardrailFilter, ImagePreprocessor, ClinicalNoteParser, VLM_VQA, SelfRefinementAgent |
| `report_chat` | Validate → Guardrail → Build Context → VLM Chat → Extract Report | InputValidator, GuardrailFilter, ContextBuilder, VLM_Chat, ReportExtractor |

### Guardrails (An toàn)

- **Scope Filter**: Từ chối câu hỏi ngoài phạm vi y khoa (crypto, politics, game...)
- **Anti-Hallucination**: Chỉ mô tả những gì nhìn thấy, không bịa số liệu
- **Measurement Rules**: Chỉ ghi số đo nếu rõ ràng trong ảnh
- **Consistency Check**: Findings phải hỗ trợ Impression
- **Self-Refinement Agent**: Tự đánh giá và cải thiện output trước khi trả về

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5 |
| UI Framework | Tailwind CSS v3, shadcn/ui |
| State Management | TanStack React Query |
| Routing | React Router v6 |
| Backend & Auth | Lovable Cloud (Supabase) |
| AI / LLM | Lovable AI Gateway (Gemini 3 Flash / GPT-5) |
| Edge Functions | Deno (Supabase Edge Functions) |
| PDF Export | html2pdf.js |
| Design System | Ocean Blue palette (#03045E → #CAF0F8) |

---

## 📁 Cấu trúc thư mục

```
vinmec-medical-ai/
├── public/                              # Static assets
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── main.tsx                         # Entry point
│   ├── App.tsx                          # Router & providers setup
│   ├── index.css                        # Design tokens & global styles
│   ├── assets/                          # Logo & brand assets
│   │   ├── vinmec-logo.jpg
│   │   └── vinmec-icon.png
│   ├── components/
│   │   ├── AppLayout.tsx                # Layout chính (sidebar + header)
│   │   ├── NavLink.tsx                  # Navigation link component
│   │   ├── ProtectedRoute.tsx           # Auth guard
│   │   ├── ReportChat.tsx               # Chat chỉnh sửa báo cáo
│   │   ├── VinmecLogo.tsx               # Vinmec logo SVG component
│   │   └── ui/                          # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx              # Auth state (login/register/logout)
│   ├── hooks/
│   │   ├── use-mobile.tsx               # Responsive detection
│   │   └── use-toast.ts                 # Toast notifications
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts                # Supabase client (auto-generated)
│   │       └── types.ts                 # Database types (auto-generated)
│   ├── lib/
│   │   ├── exportPdf.ts                 # Xuất báo cáo ra PDF
│   │   └── utils.ts                     # Utility functions
│   ├── pages/
│   │   ├── AuthPage.tsx                 # Đăng nhập / đăng ký
│   │   ├── Dashboard.tsx                # Tổng quan hệ thống
│   │   ├── ReportPage.tsx               # Sinh báo cáo X-quang
│   │   ├── ComparisonPage.tsx           # So sánh X-quang trước/sau
│   │   ├── VQAPage.tsx                  # Hỏi đáp hình ảnh y khoa
│   │   ├── HistoryPage.tsx              # Lịch sử báo cáo & VQA
│   │   ├── Index.tsx                    # Landing page
│   │   └── NotFound.tsx                 # 404
│   └── test/
│       ├── setup.ts                     # Test setup (vitest)
│       └── example.test.ts
├── supabase/
│   ├── config.toml                      # Supabase project config
│   ├── migrations/                      # Database migrations
│   └── functions/
│       └── medical-ai/
│           └── index.ts                 # ★ Orchestrator Agent + All Executors
├── .env                                 # Environment variables (auto-generated)
├── tailwind.config.ts                   # Tailwind config + design tokens
├── vite.config.ts                       # Vite config
├── tsconfig.json                        # TypeScript config
├── components.json                      # shadcn/ui config
└── package.json                         # Dependencies
```

---

## 🗄️ Database Schema

| Bảng | Mô tả | RLS |
|---|---|---|
| `medical_reports` | Báo cáo X-quang (draft, refined, refinement_log, image_url...) | Users chỉ xem/tạo/xóa của mình |
| `vqa_sessions` | Phiên hỏi đáp VQA (ảnh, ghi chú lâm sàng) | Users chỉ xem/tạo/xóa của mình |
| `vqa_messages` | Tin nhắn trong phiên VQA (role, content) | Users chỉ xem/tạo tin nhắn trong session mình |

---

## 🚀 Hướng dẫn cài đặt & chạy

### Yêu cầu hệ thống

- **Node.js** >= 18
- **Bun** hoặc **npm** (khuyến nghị Bun)
- Tài khoản Lovable (để sử dụng Lovable Cloud & AI Gateway)

### Bước 1 — Clone repository

```bash
git clone <repository-url>
cd vinmec-medical-ai
```

### Bước 2 — Cài đặt dependencies

```bash
# Dùng Bun (nhanh hơn)
bun install

# Hoặc dùng npm
npm install
```

### Bước 3 — Cấu hình environment

File `.env` đã được tự động tạo bởi Lovable Cloud:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

> **Lưu ý:** Nếu chạy ngoài Lovable, bạn cần tạo project Supabase riêng và cập nhật các biến này. Đồng thời cần cấu hình secret `LOVABLE_API_KEY` cho Edge Function.

### Bước 4 — Chạy development server

```bash
bun run dev
# hoặc
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

---

## 🔐 Luồng xác thực

1. Người dùng truy cập → redirect đến `/auth`
2. Đăng ký bằng email + password (xác nhận email) hoặc Google OAuth
3. Sau khi đăng nhập → redirect đến `/dashboard`
4. Mọi route đều được bảo vệ bởi `ProtectedRoute`

---

## 🌐 Routes

| Path | Trang | Mô tả |
|------|-------|-------|
| `/auth` | AuthPage | Đăng nhập / Đăng ký |
| `/dashboard` | Dashboard | Tổng quan hệ thống |
| `/report` | ReportPage | Sinh báo cáo X-quang |
| `/comparison` | ComparisonPage | So sánh X-quang trước/sau điều trị |
| `/vqa` | VQAPage | Hỏi đáp hình ảnh y khoa |
| `/history` | HistoryPage | Lịch sử báo cáo & VQA |

---

## 📝 Scripts

| Lệnh | Mô tả |
|---|---|
| `bun run dev` | Chạy dev server (port 8080) |
| `bun run build` | Build production |
| `bun run preview` | Preview bản build |
| `bun run test` | Chạy tests (vitest) |
| `bun run lint` | Kiểm tra lỗi code (ESLint) |

---

## 🎨 Design System

Ứng dụng sử dụng **Ocean Blue palette** đồng bộ từ Vinmec branding:

| Token | Hex | Vai trò |
|-------|-----|---------|
| Deep Navy | `#03045E` | Sidebar, dark text |
| Ocean Blue | `#0077B6` | Primary actions, headers |
| Cyan | `#00B4D8` | Accents, links |
| Light Blue | `#90E0EF` | Badges, highlights |
| Ice Blue | `#CAF0F8` | Backgrounds, cards |

---

## 📄 License

MIT
