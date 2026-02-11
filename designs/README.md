# Design Files (.jsx)

After Effects ExtendScript (.jsx) animation files for social media posts.

## Structure

```
designs/
├── titan/          ← Titan PMR post animations
│   └── TITAN_PostName.jsx
├── titanverse/     ← Titanverse post animations
│   └── TV_PostName.jsx
```

## Naming Convention

Files match their Notion post name exactly:
- `TITAN_BlackBookRepeatFlow.jsx`
- `TV_ComplianceBurden.jsx`
- `TITANUP_AgendaTease.jsx`

## Workflow

1. Claude creates the .jsx file and pushes here
2. GitHub raw URL is added to the "Design File" property on the Notion post
3. Mat pulls the .jsx from GitHub → opens in After Effects → renders

## Notes

- These are text files (ExtendScript) — typically 5-20KB each
- Rendered assets (MP4, PNG) should NOT go in this repo
- See `DESIGN_INSTRUCTIONS.md` in the project for visual specs
