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
    this.addRow(new Creature());

    // const container = this.containerEl.children[1];
    // container.empty();
    // container.createEl('h2', { text: 'Example view' });
    // //container.createEl('br');
    // container.createEl('h4', { text: 'Example view' });
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
    buttonComp.setButtonText("Create");
    buttonComp.onClick( () => {
      this.addRow(new Creature());
    })
    //buttonHeader.createEl('button', { text: "Create"});
  }

  addRow(creature: Creature){
    var header = this.tableEl.createEl('tr');
    header.createEl('td', {text: 'sample'});
    header.createEl('td', {text: '40'});
    header.createEl('td', {text: 'no'});
  }
}