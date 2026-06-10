# NEXUS — Nền tảng Giao tiếp & Cộng tác Doanh nghiệp

## Giới thiệu
NEXUS là nền tảng nhắn tin và cộng tác doanh nghiệp toàn diện, được xây dựng trên Next.js 16 và React 19. Hệ thống cung cấp chat thời gian thực, trợ lý AI tích hợp RAG (Retrieval-Augmented Generation), quản lý tri thức nội bộ, hệ thống phân quyền RBAC chi tiết và bảng điều khiển quản trị đầy đủ tính năng.

## Tính năng chính

### 💬 Chat & Nhắn tin thời gian thực
- Nhắn tin 1-1 (Direct Message) và nhóm (Group Chat)
- Kênh (Channel) theo Workspace: Public, Private, Announcement
- Gửi file, ảnh, video (tối đa 10MB/file)
- Emoji reactions, reply tin nhắn, ghim tin nhắn
- Typing indicator, trạng thái online/offline
- Thu hồi tin nhắn, xóa tin nhắn
- Tạo Poll (bình chọn) trong chat
- Quản lý Task trong nhóm
- Mention @user, @here, @all, @everyone
- Cuộc gọi audio/video qua LiveKit

### 🤖 Trợ lý AI (RAG + Agent)
- AI Assistant tích hợp trực tiếp trong chat (lệnh /ai)
- Trang AI độc lập với lịch sử hội thoại
- Chế độ RAG: tìm kiếm và trả lời từ kho tri thức nội bộ
- Chế độ Agent: Tool Calling với Gemini AI
- Streaming response theo token
- Trích dẫn nguồn tài liệu (Citations)

### 📚 Quản lý Tri thức (Knowledge Base)
- Kho tài liệu nội bộ với phân loại và tìm kiếm
- Xem trước tài liệu và các chunk RAG
- Phân quyền truy cập theo ACL

### 🏢 Workspace & Phòng ban
- Đa Workspace với phân cấp phòng ban (Department)
- Sơ đồ tổ chức (Org Chart) trực quan
- Quản lý thành viên phòng ban: HEAD, MANAGER, MEMBER, GUEST
- Liên kết Workspace với Phòng ban
- Lời mời tham gia Workspace và Phòng ban qua email

### 🛡️ Bảo mật & Phân quyền (RBAC)
- Hệ thống phân quyền dựa trên vai trò (Role-Based Access Control)
- 8 cấp vai trò: SUPER_ADMIN, ADMIN, WORKSPACE_MANAGER, WORKSPACE_OWNER, WORKSPACE_ADMIN, EMPLOYEE, WORKSPACE_MEMBER, WORKSPACE_GUEST
- Guard component RequirePermission và AuthGuard
- Xác thực JWT với tự động refresh token
- Kiểm tra trạng thái tài khoản định kỳ (polling 60s)
- Đình chỉ tài khoản (Suspend/Unsuspend)

### 👑 Bảng điều khiển Admin
- Thống kê hệ thống (AdminStats, AdminCharts)
- Quản lý người dùng: tạo, sửa, xóa, đình chỉ, phân quyền
- Quản lý lời mời (Invitations)
- Quản lý vai trò & quyền (RoleEditor)
- Quản lý Workspace và Kênh
- Quản lý Phòng ban (DepartmentManagement)
- Quản lý Tài liệu RAG (DocumentManagement)
- Nhật ký hoạt động (Audit Logs) với real-time
- Tình trạng hệ thống (SystemHealth)
- Cài đặt tổ chức (OrgSettings)
- Quản lý Tổ chức & Quota
- Gửi thông báo toàn hệ thống (Broadcast)
- Cấu hình AI (LLM model, embedding, RAG settings)

### 📊 Dashboard
- Command Center với AI Core Widget
- Task Progress Widget
- Knowledge Hub Widget (tài liệu gần đây)
- Insights Widget
- Focus Mode
- AI Daily Brief

### 🔔 Thông báo
- Thông báo real-time qua Socket.IO
- Phân loại: Social, Messaging, Workspace, System
- Đánh dấu đã đọc, xóa theo danh mục

### 👤 Quản lý Tài khoản
- Cập nhật thông tin cá nhân
- Upload và lịch sử avatar (DiceBear fallback)
- Đổi mật khẩu
- Trạng thái hoạt động: online, away, dnd
- Xác thực email OTP

## Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Next.js | 16.0.10 | Framework chính (App Router, Standalone output) |
| React | 19.2.1 | UI Library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Styling |
| Redux Toolkit | ^2.11.2 | State management |
| RTK Query | (bundled) | API data fetching & caching |
| Socket.IO Client | ^4.8.1 | Real-time communication |
| LiveKit | ^2.18.1 | Audio/Video calls |
| Shadcn/UI + Radix UI | latest | UI Components |
| React Hook Form + Zod | latest | Form validation |
| next-themes | ^0.4.6 | Dark/Light mode |
| date-fns | ^4.1.0 | Date formatting |
| Recharts | ^3.8.1 | Charts & Analytics |
| react-force-graph-2d | ^1.29.1 | Knowledge graph visualization |
| Sonner | ^2.0.7 | Toast notifications |
| Lucide React | ^0.561.0 | Icons |
| react-markdown + remark-gfm | latest | Markdown rendering |

## Cấu trúc dự án

```
KTMP_NEXUS_FRONTEND/
├── app/                          # Next.js App Router
│   ├── (app)/                    # App layout group
│   ├── account/                  # Trang quản lý tài khoản
│   ├── admin/                    # Bảng điều khiển Admin
│   │   ├── dashboard/            # Trang tổng quan admin
│   │   ├── users/                # Quản lý người dùng
│   │   ├── invitations/          # Quản lý lời mời
│   │   ├── roles/                # Quản lý vai trò & quyền
│   │   ├── documents/            # Quản lý tài liệu RAG
│   │   ├── audit/                # Nhật ký hoạt động
│   │   └── settings/             # Cài đặt hệ thống
│   ├── ai/                       # Trang AI Assistant
│   ├── auth/                     # Xác thực
│   │   ├── sign-in/              # Đăng nhập
│   │   ├── sign-up/              # Đăng ký
│   │   ├── forgot-password/      # Quên mật khẩu
│   │   └── verify-email/         # Xác thực email
│   ├── chat/                     # Trang Chat
│   │   ├── [id]/                 # Chat cụ thể
│   │   └── department/           # Sơ đồ phòng ban
│   ├── dashboard/                # Command Center
│   ├── invite/                   # Trang nhận lời mời
│   │   └── department/           # Lời mời phòng ban
│   ├── join/[id]/                # Tham gia nhóm qua link
│   ├── knowledge/                # Kho tri thức
│   │   └── [docId]/              # Chi tiết tài liệu
│   ├── login/                    # Trang đăng nhập
│   ├── components/               # Layout components
│   │   └── layout/               # Header, Footer, HeroSection, FloatingButton
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── error.tsx                 # Error boundary (500)
│   └── not-found.tsx             # 404 page
│
├── src/
│   ├── features/                 # Feature modules
│   │   ├── account/              # Quản lý tài khoản
│   │   ├── admin/                # Admin dashboard components
│   │   ├── ai/                   # AI Chat components
│   │   ├── auth/                 # Authentication forms
│   │   ├── chat/                 # Chat UI components (40+ files)
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── forgot-password/      # Forgot password flow
│   │   ├── knowledge/            # Knowledge base UI
│   │   ├── navigation/           # Navigation components
│   │   ├── security/             # Security features
│   │   ├── settings/             # Settings pages
│   │   ├── sign-in/              # Sign in feature
│   │   ├── sign-up/              # Sign up feature
│   │   └── verify-email/         # Email verification
│   │
│   ├── redux/                    # Redux store
│   │   ├── api/
│   │   │   └── baseApi.ts        # RTK Query base với auto token refresh
│   │   ├── feature/              # API slices
│   │   │   ├── authSlice.ts      # Auth state (JWT, permissions, roles)
│   │   │   ├── workspaceSlice.ts # Workspace state
│   │   │   ├── authApi.ts        # Auth endpoints
│   │   │   ├── chatApi.ts        # Chat endpoints
│   │   │   ├── messageApi.ts     # Message endpoints
│   │   │   ├── channelApi.ts     # Channel/Workspace endpoints
│   │   │   ├── workspaceApi.ts   # Workspace management
│   │   │   ├── departmentApi.ts  # Department management
│   │   │   ├── friendApi.ts      # Friend system
│   │   │   ├── notificationApi.ts# Notifications
│   │   │   ├── accountApi.ts     # Account management
│   │   │   ├── userApi.ts        # User profile
│   │   │   ├── uploadApi.ts      # File upload
│   │   │   ├── adminApi.ts       # Admin operations
│   │   │   ├── aiApi.ts          # AI conversations
│   │   │   ├── auditApi.ts       # Audit logs
│   │   │   ├── knowledgeApi.ts   # Knowledge base
│   │   │   ├── rbacApi.ts        # RBAC management
│   │   │   └── otpApi.ts         # OTP verification
│   │   └── store.ts              # Redux store config
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useRealtimeChat.ts    # Socket.IO context & provider
│   │   ├── useAIAssistant.ts     # AI streaming hook
│   │   └── useAIStream.ts        # AI stream utilities
│   │
│   ├── services/
│   │   └── socket.service.ts     # Socket.IO service (50+ event types)
│   │
│   ├── lib/
│   │   ├── rbac/
│   │   │   ├── permissions.ts    # RBAC permission constants
│   │   │   ├── usePermission.ts  # Permission hooks
│   │   │   └── index.ts
│   │   ├── socket.ts             # Socket manager (legacy)
│   │   └── textarea-caret.ts     # Textarea utilities
│   │
│   ├── components/
│   │   ├── guards/
│   │   │   ├── AuthGuard.tsx     # Route authentication guard
│   │   │   └── RequirePermission.tsx # Permission-based rendering
│   │   └── WorkspaceGuard.tsx    # Workspace role guard
│   │
│   ├── type/
│   │   ├── auth.types.ts         # Auth & User types
│   │   └── chat.types.ts         # Chat, Message, Notification types
│   │
│   └── utils/
│       ├── auth-utils.ts         # Logout utilities
│       └── image-utils.ts        # Avatar/media URL helpers
│
├── components/                   # Shared UI components (Shadcn)
│   ├── ui/                       # Button, Input, Dialog, etc.
│   └── enterprise/               # Enterprise-specific components
│
├── lib/
│   └── utils.ts                  # cn() utility
│
├── public/                       # Static assets
│   └── assets/
│
├── .env                          # Environment variables
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── package.json                  # Dependencies
```

## Cài đặt & Chạy dự án

### Yêu cầu hệ thống
- Node.js >= 18.x
- npm hoặc yarn
- Backend API Gateway đang chạy tại `http://127.0.0.1:3000`
- WebSocket Gateway đang chạy tại `http://localhost:3001`

### 1. Clone và cài đặt dependencies

```bash
git clone <repository-url>
cd KTMP_NEXUS_FRONTEND
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env` tại thư mục gốc:

```env
# ===== API GATEWAY =====
NEXT_PUBLIC_API_URL=http://127.0.0.1:3000/api

# ===== WEBSOCKET GATEWAY =====
NEXT_PUBLIC_WS_URL=http://localhost:3001

# ===== LIVEKIT (Audio/Video calls) =====
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-project.livekit.cloud

# ===== AI KNOWLEDGE SERVICE (optional) =====
NEXT_PUBLIC_AI_KNOWLEDGE_URL=http://127.0.0.1:8080
```

### 3. Chạy môi trường development

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:3002**

### 4. Build production

```bash
npm run build
npm run start
```

### 5. Lint

```bash
npm run lint
```

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|--------|----------|
| `NEXT_PUBLIC_API_URL` | URL của API Gateway | `http://127.0.0.1:3000/api` |
| `NEXT_PUBLIC_WS_URL` | URL của WebSocket Gateway | `http://localhost:3001` |
| `NEXT_PUBLIC_LIVEKIT_URL` | URL LiveKit server cho cuộc gọi | - |
| `NEXT_PUBLIC_AI_KNOWLEDGE_URL` | URL AI Knowledge service | `http://127.0.0.1:8080` |

## Kiến trúc hệ thống

### State Management
- **Redux Toolkit** với **RTK Query** cho toàn bộ API calls
- **Auto token refresh**: Khi nhận lỗi 401, tự động gọi `/auth/refresh-token` và retry request gốc (sử dụng `async-mutex` để tránh race condition)
- **Optimistic updates**: Cập nhật UI ngay lập tức trước khi server xác nhận (reactions, read receipts, message list)
- **Auth state**: Lưu token và user info trong `localStorage`, permissions/roles được sync từ API

### Real-time Communication
- **Socket.IO** kết nối tới WebSocket Gateway
- **RealtimeChatProvider**: React Context cung cấp socket state cho toàn app
- **50+ socket events**: messages, typing, presence, reactions, calls, workspace events, department events, AI streaming
- **Auto-reconnect**: Vô hạn lần thử với exponential backoff
- **Event deduplication**: Tránh toast trùng lặp trong 3 giây

### Authentication Flow
1. Đăng nhập → nhận `accessToken` + `refreshToken` + `permissions` + `roles`
2. Token lưu trong `localStorage` và `httpOnly cookie`
3. Mỗi request gửi `Authorization: Bearer <token>` header
4. `AuthGuard` kiểm tra auth state và redirect về `/login` nếu chưa đăng nhập
5. Polling `/auth/check` mỗi 60 giây để phát hiện tài khoản bị đình chỉ

### RBAC (Role-Based Access Control)
```
SUPER_ADMIN → tất cả quyền
ADMIN → quản lý org, users, audit
WORKSPACE_MANAGER → quản lý workspace, channels
WORKSPACE_OWNER → audit, transfer ownership
WORKSPACE_ADMIN → quản lý channel, members
EMPLOYEE → chat, AI, knowledge
WORKSPACE_MEMBER → chat cơ bản
WORKSPACE_GUEST → chỉ đọc channel
```

Sử dụng `<RequirePermission permission="user.admin">` hoặc `<RequirePermission anyRole={['ADMIN', 'SUPER_ADMIN']} silent>` để kiểm soát hiển thị UI.

### AI Integration
- **Phase 1 (RAG)**: Gửi query qua socket `chat:ai_query` → Gateway stream tokens qua `ai:thinking` → `ai:token` → `ai:done`
- **Phase 2 (Agent)**: Gửi qua `chat:agent_query` → Gemini tự động gọi tools → stream kết quả
- **Standalone AI page**: Sử dụng REST API `/chat/conversations` và `/chat/messages`

### Image & Media
- Avatar fallback: **DiceBear** (`https://api.dicebear.com/7.x/avataaars/svg?seed=<name>`)
- Remote image domains được cấu hình: `res.cloudinary.com`, `*.amazonaws.com`, `api.dicebear.com`, `lh3.googleusercontent.com`
- File upload tối đa 10MB qua `/upload/chat`

## Routing

| Route | Mô tả | Auth |
|-------|--------|------|
| `/` | Landing page | Public |
| `/login` | Đăng nhập | Public |
| `/register` | Đăng ký | Public |
| `/auth/sign-in` | Sign in (feature) | Public |
| `/auth/sign-up` | Sign up (feature) | Public |
| `/auth/forgot-password` | Quên mật khẩu | Public |
| `/auth/verify-email` | Xác thực email | Public |
| `/invite?token=...` | Nhận lời mời Workspace | Public |
| `/invite/department?token=...` | Nhận lời mời Phòng ban | Public |
| `/join/[id]` | Tham gia nhóm qua link | Public |
| `/chat` | Danh sách chat | 🔒 Auth |
| `/chat/[id]` | Chat cụ thể | 🔒 Auth |
| `/chat/department` | Sơ đồ phòng ban | 🔒 Auth |
| `/ai` | AI Assistant | 🔒 Auth + `ai.execute` |
| `/knowledge` | Kho tri thức | 🔒 Auth + `knowledge.read` |
| `/knowledge/[docId]` | Chi tiết tài liệu | 🔒 Auth + `knowledge.read` |
| `/dashboard` | Command Center | 🔒 Auth |
| `/account` | Cài đặt tài khoản | 🔒 Auth |
| `/admin` | Admin Dashboard | 🔒 ADMIN/SUPER_ADMIN |
| `/admin/users` | Quản lý người dùng | 🔒 `user.admin` |
| `/admin/invitations` | Quản lý lời mời | 🔒 `user.admin` |
| `/admin/roles` | Quản lý vai trò | 🔒 `user.admin` |
| `/admin/documents` | Quản lý tài liệu | 🔒 `user.admin` |
| `/admin/audit` | Nhật ký hoạt động | 🔒 `user.admin` |
| `/admin/settings` | Cài đặt hệ thống | 🔒 `user.admin` |

## Sidebar Navigation

Sidebar chính (`ModernSidebarRail`) hiển thị:
- **Workspace icons**: Nexus Global + các Workspace của user, nhóm theo Phòng ban
- **Tin nhắn** (`/chat`) — với badge số tin chưa đọc
- **Phòng ban** (`/chat/department`)
- **Trợ lý AI** (`/ai`)
- **Kiến thức** (`/knowledge`)
- **Wiki** (`/wiki`)
- **Quản trị** (chỉ ADMIN/SUPER_ADMIN/WORKSPACE_MANAGER)
- **Theme toggle** (Dark/Light)
- **User avatar** với dropdown: trạng thái, cài đặt, đăng xuất

## Các tính năng nổi bật

### Chat nâng cao
- **Mention system**: Gõ `@` để mention user, hỗ trợ `@here`, `@all`, `@everyone`, `@channel`
- **Slash command**: Gõ `/ai <query>` để mở AI Assistant Panel ngay trong chat
- **Pinned messages**: Banner hiển thị tin nhắn đã ghim, panel xem tất cả
- **Read receipts**: Hiển thị ai đã đọc tin nhắn
- **Infinite scroll**: Load thêm tin nhắn cũ khi cuộn lên (cursor-based pagination)
- **File upload**: Drag & drop hoặc chọn file, preview ảnh trước khi gửi
- **Poll**: Tạo bình chọn với nhiều lựa chọn, có thời hạn
- **Task**: Tạo và quản lý công việc trong nhóm với assignees và deadline
- **Call**: Gọi audio/video 1-1 và nhóm qua LiveKit

### Workspace Management
- Tạo Workspace mới với icon tùy chỉnh
- Liên kết Workspace với Phòng ban
- Kho lưu trữ Workspace đã giải tán (Dissolved Workspaces)
- Chuyển quyền sở hữu (Transfer Ownership)
- Rời Workspace

### Admin Dashboard
Truy cập qua `/admin/dashboard?tab=<tab>` với các tab:
- `overview` — Tổng quan + hoạt động mới nhất
- `users` — Quản lý người dùng
- `invitations` — Lời mời
- `roles` — Vai trò & quyền
- `workspaces` — Workspace
- `channels` — Kênh chat
- `departments` — Phòng ban
- `documents` — Tài liệu RAG
- `wiki-plans` — Kế hoạch biên soạn
- `wiki-drafts` — Duyệt bản thảo Wiki
- `analytics` — Thống kê
- `health` — Tình trạng hệ thống
- `settings` — Cài đặt
- `audit-logs` — Nhật ký
- `organizations` — Tổ chức & Quota

## Lưu ý phát triển

### Thêm API endpoint mới
1. Tạo hoặc mở file trong `src/redux/feature/`
2. Dùng `apiSlice.injectEndpoints()` để thêm endpoint
3. Export hooks từ file đó
4. Import vào `src/redux/store.ts` để đăng ký

### Thêm permission mới
1. Thêm constant vào `src/lib/rbac/permissions.ts`
2. Sử dụng `<RequirePermission permission="...">` trong component
3. Hoặc dùng hook `useHasPermission("...")` cho logic điều kiện

### Socket events
Tất cả socket events được xử lý tập trung trong `src/hooks/useRealtimeChat.ts` (RealtimeChatProvider). Để lắng nghe event mới:
1. Thêm callback vào `SocketCallbacks` interface trong `src/services/socket.service.ts`
2. Đăng ký handler trong `connectSocket()`
3. Xử lý trong `RealtimeChatProvider`

### Dark mode
Sử dụng `next-themes` với `attribute="class"`, mặc định là `dark`. CSS variables được định nghĩa trong `app/globals.css` cho cả `:root` (light) và `.dark`.

## Scripts

```bash
npm run dev      # Chạy development server tại port 3002
npm run build    # Build production (standalone output)
npm run start    # Chạy production server tại port 3002
npm run lint     # Kiểm tra lỗi ESLint
```

## Giấy phép

Dự án này là tài sản nội bộ. Mọi quyền được bảo lưu.

---

*Made with ❤️ for the world — NEXUS © 2026*
