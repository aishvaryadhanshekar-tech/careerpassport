# Career Passport - Node-Based Funnel Architecture Specification

## Executive Summary

This specification outlines a complete redesign of the CareerPassport hiring workflow using a **node-based, canvas-driven architecture**. Instead of navigating multiple separate pages/tabs (job creation, trips, communications, pipeline tracking), all hiring manager activities are consolidated into a single **visual funnel canvas** where:

- **Nodes represent pipeline stages** (prospects → pipeline → interviews)
- **Sub-nodes represent detailed configurations** (trips, communications, rounds)
- **AI acts as a collaborative assistant** at any point in the workflow
- **All upstream job setup, trip configuration, and downstream candidate management** happens within the same visual interface

The hiring manager's core mental model: "I'm building a visual funnel where candidates flow through stages, and I configure what happens at each stage."

---

## 1. CORE VISION & DESIGN PRINCIPLES

### 1.1 Primary Interaction Model
- **Canvas-first**: Everything happens on a visual canvas, not in forms or modals (when possible)
- **Node-centric**: Every concept (stage, round, trip, communication) is represented as a discrete, visually distinct node
- **Collaborative AI**: AI elements are available in context (Figma-style) without forcing the user into a chat interface
- **Non-linear navigation**: Users can access/edit any stage without completing prerequisites (no forced flow)
- **Visual hierarchy**: Clear distinction between nodes, sub-nodes, and nested configurations through size, color, depth cues

### 1.2 Mental Model for Hiring Manager
"When I create a job, I'm essentially defining a journey for candidates. I start broad (what's the role?), then refine each stage (what should they do at this stage? who moves to the next stage?). AI helps me think through this, either by suggesting templates or by answering questions inline."

### 1.3 Design Inspirations
- **Figma layer panel**: Layer-level AI interactions, hierarchical navigation, zoom/collapse behavior
- **FigJam boards**: Spatial arrangement of ideas, collapsible groups
- **Conversational UI**: Natural language input (voice + text) for all interactions

---

## 2. CANVAS ARCHITECTURE

### 2.1 Canvas Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar: [Job Name] | [Save] | [Publish] | [Preview]      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ MAIN CANVAS (70% width, zoomable/pannable)           │   │
│  │                                                        │   │
│  │  [Job Posting Node]                                  │   │
│  │         ↓                                             │   │
│  │  [Application Form Node]                             │   │
│  │         ↓                                             │   │
│  │  [Interview Process Node]                            │   │
│  │    ├─ [Round 1 Sub-node]                             │   │
│  │    │   ├─ [Trip A Sub-node]                          │   │
│  │    │   └─ [Communication Sub-nodes]                  │   │
│  │    └─ [Round 2 Sub-node]                             │   │
│  │                                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ DETAIL PANEL (30% width, appears on node selection)    │ │
│  │ [Shows node contents, allows inline editing]          │ │
│  │ [Expandable sections for complex configurations]      │ │
│  │ [AI Chat/Commands inline at relevant sections]        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Canvas Interaction Behaviors

#### Pan & Zoom
- Users can pan across the canvas to see the full funnel
- Zoom in/out to see high-level overview or detailed node contents
- Zoom level is persistent per session

#### Node Selection
- Clicking a node selects it (visual highlight)
- Selection triggers:
  1. Node expands slightly or shows visual focus indicator
  2. Right detail panel slides in showing node's full configuration
  3. AI icon appears near the selected node

#### Node Expansion/Collapse
- Parent nodes (stages) can be expanded to show sub-nodes
- Sub-nodes can be collapsed back into their parent
- When collapsed, parent shows a badge/count of nested items
- Behavior similar to Figma's hierarchy: hover shows full tree, zoom out shows compact view

---

## 3. NODE HIERARCHY & STRUCTURE

### 3.1 Node Types & Levels

#### Level 0: Job Node (Root)
- Represents the entire job posting
- Contains: Job title, role type, location, basic requirements
- Can be selected to view/edit high-level job details
- Status: Draft / Published / Closed

#### Level 1: Pipeline Stage Nodes (Main Flow)
Three primary stages that form the vertical funnel:

1. **Prospects Stage**
   - Represents all incoming candidates
   - Shows count: "X candidates applying"
   - Click to see candidate table/details
   - Sub-nodes: Application form configuration

2. **Pipeline Stage**
   - Represents candidates actively completing trips
   - Shows count: "X candidates in pipeline"
   - Click to see which candidates are working on what
   - Sub-nodes: Interview rounds, trips being assigned

3. **Interview Stage**
   - Represents candidates in interview process
   - Can have multiple interview rounds (Round 1, Round 2, etc.)
   - Shows count: "X candidates in interview"
   - Click to see interview assignments
   - Sub-nodes: Individual round nodes

#### Level 2: Stage-Specific Sub-nodes

**Under Prospects:**
- Application Form Node
  - Contains: Form fields, question editor, preview
  - Can be clicked to edit form structure
  - Has AI icon for "improve this form" or "suggest fields"

**Under Pipeline:**
- Trip Assignment Nodes (one per assigned trip)
  - Contains: Trip details, assigned candidates count
  - Can be clicked to configure trip details
  - Can add/remove trips via dropdown or "Create new trip" action

**Under Interview:**
- Round Nodes (Round 1, Round 2, etc.)
  - Contains: Round configuration, trips, communications
  - Sub-nodes: Trip nodes, Communication nodes
  - Can add new round or delete existing round

#### Level 3: Nested Configuration Nodes

**Trip Sub-nodes** (appear under each Round or as direct children of Pipeline stage)
- Represents a specific assessment trip
- Contains: Trip type, duration, instructions
- Actions: View trip details, replace with different trip, create new trip on-the-go
- Collapsible tray shows available trips from database or "Create new"

**Communication Sub-nodes** (appear under Rounds)
- Represents a communication template or message
- Contains: Message content, trigger conditions, delivery timing
- Actions: View template, modify trigger logic, add/remove communication
- Supports multiple communications per round (each as separate sub-node)

### 3.2 Visual Distinction Strategy

**Node styling by level:**
- Level 1 (Stages): Large cards, bold headers, prominent colors
- Level 2 (Sub-configurations): Medium cards, slightly muted colors, indented/nested layout
- Level 3 (Detailed configs): Small cards, light colors, further indentation

**Node states:**
- Default: Gray with subtle shadow
- Hover: Slightly elevated, color shift
- Selected: Colored border, detail panel appears, AI icon visible
- Active (has unsaved changes): Orange/yellow indicator dot

**Sub-node grouping:**
- Visual container (rounded rectangle) groups related sub-nodes
- Container label indicates the grouping (e.g., "Trips in Round 1", "Communications")
- Spacing between sub-node groups clearly shows hierarchy

---

## 4. UPSTREAM JOB CONFIGURATION (Prospects Stage)

### 4.1 Job Creation Workflow

#### Initial State: Blank Canvas
When user creates a new job, present options:
1. **Start from template**: "Select a similar role from your previous jobs or company templates"
2. **Build from scratch**: "Create a custom hiring process"
3. **Upload/Import**: "Bring data from Google Drive, Slack, or other systems"

#### Template Selection Flow
If user chooses template:
1. Display list of available templates (filtered by department, role type, company)
2. User selects template → Canvas pre-populates with template nodes
3. AI notification: "I've set up a funnel based on your [Senior Developer] role. Would you like me to adjust anything?"
4. User can:
   - Accept as-is
   - Modify via voice: "Remove the coding challenge step"
   - Modify via chat: Type questions or instructions
   - Modify manually: Click on nodes to edit

#### Blank Canvas Flow
If user chooses to build from scratch:
1. Canvas shows empty state with single "Job Configuration" node
2. User clicks node to open detail panel
3. Conversational AI nudge: "Let's start by understanding the role. Tell me about the position you're hiring for."
4. User provides initial info (via voice, text, or form)
5. AI processes input and suggests:
   - Mandatory fields for this role type
   - Recommended pipeline structure
   - Suggested trips/assessments

### 4.2 Mandatory Fields Determination

**Workflow:**
1. User provides initial role description
2. AI (with LLM) determines mandatory fields:
   - Always mandatory: Job title, role type, location, basic requirements
   - Context-dependent: Seniority level, team size, specific skills
3. AI presents these in detail panel: "To complete your job setup, I need these from you:" [checkbox list]
4. User confirms/modifies mandatory fields
5. System allows progression only after mandatory fields are set (but doesn't block other node edits)

**Example:**
- Role: "Product Designer"
- Mandatory fields identified: Job title, level, team, required skills, portfolio requirement
- AI asks for each field in conversational tone

### 4.3 Application Form Generation & Editing

**Node: Application Form**
- Located below Job Configuration in canvas
- Represents the form candidates will fill out
- Initially auto-generated based on job details

**Editing Application Form:**
1. Click "Application Form" node
2. Detail panel shows form fields as a list
3. Each field can be:
   - Reordered (drag within detail panel)
   - Edited (click to modify label, type, required/optional)
   - Deleted (X button)
   - Duplicated (duplicate icon)
4. Toggle "Preview candidate view" to see how form appears to candidates
5. AI assistance:
   - Click AI icon next to form node → "What would you like to improve?"
   - Examples: "Add field for portfolio link", "Make first question more specific"
   - AI suggests specific changes or new questions

**Template-based reuse:**
- Checkbox: "Use field templates" → dropdown with common fields for this role type
- "Add from templates" button in detail panel → modal with categorized field templates
- Drag-and-drop template fields directly into form

### 4.4 Candidate Experience Preview

**Feature: Inline Preview**
- While editing application form, toggle "Preview" to show candidate-facing view
- Split view: Left side = hiring manager view, right side = candidate view
- Changes in hiring manager view reflect immediately in candidate view
- Candidate view is read-only (shows how it will appear to candidates)

**Preview states to show:**
- Empty form (initial state)
- Form with sample data (filled-out state)
- Validation messages (what happens if candidate makes errors)

---

## 5. INTERVIEW PROCESS CONFIGURATION (Interview Stage)

### 5.1 Interview Rounds Structure

**Node: Interview Process**
- Parent node containing all interview configuration
- Can be expanded to show sub-nodes (rounds)
- Shows count: "X rounds configured"

**Round Nodes (Level 2):**
- Each round is a separate node (Round 1, Round 2, Final Round, etc.)
- Node shows:
  - Round name/type
  - Any trips assigned to this round
  - Any communications configured for this round
  - Count of candidates currently in this round

**Adding/Editing Rounds:**
1. Click Interview Process node → detail panel opens
2. "Add Round" button → new round node appears in canvas
3. Or use default round template from AI suggestion
4. Click on round node to edit:
   - Rename round
   - Set round description
   - Configure which trip/communication should happen

### 5.2 Trip Assignment to Rounds

**Workflow:**
1. Click on a Round node
2. Detail panel shows section: "Trips in this round"
3. Default: One empty trip slot visible (shows placeholder)
4. User can:
   - **Assign existing trip**: Click trip slot → dropdown of available trips → select one
   - **Create new trip on-the-go**: Click "Create new trip" button → right canvas opens trip creation interface
     - User fills trip details in new right panel
     - Once created, trip is automatically assigned to this round
   - **Remove trip**: Click X button to unassign trip from round
   - **Add multiple trips**: "Add another trip" link → creates another trip slot

**Visual representation:**
- Each trip appears as a small sub-node within the Round node
- Sub-nodes show trip name and type (e.g., "Coding Challenge - 60 min")
- Trip sub-nodes can be clicked for quick view/edit

**Collapsible trip tray:**
- From the Round node, a collapsible section shows: "Available trips in your system"
- Lists all trips in database
- User can browse and drag-drop into round, or use dropdown

### 5.3 Trip Details Management

**Within Trip Sub-node:**
- Trip name/title
- Trip type (coding challenge, design task, assessment, etc.)
- Duration
- Instructions for candidate
- Link to trip details (if complex, can open full trip edit view)

**Editing a trip from round context:**
- Click trip sub-node → either:
  - Show quick edit in detail panel (for simple fields)
  - Or open trip creation/edit interface on right side of canvas

**Creating new trip on-the-go:**
- When user selects "Create new trip" from a round
- Right side of canvas expands to show trip creation form
- Form guided by AI: "What kind of challenge do you want to give candidates?"
- User describes trip via voice/text
- AI suggests structure and fields
- User completes form and saves
- Trip immediately appears as assigned to the round

### 5.4 Communication Configuration (Trigger-based)

**Node: Communications**
- Appears as sub-nodes within each Round node
- Can have multiple communication sub-nodes per round (each is separate)
- Each communication represents a message/template with trigger conditions

**Communication Sub-node structure:**
- Communication name/type (e.g., "Round 1 Start", "Rejection Email")
- Trigger condition (when is this sent?)
  - Examples: "When round starts", "When score < 30%", "After 3 days", "When interview scheduled"
- Message template (content of communication)
- Recipient (candidate, hiring team, etc.)
- Status (active/inactive)

**Editing communication triggers:**
1. Click communication sub-node
2. Detail panel shows: "Trigger condition"
3. Current trigger displayed as readable condition
4. Click "Edit trigger" → logic builder opens
5. Logic builder allows:
   - Simple triggers: "When [event] happens" → dropdown of events
   - Complex triggers: "When score < [value] AND status = [value]"
   - AI assistance: "What should happen if candidate doesn't show up?" → AI suggests trigger

**Communication templates:**
- Pre-built templates available (stored in system)
- User can select template → auto-populates message content
- User can customize template text
- AI assistance: "Improve this email for tone" or "Make this rejection more personalized"

**Multiple communications per round:**
- Each communication is a separate sub-node
- Visually grouped under the round
- User can add, remove, reorder communications

---

## 6. PIPELINE TRACKING & CANDIDATE MANAGEMENT

### 6.1 Candidate View on Canvas

**Feature: Participant Tracking Nodes**
- Each Stage node (Prospects, Pipeline, Interview) shows live candidate count
- Count badge: "12 candidates", "8 in progress", "3 interviewing"
- Clicking count badge or node → Detail panel expands to show filtered participant table

### 6.2 Participant Table & Inline Actions

**Detail panel participant view:**
- Shows table of all candidates in that stage
- Columns: Candidate name, email, status, progress, last activity, actions
- Rows are filterable by status, round, trip, etc.

**Inline actions from table:**
- User can perform actions without leaving canvas:
  - Move candidate to next round
  - Assign/reassign trip
  - Send communication (immediate or scheduled)
  - Mark as completed, rejected, etc.
  - View candidate details (name, answers to application form)
- Editing doesn't require opening separate page

**Live sync:**
- As candidates progress through pipeline, counts update in real-time
- Node badges reflect current state

### 6.3 Pipeline Analytics (Optional Enhancement)

**Visible in canvas:**
- Each stage node optionally shows small chart/metric:
  - Conversion rate to next stage
  - Average time in stage
  - Top drop-off point
- Clicking metric → detail panel shows breakdown

---

## 7. AI INTEGRATION FRAMEWORK

### 7.1 AI Interaction Model

**Principle:** AI is available in context, not forced into a dedicated chat window.

**Physical placement:**
- AI icon appears next to selected nodes
- Similar to Figma's layer-level AI interactions
- Icon location: top-right corner of selected node in canvas

**Interaction triggers:**
1. **Click AI icon** → Context menu appears
2. **Voice input** → User can speak commands contextually
3. **Text input** → User can type contextual prompts
4. **Chat window** (optional) → Floating chat window for longer conversations

**Example interaction:**
```
User clicks "Application Form" node → Node highlights
User clicks AI icon → Menu: "Improve this form" | "Add fields" | "Preview"
User selects "Improve this form"
AI asks: "What would you like to improve? Clarity? Relevance? Length?"
User: "Make it shorter, focus on critical info"
AI suggests: "I removed X non-critical fields and reorganized sections. Review here."
User accepts or requests further changes
```

### 7.2 AI Capabilities by Node Type

**Job Configuration Node:**
- "Suggest mandatory fields based on role description"
- "Recommend pipeline structure for this role type"
- "Generate job posting from this description"

**Application Form Node:**
- "Improve form clarity and relevance"
- "Suggest critical questions for this role"
- "Validate that all mandatory fields are included"
- "Preview how candidates will see this"

**Round Nodes:**
- "Suggest relevant trips for this round"
- "Recommend communication strategy for this stage"
- "Validate that round structure makes sense"

**Trip Nodes:**
- "Help me create a trip for [specific skill]"
- "Improve trip instructions for clarity"
- "Estimate time required for this trip"

**Communication Nodes:**
- "Suggest trigger conditions for this message"
- "Improve message tone and clarity"
- "Validate trigger logic"

### 7.3 AI Output Handling (MVP Approach)

Since building full AI backend is complex, MVP uses:

**Option A: Mock AI with templates (Recommended for MVP)**
- AI responses are pre-built templates keyed to context
- Template database contains common suggestions for job roles
- Example: User asks "Improve form" → system returns curated improvement suggestions
- Appears to user as "AI-generated" but is actually templated

**Option B: Claude API integration (More sophisticated)**
- Use Claude API directly within the app
- When user clicks AI icon → send context (node type, current content) to Claude
- Claude generates real suggestions based on context
- Display Claude's response in detail panel
- Requires authentication (user provides API key or we authenticate on backend)

**Option C: Hybrid approach (Recommended for refined MVP)**
- Use Claude API for open-ended requests ("Help me create a trip")
- Use templates for common, repetitive tasks ("Improve form clarity")
- Best UX: fast template responses for quick actions, Claude for creative tasks

**Visual indicator:**
- Show small loading state when AI is "thinking"
- Display "AI-suggested" or "AI-generated" badge next to suggestions
- Always allow user to manually edit suggestions

---

## 8. EXTERNAL DATA INTEGRATION

### 8.1 Integration Points

**Goal:** Help hiring managers bring external data (resumes, job descriptions, company data) into the prototype without requiring backend complexity.

**Supported sources (in MVP):**
- Google Drive (upload files, reference documents)
- Slack (reference channel data)
- Direct file upload (PDF, CSV, text)
- Claude session (allow user to connect via API key)

### 8.2 Integration UI in Canvas

**Location:** Top-right corner or side panel

**Integration panel:**
- Shows: "Connected integrations"
- List of: Google Drive, Slack, Claude, etc.
- For each: "Connect" button (if not connected) or "Manage" (if connected)
- When connected: Show brief preview of what's available

**Using integrated data:**
- When AI suggests something (e.g., "Improve form"), AI can reference external data
- Example: "Based on the job description in your Google Drive, here are relevant questions"
- User can always manually connect external source to AI context

### 8.3 Claude Integration (For Advanced AI Features)

**If using Claude API:**
1. User provides API key in settings
2. When user asks AI for help, Claude has access to:
   - Current job details from canvas
   - Company context (if provided via integration)
   - Previous trips/communications (from system)
3. Claude generates contextually relevant suggestions
4. Results displayed in canvas

**Security note:**
- API keys are stored securely
- Data sent to Claude is minimized (only what's necessary)
- User can see what data is being sent before sending

---

## 9. DETAILED FEATURE CHECKLIST

### 9.1 Canvas & Navigation
- [ ] Pannable canvas with zoom in/out controls
- [ ] Node selection with visual highlight
- [ ] Node expansion/collapse with animation
- [ ] Detail panel slides in/out from right side
- [ ] Canvas persists zoom/pan state per session
- [ ] Mobile-responsive canvas (or note: desktop-only MVP)

### 9.2 Job Configuration
- [ ] Blank canvas creation option
- [ ] Template selection flow
- [ ] Job configuration node with editable fields
- [ ] Mandatory fields determination (via LLM or template)
- [ ] Confirmation flow for mandatory fields
- [ ] Ability to edit job details at any time
- [ ] Job status tracking (Draft/Published/Closed)

### 9.3 Application Form
- [ ] Application form node in canvas
- [ ] Field list in detail panel (reorderable, editable)
- [ ] Add/remove/duplicate fields
- [ ] Field type selector (text, email, file upload, etc.)
- [ ] Toggle required/optional for fields
- [ ] Candidate experience preview (read-only view)
- [ ] Split-view preview: hiring manager vs candidate
- [ ] Template field insertion
- [ ] AI suggestions for form improvement

### 9.4 Interview Process Structure
- [ ] Interview process parent node
- [ ] Add/remove/rename round nodes
- [ ] Round nodes show count of assigned trips/communications
- [ ] Visual nesting of rounds under interview process node

### 9.5 Trip Management
- [ ] Trip assignment to rounds via dropdown or modal
- [ ] Display available trips from system
- [ ] Create new trip on-the-go from round context
- [ ] Trip details view/edit within round context
- [ ] Remove trip from round
- [ ] Multiple trips per round
- [ ] Trip collapsible tray showing available options

### 9.6 Communication & Triggers
- [ ] Communication sub-nodes within rounds
- [ ] Multiple communications per round
- [ ] Trigger condition display (readable format)
- [ ] Trigger logic editor (simple conditions, boolean logic)
- [ ] Pre-built trigger templates
- [ ] Communication template library
- [ ] Customize communication text
- [ ] AI suggestions for trigger logic
- [ ] Communication status (active/inactive toggle)

### 9.7 Candidate Tracking
- [ ] Live candidate count badges on stage nodes
- [ ] Participant table in detail panel (filtered by stage)
- [ ] Table columns: Name, email, status, progress, last activity
- [ ] Inline action buttons in table (move, assign, communicate, etc.)
- [ ] Candidate detail view (show application form answers)
- [ ] Real-time count updates as candidates progress

### 9.8 AI Framework
- [ ] AI icon appears on selected nodes
- [ ] AI context menu (e.g., "Improve", "Suggest", "Validate")
- [ ] Voice input support for AI commands
- [ ] Text input support for AI commands
- [ ] AI response display in detail panel
- [ ] Accept/reject/edit AI suggestions
- [ ] AI suggestion badges ("AI-generated")

### 9.9 External Integrations
- [ ] Integration panel in UI
- [ ] Google Drive connection (file browser, upload)
- [ ] Slack connection (channel browser)
- [ ] Direct file upload
- [ ] Connected integration status display
- [ ] Data usage in AI context

### 9.10 Publish & Sharing
- [ ] "Publish Job" button (makes candidate form live)
- [ ] Preview candidate experience before publish
- [ ] Copy candidate form link
- [ ] Share job with team members
- [ ] Job status indicator (Draft/Published/Closed)

---

## 10. USER WORKFLOWS (End-to-End)

### 10.1 Workflow: Creating a Job from Scratch

1. User clicks "Create Job" → Canvas opens with blank state
2. User chooses "Build from scratch"
3. Canvas shows "Job Configuration" node
4. User clicks node → Detail panel opens with conversational prompt: "Tell me about the position"
5. User provides info (voice or text): "Senior Product Designer, 5+ years experience, leading design system work"
6. AI processes input and suggests:
   - "Here are the mandatory fields I need: [list]"
   - "Here's a suggested pipeline: [template-based structure]"
7. User confirms mandatory fields
8. Canvas auto-generates:
   - Job Configuration node (populated)
   - Application Form node (with suggested fields)
   - Interview Process node (with suggested rounds and trips)
9. User can now refine:
   - Click "Application Form" → remove/add fields → preview
   - Click "Interview Process" → expand Round 1 → assign trips → configure communications
10. User publishes job → Candidate form goes live

### 10.2 Workflow: Modifying an Existing Job (Post-Publish)

1. User opens published job → Canvas shows full structure
2. User notices: "We need to add a design review round"
3. User clicks "Interview Process" → expands to show rounds
4. User clicks "+" or "Add Round" → new round node appears
5. User renames round to "Design Review Round"
6. User clicks on new round → assigns trip "Design Presentation Review"
7. User adds communication: "Design review scheduled" with trigger "When round starts"
8. User saves → Updates take effect for future candidates (current candidates unaffected)

### 10.3 Workflow: Managing Candidates in Pipeline

1. User opens job canvas
2. User clicks "Prospects" stage node → Detail panel shows candidate table
3. User sees 15 candidates with application status
4. User clicks on one candidate row → Expands to show their application answers
5. User decides: "Move to Round 1"
6. User clicks "Assign Round 1" → Automatically adds candidate to Round 1 trip
7. Candidate receives communication (based on Round 1 trigger)
8. User later views "Interview" stage → sees candidates in active rounds
9. User can reassign trips, send messages, or move candidates all from canvas

### 10.4 Workflow: Using AI to Improve Form

1. User working on Application Form node
2. User clicks AI icon → Menu: "Improve form" | "Add fields" | "Validate"
3. User selects "Improve form"
4. AI asks: "What aspect? Clarity / Relevance / Length / Tone?"
5. User: "Make it shorter, focus on critical skills"
6. AI suggests specific changes
7. User accepts → Form updates in canvas
8. User previews → Sees updated candidate experience

---

## 11. DESIGN & VISUAL GUIDELINES

### 11.1 Node Visual Styling

**Node dimensions:**
- Level 1 (Stages): 280px width × 120px height
- Level 2 (Rounds, Forms): 240px width × 100px height
- Level 3 (Trips, Communications): 220px width × 80px height

**Node colors (light mode):**
- Default: Light gray (#F5F5F5)
- Selected: Highlighted color (primary brand color)
- Hover: Slightly elevated shadow, subtle background shift
- Active (unsaved): Orange indicator dot

**Node colors (dark mode):**
- Default: Dark gray (#2A2A2A)
- Selected: Highlighted color (adjusted for dark)
- Hover: Slightly elevated shadow

**Typography:**
- Node title: 14px bold
- Node metadata (count, status): 12px regular
- Detail panel title: 16px bold
- Detail panel labels: 12px regular

**Spacing:**
- Vertical gap between nodes: 40px
- Horizontal gap between sibling nodes: 30px
- Padding inside node: 12px
- Detail panel width: 30% of canvas

### 11.2 Interaction States

**Hover:**
- Node elevates (shadow increases)
- Cursor changes to pointer
- Node background subtly shifts

**Selected:**
- Bold colored border (2px)
- Detail panel slides in from right
- AI icon appears in top-right corner of node
- Slight scale increase (1.02x)

**Active (editing):**
- Orange indicator dot in corner
- Unsaved changes badge appears in detail panel

**Disabled (if applicable):**
- Grayed out styling
- Cursor shows "not-allowed"

### 11.3 Animations

**Transitions:**
- Node selection: 200ms ease-out
- Detail panel slide: 300ms ease-out
- Expand/collapse: 250ms ease-out
- AI response appear: 150ms fade-in

---

## 12. IMPLEMENTATION APPROACH & TECH STACK (Guidance for LLM)

### 12.1 Architecture Overview

**Frontend:**
- React or similar framework for UI
- Canvas library (e.g., react-flow-library, custom SVG, or Canvas API) for node visualization
- State management: Context API or Redux for node tree and UI state
- Styling: Tailwind CSS or CSS modules for consistent theming

**Backend (if needed):**
- API endpoints for CRUD operations on jobs, nodes, trips, communications
- Database schema for job/node/trip/communication/communication-trigger entities
- WebSocket (optional) for real-time candidate count updates

**AI Integration:**
- Claude API SDK for generating suggestions (if using Option B or C)
- Mock suggestion templates (JSON) for MVP fast development

### 12.2 Key Libraries & Patterns

**Canvas rendering:**
- react-flow-library (good for node graphs)
- Or custom SVG + React for more control
- Pan/zoom: useGestureListener or similar library

**Form handling:**
- React Hook Form for form fields in detail panel
- Controlled components for node editable fields

**AI/LLM:**
- anthropic-sdk (Claude API client)
- Fallback to template-based suggestions if API not available

**Storage:**
- localStorage for session state (zoom, detail panel state)
- API calls for persisting job/node data

### 12.3 Data Model (Suggested Schema)

```
Job
  - id
  - title
  - description
  - roleType
  - status (Draft|Published|Closed)
  - createdAt
  - updatedAt

PipelineNode
  - id
  - jobId
  - type (Stage|Round|Form|Trip|Communication)
  - name
  - parentNodeId (for hierarchy)
  - config (JSON blob for type-specific config)
  - position (x, y coordinates on canvas)
  - order (for sibling ordering)

Trip
  - id
  - name
  - type
  - duration
  - instructions

CommunicationTemplate
  - id
  - name
  - message
  - triggerCondition
  - recipients

Candidate
  - id
  - jobId
  - name
  - email
  - applicationAnswers (JSON)
  - pipelineStage (Prospect|Pipeline|Interview)
  - currentRound
  - status
```

### 12.4 AI Integration Approach for MVP

**Recommended: Hybrid (Mock + Claude API)**

For MVP speed:
- Use mock templates for common AI requests ("Improve form", "Suggest fields")
- Use Claude API for open-ended requests ("Help me create a trip for [custom requirement]")
- Fallback to templates if Claude API unavailable

**Implementation:**
```
1. Create templates/suggestions.json with pre-written suggestions
2. When AI icon clicked:
   a. If request is in templates → return template immediately
   b. If request requires Claude → call Claude API with context
   c. Display response with "AI-generated" badge
3. User can accept, reject, or request modifications
```

**Example templates:**
- "Improve form clarity" → hardcoded list of improvements (remove vague questions, add examples, etc.)
- "Suggest mandatory fields" → lookup table by role type
- "Suggest pipeline structure" → template by role level + industry

---

## 13. MVP SCOPE & PHASING

### Phase 1 (MVP): Core Canvas + Job Setup
- [ ] Canvas UI (pan, zoom, node rendering)
- [ ] Job configuration node
- [ ] Application form node with field editor
- [ ] Basic preview functionality
- [ ] Template-based job creation
- [ ] Save/publish job
- **Estimate: 3-4 weeks**

### Phase 2: Interview Process
- [ ] Interview process node with rounds
- [ ] Trip assignment to rounds
- [ ] Communication nodes with basic triggers
- [ ] Trip library/dropdown
- **Estimate: 2-3 weeks**

### Phase 3: AI Integration & Candidate Tracking
- [ ] AI icon + context menu on nodes
- [ ] Claude API integration (or mock templates)
- [ ] Candidate count badges
- [ ] Participant table in detail panel
- **Estimate: 2-3 weeks**

### Phase 4 (Polish & Beyond)
- [ ] Advanced trigger logic builder
- [ ] External integrations (Google Drive, Slack, Claude)
- [ ] Analytics/metrics
- [ ] Mobile responsiveness
- [ ] Team collaboration features
- **Estimate: 2+ weeks**

---

## 14. ACCEPTANCE CRITERIA

A hiring manager should be able to:

1. **Create a new job** by either selecting a template or building from scratch
2. **Define job basics** (title, role type, requirements) on the canvas
3. **Configure an application form** with relevant fields and preview it
4. **Set up interview process** with multiple rounds
5. **Assign trips** (assessments, challenges) to each round
6. **Configure communications** with trigger conditions (when messages get sent)
7. **Ask AI for help** at any point in the workflow (without leaving canvas)
8. **Track candidates** as they move through pipeline stages
9. **Publish the job** and make the candidate form live
10. **Modify setup** after publishing without blocking existing candidates

---

## 15. REFERENCES & INSPIRATIONS

- **Figma**: Layer hierarchy, AI-at-layer-level, zoom/collapse behavior, hotkeys
- **FigJam**: Spatial canvas, collapsible groups, collaborative editing metaphor
- **Zapier**: Visual workflow builder, node-based flow, conditional logic
- **Airtable**: Visual database views, filtering, inline editing, card layouts
- **Typeform**: Conversational form builder, preview mode, logic branching

---

## Appendix: Hiring Manager Mental Model Diagram

```
Hiring Manager's Goal: Build a candidate experience journey

START
  ↓
Define Role (What am I hiring for?)
  ↓
Create Application Form (How do I filter candidates?)
  ↓
Design Pipeline (What rounds do candidates go through?)
  ↓
  ├─ Round 1: Add trip + communication
  ├─ Round 2: Add trip + communication
  └─ Final Round: Add trip + communication
  ↓
Publish & Track (Who's moving through each stage?)
  ↓
END (Make hiring decision)

Throughout: AI helps at each step, candidate counts visible in canvas
```

---

## Notes for LLM Implementation

- **Focus on visual clarity**: Nodes should be immediately distinguishable by type and hierarchy
- **Favor conversational flows**: Where possible, use natural language prompts instead of complex modals
- **Allow non-linear editing**: Don't force users to complete sections sequentially
- **Make AI optional**: Core workflows should work without AI; AI should enhance, not require
- **Mock when needed**: For MVP, mock AI responses are fine; real AI can be added later
- **Think in stages**: Pipeline stages (Prospects → Pipeline → Interview) are the fundamental organizing principle
- **Respect node as anchor**: Every feature, every interaction should relate back to nodes in the canvas

