import { createPublicKey } from 'crypto';
import Creature from 'lib/Models/Creature';
import { VIEW_TYPE_EXAMPLE, Red, Green, Yes, No, Fill } from 'lib/Models/Constants';
import { ButtonComponent, ItemView, TextAreaComponent, WorkspaceLeaf, Setting, TextComponent } from 'obsidian';

export class ExampleView extends ItemView {
  gridEl: HTMLDivElement;
  formEl: HTMLDivElement;
  tableEl: HTMLDivElement;
  nameInput: TextComponent;
  staminaInput: TextComponent;
  creatures: Creature[] = [];
  buttons: ButtonComponent[] = [];
  round: number;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return 'Initiative Tracker';
  }

  getIcon() {
    return "scroll-text";
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
    this.formEl = this.gridEl.createDiv({cls: "fullScreen"});
    this.nameInput = new TextComponent(this.formEl).setPlaceholder("Name");
    this.nameInput.inputEl.addClass("padded-input");
    this.staminaInput = new TextComponent(this.formEl).setPlaceholder("Max Stamina");
    this.staminaInput.inputEl.addClass("padded-input");
   
    var createButtonComp = new ButtonComponent(this.formEl);
    createButtonComp.setButtonText("Create");
    createButtonComp.onClick( () => this.createCreatureRow());
    this.setRound(0);
  }

  setRound(round: number){
    if (this.formEl.children.length >= 4)
    {
      this.formEl.children[3].remove();
    }
    this.round = round;
    var div = this.formEl.createDiv({text: "Round: " + this.round, cls: "rightAlign"});
    var resetRoundsButton = new ButtonComponent(div);
    resetRoundsButton.setButtonText("Reset");
    resetRoundsButton.setClass("headerButtonLeft");
    resetRoundsButton.onClick( () => {
      this.round == 0;
      this.setRound(0);
    });
  }

  createCreatureRow(){
    if (this.nameInput.getValue() == "")
    {
      return;
    }
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
    header.createEl('th', {text: 'FTA', title: "Free Triggered Action"});
    header.createEl('th', {text: 'Acted'});

    var createButtonHeader = header.createEl('th');
    var resetButtonComp = new ButtonComponent(createButtonHeader)

    resetButtonComp.setButtonText("New Round");
    resetButtonComp.setClass("headerButtonLeft");
    resetButtonComp.onClick( () => {
      this.newRound();
    });
    var resetButtonComp = new ButtonComponent(createButtonHeader)

    resetButtonComp.setButtonText("Clear");
    resetButtonComp.setClass("headerButtonRight");
    resetButtonComp.onClick( () => {
      this.removeAllRows();
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
    var buttonCell = row.createEl('td', {cls: Green});
    var buttonComp = new ButtonComponent(buttonCell);
    buttonComp.setButtonText(No);
    buttonComp.setClass(Fill);
    buttonComp.onClick( () => {
      this.changeTriggeredActionCell(row, buttonComp, buttonComp.buttonEl.getText() == No);
    });
    var actedButtonCell = row.createEl('td', {cls: Green});
    var actedButtonComp = new ButtonComponent(actedButtonCell);
    actedButtonComp.setButtonText(No);
    actedButtonComp.setClass(Fill);
    actedButtonComp.onClick( () => {
      this.changeActedCell(row, actedButtonComp, actedButtonComp.buttonEl.getText() == No);
    });
    buttonCell = row.createEl('td');
    var removeButton = new ButtonComponent(buttonCell);
    removeButton.buttonEl.addClass("padded");
    removeButton.onClick(() => {this.removeRow(row)});
    buttonCell.createEl('br');
    removeButton.setButtonText("Remove");
    var deadButton = new ButtonComponent(buttonCell);
    deadButton.buttonEl.addClass("padded");
    deadButton.setButtonText("Dead");
  }

  removeRow(row: HTMLTableRowElement) {
    row.remove();
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
      row.children[3].addClass(Red);
      row.children[3].removeClass(Green);
    }
    else
    {
      buttonComp.setButtonText(No);
      row.children[3].addClass(Green);
      row.children[3].removeClass(Red);
    }
  }

  changeTriggeredActionCell(row : HTMLTableRowElement, buttonComp : ButtonComponent, hasActed : boolean) {
    if (hasActed)
    {
      buttonComp.setButtonText(Yes);
      row.children[2].addClass(Red);
      row.children[2].removeClass(Green);
    }
    else
    {
      buttonComp.setButtonText(No);
      row.children[2].addClass(Green);
      row.children[2].removeClass(Red);
    }
  }

  newRound()
  {
    var count = this.tableEl.children.length;
    this.setRound(++this.round);
    for (var i = 1; i < count; i++)
    {
        var row =  (this.tableEl.children[i] as (HTMLTableRowElement));
        var button = (row.children[2] as HTMLTableCellElement).children[0] as HTMLButtonElement;
        var triggeredActionButton = (row.children[3] as HTMLTableCellElement).children[0] as HTMLButtonElement;
        button.textContent = No;
        triggeredActionButton.textContent = No;
        row.children[3].removeClass(Red);
        row.children[2].removeClass(Red);
        row.children[3].addClass(Green);
        row.children[2].addClass(Green);
    }

  }

  removeAllRows(){
    for(var i = 1; i < this.tableEl.children.length; i++)
    {
      this.tableEl.children[i].remove();
    }
  }
}