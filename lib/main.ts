import { App, ButtonComponent, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { InitiativeView } from './Views/InitiativeTrackerView';
import { INITIATIVE_VIEW, TableFormat, TableFlag } from 'lib/Models/Constants';
import Creature from 'lib/Models/Creature';
import {RetainerSettings, DEFAULT_SETTINGS} from 'lib/Settings'
import { CreatureTypes } from './Models/CreatureTypes';
// Remember to rename these classes and interfaces!

export default class ForbiddenLandsCharacterSheet extends Plugin {
	settings: RetainerSettings;
	creatures: Creature[] = [];

	async onload() {
		await this.loadSettings();
		this.registerView(
			INITIATIVE_VIEW,
			(leaf) => new InitiativeView(leaf, this.creatures, this.settings.playerCharacters)
		  );

		  this.addRibbonIcon('scroll-text', 'DRAW STEEL! (Initiative Tracker)', () => {
			this.activateView();
		  });

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');
		
		// this.addCommands();
		// This adds a settings tab so the user can configure letious aspects of the plugin
		this.addSettingTab(new RetainerSettingTab(this.app, this));
	}

	// addCommands(){
	// 	this.addCommand({
	// 		id: "insert-initiative-table",
	// 		name: "Insert Initiative Table",
	// 		editorCallback: (editor: Editor) => { 
	// 			editor.replaceRange(TableFormat, editor.getCursor());
	// 		}
	// 	});
	// 	// this.addCommand({
	// 	// 	id: 'import-table-to-tracker',
	// 	// 	name: 'Import Table To Tracker',
	// 	// 	editorCallback: (editor: Editor) => {
	// 	// 		this.importSelectionToTracker(editor);
	// 	// 	}
	// 	// });
	// }

	importSelectionToTracker(editor: Editor){
		if(!(editor.somethingSelected())) {
			return;
		}

		let selection = editor.getSelection();
		let done = false;
		let lines: string[] = [];
		lines = selection.split('\n');
		let flagFound = false;
		let creatures = [];
		for(let i = 0; i < lines.length; i++){
			let sample = lines[i];
			if (sample.contains(TableFlag))
			{
				flagFound = true;
				continue;
			}
			if (flagFound && sample.contains("|"))
			{
				let cells = sample.split("|");
				let creature = new Creature();
				creature.Name = cells[1];
				creature.MaxStamina = +cells[2];
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
		const leaves = workspace.getLeavesOfType(INITIATIVE_VIEW);
	
		if (leaves.length > 0) {
		  // A leaf with our view already exists, use that
		  leaf = leaves[0];

		} else {
		  // Our view could not be found in the workspace, create a new leaf
		  // in the right sidebar for it
		  
		  leaf = workspace.getRightLeaf(false);
		  if (leaf != null)
			await leaf.setViewState({ type: INITIATIVE_VIEW, active: true });
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

class RetainerSettingTab extends PluginSettingTab {
	plugin: ForbiddenLandsCharacterSheet;

	constructor(app: App, plugin: ForbiddenLandsCharacterSheet) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		let div = containerEl.createDiv({cls: "rightAlign bottomSpace"});
		new ButtonComponent(div)
			.setButtonText("Add Player Character")
			.setClass("rightAlign")
			.onClick( () => {
				this.buildCharacterInput(containerEl)
			} );
		this.plugin.settings.playerCharacters.forEach((x) => this.buildCharacterInput(containerEl, x))
	}

	buildCharacterInput(containerEl: HTMLElement, character?: Creature){
		let player = character ?? new Creature();
		player.Type = CreatureTypes.Hero;
		if (character == undefined)
		{
			this.plugin.settings.playerCharacters.push(player);
		}

		let staminaInput = player.MaxStamina == undefined ? '' : player.MaxStamina.toString();
		let setting = new Setting(containerEl)
		.setName('Player Character')
		.setDesc('Set the PC\'s Name and Stamina')
		.addText(text => text
			.setPlaceholder('Name')
			.setValue(player.Name)
			.onChange(async (value) => {
				player.Name = value;
				await this.plugin.saveSettings();
			}))
		.addText(text => text
			.setPlaceholder('Stamina')
			.setValue(staminaInput)
			.onChange(async (value) => {
				if (value != null && value != "")
				{
					player.MaxStamina = +value;
				}
				await this.plugin.saveSettings();
			}))
		.addButton((button: ButtonComponent): ButtonComponent => {
			let b = button.setButtonText("Delete").onClick(async () => {
				this.plugin.settings.playerCharacters.remove(player);
				setting.controlEl.remove();
				setting.nameEl.remove();
				setting.descEl.remove();
				setting.infoEl.remove();
				setting.settingEl.remove();
				await this.plugin.saveSettings();
			});
			return b;
		});
					
	}
}
