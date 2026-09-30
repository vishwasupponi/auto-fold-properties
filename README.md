# Auto Fold Properties (Obsidian Plugin)

An Obsidian plugin that automatically collapses note frontmatter / properties upon opening a note, keeping your editor clean and focused.

## ✨ Features

- **Automatic Property Folding**: Notes open with the properties section neatly folded into a header bar.
- **Native Click-to-Open**: Clicking the properties header expands it natively and **stays open** while you type (no auto-closing when moving your mouse away).
- **New Note Exemption**: When creating a brand-new note, properties remain **unfolded** so you can immediately add metadata and tags.
- **Target Folder Filtering**: Choose specific folders where property auto-folding should apply (with interactive folder autocompletion), or leave empty to apply across your entire vault.
- **Fold Once Per Session**: An optional toggle that auto-folds properties only the first time a note is opened per app session. If you unfold a note, it remembers your choice until Obsidian is restarted.

## 🚀 Installation

### Manual Installation

1. Download the latest release (`main.js` and `manifest.json`).
2. Inside your Obsidian vault, navigate to `.obsidian/plugins/`.
3. Create a folder named `auto-fold-properties` and place `main.js` and `manifest.json` inside it.
4. In Obsidian, go to **Settings** → **Community plugins**, click **Reload plugins**, and enable **Auto Fold Properties**.

## ⚙️ Settings

- **Fold Once Per Session**:
  - *Enabled*: Properties are folded only the first time you open a note in that app session. If you unfold it, it stays unfolded until you close Obsidian.
  - *Disabled (Default)*: Properties are folded every time a note is opened or reopened.
- **Target Folders**:
  - Add specific folder paths from your vault to restrict where the plugin acts.
  - Leave empty to automatically fold properties across all notes in your vault.


## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Developed by [Vishwas Upponi](https://github.com/vishwasupponi).
