# Tài liệu Dự án Chat App - Duy

## Tổng quan
Đây là một ứng dụng chat hiện đại được xây dựng với Next.js, Redux Toolkit và Tailwind CSS. Ứng dụng cung cấp trải nghiệm giao tiếp thời gian thực, tích hợp AI, hệ thống quản lý workspace và bảng điều khiển quản trị chi tiết.

## Công nghệ sử dụng
- **Frontend Framework**: Next.js 16 (App Router), React 19
- **State Management**: Redux Toolkit (RTK Query for API)
- **Real-time**: Socket.io
- **UI Components**: Radix UI, Shadcn UI, Lucide Icons
- **Video/Audio Call**: Livekit
- **Styling**: Tailwind CSS 4
- **Form Handling**: React Hook Form, Zod
- **Biểu đồ**: Recharts

## Danh sách các Chức năng (Features) từ đầu đến cuối

### 1. Hệ thống Xác thực (Authentication)
Quản lý vòng đời người dùng từ khi đăng ký đến khi đăng nhập và bảo mật tài khoản.
- **Đăng ký (Sign Up)**: Tạo tài khoản mới với xác thực email qua mã OTP.
- **Đăng nhập (Sign In)**: Đăng nhập bằng email/mật khẩu, hỗ trợ cơ chế Refresh Token để duy trì phiên làm việc.
- **Quên mật khẩu (Forgot Password)**: Quy trình khôi phục mật khẩu qua email.
- **Xác thực Email/OTP**: Đảm bảo người dùng sở hữu email hợp lệ.
- **Cấu trúc mã**: 
  - Giao diện: `src/features/auth`, `src/features/sign-in`, `src/features/sign-up`, `src/features/verify-email`.
  - Logic API: `src/redux/feature/authApi.ts`, `src/redux/feature/otpApi.ts`.

### 2. Quản lý Không gian làm việc (Workspace Management)
Nơi người dùng cộng tác và trò chuyện theo từng tổ chức hoặc dự án.
- **Tạo Workspace**: Thiết lập không gian làm việc với tên và icon riêng.
- **Quản lý thành viên**: Mời thành viên mới qua email, quản lý danh sách thành viên hiện tại.
- **Phân quyền (RBAC)**: Hệ thống phân quyền chi tiết (Owner, Admin, Member, Guest) để kiểm soát quyền truy cập tài nguyên.
- **Cấu trúc mã**:
  - Giao diện: `app/workspace`, `src/features/chat/WorkspaceManagementModal.tsx`.
  - Logic API: `src/redux/feature/workspaceApi.ts`, `src/redux/feature/rbacApi.ts`.

### 3. Trò chuyện & Giao tiếp (Chat & Communication)
Trái tim của ứng dụng, cho phép kết nối mọi người.
- **Kênh (Channels)**: Tạo và quản lý các kênh (public/private) trong một workspace.
- **Nhắn tin thời gian thực**: Gửi tin nhắn văn bản, hình ảnh, tệp tin tức thì.
- **Tin nhắn trực tiếp (DM)**: Chat 1-1 riêng tư giữa những người bạn.
- **Phản hồi & Chuỗi (Threads)**: Trả lời tin nhắn theo luồng, giúp giữ cho kênh chat sạch sẽ.
- **Emoji & Phản ứng**: Thả cảm xúc vào tin nhắn.
- **Trạng thái đọc (Read Receipts)**: Biết khi nào tin nhắn đã được đọc.
- **Hệ thống cuộc gọi**: Tích hợp Livekit cho các cuộc gọi trực tuyến chất lượng cao.
- **Cấu trúc mã**:
  - Giao diện: `src/features/chat/` (bao gồm `MessageList`, `MessageComposer`, `ChannelSidebar`).
  - Logic API: `src/redux/feature/chatApi.ts`, `src/redux/feature/messageApi.ts`, `src/redux/feature/channelApi.ts`.
  - Service: `src/services/socket.service.ts`.

### 4. Trí tuệ nhân tạo (AI Features)
Tăng cường năng suất với AI.
- **AI Chatbot**: Trợ lý ảo hỗ trợ trả lời câu hỏi và thực hiện các yêu cầu của người dùng.
- **Lịch sử AI**: Theo dõi và lưu trữ các phiên làm việc với AI.
- **AI Bubbles**: Giao diện hiển thị tin nhắn AI chuyên biệt.
- **Cấu trúc mã**:
  - Giao diện: `src/features/ai`, `src/features/chat/modern-ai-bubble.tsx`.
  - Logic API: `src/redux/feature/aiApi.ts`.

### 5. Trung tâm Kiến thức & Dashboard (Knowledge & Analytics)
Quản lý dữ liệu và theo dõi hoạt động.
- **Knowledge Hub**: Lưu trữ tài liệu, tạo bộ sưu tập tri thức cho workspace.
- **Bảng điều khiển (Dashboard)**: Hiển thị các chỉ số quan trọng, biểu đồ hoạt động và sức khỏe hệ thống.
- **Audit Logs**: Nhật ký chi tiết các hành động nhạy cảm để quản trị viên kiểm soát an ninh.
- **Cấu trúc mã**:
  - Giao diện: `src/features/knowledge`, `src/features/dashboard`, `src/features/admin`.
  - Logic API: `src/redux/feature/knowledgeApi.ts`, `src/redux/feature/dashboardApi.ts`, `src/redux/feature/auditApi.ts`.

### 6. Cá nhân hóa & Thông báo (Settings & Notifications)
- **Thông báo**: Hệ thống thông báo đẩy thời gian thực cho mọi hoạt động quan trọng.
- **Cài đặt tài khoản**: Đổi avatar, cập nhật thông tin cá nhân, cấu hình bảo mật 2 lớp.
- **Bạn bè**: Quản lý danh sách bạn bè, lời mời kết bạn và danh sách chặn.
- **Cấu trúc mã**:
  - Giao diện: `src/features/settings`, `src/features/account`, `src/features/chat/friends-panel.tsx`.
  - Logic API: `src/redux/feature/notificationApi.ts`, `src/redux/feature/friendApi.ts`, `src/redux/feature/accountApi.ts`.

## Luồng hoạt động chính (Flow)
1. **User** đăng ký -> Xác thực OTP -> Đăng nhập.
2. **User** tạo hoặc tham gia một **Workspace**.
3. **User** tạo **Channel** hoặc chat trực tiếp với **Friend**.
4. **Socket.io** duy trì kết nối để cập nhật tin nhắn và thông báo thời gian thực.
5. **Admin** theo dõi toàn bộ hoạt động qua **Dashboard** và **Audit Logs**.

---
*Tài liệu được khởi tạo bởi Duy - Coding Assistant*
