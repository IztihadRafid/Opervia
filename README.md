# Opervia

**A Multi-Tenant SaaS Operations Management Platform**

Opervia is a SaaS platform designed to help organizations manage their software applications, subscriptions, vendors, licenses, expenses, team members, and operational activity from a centralized workspace.

**Production:** [https://opervia-five.vercel.app/](https://opervia-five.vercel.app/)
**GitHub Repository:** [https://github.com/IztihadRafid/Opervia](https://github.com/IztihadRafid/Opervia)
**Local Development:** [http://localhost:3000](http://localhost:3000)

\

> **Project status:** Core product development across M1–M13 has been implemented, and a production build has passed. The application is deployed on Vercel. Production authentication, database operations, email delivery, and role-specific workflows should continue to be verified through end-to-end testing.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Project Objectives](#2-project-objectives)
3. [Features](#3-features)
4. [Technology Stack](#4-technology-stack)
5. [Application Architecture](#5-application-architecture)
6. [Roles and Permissions](#6-roles-and-permissions)
7. [Project Structure](#7-project-structure)
8. [Getting Started](#8-getting-started)
9. [Environment Variables](#9-environment-variables)
10. [Development Commands](#10-development-commands)
11. [Multi-Tenant Architecture](#11-multi-tenant-architecture)
12. [Database and Data Management](#12-database-and-data-management)
13. [Security](#13-security)
14. [Performance and Data Fetching](#14-performance-and-data-fetching)
15. [Activity Logging](#15-activity-logging)
16. [Testing and Quality Assurance](#16-testing-and-quality-assurance)
17. [Deployment](#17-deployment)
18. [M1–M13 Development Roadmap](#18-m1m13-development-roadmap)
19. [Known Limitations and Remaining Work](#19-known-limitations-and-remaining-work)
20. [Production Smoke-Test Checklist](#20-production-smoke-test-checklist)
21. [Troubleshooting](#21-troubleshooting)
22. [Development Guidelines](#22-development-guidelines)
23. [License](#23-license)

---

## 1. Overview

Opervia is designed to provide organizations with a centralized workspace for managing software-related operational information.

Instead of maintaining separate records for applications, vendors, licenses, subscriptions, and expenses, an organization can manage these records through a unified interface.

The platform follows a multi-tenant architecture. Each organization has its own workspace, and protected server operations must verify the authenticated user, organization membership, and required permissions before allowing access to organization-specific information.

### Intended users

- Business owners
- Operations managers
- IT administrators
- Software asset managers
- Finance and administrative teams
- Organizations managing multiple software subscriptions and vendors

### Core principles

- Organization-scoped data access
- Server-side authentication and authorization
- Validated user input
- Reusable UI and application components
- Efficient data fetching and pagination
- Secure invitation and password-reset workflows
- Maintainable code and predictable application behavior

## 2. Project Objectives

Opervia aims to:

1. Centralize software and operational asset management.
2. Organize applications, vendors, subscriptions, licenses, and expenses.
3. Provide dashboard summaries and analytics.
4. Support organization and team management.
5. Provide role-based access control.
6. Record important operational activities.
7. Validate data on the server.
8. Prevent unauthorized cross-organization data access.
9. Provide responsive interfaces for common screen sizes.
10. Establish a maintainable foundation for future SaaS features.

## 3. Features

### 3.1 Dashboard and Analytics

The dashboard provides an overview of operational data and includes charting and date-range workflows.

Recorded capabilities include:

- Dashboard summary information
- Charts and analytics
- Date-range selection
- Data refresh when the selected range changes
- Organization-aware data loading

### 3.2 Application Management

Applications represent software products and tools tracked by an organization.

Capabilities include:

- Create, view, update, and delete application records where permitted
- Associate applications with vendors
- Assign categories
- Search and filter supported records
- Paginated data views
- Server-side validation

### 3.3 Subscription Management

The subscription module manages subscription-related operational records.

Recorded functionality includes:

- Subscription record management
- Subscription-related filtering and list workflows
- Renewal-related operations
- Activity integration for supported subscription events

### 3.4 Vendor Management

The vendor module maintains information about companies that provide software and services.

Capabilities include:

- Vendor record management
- Application/vendor relationships
- Organization-scoped records
- Validation and permission checks
- Vendor-related list and search workflows

### 3.5 License Management

The license module manages software license records associated with an organization's operational inventory.

The exact fields and permitted actions are defined by the current license models, validation schemas, services, and route handlers.

### 3.6 Expense Management

The expense module provides workflows for recording and managing operational expenses.

Recorded work includes:

- Expense record management
- List views
- Filtering and UI state handling
- Organization-aware operations
- Activity integration for supported expense events

Cross-currency aggregation and reporting remain deferred; see [Known Limitations and Remaining Work](#19-known-limitations-and-remaining-work).

### 3.7 Organization and Team Management

Opervia supports organization context and membership-based access.

Recorded functionality includes:

- Organization/workspace context
- Organization settings
- User and membership management
- Role-based access checks
- Invitation creation
- Invitation acceptance
- Invitation revocation
- Invitation resend with a cooldown
- Invitation expiration
- Invitation email-status tracking

Organization creation and selection behavior should be verified against the currently deployed UI and API implementation.

### 3.8 Category Management

Category Management is integrated into Settings.

Capabilities include:

- Create organization-scoped categories
- Edit category information
- Prevent duplicate categories through normalization
- Mark categories active or inactive
- Reactivate inactive categories
- Validate category selection on the server
- Support category selection in application workflows
- Preserve compatibility with existing records that reference inactive categories

Categories are deactivated rather than hard-deleted where deletion could break existing references.

### 3.9 Profile and Organization Settings

Settings includes:

- Profile information management
- Organization settings
- Organization name editing for authorized roles
- Category management

Sensitive organization changes must be protected by server-side role checks.

### 3.10 Activity History

Activity history provides a view of supported actions performed within an organization.

Recorded event families include:

- Application creation, update, and deletion
- Subscription creation, update, deletion, and renewal
- User invitation and invitation revocation
- Payment processing
- Expense creation, update, and deletion
- License-related activity where logging is integrated

Activity coverage should be verified whenever new operations are added.

### 3.11 Authentication and Password Reset

The project includes authentication workflows and a password-reset page.

Security-related implementation includes:

- Password hashing using Argon2
- Session-aware protected operations
- Token-based password-reset workflows
- Token expiration and validation
- Email delivery integration

The current authentication configuration and exact session behavior are defined by the implementation in the repository.

### 3.12 Transactional Email

Resend is used for transactional email workflows, including invitations and password-reset messages.

Generated URLs use the `NEXTAUTH_URL` environment variable. The production environment must use the canonical deployment URL.

### 3.13 Global Search

Global search provides access to supported operational records through a shared search interface.

Search results must remain scoped to the authenticated user's authorized organization context.

---

## 4. Technology Stack

| Category          | Technology                      |
| ----------------- | ------------------------------- |
| Framework         | Next.js App Router 16           |
| Frontend          | React 19                        |
| Language          | TypeScript                      |
| Styling           | Tailwind CSS v4                 |
| UI components     | shadcn/ui and Radix UI          |
| Icons             | Lucide React                    |
| Database          | MongoDB                         |
| Database modeling | Mongoose                        |
| Authentication    | NextAuth.js v5 beta-based setup |
| Validation        | Zod                             |
| Client data state | TanStack Query                  |
| Forms             | React Hook Form                 |
| Charts            | ApexCharts and React ApexCharts |
| Password hashing  | Argon2                          |
| Email delivery    | Resend                          |
| Hosting           | Vercel                          |
| Source control    | Git and GitHub                  |

The repository's `package.json` is the authoritative source for installed package versions.

## 5. Application Architecture

Opervia uses a layered Next.js architecture.

```text
┌──────────────────────────────────────┐
│             Browser UI               │
│                                      │
│ Pages, Components, Forms, Charts      │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│       Client Data and API Layer      │
│                                      │
│ TanStack Query, Hooks, API Client     │
│ Selected Organization Context        │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│       Next.js API Route Handlers     │
│                                      │
│ Authentication, Authorization,       │
│ Request Validation, HTTP Responses   │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│             Service Layer            │
│                                      │
│ Business Rules, Data Operations,      │
│ Activity Logging, Email Workflows     │
└───────────────┬──────────────┬───────┘
                │              │
                ▼              ▼
┌──────────────────────┐  ┌────────────┐
│ MongoDB / Mongoose   │  │   Resend   │
│ Data Persistence     │  │   Email    │
└──────────────────────┘  └────────────┘
```

### Architectural responsibilities

**UI layer**

Responsible for rendering pages, collecting user input, displaying feedback, and presenting operational data.

**Client data layer**

Responsible for calling APIs and coordinating server state through hooks and TanStack Query.

**API route layer**

Responsible for authenticating requests, validating organization membership and permissions, validating inputs, and returning appropriate responses.

**Service layer**

Responsible for business rules, persistence operations, invitation workflows, and other reusable server-side operations.

**Database layer**

Responsible for storing application records, users, organizations, memberships, invitations, and other domain data.

**Email layer**

Responsible for sending transactional emails through Resend.

## 6. Roles and Permissions

The project uses the following organization role hierarchy:

| Role     | Level | General purpose                      |
| -------- | ----: | ------------------------------------ |
| `viewer` |     1 | Read-only access where supported     |
| `member` |     2 | Standard workspace participation     |
| `admin`  |     3 | Organization administration          |
| `owner`  |     4 | Highest organization-level authority |

Higher roles satisfy lower minimum-role checks in the known role hierarchy. However, this hierarchy is not a complete permission matrix. Specific actions must be verified in their corresponding API routes and services.

### Authorization requirements

Every protected server operation should:

1. Authenticate the current user.
2. Validate the requested organization.
3. Verify organization membership.
4. Enforce the minimum required role.
5. Scope database operations to the validated organization.
6. Return only authorized information.

Hiding an action in the UI is not a replacement for server-side authorization.

## 7. Project Structure

The following is a conceptual overview. Use the actual repository for the exact current file structure.

```text
Opervia/
├── public/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   ├── api/
│   │   ├── invite/
│   │   ├── reset-password/
│   │   └── ...
│   ├── components/
│   ├── hooks/
│   └── lib/
│       ├── api-client.ts
│       ├── auth/
│       ├── db/
│       ├── email/
│       ├── services/
│       ├── validations/
│       └── ...
├── .env.local
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Important directories

- `src/app/` — Next.js pages and route handlers.
- `src/app/api/` — server-side API endpoints.
- `src/components/` — reusable and feature-specific UI components.
- `src/hooks/` — reusable hooks and client data workflows.
- `src/lib/api-client.ts` — client API helper and organization-header handling.
- `src/lib/auth/` — authentication and token utilities.
- `src/lib/db/` — database connection and models.
- `src/lib/email/` — transactional email helpers.
- `src/lib/services/` — business logic and data operations.

Some files may be located elsewhere in the current codebase; inspect existing files before creating replacements.

## 8. Getting Started

### Prerequisites

- Node.js compatible with the installed Next.js version
- npm
- Git
- MongoDB database access
- Resend credentials if testing email functionality

### Step 1: Clone the repository

```bash
git clone https://github.com/IztihadRafid/Opervia.git
cd Opervia
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Configure environment variables

Create `.env.local` in the project root and add the environment variables described below.

Use your own credentials. Never commit `.env.local` to Git.

### Step 4: Start the development server

```bash
npm run dev
```

Open:

[http://localhost:3000](http://localhost:3000)

The local development URL should remain separate from the production URL.

### Step 5: Validate the codebase

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Run these checks after relevant code changes and before releasing a new version.

## 9. Environment Variables

Environment variables must be configured separately for local development and production.

| Variable                          | Purpose                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `MONGODB_URI`                     | MongoDB connection string                                                           |
| `NEXTAUTH_URL`                    | Canonical application URL used by invitation and password-reset URL generation      |
| `AUTH_SECRET`                     | Authentication secret, subject to current auth configuration                        |
| `BETTER_AUTH_SECRET`              | Present in the known local environment; verify whether current code still uses it   |
| `INVITATION_TOKEN_ENCRYPTION_KEY` | Protects recoverable invitation-token material where required by the implementation |
| `RESEND_API_KEY`                  | Resend email API key                                                                |
| `EMAIL_FROM`                      | Sender identity for transactional email                                             |
| `TEST_EMAIL`                      | Test-recipient configuration, if used by the current email implementation           |

This list reflects the project's recorded configuration. Confirm actual source-code usage before removing or renaming any variable.

### Local configuration

In `.env.local`:

```dotenv
NEXTAUTH_URL=http://localhost:3000
```

Keep your existing local secrets and database configuration in that file.

### Production configuration

In Vercel, open:

**Project → Settings → Environment Variables**

Set the production URL to:

```dotenv
NEXTAUTH_URL=https://opervia-five.vercel.app
```

Ensure the variable is assigned to the Production environment.

If you change a Vercel environment variable, redeploy the target environment for the change to take effect.

**Never publish actual environment-variable values in this README, GitHub issues, or public documentation.**

## 10. Development Commands

| Command            | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Starts the development server                 |
| `npm run lint`     | Runs ESLint                                   |
| `npx tsc --noEmit` | Runs TypeScript type checking                 |
| `npm run build`    | Creates a production build                    |
| `npm run start`    | Runs the built production application locally |

## 11. Multi-Tenant Architecture

Opervia uses an organization context to distinguish one workspace from another.

The client API helper, `src/lib/api-client.ts`, reads the selected organization ID from local storage using the key:

```text
opervia-organization-id
```

When available, it sends that ID through the request header:

```text
x-organization-id
```

### Important security distinction

The organization header is client-supplied context. It is **not proof of authorization**.

A protected server operation must validate that the authenticated user is a member of the requested organization and has the required role.

### Tenant isolation rules

- Scope database queries to the validated organization.
- Scope updates and deletions by both record ID and organization ID.
- Reject unauthorized organization access.
- Never rely only on client-side role checks.
- Avoid leaking data between organizations through search, pagination, analytics, or activity history.
- Test access-denied cases as well as successful requests.

## 12. Database and Data Management

MongoDB is used for persistence, with Mongoose providing models and data-access behavior.

### Data access practices

- Validate request inputs before database operations.
- Use organization-scoped queries for tenant-owned records.
- Apply pagination limits to list endpoints.
- Use stable sort ordering for paginated results.
- Add indexes that match frequently used filters and sort operations.
- Avoid returning internal-only fields.
- Keep data lifecycle behavior consistent with record relationships.

### Category lifecycle

Categories are organization-scoped and support active/inactive states. Deactivation is used instead of hard deletion when existing records may continue to reference a category.

### Database operations

Do not run destructive production database operations without a backup, a clear recovery plan, and explicit verification of the target environment.

## 13. Security

Opervia includes security-oriented implementation patterns such as server-side authorization, input validation, Argon2-based password hashing, token-based invitation and password-reset workflows, and environment-based configuration.

### Security guidelines

- Keep secrets outside source control.
- Do not expose passwords, raw tokens, encryption keys, or database credentials.
- Authenticate protected requests on the server.
- Validate organization membership and roles on the server.
- Validate all untrusted input.
- Scope all tenant-owned data operations.
- Enforce invitation and password-reset expiration and state transitions.
- Use least-privilege database credentials.
- Restrict database network access where practical.
- Verify transactional email sender configuration.
- Avoid logging sensitive information.
- Re-test authorization after changing routes, services, or models.

This documentation does not represent a formal security audit, compliance certification, or guarantee that every security control has been independently tested.

## 14. Performance and Data Fetching

The project uses TanStack Query for client-side server-state management.

Recorded configuration has included:

- General query stale time: 30 seconds
- Dashboard stale time: 60 seconds
- Query garbage-collection time: 5 minutes
- Window-focus refetching disabled in the general query configuration

Verify the current configuration before relying on these exact values.

### Performance principles

- Use pagination for large lists.
- Avoid unbounded database queries.
- Use indexes aligned with actual query patterns.
- Scope data requests to the current organization.
- Keep query keys consistent.
- Refresh or invalidate relevant cached data after mutations.
- Use stable sorting for pagination.
- Test loading, empty, and error states.
- Monitor production behavior rather than relying only on local performance.

## 15. Activity Logging

Activity history records supported operational events for an organization.

Recorded event types include:

- `application_added`
- `application_updated`
- `application_deleted`
- `subscription_added`
- `subscription_updated`
- `subscription_deleted`
- `subscription_renewed`
- `user_invited`
- `invitation_revoked`
- `payment_processed`
- `expense_created`
- `expense_updated`
- `expense_deleted`

Additional license activity has been part of the project work; confirm the exact event constants and current integration in the repository before adding or modifying them.

Activity records should be organization-scoped and must not contain secrets, passwords, or raw authentication tokens.

## 16. Testing and Quality Assurance

Development has included TypeScript checks, ESLint, production builds, and manual browser regression testing.

### Automated/static checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

### Manual testing areas

- Authentication and password reset
- Organization context and membership
- Role-based access restrictions
- Application management
- Subscription management
- Vendor management
- License management
- Expense management
- Category lifecycle
- Search, filtering, and pagination
- Dashboard date-range behavior
- Activity history
- Invitations and email delivery
- Settings and organization updates
- Production environment configuration

A successful build confirms that the code compiles. It does not by itself confirm that every database, email, authentication, or authorization workflow works correctly in production.

## 17. Deployment

Opervia is deployed using Vercel.

**Production URL:** [https://opervia-five.vercel.app/](https://opervia-five.vercel.app/)

### Deployment workflow

1. Review `git status`.
2. Confirm the intended code changes.
3. Run TypeScript and lint checks.
4. Run the production build.
5. Test the affected workflow.
6. Commit and push the intended changes to the configured GitHub branch.
7. Confirm Vercel deploys the intended commit.
8. Check production environment variables.
9. Verify MongoDB connectivity.
10. Verify email configuration and generated links.
11. Run production smoke tests.
12. Review build and runtime logs.

### Production requirements

- `NEXTAUTH_URL` points to the production domain.
- `MONGODB_URI` points to the intended production database.
- Authentication secrets are configured in Vercel.
- Invitation token encryption configuration is present if required.
- Resend credentials and sender settings are correct.
- MongoDB network access permits the deployment to connect.
- Invitation and password-reset links use the production domain.

The login page has been observed to load at the production URL. Full production readiness requires testing the database-backed and email-dependent workflows as well.

## 18. M1–M13 Development Roadmap

The following summarizes the recorded development sequence.

| Module | Scope                                                | Status                                                                         |
| ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| M1     | Project foundation and framework setup               | Complete                                                                       |
| M2     | Authentication foundation                            | Complete                                                                       |
| M3     | Organization and membership foundation               | Complete                                                                       |
| M4     | Core models and API foundations                      | Complete                                                                       |
| M5     | Core management workflows and UI foundations         | Complete                                                                       |
| M6     | Data fetching, hooks, and list workflows             | Complete                                                                       |
| M7     | Dashboard and analytics foundations                  | Complete                                                                       |
| M8     | Filtering, pagination, and UI refinements            | Complete                                                                       |
| M9     | Dashboard date-range behavior and regression fixes   | Complete                                                                       |
| M10    | Activity logging and event integration               | Recorded complete                                                              |
| M11    | Security and production hardening                    | Recorded complete                                                              |
| M12    | Production build and deployment                      | Build passed; Vercel deployment configured; production smoke testing continues |
| M13    | Product modules, settings, and final regression work | Main feature work recorded complete; follow-up work remains                    |

### Major M13 product areas

- Applications and vendor relationships
- Subscriptions
- Vendors
- Licenses
- Expenses
- Profile and organization settings
- Category Management
- Activity history
- Production build corrections and deployment setup

Module status reflects recorded development progress, not independent certification of every feature.

## 19. Known Limitations and Remaining Work

### Expense multi-currency totals and reporting

Cross-currency expense totals and reporting were explicitly deferred. This work should not be considered complete until conversion rules, currency handling, and reporting requirements are agreed and implemented.

### Production smoke testing

Continue verifying:

- Sign-in and password reset
- Organization selection and tenant isolation
- Database-backed CRUD operations
- Role-based authorization
- Invitation acceptance and revocation
- Invitation and reset email delivery
- Activity event coverage

### Email production readiness

Confirm Resend sender/domain configuration and any test-mode recipient restrictions before relying on email delivery for real users.

### UI refinement

Continue improving consistency, responsiveness, accessibility, loading states, and error handling where needed.

### Documentation maintenance

Keep this README synchronized with actual route behavior, environment variables, role permissions, and deployed functionality.

## 20. Production Smoke-Test Checklist

Use test accounts and test data. Never include real credentials or token-bearing URLs in test notes.

### Authentication

- [ ] Sign in with a valid account.
- [ ] Invalid credentials display a safe error.
- [ ] Protected pages deny unauthenticated access.
- [ ] Password-reset request behaves correctly.
- [ ] Reset email link uses the production domain.
- [ ] Invalid or expired reset tokens are rejected.
- [ ] Sign-out behaves as intended.

### Organization and permissions

- [ ] The intended organization loads.
- [ ] Organization creation and selection work as implemented.
- [ ] Switching organizations switches the data context.
- [ ] A user cannot access another organization's records by changing an ID or header.
- [ ] Role restrictions are enforced by the server.

### Product modules

- [ ] Applications can be managed.
- [ ] Subscriptions can be managed.
- [ ] Vendors can be managed.
- [ ] Licenses can be managed.
- [ ] Expenses can be managed.
- [ ] Search, filtering, and pagination behave correctly.
- [ ] Categories can be created, deactivated, and reactivated.
- [ ] Activity history displays supported operations.

### Invitations and email

- [ ] Authorized users can create invitations.
- [ ] Invitation emails use the production domain.
- [ ] Expired, revoked, or accepted invitations cannot be reused.
- [ ] Resend cooldown is enforced.
- [ ] Password-reset email links use the production domain.
- [ ] Email provider logs and application status are checked.

### Deployment

- [ ] Vercel deploys the intended commit.
- [ ] Production environment variables are configured.
- [ ] MongoDB connectivity works.
- [ ] Runtime logs do not expose secrets or raw tokens.
- [ ] Desktop and mobile layouts remain usable.

## 21. Troubleshooting

### Invitation or password-reset links point to localhost

1. Open Vercel project settings.
2. Check `NEXTAUTH_URL` in the Production environment.
3. Set it to `https://opervia-five.vercel.app`.
4. Redeploy if the value changed.
5. Request a new test email and verify its destination without sharing the token.

### Database-backed features fail in production

- Confirm `MONGODB_URI` exists in Vercel Production.
- Confirm it points to the intended database.
- Check MongoDB network access and credentials.
- Inspect Vercel runtime logs without sharing secret values.

### Emails are not delivered

- Verify `RESEND_API_KEY`.
- Verify `EMAIL_FROM` and sender/domain configuration.
- Check Resend logs and test-mode restrictions.
- Review the application's recorded email status where available.

### Local development works but production fails

Local and production environments are separate. Compare variable names and environment scopes without copying secret values. Check the deployed commit, Vercel build logs, and runtime logs.

## 22. Development Guidelines

Before implementing a feature:

1. Inspect the existing model, validation schema, service, API route, hook, query keys, and page.
2. Reuse existing patterns rather than creating duplicate implementations.
3. Keep changes focused on the requested task.
4. Enforce authorization and organization scoping on the server.
5. Add or update validation where required.
6. Update activity logging when the operation should be recorded.
7. Run `npx tsc --noEmit` and `npm run lint`.
8. Run `npm run build` when appropriate before release.
9. Manually test the affected workflow.
10. Never commit `.env.local`, credentials, production tokens, or user data.

## 23. License

No license terms are declared by this README. Add an appropriate `LICENSE` file before presenting Opervia as an open-source project or granting reuse rights.

---

**Opervia — One workspace for software operations.**
