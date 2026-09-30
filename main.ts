import { App, Plugin, PluginSettingTab, TFile, TFolder, MarkdownView, FuzzySuggestModal, SettingDefinitionItem } from 'obsidian';

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

class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
	private onChoose: (folder: TFolder) => void;

	constructor(app: App, onChoose: (folder: TFolder) => void) {
		super(app);
		this.onChoose = onChoose;
		this.setPlaceholder('Type folder name to select...');
	}

	getItems(): TFolder[] {
		const folders: TFolder[] = [];
		const collectFolders = (parent: TFolder) => {
			for (const child of parent.children) {
				if (child instanceof TFolder) {
					folders.push(child);
					collectFolders(child);
				}
			}
		};
		collectFolders(this.app.vault.getRoot());
		return folders;
	}

	getItemText(folder: TFolder): string {
		return folder.path;
	}

	onChooseItem(folder: TFolder): void {
		this.onChoose(folder);
	}
}

class FoldPropertiesSettingTab extends PluginSettingTab {
	plugin: AutoFoldPropertiesPlugin;

	constructor(app: App, plugin: AutoFoldPropertiesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Fold once per session',
				desc: 'When enabled, properties are auto-folded only the first time a note is opened per app session. Re-opening a note without closing Obsidian will remember your current fold state. When disabled, properties auto-fold every time a note is opened.',
				control: {
					type: 'toggle',
					key: 'foldOncePerSession'
				}
			},
			{
				type: 'list',
				heading: 'Target folders',
				emptyState: 'No specific folders selected. Property folding applies to all folders in your vault.',
				addItem: {
					name: 'Add folder',
					action: () => {
						new FolderSuggestModal(this.app, (selectedFolder) => {
							if (!this.plugin.settings.targetFolders.includes(selectedFolder.path)) {
								this.plugin.settings.targetFolders.push(selectedFolder.path);
								void this.plugin.saveSettings();
								this.update();
							}
						}).open();
					}
				},
				onDelete: (idx: number) => {
					this.plugin.settings.targetFolders.splice(idx, 1);
					void this.plugin.saveSettings();
					this.update();
				},
				onReorder: (oldIndex: number, newIndex: number) => {
					const [moved] = this.plugin.settings.targetFolders.splice(oldIndex, 1);
					this.plugin.settings.targetFolders.splice(newIndex, 0, moved);
					void this.plugin.saveSettings();
				},
				items: this.plugin.settings.targetFolders.map((path) => ({
					name: path,
					searchable: false
				}))
			}
		];
	}
}
