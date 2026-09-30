import { App, Plugin, PluginSettingTab, Setting, TFile, TFolder, MarkdownView, AbstractInputSuggest, TextComponent } from 'obsidian';

interface FoldPropertiesSettings {
	targetFolders: string[];
	foldOncePerSession: boolean;
}

const DEFAULT_SETTINGS: FoldPropertiesSettings = {
	targetFolders: [],
	foldOncePerSession: false
};

interface AppWithCommands {
	commands?: {
		commands: Record<string, unknown>;
		executeCommandById: (id: string) => boolean;
	};
}

export default class AutoFoldPropertiesPlugin extends Plugin {
	settings: FoldPropertiesSettings;
	private newlyCreatedFiles: Set<string> = new Set();
	private sessionFoldedFiles: Set<string> = new Set();

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new FoldPropertiesSettingTab(this.app, this));

		// 1. Track newly created files
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.newlyCreatedFiles.add(file.path);
					window.setTimeout(() => {
						this.newlyCreatedFiles.delete(file.path);
					}, 10000);
				}
			})
		);

		// 2. Handle file open event
		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (file) {
					this.handleFileOpen(file);
				}
			})
		);

		// 3. Handle active leaf change event
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf && leaf.view instanceof MarkdownView && leaf.view.file) {
					this.handleFileOpen(leaf.view.file);
				}
			})
		);

		// 4. Handle initial layout ready for all restored tabs on startup
		this.app.workspace.onLayoutReady(() => {
			this.app.workspace.iterateAllLeaves((leaf) => {
				if (leaf.view instanceof MarkdownView && leaf.view.file) {
					this.handleFileOpen(leaf.view.file);
				}
			});
		});
	}

	private isFolderTarget(file: TFile): boolean {
		if (!this.settings.targetFolders || this.settings.targetFolders.length === 0) {
			return true;
		}

		const filePath = file.path.toLowerCase();

		return this.settings.targetFolders.some((folder) => {
			let f = folder.trim().toLowerCase();
			if (!f) return false;
			if (f.startsWith('/')) f = f.substring(1);
			if (f.endsWith('/')) f = f.substring(0, f.length - 1);

			return filePath === f || filePath.startsWith(f + '/');
		});
	}

	private handleFileOpen(file: TFile) {
		if (!file || file.extension !== 'md') return;

		// Check if file's folder matches settings
		if (!this.isFolderTarget(file)) return;

		// Check if file was newly created in this session
		if (this.newlyCreatedFiles.has(file.path)) {
			this.newlyCreatedFiles.delete(file.path);
			return;
		}

		// Check "Fold Once Per Session" setting
		if (this.settings.foldOncePerSession && this.sessionFoldedFiles.has(file.path)) {
			return;
		}

		// Attempt to fold properties when view/DOM is ready
		this.foldPropertiesWhenReady(file.path);
	}

	private foldPropertiesWhenReady(filePath: string, attempts = 0) {
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		const matchingLeaf = leaves.find(
			(leaf) => leaf.view instanceof MarkdownView && leaf.view.file?.path === filePath
		);

		if (!matchingLeaf || !(matchingLeaf.view instanceof MarkdownView)) {
			if (attempts < 20) {
				window.setTimeout(() => {
					this.foldPropertiesWhenReady(filePath, attempts + 1);
				}, 50);
			}
			return;
		}

		const view = matchingLeaf.view;
		const container = view.contentEl.querySelector('.metadata-container');

		if (container) {
			const isCollapsed = container.classList.contains('is-collapsed');

			if (!isCollapsed) {
				const appWithCommands = this.app as unknown as AppWithCommands;
				const appCommands = appWithCommands.commands;
				if (appCommands) {
					if (appCommands.commands['editor:fold-properties']) {
						appCommands.executeCommandById('editor:fold-properties');
					} else if (appCommands.commands['editor:toggle-fold-properties']) {
						appCommands.executeCommandById('editor:toggle-fold-properties');
					}
				}
			}

			// Verify if now collapsed, and ONLY THEN mark as session-folded
			window.setTimeout(() => {
				const updatedContainer = view.contentEl.querySelector('.metadata-container');
				if (updatedContainer && updatedContainer.classList.contains('is-collapsed')) {
					this.sessionFoldedFiles.add(filePath);
				}
			}, 30);

			return;
		}

		// Retry up to 20 times (every 50ms = 1000ms total window) to ensure DOM is rendered
		if (attempts < 20) {
			window.setTimeout(() => {
				this.foldPropertiesWhenReady(filePath, attempts + 1);
			}, 50);
		}
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<FoldPropertiesSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		if (!Array.isArray(this.settings.targetFolders)) {
			this.settings.targetFolders = [];
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
	}
}

class FolderSuggest extends AbstractInputSuggest<TFolder> {
	private textComponent: TextComponent;

	constructor(app: App, textComponent: TextComponent) {
		super(app, textComponent.inputEl);
		this.textComponent = textComponent;
	}

	getSuggestions(query: string): TFolder[] {
		const lower = query.toLowerCase().trim();
		const allFiles = this.app.vault.getAllLoadedFiles();
		const folders = allFiles.filter((f): f is TFolder => f instanceof TFolder);

		if (!lower) return folders.slice(0, 10);
		return folders
			.filter((folder) => folder.path.toLowerCase().includes(lower))
			.slice(0, 15);
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path);
	}

	selectSuggestion(folder: TFolder): void {
		this.textComponent.setValue(folder.path);
		this.textComponent.inputEl.dispatchEvent(new Event('input'));
		this.close();
	}
}

class FoldPropertiesSettingTab extends PluginSettingTab {
	plugin: AutoFoldPropertiesPlugin;

	constructor(app: App, plugin: AutoFoldPropertiesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('General')
			.setHeading();

		// 1. Checkbox: Remember fold state until app closes
		new Setting(containerEl)
			.setName('Fold Once Per Session')
			.setDesc(
				'When enabled, properties are auto-folded only the first time a note is opened per app session. Re-opening a note without closing Obsidian will remember your current fold state. When disabled, properties auto-fold every time a note is opened.'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.foldOncePerSession)
					.onChange(async (value) => {
						this.plugin.settings.foldOncePerSession = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Folder Selection')
			.setHeading();

		let inputComponent: TextComponent;

		new Setting(containerEl)
			.setName('Target Folders')
			.setDesc('Type a folder path to apply property folding (Leave empty to apply to ALL folders in your vault):')
			.addText((text) => {
				inputComponent = text;
				text.setPlaceholder('Start typing folder path...');
				new FolderSuggest(this.app, text);
			})
			.addButton((button) =>
				button
					.setButtonText('Add Folder')
					.setCta()
					.onClick(async () => {
						const value = inputComponent.getValue().trim();
						if (value && !this.plugin.settings.targetFolders.includes(value)) {
							this.plugin.settings.targetFolders.push(value);
							await this.plugin.saveSettings();
							this.display();
						}
					})
			);

		new Setting(containerEl)
			.setName('Configured Target Folders')
			.setHeading();

		if (this.plugin.settings.targetFolders.length === 0) {
			containerEl.createEl('p', {
				text: 'No specific folders selected. Property folding applies to ALL folders in your vault.',
				cls: 'setting-item-description'
			});
			return;
		}

		for (let i = 0; i < this.plugin.settings.targetFolders.length; i++) {
			const folderPath = this.plugin.settings.targetFolders[i];
			new Setting(containerEl)
				.setName(folderPath)
				.addButton((button) =>
					button
						.setButtonText('Remove')
						.setDestructive()
						.onClick(async () => {
							this.plugin.settings.targetFolders.splice(i, 1);
							await this.plugin.saveSettings();
							this.display();
						})
				);
		}
	}
}
