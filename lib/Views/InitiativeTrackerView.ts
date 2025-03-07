import { createPublicKey } from 'crypto';
import Creature from 'lib/Models/Creature';
import { ButtonComponent, ItemView, TextAreaComponent, WorkspaceLeaf, Setting, TextComponent } from 'obsidian';

export const VIEW_TYPE_EXAMPLE = 'example-view';
export const Yes = 'Yes';
export const No = 'No';
export const ActedClass = 'Acted';

export class ExampleView extends ItemView {
  gridEl: HTMLDivElement;
  formEl: HTMLDivElement;
  tableEl: HTMLDivElement;
  nameInput: TextComponent;
  staminaInput: TextComponent;
  creatures: Creature[] = [];
  buttons: ButtonComponent[] = [];
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

    this.createInputSection();
    this.createTable();
  }

  async onClose() {
    // Nothing to clean up.
  }

  createInputSection() {
    this.formEl = this.gridEl.createDiv();
    this.nameInput = new TextComponent(this.formEl).setPlaceholder("Name");
    this.nameInput.inputEl.addClass("padded-input");
    this.staminaInput = new TextComponent(this.formEl).setPlaceholder("Max Stamina");
    this.staminaInput.inputEl.addClass("padded-input");
    var createButtonComp = new ButtonComponent(this.formEl);
  
    createButtonComp.setButtonText("Create");
    createButtonComp.onClick( () => this.createCreatureRow());
  }
  
  createCreatureRow(){
    var creature = new Creature();
    creature.Id = (this.creatures.length + 1).toString();
    creature.Name = this.nameInput.getValue();
    this.nameInput.setValue('');
    creature.Stamina = +this.staminaInput.getValue();
    this.staminaInput.setValue('');
    this.addRow(creature);
  }

  //Create a HTML Table
  createTable() {
    this.tableEl = this.gridEl.createEl('table', {cls: "Centered"});
    var header = this.tableEl.createEl('tr');
    header.createEl('th', {text: 'Character', cls: 'name-Cell'});
    header.createEl('th', {text: 'Stamina', cls: 'stamina-Cell'});
    header.createEl('th', {text: 'Acted'});  
    
    var createButtonHeader = header.createEl('th');
    var resetButtonComp = new ButtonComponent(createButtonHeader)

    resetButtonComp.setButtonText("Reset");
    resetButtonComp.onClick( () => {
      this.ResetAllCreatures();
    });
    //buttonHeader.createEl('button', { text: "Create"});
  }

  addRow(creature: Creature){
    this.creatures.push(creature);
    var row = this.tableEl.createEl('tr', {cls: "Centered"});
    row.createEl('td', {text: creature.Name, cls: "Centered name-Cell"});
    row.id = creature.Id;
    row.createEl('td', {text: "stamina", cls: "Centered stamina-Cell"})
    this.updateStamina(row, creature.Stamina.toString())
    var buttonCell = row.createEl('td');
    var buttonComp = new ButtonComponent(buttonCell);
    buttonComp.setButtonText(No);
    buttonComp.onClick( () => {
      this.changeActedCell(row, buttonComp, buttonComp.buttonEl.getText() == No);
    });
    buttonCell = row.createEl('td');
    var removeButton = new ButtonComponent(buttonCell);
    removeButton.buttonEl.addClass("padded");
    buttonCell.createEl('br');
    removeButton.setButtonText("Remove");
    var deadButton = new ButtonComponent(buttonCell);
    deadButton.buttonEl.addClass("padded");
    deadButton.setButtonText("Dead");
  }

  updateStamina(row: HTMLTableRowElement, stamina: string){
    try{
      var staminaCell = row.children[1] as HTMLTableCellElement;
      staminaCell.empty();
      staminaCell.setText(stamina);
      staminaCell.createEl('br');
      new ButtonComponent(staminaCell).setButtonText("-5").onClick(() => {this.updateStamina(row, (+stamina - 5).toString())}).setClass('slimButton');
      new ButtonComponent(staminaCell).setButtonText("-1").onClick(() => {this.updateStamina(row, (+stamina - 1).toString())}).setClass('slimButton');
      new ButtonComponent(staminaCell).setButtonText("+1").onClick(() => {this.updateStamina(row, (+stamina + 1).toString())}).setClass('slimButton');
      new ButtonComponent(staminaCell).setButtonText("+5").onClick(() => {this.updateStamina(row, (+stamina + 5).toString())}).setClass('slimButton');
    }
    catch(e)
    {
      var result = (e as Error).message;
      console.log("ERROR:");
      console.log(result);
    } 
  }

  changeActedCell(row : HTMLTableRowElement, buttonComp : ButtonComponent, hasActed : boolean) {
    if (hasActed)
    {
      buttonComp.setButtonText(Yes);
      row.addClass(ActedClass);
    }
    else
    {
      buttonComp.setButtonText(No);
      row.removeClass(ActedClass);
    }
  }

  ResetAllCreatures()
  {
    var count = this.tableEl.children.length;
    for (var i = 1; i < count; i++)
    {
        var row =  (this.tableEl.children[i] as (HTMLTableRowElement));
        var button = (row.children[2] as HTMLTableCellElement).children[0] as HTMLButtonElement;
        button.textContent = No;
        if (row.classList.contains(ActedClass))
        {
          row.removeClass(ActedClass);
        }
    }

  }
}