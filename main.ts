import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf  } from 'obsidian';

import { iPluginSettings } from "./settings/iPluginSettings"
import { VIEW_TYPE_EXAMPLE, ExampleView } from 'views/diceRollerView';
// Remember to rename these classes and interfaces!


const DEFAULT_SETTINGS: iPluginSettings = {
	mySetting: 'default'
}

export default class ForbiddenLandsCharacterSheet extends Plugin {
	settings: iPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const CharacterRibbon = this.addRibbonIcon('book', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		const GearRibbon = this.addRibbonIcon('dice', 'Quick Roll', (evt: MouseEvent) => {
			// Called when the user clicks the icon.

			let item: number = Math.random() * 10 + Math.random() * 10;

			if (item <= 11)
			{
				new Notice('Tier 1 Result!');
			} else
			if (item >= 12 && item <= 16)
			{
				new Notice('Tier 2 Result!');
			} else
			if (item >= 17)
			{
				new Notice('Tier 3 Result!');
			}	
		});
		// Per
		// Perform additional things with the ribbon
		CharacterRibbon.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('INPUT PSEUDO CHARACTER SHEET');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf)
		);
		this.addRibbonIcon("magnifying-glass", "Open Complex Roller", () => {
			this.activateView();
		  });
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
	}

	async activateView() {
		const { workspace } = this.app;
	
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);
	
		if (leaves.length > 0) {
		  // A leaf with our view already exists, use that
		  leaf = leaves[0];
		} else {
		  // Our view could not be found in the workspace, create a new leaf
		  // in the right sidebar for it
		  leaf = workspace.getRightLeaf(false);
		  if (leaf != null)
			await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
	}
	
	// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf != null)
		workspace.revealLeaf(leaf);
	  }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: ForbiddenLandsCharacterSheet;

	constructor(app: App, plugin: ForbiddenLandsCharacterSheet) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Character Sheet')
			.setDesc('Set a note to be your character sheet')
			.addText(text => text
				.setPlaceholder('Select a note')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Equipment Sheet')
			.setDesc('Set a note to be your equipment sheet')
			.addText(text => text
				.setPlaceholder('Select a note')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
