<h1 align="center">
  <img src="https://img.icons8.com/fluency/96/000000/company.png" width="80" alt="Bigwig Media Digital"/><br/>
  Bigwig Media Digital Portal
</h1>

<p align="center">
  <b>ITIL-Compliant HR, Operations & Service Desk Platform</b><br/>
  <i>SOC-2 · ISMS (ISO 27001) · SonarQube Certified · Multi-Cloud Ready</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18LTS-green?logo=node.js" />
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-316192?logo=postgresql" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io" />
  <img src="https://img.shields.io/badge/ITIL-v4-purple" />
  <img src="https://img.shields.io/badge/SOC--2-Compliant-green" />
  <img src="https://img.shields.io/badge/ISO_27001-ISMS-blue" />
</p>

---

## 📋 Table of Contents

| # | Section |
|---|---------|
| 1 | [🏗️ Architecture](#architecture) |
| 2 | [⚡ Feature Modules](#feature-modules) |
| 3 | [🔄 Functional Flows](#functional-flows) |
| 4 | [🗄️ Database Schema](#database-schema) |
| 5 | [🔐 Security & Compliance](#security--compliance) |
| 6 | [🚀 Deployment Guide](#deployment-guide) |
| 7 | [☁️ Cloud Deployment](#cloud-deployment) |
| 8 | [🔧 Local Development](#local-development) |
| 9 | [📊 SonarQube Setup](#sonarqube-setup) |
| 10 | [📜 License](#license) |

---

## 🏗️ Architecture {#architecture}

```mermaid
graph TB
    subgraph "👥 Users"
        EMP[👤 Employee]
        HR[👩‍💼 HR / Manager]
        SD[🛠️ Platform Ops / SD Agent]
        ADMIN[👑 Owner / Admin]
    end

    subgraph "🌐 Frontend  · React 18 + Vite"
        direction LR
        SDB[📊 Dashboard]
        HRM[👥 HR Modules]
        TAS[🎯 Talent & Recruitment]
        PORTAL[🎫 Service Desk Portal]
        AGENT[🔴 Agent Queue]
        DOC[📄 Nextcloud Documents]
    end

    subgraph "🔀 API Gateway  · Nginx"
        GW[Nginx Reverse Proxy\nTLS 1.3 · HSTS · Rate Limit]
    end

    subgraph "⚙️ Backend  · Node.js 18 + Express"
        AUTH[🔐 Auth / OIDC]
        EMP_SVC[👤 Employee Service]
        ATT[🕐 Attendance]
        LEAVE[🌴 Leave Management]
        PAY[💰 Payroll]
        PERF[📈 Performance]
        TICKET[🎫 Ticketing / SD]
        CHANGE[🔄 Change Mgmt]
        CMDB_SVC[🗄️ CMDB]
        SLA_SVC[🛡️ SLA Engine]
        WS[🔌 Socket.IO]
    end

    subgraph "💾 Data Layer"
        PG[(🐘 PostgreSQL 15)]
        REDIS[(⚡ Redis 7\nSession · Cache · Rate Limit)]
    end

    subgraph "📦 Storage"
        UPLOADS[📁 File Uploads]
        NC[☁️ Nextcloud]
    end

    EMP --> GW
    HR --> GW
    SD --> GW
    ADMIN --> GW
    GW --> AUTH
    GW --> EMP_SVC
    GW --> ATT
    GW --> LEAVE
    GW --> PAY
    GW --> PERF
    GW --> TICKET
    GW --> CHANGE
    GW --> CMDB_SVC
    GW --> SLA_SVC
    GW --> WS
    GW -.->|Documents| NC

    AUTH --> PG
    EMP_SVC --> PG
    ATT --> PG
    LEAVE --> PG
    PAY --> PG
    PERF --> PG
    TICKET --> PG
    CHANGE --> PG
    CMDB_SVC --> PG
    SLA_SVC --> PG
    AUTH --> REDIS
    TICKET --> REDIS
    EMP_SVC --> UPLOADS
```

---

## ⚡ Feature Modules {#feature-modules}

### 👤 Employee Self-Service
| Icon | Feature | Description |
|------|---------|-------------|
| 👤 | **My Profile** | View & edit personal info, designations, certifications |
| 🕐 | **Attendance** | Clock-in/out, real-time location, WFH tracking |
| 🌴 | **Leaves** | Apply, track, approve leave with policy enforcement |
| 📅 | **Roster / Shift** | View personal roster and shift schedule |
| 💰 | **Salary Slips** | View and download payslips / Form 16 |
| 📈 | **Appraisal** | Quarterly goal setting, self-review, KRA tracking |
| 🚪 | **Offboarding** | Self-initiate, multi-step approval workflow |

### 👩‍💼 HR / Manager Tools
| Icon | Feature | Description |
|------|---------|-------------|
| 👥 | **Directory** | Full employee directory with org chart |
| ✅ | **Leave Approvals** | Approve / reject with audit trail |
| 📊 | **Reports** | Attendance, payroll, assets, leave balance reports |
| 💵 | **Salary Structure** | Band-based salary management, payroll run |
| 🎯 | **Recruitment (TAS)** | Job postings, candidate pipeline, AI assessment |
| 🏢 | **Onboarding** | Structured employee onboarding workflow |
| 📅 | **Roster Management** | Shift assignments, roster generation |
| 🏛️ | **Admin Panel** | Roles, departments, policies, org branding |
| 🏢 | **Office Management** | Multi-office, visit approvals |

### 🎫 ITIL Service Desk
| Icon | Feature | Description |
|------|---------|-------------|
| 🎫 | **Raise Ticket** | All-employee incident / service request portal |
| 📊 | **SD Dashboard** | Real-time KPI cards, open/breached/resolved stats |
| 🔴 | **Incident Management** | Queue view, SLA timer, priority, status, activity log |
| 🔄 | **Change Management** | RFC lifecycle, CAB workflow, risk assessment |
| 🔍 | **Problem Management** | Root cause analysis, incident linking, KEDB creation |
| 🗄️ | **CMDB** | Configuration item registry, dependency graph |
| 📚 | **KEDB** | Known Error Database with full-text search |
| 🛡️ | **SLA Management** | Per-org SLA policies, breach detection, compliance |
| ⚙️ | **SD Admin** | Teams, categories, member assignment |

---

## 🔄 Functional Flows {#functional-flows}

### 🎫 Incident Lifecycle

```mermaid
stateDiagram-v2
    [*] --> OPEN : Employee raises ticket
    OPEN --> IN_PROGRESS : Agent picks up
    IN_PROGRESS --> ON_HOLD : Waiting info
    IN_PROGRESS --> WAITING_FOR_USER : Clarification needed
    IN_PROGRESS --> PENDING_VENDOR : 3rd-party dependency
    IN_PROGRESS --> PENDING_OTHER : Other blocker
    ON_HOLD --> IN_PROGRESS : Info received
    WAITING_FOR_USER --> IN_PROGRESS : User responds
    PENDING_VENDOR --> IN_PROGRESS : Vendor resolves
    IN_PROGRESS --> RESOLVED : Resolution applied
    RESOLVED --> CLOSED : Auto-close / confirmed
    RESOLVED --> IN_PROGRESS : User rejects resolution
    CLOSED --> [*]
```

### 🔄 Change Approval (CAB) Workflow

```mermaid
flowchart LR
    A[📝 RFC Submitted] --> B{Risk?}
    B -- Low --> C[Standard Change]
    B -- Medium/High --> D[CAB Review]
    C --> E[Approved]
    D --> F{CAB Decision}
    F -- Approved --> E
    F -- Rejected --> G[Closed - Rejected]
    E --> H[🚧 In Progress]
    H --> I[✅ Implemented]
    I --> J[🔍 Post-impl Review]
    J --> K[🏁 Closed]
```

### 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant RC as Redis

    U->>FE: Login (email + role)
    FE->>BE: POST /api/auth/login
    BE->>DB: Lookup user + bcrypt verify
    DB-->>BE: User record
    BE->>BE: isOwner check + role auth
    BE->>BE: Check mustChangePassword flag
    alt requiresPasswordChange == true
        BE-->>FE: requiresPasswordChange + temp JWT
        FE->>U: Show Change Password Screen
        U->>FE: New Password
        FE->>BE: POST /api/auth/change-password
        BE->>DB: Update Password & Flip Flag
    end
    BE->>RC: Rate-limit check (5 attempts/15min)
    BE-->>FE: JWT token (30d expiry)
    FE->>FE: Store token in localStorage
    FE->>BE: GET /api/auth/me (every load)
    BE->>DB: Fetch full profile + department
    DB-->>BE: User with role, dept, certifications
    BE-->>FE: User object (incl. department name)
    FE->>FE: Render role-gated sidebar
```

### 🌴 Leave Request Flow

```mermaid
sequenceDiagram
    participant E as 👤 Employee
    participant API as Backend
    participant MGR as 👩‍💼 Manager
    participant DB as DB

    E->>API: POST /api/leaves (type, dates, reason)
    API->>DB: Check leave balance
    API->>DB: Check existing leaves (overlap)
    API-->>E: Leave request created (PENDING)
    API->>MGR: Notification (Socket.IO / Email)
    MGR->>API: PUT /api/leaves/:id (APPROVED/REJECTED)
    API->>DB: Update status + deduct balance
    API-->>E: Notification of decision
```

---

## 🗄️ Database Schema {#database-schema}

```mermaid
erDiagram
    Organization ||--o{ User          : "employs"
    Organization ||--o{ Department    : "has"
    Organization ||--o{ LeavePolicy   : "sets"
    Organization ||--o{ SLAPolicy     : "defines"

    User ||--o{ Attendance        : "marks"
    User ||--o{ Leave             : "applies"
    User ||--o{ Ticket            : "raises (requester)"
    User ||--o{ Ticket            : "handles (assignee)"
    User ||--o{ ChangeRequest     : "creates"
    User ||--o{ Problem           : "owns"
    User ||--o{ AppraisalReview   : "has"
    User ||--o{ PayrollRecord     : "receives"
    User ||--o{ OffboardingRequest: "initiates"

    Department ||--o{ User          : "contains"

    Ticket ||--o{ TicketComment   : "has"
    Ticket ||--o{ TicketActivity  : "logs"
    Ticket }o--|| SLAPolicy       : "governed by"
    Ticket }o--|| ServiceDeskTeam : "assigned to"
    Ticket }o--|| CMDBItem        : "affects"

    Problem ||--o{ Ticket         : "linked incidents"
    Problem ||--o| KEDBEntry      : "produces"

    ChangeRequest ||--o{ ChangeComment   : "has"
    ChangeRequest ||--o{ ChangeRequestCI : "links"
    ChangeRequestCI }o--||  CMDBItem     : "references"

    CMDBItem ||--o{ CMDBRelationship : "as source"
    CMDBItem ||--o{ CMDBRelationship : "as target"

    ServiceDeskTeam ||--o{ ServiceDeskMember : "has"
    User            ||--o{ ServiceDeskMember : "is member"
```

### 📊 Key Table Summary

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `User` | All employees | `email`, `LegacyRole`, `roleId`, `departmentId`, `isActive` |
| `Organization` | Company config | `name`, `ownerId`, `branding` |
| `Department` | Org structure | `name`, `organizationId` |
| `Attendance` | Clock-in/out | `userId`, `date`, `clockIn`, `clockOut`, `location` |
| `Leave` | Leave requests | `userId`, `type`, `startDate`, `endDate`, `status` |
| `LeaveBalance` | Leave quota | `userId`, `casualLeaves`, `earnedLeaves`, `sickLeaves` |
| `Ticket` | SD tickets | `ticketNumber`, `type`, `status`, `priority`, `slaBreached` |
| `TicketActivity` | Audit trail | `ticketId`, `userId`, `action`, `details` |
| `ChangeRequest` | RFCs | `changeNumber`, `status`, `riskLevel`, `implementationDate` |
| `Problem` | Problem records | `problemNumber`, `status`, `rootCause`, `workaround` |
| `KEDBEntry` | Known errors | `title`, `symptoms`, `rootCause`, `workaround`, `resolution` |
| `CMDBItem` | Config items | `ciNumber`, `type`, `environment`, `status`, `ipAddress` |
| `SLAPolicy` | SLA rules | `priority`, `ticketType`, `responseTimeMinutes`, `resolutionTimeMinutes` |
| `ServiceDeskTeam` | Agent teams | `name`, `organizationId` |
| `PayrollRecord` | Payslips | `userId`, `month`, `year`, `netPay`, `payslipUrl` |
| `AppraisalCycle` | Review cycles | `quarter`, `year`, `phase`, `organizationId` |

---

## 🔐 Security & Compliance {#security--compliance}

### 🏆 SonarQube Compliance
- **Zero** critical/blocker code smells enforced via `sonar-project.properties`
- Strict CORS — origin allowlist only (no wildcards in production)
- No hardcoded secrets — all via environment variables / Secrets Manager
- Global error handler never exposes stack traces in production
- Input sanitisation strips null bytes and unsafe characters
- `_next` linting: unused parameters prefixed to avoid SonarQube false positives

### 🛡️ SOC-2 Controls

| Control | Implementation |
|---------|---------------|
| **Access Control** | JWT auth + role-based access on every endpoint |
| **Audit Logging** | Structured JSON audit log on all `/auth` and `/servicedesk` routes |
| **Rate Limiting** | 500 req/15min global · 10 req/15min on auth endpoints |
| **Encryption in Transit** | TLS 1.2/1.3 via Nginx/Caddy; HSTS preload |
| **Encryption at Rest** | PostgreSQL volume on cloud-encrypted block storage |
| **Incident Response** | Service Desk tickets for internal security incidents |
| **Change Management** | ITIL Change Management module with CAB approval |
| **Password Policy** | bcrypt (14 rounds), enforced via auth service |
| **Session Management** | JWT 30-day expiry; token invalidated on logout |

### 🔒 ISMS (ISO 27001) Controls

| Annex A Control | Implementation |
|----------------|---------------|
| **A.9 — Access Control** | RBAC (Owner, Admin, HR, Manager, Employee, Platform Ops) |
| **A.10 — Cryptography** | bcrypt passwords, JWT HMAC-SHA256, TLS 1.3 |
| **A.12 — Operations Security** | Read-only container filesystems, no-new-privileges |
| **A.13 — Network Security** | Docker internal network, firewall (UFW/Security Groups) |
| **A.16 — Incident Management** | Full ITSM Incident Management module |
| **A.17 — Business Continuity** | PostgreSQL persistent volumes, Redis AOF persistence |
| **A.18 — Compliance** | Audit trails, data retention config, SLA monitoring |

---

## 🚀 Deployment Guide {#deployment-guide}

### Prerequisites

```bash
# Required
docker >= 24.0
docker compose >= 2.20

# Optional (for cloud deployments)
aws-cli >= 2.x      # AWS
azure-cli >= 2.50   # Azure
hcloud >= 1.40      # Hetzner
```

### Quick Start (Local / Dev)

```bash
# 1. Clone
git clone https://github.com/your-org/ess-bsl.git
cd ess-bsl

# 2. Configure environment
cp .env.example .env
nano .env          # Set strong secrets!

# 3. Start
docker compose up -d

# 4. Open
open http://localhost:5173

# Note: The initial admin login is:
#  User: admin@bigwig.local 
#  Pass: password123
# You will be forced to change this password on your first login!
```

### Production Start

```bash
# Uses docker-compose.prod.yml overlay for hardened config
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Default Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | `5173` | React SPA (dev) / `80`+`443` (prod) |
| Backend API | `3434` | Express REST + Socket.IO |
| PostgreSQL | `5433` | (dev only — not exposed in prod) |
| Redis | `6379` | (internal only) |
| Nextcloud | `8080` | Document storage |

---

## ☁️ Cloud Deployment {#cloud-deployment}

### 🟠 AWS — EC2

```bash
# 1. Build and push to ECR
aws ecr create-repository --repository-name ess-bsl-backend --region us-east-1
aws ecr create-repository --repository-name ess-bsl-frontend --region us-east-1

export ECR_REGISTRY=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
aws ecr get-login-password | docker login --username AWS --password-stdin "$ECR_REGISTRY"

docker build -t $ECR_REGISTRY/ess-bsl-backend:latest ./backend && docker push $_
docker build -t $ECR_REGISTRY/ess-bsl-frontend:latest ./frontend  && docker push $_

# 2. SSH into EC2 and run:
export ECR_REGISTRY=... AWS_REGION=us-east-1
bash deploy/aws/deploy-ec2.sh
```

**Recommended EC2 spec:** `t3.large` (2 vCPU, 8 GB RAM) for ≤200 users  
**Security Groups:** Allow `80`, `443` inbound. Block `5433`, `6379` externally.

---

### 🟠 AWS — ECS Fargate (Managed, Zero maintenance)

```bash
# 1. Create ECS cluster
aws ecs create-cluster --cluster-name ess-bsl-cluster

# 2. Store secrets in Secrets Manager
aws secretsmanager create-secret --name ess-bsl/db-url \
    --secret-string "postgres://user:pass@rds-endpoint:5432/ess_db"
aws secretsmanager create-secret --name ess-bsl/jwt-secret \
    --secret-string "your-32-char-secret"

# 3. Register task definition (update ACCOUNT_ID and REGION first)
sed -i "s/ACCOUNT_ID/$(aws sts get-caller-identity --query Account --output text)/g" \
    deploy/aws/ecs-task-definition.json
sed -i "s/REGION/us-east-1/g" deploy/aws/ecs-task-definition.json
aws ecs register-task-definition --cli-input-json file://deploy/aws/ecs-task-definition.json

# 4. Create service behind Application Load Balancer
aws ecs create-service \
    --cluster ess-bsl-cluster \
    --service-name ess-bsl \
    --task-definition ess-bsl \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=arn:aws:...,containerName=frontend,containerPort=80"
```

---

### 🔵 Azure — Container Instances

```bash
# Set variables
export RESOURCE_GROUP=ess-bsl-rg
export LOCATION=eastus
export ACR_NAME=essbslacr
export DATABASE_URL="postgresql://..."
export JWT_SECRET="..."
export REDIS_URL="redis://..."
export VITE_API_URL="https://ess.yourdomain.com/api"

# Run deploy script
bash deploy/azure/deploy-azure.sh
```

**For production**, use **Azure Container Apps** (recommended for auto-scaling):
```bash
az containerapp env create --name ess-bsl-env --resource-group $RESOURCE_GROUP --location $LOCATION
az containerapp create \
    --name ess-bsl-backend \
    --resource-group $RESOURCE_GROUP \
    --environment ess-bsl-env \
    --image $ACR_NAME.azurecr.io/ess-bsl-backend:latest \
    --target-port 3434 --ingress internal \
    --min-replicas 1 --max-replicas 5
```

---

### 🌩️ Hetzner Cloud (Most Cost-Effective)

```bash
# Option A: Cloud-init on new server
hcloud server create \
    --name ess-bsl \
    --type cpx31 \
    --image ubuntu-22.04 \
    --user-data-from-file deploy/hetzner/cloud-init.sh \
    --location nbg1

# Option B: Manual on existing VPS
export DOMAIN=ess.yourcompany.com
export EMAIL=admin@yourcompany.com
export REPO_URL=https://github.com/your-org/ess-bsl.git
bash deploy/hetzner/cloud-init.sh
```

**Recommended Hetzner spec:** `CPX31` (4 vCPU, 8 GB, 160 GB SSD) — ~€14/month  
Auto TLS via **Caddy** (Let's Encrypt — no manual cert management!)

---

### 🔄 CI/CD — GitHub Actions

```yaml
# .github/workflows/deploy.yml (add to your repo)
name: Deploy ESS-BSL
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and Push
        run: |
          docker build -t $ECR_REGISTRY/ess-bsl-backend:${{ github.sha }} ./backend
          docker push $ECR_REGISTRY/ess-bsl-backend:${{ github.sha }}
          docker build -t $ECR_REGISTRY/ess-bsl-frontend:${{ github.sha }} ./frontend
          docker push $ECR_REGISTRY/ess-bsl-frontend:${{ github.sha }}

      - name: Update ECS Service
        run: |
          aws ecs update-service --cluster ess-bsl-cluster \
            --service ess-bsl --force-new-deployment
```

---

## 🔧 Local Development {#local-development}

```bash
# Start just the DB and Redis
docker compose up -d postgres redis

# Backend (hot reload)
cd backend
cp .env.example .env  # fill in locals
npm install
npm run dev           # nodemon on :3434

# Frontend (Vite HMR)
cd frontend
npm install
npm run dev           # Vite on :5173
```

### Environment Variables Quick Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | ≥32 char random string |
| `FRONTEND_URL` | ✅ | Allowed CORS origin |
| `REDIS_URL` | ✅ | Redis connection string |
| `NODE_ENV` | ✅ | `development` or `production` |
| `VITE_API_URL` | ✅ | Backend API base URL for frontend |
| `SMTP_HOST` | ○ | Email notifications |
| `REDIS_PASSWORD` | ○ | Redis auth (prod required) |

---

## 📊 SonarQube Setup {#sonarqube-setup}

```bash
# Run SonarQube locally
docker run -d --name sonarqube -p 9000:9000 sonarqube:community

# Wait for startup, then run analysis
npm install -g sonar-scanner
sonar-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=YOUR_TOKEN \
  -Dsonar.projectKey=ESS-BSL

# Or via GitHub Actions (SonarCloud)
# Add SONAR_TOKEN to repository secrets and use:
# uses: SonarSource/sonarcloud-github-action@master
```

Quality gates enforced: **0 Blocker**, **0 Critical** issues before merge.

---

## 📁 Project Structure

```
ess-bsl/
├── backend/                  # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Full DB schema (50+ models)
│   │   └── migrations/       # Version-controlled SQL migrations
│   └── src/
│       ├── controllers/      # Business logic (24 controllers)
│       ├── middleware/        # auth, security, rate-limit
│       ├── routes/           # Express routers (25 route files)
│       └── oidc/             # OpenID Connect provider
├── frontend/                 # React 18 + Vite SPA
│   └── src/
│       ├── pages/
│       │   ├── servicedesk/  # 9 ITSM pages
│       │   └── ...           # 20+ HR/Operations pages
│       ├── components/       # Layout, Sidebar, etc.
│       └── context/          # Auth + Theme providers
├── nginx/
│   └── nginx.prod.conf       # Production TLS config
├── deploy/
│   ├── aws/                  # EC2 script + ECS task def
│   ├── azure/                # Azure CLI deploy script
│   └── hetzner/              # Cloud-init bootstrap
├── docker-compose.yml        # Dev/base stack
├── docker-compose.prod.yml   # Production overlay
├── sonar-project.properties  # SonarQube config
└── .env.example              # Environment template
```

---

## 📜 License

© 2024 Bigwig Media Digital. All rights reserved.

---

<p align="center">
  Built with ❤️ for modern cloud operations teams<br/>
  <img src="https://img.icons8.com/fluency/48/000000/cloud-computing.png" width="32"/>
  <img src="https://img.icons8.com/fluency/48/000000/security-checked.png" width="32"/>
  <img src="https://img.icons8.com/fluency/48/000000/dashboard-layout.png" width="32"/>
</p>
