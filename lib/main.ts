import { App, ButtonComponent, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { InitiativeView } from './Views/InitiativeTrackerView';
import { VIEW_TYPE_EXAMPLE, TableFormat, TableFlag } from 'lib/Models/Constants';
import Creature from 'lib/Models/Creature';
import {MyPluginSettings, DEFAULT_SETTINGS} from 'lib/Settings'
// Remember to rename these classes and interfaces!

export default class ForbiddenLandsCharacterSheet extends Plugin {
	settings: MyPluginSettings;
	creatures: Creature[] = [];

	async onload() {
		await this.loadSettings();
		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new InitiativeView(leaf, this.creatures, this.settings.playerCharacters)
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
		var flagFound = false;
		var creatures = [];
		for(var i = 0; i < lines.length; i++){
			var sample = lines[i];
			if (sample.contains(TableFlag))
			{
				flagFound = true;
				continue;
			}
			if (flagFound && sample.contains("|"))
			{
				var cells = sample.split("|");
				var creature = new Creature();
				creature.Name = cells[1];
				creature.Stamina = +cells[2];
				creature.Id = creatures.length.toString();
				creatures.push(creature);
			}
		}
		if (creatures.length > 0)
		{
			this.creatures = creatures;
			this.activateView();
			this.creatures = [];
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
		console.log("Settings Loaded");
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("Settings Saved");
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
				this.buildCharacterInput(containerEl)
			} );
		new ButtonComponent(div)
			.setButtonText("Save")
			.setClass("rightAlign")
			.onClick( () => {
				this.plugin.saveSettings();
			} );
	    console.log(this.plugin.settings.playerCharacters.length);
	    console.log(containerEl.children.length);
		console.log("Adding Characters");
		this.plugin.settings.playerCharacters.forEach((x) => this.buildCharacterInput(containerEl, x))
	}

	buildCharacterInput(containerEl: HTMLElement, character?: Creature){
		console.log("HI!!!!");
		var player = character ?? new Creature();
		
		if (character == undefined)
		{
			this.plugin.settings.playerCharacters.push(player);
		}

		var staminaInput = player.Stamina == undefined ? '' : player.Stamina.toString();
		var setting = new Setting(containerEl)
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
			}))
		.addButton((button: ButtonComponent): ButtonComponent => {
			let b = button.setButtonText("Delete").onClick(() => {
				this.plugin.settings.playerCharacters.remove(player);
				setting.controlEl.remove();
				setting.nameEl.remove();
				setting.descEl.remove();
				setting.infoEl.remove();
				setting.settingEl.remove();
			});
			return b;
		});
					
	}
}
