# DBStack Manager (db-mana)

DBStack Manager là nền tảng quản trị database đa engine trên cùng máy chủ, cho phép triển khai và vận hành bằng giao diện web mà không cần thao tác dòng lệnh Docker Compose.

## Mục tiêu sản phẩm

- Triển khai nhiều database engine (MySQL, MariaDB, PostgreSQL) trên cùng một host
- Quản lý vòng đời instance: tạo, start/stop/restart, backup/restore, clone, upgrade
- Theo dõi tài nguyên và trạng thái hệ thống ở mức cơ bản cho giai đoạn MVP
- Quản trị nhiều người dùng theo mô hình RBAC

## Đối tượng sử dụng

- Hosting Provider
- DevOps Engineer
- Software Company
- Developer Team
- MSP (Managed Service Provider)

## Công nghệ mục tiêu

### Frontend

- React
- TypeScript
- TailwindCSS
- shadcn/ui
- Responsive Dashboard

### Backend

- Node.js
- NestJS
- SQLite (MVP)
- REST API

### Runtime

- Docker
- Docker Compose

### Hệ điều hành hỗ trợ

- Ubuntu Server
- Debian

## Dashboard Layout

Sidebar gồm các mục:

- Dashboard
- Database Instances
- Backup Manager
- Storage
- Monitoring
- Templates
- Logs
- Settings
- Users

## Core Features

### 1) Database Instance Management

Engine và version hỗ trợ:

- MySQL: 5.7, 8.0, 8.4
- MariaDB: 10.6, 10.11, 11.x
- PostgreSQL: 14, 15, 16, 17

Mỗi instance cần có:

- Container riêng
- Network riêng
- Data volume riêng
- Backup riêng

Thông tin hiển thị:

- Instance Name
- Engine Type
- Version
- Status
- Port
- CPU
- RAM
- Disk Usage
- Created Date

Actions:

- Start
- Stop
- Restart
- Delete
- Clone
- Upgrade
- Backup
- Restore

### 2) Create Instance Wizard

6 bước:

1. Chọn Database Engine
2. Chọn Version
3. Cấu hình tài nguyên (CPU, RAM, Storage, Connection Limit)
4. Authentication (Root User, Password, DB Name, Timezone, Charset, Collation)
5. Network (Container Port, Host Port, Bind IP, Whitelist IP)
6. Review & Deploy (Preview Docker Compose + nút Deploy)

### 3) Docker Compose Engine

Ví dụ compose:

```yaml
services:
  mysql_001:
    image: mysql:8.4
    container_name: mysql_001
    restart: always

    environment:
      MYSQL_ROOT_PASSWORD: password

    ports:
      - "3306:3306"

    volumes:
      - /data/mysql/mysql_001:/var/lib/mysql
```

Cấu trúc lưu trữ dữ liệu:

```bash
/opt/dbstack/
├── mysql/
│   ├── mysql_001/
│   ├── mysql_002/
├── mariadb/
│   ├── mariadb_001/
├── postgresql/
│   ├── pg_001/
```

### 4) Backup Manager

- Full backup: `mysqldump`, `mariadb-dump`, `pg_dump`
- Physical backup: XtraBackup, Mariabackup, PostgreSQL Base Backup
- Schedule: Hourly / Daily / Weekly / Monthly
- Retention: 7 / 30 / 90 bản backup
- Storage target: Local, MinIO, AWS S3, Cloudflare R2, Wasabi, FTP, SFTP, NFS, SMB

### 5) Restore System

- Restore toàn bộ instance
- Restore sang instance mới
- Nguồn restore: Local file, S3, FTP, Remote Storage

### 6) Monitoring

Database metrics:

- Connections
- Queries/s
- Transactions/s
- Cache Hit Rate
- Slow Queries
- Replication Status

Server metrics:

- CPU
- RAM
- Disk
- Network
- Docker Status

### 7) Database Configuration Manager

- Hỗ trợ `my.cnf`, `postgresql.conf`
- Tính năng: Syntax Highlight, Validation, Compare Changes, Save, Apply, Restart Database

### 8) Connection Manager

- Host, Port, SSL
- Authentication Mode
- Max Connections
- Idle Timeout
- Connection Timeout
- TCP KeepAlive

### 9) User Management (RBAC)

- Super Admin: toàn quyền
- Operator: quản lý database
- Read Only: chỉ xem

### 10) Template Marketplace

Mẫu template điển hình:

- MySQL Production
- MySQL Development
- MariaDB Ecommerce
- PostgreSQL Analytics

### 11) Security

- SSL/TLS
- Fail2Ban Integration
- IP Whitelist
- Audit Logs
- 2FA
- Session Management
- Password Policy

### 12) Logging Center

Nguồn log:

- Docker Logs
- Database Logs
- System Logs
- Backup Logs

Bộ lọc:

- Error
- Warning
- Info

### 13) Advanced Features

- Clone Database
- Snapshot trước khi upgrade
- One Click Upgrade
- Migration Tool (MySQL/MariaDB/PostgreSQL)
- Health Check (Port, Query, Storage, Replication)

## UI/UX định hướng

- Phong cách Coolify + shadcn/ui
- Dark mode mặc định
- Responsive
- Realtime WebSocket
- Trạng thái màu:
  - Green = Running
  - Yellow = Warning
  - Red = Stopped

## MVP Giai đoạn 1

- Deploy MySQL/MariaDB/PostgreSQL bằng Docker
- Quản lý Start/Stop/Restart
- Backup thủ công
- Restore
- Chỉnh sửa cấu hình
- Quản lý port
- Monitoring cơ bản
- Multi-user RBAC

## Khả năng mở rộng

Kiến trúc plugin-based để bổ sung engine mới:

- MongoDB
- Redis

## Khởi chạy dự án (MVP hiện tại)

### 1) Backend (NestJS + SQLite)

```bash
cd /tmp/workspace/nguyenthuyendieu4/db-mana/backend
npm install
npm run start:dev
```

Backend chạy mặc định tại `http://localhost:3000`.

### 2) Frontend (React + TypeScript + TailwindCSS)

```bash
cd /tmp/workspace/nguyenthuyendieu4/db-mana/frontend
npm install
npm run dev
```

Frontend chạy mặc định tại `http://localhost:5173`.

### API chính đã có trong MVP

- `GET /api/health`
- `GET /api/instances`
- `POST /api/instances`
- `POST /api/instances/:id/actions`
- `GET /api/instances/:id/compose`
- `DELETE /api/instances/:id`
- `GET /api/backups`
- `GET /api/monitoring/overview`
- `GET /api/templates`
- `GET /api/users`
