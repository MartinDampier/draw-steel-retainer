import Creature from 'lib/Models/Creature';
import { ButtonComponent, ItemView, WorkspaceLeaf } from 'obsidian';

export const VIEW_TYPE_EXAMPLE = 'example-view';

export class ExampleView extends ItemView {
  gridEl: HTMLDivElement;
  formEl: HTMLDivElement;
  tableEl: HTMLDivElement;
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return 'Example view';
  }

  async onOpen() {
    this.contentEl.empty();

    this.gridEl = this.contentEl.createDiv();
    this.formEl = this.contentEl.createDiv();
    this.tableEl = this.contentEl.createDiv();

    this.createTable();
  }

  async onClose() {
    // Nothing to clean up.
  }

  //Create a HTML Table
  createTable() {
    this.tableEl = this.gridEl.createEl('table');
    var header = this.tableEl.createEl('tr');
    header.createEl('th', {text: 'Character'});
    header.createEl('th', {text: 'Stamina'});
    header.createEl('th', {text: 'Acted'});
    
    var buttonHeader = header.createEl('th');
    var buttonComp = new ButtonComponent(buttonHeader);

    var sampleCreature = new Creature();
    sampleCreature.Name = "Creature Sample";
    sampleCreature.Stamina = 90;
    
    buttonComp.setButtonText("Create");
    buttonComp.onClick( () => {
      this.addRow(sampleCreature);
    })
    //buttonHeader.createEl('button', { text: "Create"});
  }

  addRow(creature: Creature){
    var row = this.tableEl.createEl('tr', {cls: "Centered"});
    row.createEl('td', {text: creature.Name, cls: "Centered"});
    row.createEl('td', {text: creature.Stamina.toString(), cls: "Centered"});

    var buttonCell = row.createEl('td');
    var buttonComp = new ButtonComponent(buttonCell);
    buttonComp.setButtonText("No");
    buttonComp.onClick( () => {
      creature.HasActed = !creature.HasActed;
      this.changeActedCell(row, buttonComp, creature.HasActed);
    });
  }

  changeActedCell(row : HTMLTableRowElement, buttonComp : ButtonComponent, hasActed : boolean) {
    if (hasActed)
    {
      buttonComp.setButtonText("Yes");
      row.addClass("Acted");
    }
    else
    {
      buttonComp.setButtonText("No");
      row.removeClass("Acted");
    }
  }
}