---
name: coa-cli
description: CoAnimator CLI and project file integration for automated video generation, template rendering, and scene stitching.
---

# CoAnimator CLI (coa) Skill

CoAnimator is an agent-guided animation studio for rendering vector, character, and scene animations directly to MP4/WebM.

## CLI Usage

### 1. Render Project to Video
```bash
coa render project.coa --output ./Export/output.mp4 --resolution 1080x1920 --fps 60
```

### 2. Export Specific Scene
```bash
coa export-scene project.coa --scene "HookScene" --output ./Export/hook.mp4
```

### 3. Pack / Unpack Project Files
```bash
# Unpack project into editable JSON and assets
coa unpack project.coa --out-dir ./01-source/unpacked/

# Pack edited JSON and assets back into project
coa pack ./01-source/unpacked/ --output project_edited.coa
```

### 4. Headless Automation (CI / Server)
```bash
coa render project.coa --headless --threads 4 --preset high-quality
```
