# Auto Fold Properties

[![Latest Release](https://img.shields.io/github/v/release/vishwasupponi/auto-fold-properties?color=3b82f6&label=Version)](https://github.com/vishwasupponi/auto-fold-properties/releases/latest)
[![Obsidian](https://img.shields.io/badge/Obsidian-v1.13.0%2B-7C3AED.svg)](https://obsidian.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](LICENSE)

> [!NOTE]
> **Safe & Non-Destructive**: This plugin operates strictly at the UI display level. It **never modifies, edits, alters, or writes to any files or notes** in your vault.

An Obsidian plugin that automatically collapses note frontmatter / properties upon opening a note, keeping your editor clean and focused.

---

## ✨ Features

- **Automatic Property Folding**: Notes open with the properties section neatly folded into a compact header bar.
- **Native Click-to-Open**: Clicking the properties header expands it natively and stays open while you view or edit metadata.
- **New Note Exemption**: When creating a brand-new note, properties remain unfolded so you can immediately add metadata and tags.
- **Target Folder Filtering**: Choose specific folders where property auto-folding should apply (with native fuzzy folder search), or leave empty to apply across your entire vault.
- **Fold Once Per Session**: An optional toggle that auto-folds properties only the first time a note is opened per app session. If you unfold a note, it remembers your choice until Obsidian is restarted.

---

## 🚀 Installation

### From Obsidian Community Plugins *(Recommended)*
1. In Obsidian, navigate to **Settings** → **Community plugins**.
2. Turn off **Restricted mode** if prompted.
3. Click **Browse** and search for **Auto Fold Properties**.
4. Click **Install**, then click **Enable**.

### Manual Installation
1. Download `main.js` and `manifest.json` from the [Latest Release](https://github.com/vishwasupponi/auto-fold-properties/releases/latest).
2. Inside your Obsidian vault, navigate to `.obsidian/plugins/`.
3. Create a folder named `auto-fold-properties` and copy `main.js` and `manifest.json` into it.
4. Go to **Settings** → **Community plugins**, click **Reload plugins**, and enable **Auto Fold Properties**.

---

## ⚡ Quick Start

1. Open any note with frontmatter properties in your vault—the properties banner will be automatically folded on open.
2. Click the folded properties header once whenever you want to expand and view or edit your metadata.
3. *(Optional)* Open **Settings** → **Auto Fold Properties** if you want to restrict property folding to specific folders or enable **Fold once per session**.

---

## ⚙️ Settings

- **Fold once per session**:
  - *Enabled*: Properties are auto-folded only the first time you open a note in that app session. If you unfold it, it stays unfolded until Obsidian is restarted.
  - *Disabled (default)*: Properties are auto-folded every time a note is opened or reopened.
- **Target folders**:
  - Click **Add folder** to search and add specific folders from your vault to restrict where the plugin acts.
  - Leave empty to automatically fold properties across all notes in your vault.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Developed by [Vishwas Upponi](https://github.com/vishwasupponi).
