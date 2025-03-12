import { App, ButtonComponent, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { ExampleView } from './Views/InitiativeTrackerView';
import { VIEW_TYPE_EXAMPLE, TableFormat } from './Models/Constants';
import Creature from 'lib/Models/Creature';
// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
	playerCharacters: Creature[];
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	playerCharacters: [],
}

export default class ForbiddenLandsCharacterSheet extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf)
		  );

		  this.addRibbonIcon('scroll-text', 'DRAW STEEL! (Initiative Tracker)', () => {
			this.activateView();
		  });

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');
		
		this.addCommands();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	addCommands(){
		this.addCommand({
			id: "insert-initiative-table",
			name: "Insert Initiative Table",
			editorCallback: (editor: Editor) => { 
				editor.replaceRange(TableFormat, editor.getCursor());
			}
		});
		this.addCommand({
			id: 'import-table-to-tracker',
			name: 'Import Table To Tracker',
			editorCallback: (editor: Editor) => {
				this.importSelectionToTracker(editor);
			}
		});
	}

	importSelectionToTracker(editor: Editor){
		if(!(editor.somethingSelected())) {
			return;
		}

		var selection = editor.getSelection();
		var done = false;
		var lines: string[] = [];
		lines = selection.split('\n');
		for(var i = 0; i < lines.length; i++){
			console.log(lines[i]);
		}
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

class SampleSettingTab extends PluginSettingTab {
	plugin: ForbiddenLandsCharacterSheet;

	constructor(app: App, plugin: ForbiddenLandsCharacterSheet) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h1', {text: 'Draw Steel Companion Settings'});

		var div = containerEl.createDiv({cls: "rightAlign bottomSpace"});
		new ButtonComponent(div)
			.setButtonText("Add Player Character")
			.setClass("rightAlign")
			.onClick( () => {

				var player = new Creature();
				this.plugin.settings.playerCharacters.push(player);

				var staminaInput = '';

				new Setting(containerEl)
				.setName('Player Character')
				.setDesc('Set the PC\'s Name and Stamina')
				.addText(text => text
					.setPlaceholder('Name')
					.setValue(player.Name)
					.onChange(async (value) => {
						console.log('Secret: ' + value);
						player.Name = value;
						await this.plugin.saveSettings();
					}))
				.addText(text => text
					.setPlaceholder('Stamina')
					.setValue(staminaInput)
					.onChange(async (value) => {
						console.log('Secret: ' + value);
						if (value != null && value != "")
						{
							player.Stamina = +value;
						}
						await this.plugin.saveSettings();
					}));
			} );
	}
}
