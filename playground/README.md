# Content Playground

**Draft workspace for building campaigns before they go live**

The playground is where you develop, iterate, and refine campaigns before they're published. When a campaign is ready for posting, move it to the `campaigns/` folder.

---

## Structure

Playground is organized by **content pillars**:

```
playground/
├── product/        # Product features, workflows, capabilities
├── proof/          # Case studies, testimonials, results
├── insight/         # Industry analysis, NHS policy, education
├── community/      # Events, milestones, Titanverse, team content
├── leadership/     # Strategic vision, thought leadership, brand
└── _template/      # Template for new playground campaigns
```

---

## Workflow

### 1. Create Campaign in Playground

1. Copy `playground/_template/` to the appropriate pillar folder
2. Rename to `draft-[campaign-slug]` or `YYYY-MM-DD-[campaign-slug]` if you have a target date
3. Build your campaign content in full structure
4. Update `status.md` as you progress

### 2. Build Content

- Write blog posts, carousels, video scripts
- Create social media captions
- Add notes and ideas in `notes.md`
- Track status in `status.md`

### 3. Review & Refine

- Use `status.md` to mark: `draft` → `review` → `ready-to-publish`
- Collaborate using `notes.md`
- Iterate until content is polished

### 4. Move to Campaigns

When ready to publish:
1. Move entire campaign folder from `playground/[pillar]/` to `campaigns/TITAN/` or `campaigns/TITANVERSE/`
2. Remove `status.md` and `notes.md` (or archive them)
3. Update `campaign-meta.json` with final details
4. Campaign is now live and ready for posting

---

## Status Tracking

Each playground campaign includes `status.md`:

- **draft** — Initial creation, content being written
- **review** — Content complete, awaiting review/approval
- **ready-to-publish** — Approved, ready to move to campaigns folder

---

## Notes System

Use `notes.md` for:
- Internal collaboration
- Ideas and iterations
- Questions to resolve
- Reference links
- Brainstorming

This file stays in playground and is removed/archived when campaign goes live.

---

## Pillar Guidelines

See each pillar folder's README for:
- What content belongs in that pillar
- Performance targets
- Content format recommendations
- Strategic priorities

---

## Key Principles

- **Full structure** — Playground campaigns use same structure as live campaigns for easy migration
- **Pillar organization** — Content organized by strategic pillars
- **Status tracking** — Clear workflow from draft to published
- **Collaboration** — Notes system for team input
- **Easy migration** — Move entire folder when ready

---

**Remember:** Playground is for building. Campaigns folder is for live content.
