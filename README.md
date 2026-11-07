# Zubi AI Studio

> **Create Without Limits. Powered by AI.**
>
> A modern, scalable AI-powered creative platform where users can generate, edit, and improve images, videos, text, and other digital content from one beautifully designed workspace.

![Zubi AI Studio](https://placehold.co/1200x480/101322/FFFFFF?text=Zubi+AI+Studio)

[![Next.js](https://img.shields.io/badge/Next.js-App_Router-black?logo=next.js)](https://nextjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-JSX-yellow?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-blue)](#license)

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Product Vision](#2-product-vision)
- [3. Design Direction](#3-design-direction)
- [4. Brand System](#4-brand-system)
- [5. Technology Stack](#5-technology-stack)
- [6. Website Pages](#6-website-pages)
- [7. AI Tools and Capabilities](#7-ai-tools-and-capabilities)
- [8. User Dashboard](#8-user-dashboard)
- [9. Admin Dashboard](#9-admin-dashboard)
- [10. User Roles and Permissions](#10-user-roles-and-permissions)
- [11. Core User Journeys](#11-core-user-journeys)
- [12. AI Provider Integration](#12-ai-provider-integration)
- [13. Firebase Architecture](#13-firebase-architecture)
- [14. Data Model](#14-data-model)
- [15. Credits and Subscription System](#15-credits-and-subscription-system)
- [16. UI/UX Requirements](#16-uiux-requirements)
- [17. Responsive Design](#17-responsive-design)
- [18. SEO and Marketing](#18-seo-and-marketing)
- [19. Security and Reliability](#19-security-and-reliability)
- [20. Performance and Accessibility](#20-performance-and-accessibility)
- [21. Suggested Project Structure](#21-suggested-project-structure)
- [22. Environment Variables](#22-environment-variables)
- [23. Getting Started](#23-getting-started)
- [24. Development Standards](#24-development-standards)
- [25. Testing Strategy](#25-testing-strategy)
- [26. Deployment](#26-deployment)
- [27. Development Roadmap](#27-development-roadmap)
- [28. Future Enhancements](#28-future-enhancements)
- [29. Product Success Metrics](#29-product-success-metrics)
- [30. License](#30-license)

---

## 1. Project Overview

**Zubi AI Studio** is an AI-powered creative SaaS platform designed to bring multiple AI utilities into one simple, premium, and user-friendly workspace.

Instead of visiting different websites for every task, users can discover and use AI tools from a single platform.

### Main product categories

- **Image AI:** Generate, edit, enhance, and transform images.
- **Video AI:** Create short videos and transform visual assets using supported providers.
- **Writing AI:** Generate, rewrite, summarize, and improve text.
- **Audio AI:** Work with speech, voice, transcription, and audio tools where providers are available.
- **Productivity AI:** Create ideas, prompts, descriptions, and useful business content.
- **Developer AI:** Generate and explain code, SQL, regex, and technical documentation.

### Primary goals

1. Deliver a polished and intuitive AI tools experience.
2. Make complex AI workflows easy for non-technical users.
3. Support multiple AI providers behind a consistent interface.
4. Build a secure credit and usage management system.
5. Create an architecture that can grow into a multi-plan SaaS business.
6. Allow administrators to manage tools, users, pricing, content, and usage.
7. Keep the platform fast, responsive, accessible, and SEO-friendly.

### Product positioning

**One studio. Many AI possibilities.**

Zubi AI Studio should feel like a professional creative workspace—not a random directory of AI links.

---

## 2. Product Vision

### Mission

Make useful AI capabilities accessible through a clean, reliable, and affordable creative platform.

### Target users

- Content creators and social media managers
- Freelancers and digital agencies
- Small businesses and entrepreneurs
- Designers and marketers
- Students and educators
- Developers and technical teams
- Anyone who wants to create digital content faster

### Core principles

| Principle | Product expectation |
|---|---|
| Simple | A new user should understand how to use a tool quickly. |
| Useful | Every published tool must solve a clear problem. |
| Transparent | Show credit cost, limits, and generation status clearly. |
| Reliable | Handle failures, retries, and provider downtime gracefully. |
| Secure | Protect user data, files, API credentials, and billing records. |
| Scalable | Add tools and providers without rewriting the whole platform. |

---

## 3. Design Direction

### Overall visual style

Create a **premium, modern AI SaaS interface** with a creative studio atmosphere.

The design should combine:

- Minimal layouts with strong visual hierarchy
- Dark-first studio experience with a polished light theme
- Soft borders and subtle surface contrast
- Large, confident headings
- Carefully selected gradients as accents—not everywhere
- Beautiful tool cards with meaningful previews
- Smooth transitions and purposeful micro-interactions
- Spacious layouts and consistent alignment
- Clear empty, loading, success, and error states

### Main visual references

Use the design quality and interaction patterns of modern products such as:

- Linear — clean application layout and navigation
- Vercel — restrained typography and developer-friendly clarity
- Framer — creative presentation and polished interactions
- Raycast — focused productivity interface
- Modern AI creative tools — visual previews and simple generation workflows

These are inspiration references only. The product should have its own identity.

### Application layout

**Public marketing website**

- Top navigation with logo, product links, pricing, resources, and account actions
- Large hero section with a clear headline and primary call to action
- Searchable tools discovery area
- Featured tools and category sections
- Example outputs and workflow previews
- How-it-works section
- Pricing and FAQ
- Footer with legal and support links

**Authenticated studio**

- Collapsible left sidebar
- Top bar with global search, credits, notifications, and profile menu
- Main content area with page title and contextual actions
- Optional right-side settings panel for advanced tool controls
- Responsive mobile navigation
- Consistent page containers and spacing

### Suggested dashboard layout

```text
┌────────────────────────────────────────────────────────────────┐
│ Logo / Workspace     Search tools...       Credits   Profile   │
├─────────────────┬──────────────────────────────────────────────┤
│ Overview        │ Good morning, welcome to your studio          │
│ Explore Tools   │                                              │
│ My Creations    │ [Generate Image] [Remove Background] [More]  │
│ Favorites       │                                              │
│ History         │ Recent Creations                              │
│ Usage & Billing │ [Preview] [Preview] [Preview] [Preview]       │
│ Settings        │                                              │
│                 │ Popular Tools                                 │
│                 │ [Tool Card] [Tool Card] [Tool Card]            │
└─────────────────┴──────────────────────────────────────────────┘
```

---

## 4. Brand System

### Brand identity

- **Product name:** Zubi AI Studio
- **Tagline:** Create Without Limits. Powered by AI.
- **Personality:** Creative, intelligent, reliable, modern, approachable
- **Voice:** Clear, helpful, confident, and human

### Suggested color palette

| Token | Suggested value | Usage |
|---|---|---|
| Primary | `#8B5CF6` | Primary actions and brand accents |
| Secondary | `#22D3EE` | Supporting highlights |
| Accent | `#F472B6` | Creative emphasis |
| Background dark | `#090B14` | Main dark canvas |
| Surface dark | `#111522` | Cards and panels |
| Elevated dark | `#191F30` | Menus and elevated surfaces |
| Text primary | `#F8FAFC` | Main text on dark theme |
| Text muted | `#94A3B8` | Secondary text |
| Border | `#273044` | Dividers and card borders |
| Success | `#22C55E` | Successful operations |
| Warning | `#F59E0B` | Warnings and pending states |
| Danger | `#EF4444` | Errors and destructive actions |

Use CSS variables or design tokens so the palette can be adjusted centrally. Check contrast in both themes.

### Typography

Suggested font pairing:

- **Headings:** Geist or Plus Jakarta Sans
- **Body:** Inter or Geist Sans
- **Code:** Geist Mono

Use a consistent type scale. Avoid using too many font weights or oversized text in dashboard screens.

### Component styling

- Cards: medium radius, subtle border, restrained shadow
- Buttons: clear hierarchy for primary, secondary, ghost, and destructive actions
- Inputs: visible labels, helpful placeholders, clear focus rings
- Badges: use only for meaningful status or category labels
- Dialogs: concise content, clear action buttons
- Tool cards: icon, title, short benefit, category, and relevant usage information

---

## 5. Technology Stack

The project uses JavaScript and JSX rather than TypeScript.

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js App Router | Application framework, routing, server rendering |
| Language | JavaScript / JSX | Application development |
| UI | React | Component-based interface |
| Styling | Tailwind CSS | Responsive utility-first styling |
| Components | shadcn/ui + Radix UI | Accessible, reusable components |
| Icons | Lucide React | Consistent icon system |
| Animation | Framer Motion | Page transitions and micro-interactions |
| Forms | React Hook Form | Form state management |
| Validation | Zod | Input validation |
| Backend | Firebase | Authentication, Firestore, Storage |
| Server operations | Next.js Route Handlers / Server Actions | Secure application operations |
| State | Zustand | Lightweight client state where needed |
| Data tables | TanStack Table | Admin and usage tables |
| Charts | Recharts | Usage and analytics visualizations |
| File handling | Firebase Storage | User uploads and generated assets |
| Local persistence | IndexedDB / Dexie (optional) | Local drafts and offline-friendly state |
| Testing | Vitest + Playwright | Unit and end-to-end testing |
| Monitoring | Sentry (optional) | Error tracking |
| Deployment | Vercel | Hosting and deployment |
| Source control | Git + GitHub | Version control |

### Architecture rule

Keep provider-specific API code out of UI components. A tool page should call a shared server-side generation service, which validates input, checks permissions and credits, selects a provider, and records the result.

---

## 6. Website Pages

### Public routes

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Introduce the platform and highlight tools |
| `/tools` | Explore Tools | Search and browse all published tools |
| `/tools/[slug]` | Tool Details | Explain a tool and launch its workflow |
| `/categories` | Categories | Browse tools by category |
| `/categories/[slug]` | Category Details | Show tools in a category |
| `/pricing` | Pricing | Compare plans and credit allowances |
| `/about` | About | Explain the product and mission |
| `/blog` | Blog | Publish guides, updates, and SEO content |
| `/blog/[slug]` | Blog Article | Read an article |
| `/contact` | Contact | Support and business inquiries |
| `/privacy` | Privacy Policy | Privacy information |
| `/terms` | Terms | Platform terms |
| `/refund-policy` | Refund Policy | Billing and refund rules |
| `/login` | Login | User sign-in |
| `/register` | Register | Create an account |
| `/forgot-password` | Forgot Password | Start password recovery |
| `/verify-email` | Verify Email | Email verification guidance |

### User application routes

| Route | Page | Purpose |
|---|---|---|
| `/studio` | Overview | User workspace overview |
| `/studio/explore` | Explore | Discover available AI tools |
| `/studio/tools/[slug]` | Tool Workspace | Use a selected tool |
| `/studio/creations` | My Creations | Browse generated outputs |
| `/studio/history` | History | Review previous operations |
| `/studio/favorites` | Favorites | Saved tools |
| `/studio/usage` | Usage | Credit and activity details |
| `/studio/billing` | Billing | Plan and payment information |
| `/studio/settings` | Settings | Account and preferences |
| `/studio/settings/profile` | Profile | Personal information |
| `/studio/settings/security` | Security | Password and session options |

### Admin routes

| Route | Page | Purpose |
|---|---|---|
| `/admin` | Admin Overview | Platform metrics and alerts |
| `/admin/users` | Users | User management |
| `/admin/tools` | Tools | Create and manage AI tools |
| `/admin/categories` | Categories | Manage tool categories |
| `/admin/providers` | Providers | Configure provider metadata and status |
| `/admin/plans` | Plans | Manage subscriptions and plans |
| `/admin/transactions` | Transactions | Review billing records |
| `/admin/usage` | Usage | Monitor credit consumption |
| `/admin/generations` | Generations | Inspect generation jobs |
| `/admin/content` | Content | Manage marketing pages and FAQs |
| `/admin/blog` | Blog | Manage articles |
| `/admin/coupons` | Coupons | Manage promotional codes |
| `/admin/feedback` | Feedback | Review user feedback |
| `/admin/settings` | Settings | Platform configuration |
| `/admin/audit-logs` | Audit Logs | Review sensitive admin actions |

Protect every admin route on the server. Hiding admin links in the browser is not authorization.

---

## 7. AI Tools and Capabilities

Tools should be modular. Each tool should have metadata, a validated input schema, a provider mapping, a credit policy, and a consistent output format.

### 7.1 Image tools

| Tool | Description | Typical inputs |
|---|---|---|
| AI Image Generator | Generate images from text prompts | Prompt, style, aspect ratio |
| Background Remover | Remove an image background | Image upload |
| Image Enhancer | Improve image clarity and quality | Image upload, enhancement level |
| Image Upscaler | Increase image resolution | Image, scale factor |
| Image to Image | Transform an existing image | Image, prompt, strength |
| AI Photo Editor | Apply prompt-based image edits | Image, edit instructions |
| Image Variation | Create variations from a reference image | Image, variation settings |
| AI Thumbnail Maker | Create video and social thumbnails | Topic, text, style |
| Product Image Generator | Create clean product visuals | Product image, scene prompt |
| Social Media Image Maker | Create platform-ready graphics | Platform, content, style |

### 7.2 Video tools

| Tool | Description | Typical inputs |
|---|---|---|
| Text to Video | Generate video from a text prompt | Prompt, duration, aspect ratio |
| Image to Video | Animate a still image | Image, motion prompt |
| Video Enhancer | Improve supported video assets | Video upload, settings |
| AI Video Captions | Create captions or subtitles | Video/audio, language |
| Short Video Ideas | Generate short-form video concepts | Topic, audience, platform |
| Video Script Writer | Create scripts for videos | Topic, duration, tone |
| AI Clip Planner | Suggest clips and timestamps | Transcript or video metadata |

Video generation can be expensive and provider-dependent. Display supported durations, limits, expected processing status, and credit cost before users submit a job.

### 7.3 Writing tools

- AI Article Writer
- Blog Outline Generator
- SEO Title Generator
- Meta Description Generator
- Product Description Writer
- Social Media Caption Generator
- YouTube Title and Description Generator
- Email Writer
- Grammar and Clarity Improver
- Text Summarizer
- Paraphraser
- Translation Assistant
- Content Repurposer
- Hashtag Generator
- Call-to-Action Generator

### 7.4 Audio tools

- Speech to Text
- Text to Speech
- Audio Transcription
- Audio Summarizer
- Subtitle Text Extractor
- Voiceover Script Writer

Only publish tools when a working provider integration and its usage rights are in place. Do not advertise unsupported capabilities as live.

### 7.5 Developer tools

- Code Explainer
- Code Generator
- SQL Query Assistant
- Regex Generator
- JSON Formatter and Explainer
- API Documentation Writer
- README Generator
- Debugging Assistant
- Commit Message Generator

### 7.6 Tool detail page content

Every tool page should contain:

1. Tool name and a benefit-focused headline.
2. Short description in plain language.
3. Input area with clear instructions.
4. Supported file types and limits, where relevant.
5. Available settings and examples.
6. Credit cost before generation.
7. Generate action and processing feedback.
8. Output preview and download action.
9. Retry or regenerate action where supported.
10. Privacy and retention note.
11. How-to-use steps.
12. FAQ section.
13. Related tools.
14. SEO title, description, and structured metadata.

### Example tool content

**AI Background Remover**

- Headline: Remove image backgrounds in seconds.
- Description: Upload a supported image and create a clean transparent-background result.
- Primary action: Upload Image
- Secondary action: View Example
- Output: Transparent PNG when supported by the provider
- Helpful note: Results depend on image quality and provider capabilities.

---

## 8. User Dashboard

The dashboard should help users understand what they can do next without overwhelming them.

### Overview

- Welcome message
- Current plan and available credits
- Quick actions for popular tools
- Recently used tools
- Recent creations
- Favorite tools
- Usage summary
- Helpful onboarding tips
- Upgrade prompt when appropriate

### Explore tools

- Search by name or task
- Category filters
- Popular, featured, and recently added sections
- Sort by newest or popularity
- Tool cards with concise descriptions
- Empty search state with suggestions

### My creations

- Grid and list views
- Image and video previews
- Search and filter by type/date/status
- Download supported output formats
- Rename creation
- Favorite/unfavorite
- Delete with confirmation
- Open creation details

### Generation history

Each job should show:

- Tool name
- Input summary
- Status: queued, processing, completed, failed, cancelled
- Credit amount
- Created date
- Output link when available
- Error details in a safe, user-friendly format
- Retry action only when safe and supported

### User settings

- Name and profile photo
- Email and verification status
- Password/security options
- Theme preference
- Notification preferences
- Account deletion request
- Privacy and data controls

---

## 9. Admin Dashboard

The admin area is the control center for the platform.

### Admin overview metrics

- Total registered users
- Active users
- New users over time
- Total generations
- Successful and failed jobs
- Credits consumed
- Subscription revenue, if billing is enabled
- Most-used tools
- Provider error rate
- Recent system events

Metrics should come from actual records and clearly define their time range. Do not display fake revenue or invented analytics.

### Tool management

Administrators should be able to:

- Create, edit, publish, unpublish, and archive tools
- Set tool name, slug, description, icon, category, and tags
- Configure provider mapping
- Define input fields and validation rules
- Set credit cost and usage limits
- Set supported output types
- Mark a tool as featured or popular
- Configure SEO metadata
- Preview a tool before publishing

Provider secrets must never be stored in public tool documents or sent to the browser.

### User management

- Search and filter users
- View profile and account status
- Review usage and generation history
- Assign or remove supported roles
- Suspend or reactivate accounts
- Grant promotional credits with an audit reason
- Review subscription state

### Content management

- Homepage hero content
- Featured tools
- Category descriptions
- FAQs
- Blog articles
- Legal page content
- Announcement banners

### Platform settings

- Maintenance mode
- Signup availability
- Default credit policy
- Upload limits
- Supported file types
- Provider availability flags
- Default theme
- Email notification configuration

---

## 10. User Roles and Permissions

Use role-based access control (RBAC), enforced in server-side code and Firestore Security Rules where applicable.

| Role | Permissions |
|---|---|
| Guest | Browse public pages and published tools |
| USER | Use enabled tools, manage own creations and account |
| SUPPORT | View permitted support information and respond to requests |
| EDITOR | Manage approved marketing and blog content |
| ADMIN | Manage users, tools, plans, usage, and platform settings |
| SUPER_ADMIN | Full platform administration and role management |

### Authorization requirements

- New registrations receive only the default `USER` role.
- Users cannot change their own role or credit balance.
- Admin role changes must be server-authorized and logged.
- Sensitive operations require explicit permission checks.
- Never trust a role value supplied by the client.
- Use custom claims or server-verified role records according to the chosen Firebase authorization design.

---

## 11. Core User Journeys

### Journey A: New user

1. Visitor opens the homepage.
2. Visitor explores available tools.
3. Visitor selects a tool.
4. Platform explains whether sign-in is required.
5. User registers and verifies email if required.
6. User reaches the studio dashboard.
7. User receives a clear onboarding experience.
8. User runs an available tool.

### Journey B: Generate an image

1. User opens AI Image Generator.
2. User enters a prompt.
3. User chooses supported style and aspect ratio.
4. UI displays the credit cost.
5. User confirms generation.
6. Server validates the request and available credits.
7. Server creates a generation job.
8. Provider processes the request.
9. Platform records the result and final usage.
10. User previews and downloads the output.

### Journey C: Failed generation

1. Provider returns an error or times out.
2. Job status is updated safely.
3. User sees a clear error message.
4. Credits are reconciled according to the documented billing policy.
5. Retry is offered only when safe.
6. Failure details are recorded for monitoring without exposing secrets.

### Journey D: Admin publishes a tool

1. Admin creates a tool record.
2. Admin configures the provider mapping and input schema.
3. Admin defines credit cost and usage restrictions.
4. Admin previews the tool.
5. Admin publishes it.
6. The public tool directory displays the published tool.

---

## 12. AI Provider Integration

### Provider abstraction

Do not couple the app to one AI vendor. Create a shared provider interface so new providers can be added without rewriting tool pages.

Suggested conceptual interface:

```js
// lib/ai/providers/base.js

export async function generate(input, options = {}) {
  throw new Error("Provider must implement generate()");
}
```

A provider adapter should normalize vendor-specific requests and responses into a common application format.

### Suggested structure

```text
lib/
  ai/
    providers/
      base.js
      image-provider.js
      text-provider.js
      video-provider.js
    services/
      generate.js
      validate-request.js
      reconcile-credits.js
    schemas/
      image.js
      text.js
      video.js
```

### Provider requirements

- Store API keys only in server-side environment variables or a secure secret manager.
- Validate all user input before calling a provider.
- Apply per-user rate limits.
- Set request timeouts and handle retries carefully.
- Normalize provider errors.
- Track provider request IDs when available.
- Record usage and cost metadata where permitted.
- Avoid logging prompts or uploaded content unnecessarily.
- Respect provider terms, safety requirements, and data-retention rules.

### Asynchronous generation

Long-running image or video jobs should use a job-based workflow:

1. Create a job record.
2. Return a job identifier to the client.
3. Process the provider request using a suitable server or background execution system.
4. Update job status.
5. Store output metadata.
6. Notify or refresh the user interface.

Do not assume a short-lived HTTP request can safely handle every long-running generation. Select infrastructure based on provider duration and hosting limits.

---

## 13. Firebase Architecture

### Firebase services

| Service | Responsibility |
|---|---|
| Firebase Authentication | User registration and sign-in |
| Cloud Firestore | Users, tools, jobs, plans, usage, content |
| Firebase Storage | User uploads and generated assets |
| Firebase App Check | Reduce unauthorized abuse of supported Firebase services |
| Firebase Admin SDK | Trusted server-side operations |
| Cloud Functions (optional) | Background processing and event-driven tasks |

### Architecture principles

- Use Firebase client SDK only for operations allowed by Security Rules.
- Use Firebase Admin SDK only on trusted server-side code.
- Keep Admin SDK credentials out of client bundles.
- Validate ownership for every user-owned document and file.
- Use server-controlled writes for credits, roles, transactions, and generation status.
- Add indexes for actual query patterns.
- Separate public content from private user data.

### Suggested Firestore collections

```text
users/{userId}
userSettings/{userId}
tools/{toolId}
categories/{categoryId}
generations/{generationId}
creditAccounts/{userId}
creditTransactions/{transactionId}
plans/{planId}
subscriptions/{subscriptionId}
payments/{paymentId}
favorites/{favoriteId}
notifications/{notificationId}
blogPosts/{postId}
faqs/{faqId}
providerConfigs/{providerId}
adminAuditLogs/{logId}
supportTickets/{ticketId}
```

For high-volume collections, define ownership fields and indexes based on real query patterns. Avoid putting every user's history in one unbounded array.

---

## 14. Data Model

The following examples are conceptual. Adapt fields and indexes to the final implementation.

### User document

```js
{
  uid: "firebase-auth-uid",
  displayName: "Example User",
  email: "user@example.com",
  photoURL: null,
  role: "USER",
  status: "active",
  emailVerified: false,
  planId: "free",
  createdAt: "Firestore Timestamp",
  updatedAt: "Firestore Timestamp"
}
```

### Tool document

```js
{
  name: "AI Image Generator",
  slug: "ai-image-generator",
  description: "Generate images from text prompts.",
  categoryId: "image",
  icon: "image",
  status: "published",
  featured: true,
  providerKey: "image-provider",
  creditCost: 5,
  inputSchema: {
    prompt: {
      type: "string",
      required: true,
      maxLength: 2000
    },
    aspectRatio: {
      type: "string",
      required: true,
      options: ["1:1", "16:9", "9:16"]
    }
  },
  outputTypes: ["image"],
  createdAt: "Firestore Timestamp",
  updatedAt: "Firestore Timestamp"
}
```

### Generation document

```js
{
  userId: "firebase-auth-uid",
  toolId: "ai-image-generator",
  status: "queued",
  input: {
    prompt: "A modern product photo in a bright studio"
  },
  output: null,
  creditsReserved: 5,
  creditsCharged: 0,
  providerKey: "image-provider",
  providerRequestId: null,
  errorCode: null,
  createdAt: "Firestore Timestamp",
  completedAt: null
}
```

### Credit transaction document

```js
{
  userId: "firebase-auth-uid",
  type: "generation",
  amount: -5,
  balanceAfter: 95,
  referenceId: "generation-id",
  description: "AI Image Generator",
  idempotencyKey: "unique-operation-key",
  createdAt: "Firestore Timestamp"
}
```

### Data integrity rules

- Use Firestore transactions or another atomic server-side approach for balance changes.
- Use idempotency keys to prevent duplicate charges.
- Never accept `balanceAfter`, `creditsCharged`, or role values from the client.
- Keep an immutable ledger of credit transactions.
- Define what happens when a provider fails after a reservation.
- Use server timestamps for authoritative event times.

---

## 15. Credits and Subscription System

### Example plan structure

These are product-planning examples, not final prices or promises.

| Plan | Example allowance | Intended audience |
|---|---:|---|
| Free | Limited starter credits | New users |
| Starter | Small monthly allowance | Casual creators |
| Pro | Larger monthly allowance | Freelancers and creators |
| Business | Team-oriented allowance | Small teams and agencies |

### Credit features

- Initial promotional credits, if enabled
- Credit balance and transaction history
- Tool-specific credit costs
- Subscription renewal allowances
- Optional one-time credit packs
- Promotional coupon support
- Admin credit adjustments with audit reasons
- Low-credit warnings
- Usage summaries

### Billing rules

1. Show the cost before a user starts a generation.
2. Reserve or deduct credits through trusted server logic.
3. Prevent duplicate charges with idempotency.
4. Reconcile credits when jobs fail or are cancelled.
5. Record every balance change in a ledger.
6. Verify payment webhooks on the server.
7. Never grant paid credits based only on a browser redirect.
8. Clearly disclose expiration, renewal, and refund rules.

Integrate a payment provider only after confirming supported countries, currencies, payout availability, and compliance requirements.

---

## 16. UI/UX Requirements

### Home page content

**Hero headline**

> Your Creative Ideas, Powered by AI.

**Supporting text**

> Generate images, create content, explore creative tools, and turn your ideas into finished work—all from one simple AI studio.

**Primary CTA:** Explore AI Tools

**Secondary CTA:** Create Free Account

### Homepage sections

1. Navigation
2. Hero with product preview
3. Trust or capability highlights (only verified claims)
4. Popular AI tools
5. Browse by category
6. Featured workflow examples
7. How Zubi AI Studio works
8. Benefits for creators and businesses
9. Pricing plans
10. Frequently asked questions
11. Final call to action
12. Footer

### Example homepage copy

**Section: One workspace, endless possibilities**

> Stop jumping between disconnected tools. Find the right AI workflow, add your input, and create from one organized workspace.

**Section: Built for the way you work**

- Create visual content faster.
- Turn rough ideas into polished drafts.
- Reuse your favorite workflows.
- Keep your creations organized.
- Understand usage before you generate.

**Section: How it works**

1. Choose a tool.
2. Add your prompt or upload a supported file.
3. Customize available settings.
4. Generate and review your result.
5. Save or download your creation.

### Micro-interactions

- Subtle hover states on cards and buttons
- Smooth sidebar transitions
- Skeleton loaders for content
- Progress indicators for generation jobs
- Toast feedback for successful actions
- Clear confirmation for destructive actions
- Copy-to-clipboard feedback
- Image preview and lightbox
- Keyboard-accessible dialogs and menus

Motion should support usability. Avoid excessive animation, forced scrolling, or heavy effects that slow down the studio.

### Required UI states

Every interactive feature should define:

- Default state
- Loading state
- Empty state
- Success state
- Validation error state
- Server/provider error state
- Disabled state
- Permission-denied state
- Offline or connection-lost state where relevant

---

## 17. Responsive Design

The experience must work well on:

- Desktop: full dashboard with sidebar and multi-column tool grids
- Laptop: compact sidebar and flexible content width
- Tablet: collapsible navigation and adaptive cards
- Mobile: drawer navigation, stacked forms, touch-friendly controls

### Responsive rules

- Avoid horizontal overflow.
- Use responsive grid columns.
- Keep primary actions easy to reach.
- Make upload areas usable on touch screens.
- Keep dialogs within viewport height.
- Use readable font sizes and spacing.
- Test tool workspaces on small screens, not only the homepage.

---

## 18. SEO and Marketing

### SEO foundations

- Unique page title and meta description
- Canonical URLs
- Open Graph and social sharing metadata
- XML sitemap
- Robots configuration
- Semantic HTML
- Descriptive image alt text
- Internal links between tools and categories
- Fast loading and stable layouts
- Useful, original tool descriptions and guides

### Structured data

Use appropriate structured data only when page content qualifies, such as:

- Organization
- WebSite
- BreadcrumbList
- Article
- SoftwareApplication, where accurate

Never add fake ratings, reviews, pricing, or availability to structured data.

### Content strategy

Publish helpful content around real user problems:

- How to remove an image background
- How to write better AI image prompts
- How to create product images for an online store
- How to write SEO-friendly product descriptions
- How to plan short-form video content
- How to use AI responsibly in a creative workflow

Each article should be genuinely useful, original, and connected to relevant tools.

---

## 19. Security and Reliability

### Authentication and access

- Verify authentication on protected server routes.
- Enforce authorization on every sensitive operation.
- Protect admin pages and APIs independently.
- Use secure session handling where applicable.
- Require email verification for sensitive workflows if appropriate.
- Add account recovery and session management.

### API protection

- Keep provider keys server-side.
- Validate request bodies with Zod.
- Apply rate limits by user and IP where appropriate.
- Enforce upload size, MIME type, and file count limits.
- Do not trust client-provided file names or metadata.
- Restrict CORS where relevant.
- Return safe error messages without secrets or stack traces.

### File security

- Validate uploaded file content, not just the extension.
- Use private storage paths for user content.
- Enforce per-user access rules.
- Use short-lived signed URLs when appropriate.
- Define retention and deletion policies.
- Consider malware scanning for risky file types.

### Financial and usage integrity

- Server controls all credit changes.
- Payment webhooks are signature-verified.
- Duplicate webhook delivery is handled idempotently.
- Every admin adjustment is audited.
- Generation jobs have explicit state transitions.
- Failed jobs follow a documented refund/reconciliation policy.

### Privacy

- Explain what data is sent to external AI providers.
- Collect only necessary user information.
- Provide clear retention and deletion policies.
- Avoid storing sensitive prompts or files longer than needed.
- Respect provider data policies and applicable laws.

---

## 20. Performance and Accessibility

### Performance

- Use Next.js Server Components for content that does not need client interactivity.
- Add `"use client"` only where needed.
- Optimize images and use responsive image sizing.
- Lazy-load heavy previews and non-critical modules.
- Paginate large creation and admin tables.
- Avoid unnecessary global state.
- Cache public content safely.
- Avoid caching private user data across accounts.
- Monitor Core Web Vitals and real user performance.

### Accessibility

- Use semantic headings and landmarks.
- Provide labels for every form control.
- Support keyboard navigation.
- Show visible focus states.
- Use accessible dialogs and menus.
- Provide alt text for meaningful images.
- Do not communicate status using color alone.
- Respect reduced-motion preferences.
- Maintain sufficient text and control contrast.

---

## 21. Suggested Project Structure

```text
zubi-ai-studio/
├── app/
│   ├── (marketing)/
│   │   ├── page.jsx
│   │   ├── tools/
│   │   ├── categories/
│   │   ├── pricing/
│   │   ├── blog/
│   │   ├── about/
│   │   └── contact/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── verify-email/
│   ├── (studio)/
│   │   └── studio/
│   │       ├── page.jsx
│   │       ├── explore/
│   │       ├── tools/[slug]/
│   │       ├── creations/
│   │       ├── history/
│   │       ├── favorites/
│   │       ├── usage/
│   │       ├── billing/
│   │       └── settings/
│   ├── admin/
│   │   ├── page.jsx
│   │   ├── users/
│   │   ├── tools/
│   │   ├── categories/
│   │   ├── providers/
│   │   ├── plans/
│   │   ├── usage/
│   │   ├── generations/
│   │   └── settings/
│   ├── api/
│   │   ├── generate/
│   │   ├── generations/[id]/
│   │   ├── webhooks/
│   │   └── health/
│   ├── layout.js
│   ├── globals.css
│   ├── loading.jsx
│   ├── error.jsx
│   └── not-found.jsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── marketing/
│   ├── studio/
│   ├── tools/
│   ├── admin/
│   ├── shared/
│   └── providers/
├── config/
│   ├── site.js
│   ├── navigation.js
│   └── plans.js
├── hooks/
├── lib/
│   ├── firebase/
│   │   ├── client.js
│   │   ├── admin.js
│   │   └── auth.js
│   ├── ai/
│   │   ├── providers/
│   │   ├── services/
│   │   └── schemas/
│   ├── auth/
│   ├── billing/
│   ├── credits/
│   ├── security/
│   ├── validation/
│   └── utils.js
├── services/
├── store/
├── types/
│   └── schemas/
├── public/
│   ├── images/
│   ├── icons/
│   └── brand/
├── scripts/
├── tests/
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── components.json
├── jsconfig.json
├── next.config.mjs
├── package.json
└── README.md
```

Keep this structure practical. Do not create empty folders or abstractions before the related feature exists.

---

## 22. Environment Variables

Create a local `.env.local` file. Never commit real secrets.

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Zubi AI Studio"

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# AI Providers (server-side only)
AI_IMAGE_PROVIDER_API_KEY=
AI_TEXT_PROVIDER_API_KEY=
AI_VIDEO_PROVIDER_API_KEY=

# Billing (only when configured)
PAYMENT_PROVIDER_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=

# Monitoring (optional)
SENTRY_DSN=
```

### Environment variable rules

- Only values intentionally exposed to the browser should use `NEXT_PUBLIC_`.
- Never prefix private API keys or service-account credentials with `NEXT_PUBLIC_`.
- Use the hosting platform's secret manager in production.
- Validate required environment variables at startup or at the point of use.
- Keep `.env.local` out of Git.

---

## 23. Getting Started

### Requirements

- Node.js version supported by the selected Next.js release
- npm
- Git
- Firebase project
- AI provider API credentials for tools you want to enable

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/zubi-ai-studio.git
cd zubi-ai-studio
npm install
```

### Configure environment

Create `.env.local` in the project root and add the required Firebase values.

### Run development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Common scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:e2e
```

Add scripts to `package.json` when the corresponding tooling is installed.

---

## 24. Development Standards

### Code quality

- Use JavaScript and JSX consistently.
- Prefer small, reusable components.
- Keep server and client responsibilities separate.
- Keep provider integration in service modules.
- Validate external input at boundaries.
- Use meaningful names for files, functions, and variables.
- Avoid giant page components.
- Avoid duplicated business logic.
- Handle errors explicitly.
- Remove unused imports and dead code.

### Component conventions

- Use shadcn/ui components as a foundation.
- Keep shared UI primitives in `components/ui`.
- Keep product-specific components in their feature folders.
- Use Lucide icons consistently.
- Use design tokens instead of scattered color values.
- Build accessible forms with React Hook Form and Zod.

### Next.js conventions

- Use Server Components by default.
- Use Client Components only for interactive browser behavior.
- Keep secrets and privileged Firebase operations on the server.
- Use Route Handlers for API endpoints that need HTTP interfaces.
- Add loading, error, and not-found experiences.
- Avoid reading browser-only APIs during server rendering.
- Keep metadata specific to each public page.

### Git workflow

Suggested branch names:

```text
main
develop
feature/authentication
feature/tool-directory
feature/image-generation
feature/credit-system
fix/generation-status
```

Use focused commits and review security-sensitive changes before merging.

---

## 25. Testing Strategy

### Unit tests

Test:

- Input validation schemas
- Credit calculations
- Generation state transitions
- Provider response normalization
- Permission helpers
- Utility functions

### Integration tests

Test:

- Authenticated API requests
- Tool publishing and discovery
- Credit reservation and reconciliation
- Generation job creation
- Storage ownership checks
- Payment webhook verification

### End-to-end tests

Critical flows:

1. Register and sign in.
2. Open the studio dashboard.
3. Browse published tools.
4. Submit a valid generation request.
5. See processing and completed states.
6. View and download a creation.
7. Confirm users cannot access another user's data.
8. Confirm non-admin users cannot access admin operations.
9. Confirm failed jobs follow the credit policy.

Use Firebase Emulator Suite for rules and integration tests where practical.

---

## 26. Deployment

### Recommended deployment

- Frontend and Next.js server: Vercel
- Authentication and database: Firebase
- User uploads and outputs: Firebase Storage
- Background processing: suitable queue/worker or cloud execution service
- Source control: GitHub
- Monitoring: Sentry or an equivalent service

### Production checklist

- [ ] Production Firebase project configured
- [ ] Environment variables added securely
- [ ] Firestore Security Rules reviewed and deployed
- [ ] Storage Rules reviewed and deployed
- [ ] Required Firestore indexes deployed
- [ ] Admin authorization verified server-side
- [ ] Provider API keys stored securely
- [ ] Rate limits enabled
- [ ] Credit transactions tested for concurrency
- [ ] Payment webhooks verified, if billing is enabled
- [ ] Error monitoring configured
- [ ] Privacy and legal pages reviewed
- [ ] Sitemap and robots configuration checked
- [ ] Mobile layouts tested
- [ ] Backup and retention policies documented

---

## 27. Development Roadmap

Build in small, testable phases. Do not connect every AI provider before the platform's core architecture is stable.

### Phase 1 — Foundation

- [ ] Create Next.js JavaScript project
- [ ] Configure Tailwind and shadcn/ui
- [ ] Establish brand tokens and typography
- [ ] Build responsive marketing layout
- [ ] Configure Firebase client and Admin SDK
- [ ] Set up environment validation
- [ ] Add error, loading, and not-found states

### Phase 2 — Authentication

- [ ] Registration
- [ ] Login and logout
- [ ] Forgot/reset password
- [ ] Email verification flow
- [ ] User profile creation
- [ ] Protected studio routes
- [ ] Server-side role checks

### Phase 3 — Marketing website

- [ ] Homepage
- [ ] Tool directory
- [ ] Tool detail pages
- [ ] Categories
- [ ] Pricing page
- [ ] FAQ and contact pages
- [ ] SEO metadata and sitemap

### Phase 4 — Studio dashboard

- [ ] Dashboard overview
- [ ] Search and category filters
- [ ] Tool workspace layout
- [ ] My creations
- [ ] History
- [ ] Favorites
- [ ] User settings

### Phase 5 — First working AI tools

Start with a small group of reliable tools:

- [ ] One text generation tool
- [ ] One image generation or image editing tool
- [ ] One image utility, such as background removal
- [ ] Shared provider adapter
- [ ] Server-side validation
- [ ] Job status handling
- [ ] Output storage and download

### Phase 6 — Credits and billing

- [ ] Credit account
- [ ] Immutable transaction ledger
- [ ] Credit reservation and reconciliation
- [ ] Tool-specific costs
- [ ] Free plan allowance
- [ ] Paid plans
- [ ] Payment integration and webhook verification

### Phase 7 — Admin dashboard

- [ ] Admin overview
- [ ] User management
- [ ] Tool management
- [ ] Category management
- [ ] Provider status management
- [ ] Usage and generation monitoring
- [ ] Content management
- [ ] Audit logs

### Phase 8 — Quality and launch

- [ ] Security review
- [ ] Firestore and Storage Rules tests
- [ ] Responsive QA
- [ ] Accessibility review
- [ ] Performance optimization
- [ ] SEO review
- [ ] Error monitoring
- [ ] Production deployment

---

## 28. Future Enhancements

Possible future features:

- Team workspaces and shared credits
- Prompt library and reusable templates
- Public creation gallery with user consent
- Workflow builder connecting multiple AI tools
- Batch generation
- Scheduled generation
- Brand kits for businesses
- API access for developers
- Browser extension
- Webhooks and integrations
- Referral and affiliate system
- Organization-level billing
- Usage budgets and team limits
- Multi-language interface
- AI assistant that recommends the right tool

Add these only after validating demand and operational cost.

---

## 29. Product Success Metrics

Measure product quality with real usage data.

| Metric | What it tells us |
|---|---|
| Registration conversion | Whether visitors understand the value |
| First-generation conversion | Whether onboarding leads to real usage |
| Generation success rate | Provider and workflow reliability |
| Time to first result | How quickly users receive value |
| Weekly active users | Ongoing product engagement |
| Repeat usage | Whether tools solve recurring needs |
| Credit utilization | Whether the credit model is understandable |
| Tool adoption | Which tools users actually value |
| Support issue rate | Where users encounter friction |
| Infrastructure cost per generation | Whether unit economics are sustainable |

Avoid optimizing only for registrations. A useful platform helps users complete successful tasks and return.

---

## 30. License

This project is intended to be a proprietary product of **Zubi AI Studio** unless a different license is explicitly added by the project owner.

Third-party libraries, AI models, APIs, and assets remain subject to their respective licenses and terms of service.

---

## Final Product Standard

Zubi AI Studio should not become a collection of unfinished AI demos. Every published tool should have:

- A clear purpose and honest description
- A working and supported provider integration
- Validated inputs and predictable outputs
- Transparent credit cost and usage limits
- Proper loading, success, and failure states
- Secure handling of user files and data
- A useful mobile experience
- Basic documentation and support information

**Build a small number of excellent tools first. Make the platform reliable. Then expand the studio.**

---

*Built with ambition by Zubair Developer.*
