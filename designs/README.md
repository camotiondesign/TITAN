# Design Files (.jsx)

After Effects ExtendScript (.jsx) animation files for social media posts.

## Structure

```
designs/
├── linkedin/
│   ├── titan/          ← Titan PMR LinkedIn post animations
│   │   └── TITAN_PostName.jsx
│   └── titanverse/     ← Titanverse LinkedIn post animations
│       └── TV_PostName.jsx
├── tiktok/             ← TikTok designs (1080x1920, shared account)
│   └── TT_PostName.jsx
├── youtube/
│   ├── thumbnails/     ← YouTube thumbnail designs (1280x720)
│   │   └── YT_Title_thumb.jsx
│   └── end-cards/      ← YouTube end screen designs
├── instagram/          ← Instagram designs (shared account)
│   └── IG_PostName.jsx
├── facebook/           ← Facebook designs (shared account)
├── _templates/         ← Reusable base templates
└── README.md
```

**Key rule:** LinkedIn is the ONLY platform with separate titan/ and titanverse/ folders. Every other platform is a shared account.

## Naming Convention

Files match their Notion post name exactly:
- `TITAN_BlackBookRepeatFlow.jsx` (LinkedIn Titan PMR)
- `TV_ComplianceBurden.jsx` (LinkedIn Titanverse)
- `TITANUP_AgendaTease.jsx` (LinkedIn campaign)
- `TT_PostName.jsx` (TikTok)
- `YT_Title_thumb.jsx` (YouTube thumbnail)
- `IG_PostName.jsx` (Instagram)

## Platform Specs

| Platform | Dimensions | Notes |
|----------|-----------|-------|
| LinkedIn | 1200x1200 (single), 1080x1350 (carousel) | Brand-specific folders |
| TikTok | 1080x1920 | Vertical video, shared account |
| YouTube thumbnails | 1280x720 | High contrast, readable at small sizes |
| Instagram | 1080x1080 (feed), 1080x1920 (stories) | Shared account |
| Facebook | 1200x630 | Shared account |

## Workflow

1. Claude creates the .jsx file and pushes to the correct platform folder
2. GitHub raw URL is added to the "Design File" property on the Notion post
3. Cam pulls the .jsx from GitHub, opens in After Effects, renders

## Notes

- These are text files (ExtendScript) — typically 5-20KB each
- Rendered assets (MP4, PNG) should NOT go in this repo
- See `DESIGN_INSTRUCTIONS.md` in the project for visual specs
