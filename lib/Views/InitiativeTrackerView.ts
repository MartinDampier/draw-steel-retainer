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
    this.nameInput = new TextComponent(this.formEl);
    this.staminaInput = new TextComponent(this.formEl);
    var createButtonComp = new ButtonComponent(this.formEl);
    var sampleCreature = new Creature();
    
    createButtonComp.setButtonText("Create");
    createButtonComp.onClick( () => {
      sampleCreature.Name = this.nameInput.getValue();
      this.nameInput.setValue('');
      sampleCreature.Stamina = +this.staminaInput.getValue();
      this.staminaInput.setValue('');
      this.addRow(sampleCreature);
    });
  }

  //Create a HTML Table
  createTable() {
    this.tableEl = this.gridEl.createEl('table');
    var header = this.tableEl.createEl('tr');
    header.createEl('th', {text: 'Character'});
    header.createEl('th', {text: 'Stamina'});
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
    row.createEl('td', {text: creature.Name, cls: "Centered"});
    row.createEl('td', {text: creature.Stamina.toString(), cls: "Centered"});

    var buttonCell = row.createEl('td');
    var buttonComp = new ButtonComponent(buttonCell);
    buttonComp.setButtonText(No);
    buttonComp.onClick( () => {
      this.changeActedCell(row, buttonComp, buttonComp.buttonEl.getText() == No);
    });
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