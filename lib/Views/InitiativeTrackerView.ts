import { createPublicKey } from 'crypto';
import Creature from 'lib/Models/Creature';
import { INITIATIVE_VIEW, Red, Green, Yes, No, Fill } from 'lib/Models/Constants';
import { ButtonComponent, ItemView, TextAreaComponent, WorkspaceLeaf, Setting, TextComponent, ExtraButtonComponent, DropdownComponent } from 'obsidian';
import { isSharedArrayBuffer } from 'util/types';
import { CreatureTypes } from 'lib/Models/CreatureTypes';

export class InitiativeView extends ItemView {
  gridEl: HTMLDivElement;
  formEl: HTMLDivElement;
  roundEl: HTMLDivElement;
  heroesTableEl: HTMLDivElement;
  villainsTableEl: HTMLDivElement;
  nameInput: TextComponent;
  staminaInput: TextComponent;
  minionStaminaInput: TextComponent;
  minionCountInput: DropdownComponent;
  typeInput: DropdownComponent;
  villains: Creature[] = [];
  heroes: Creature[] = [];
  buttons: ButtonComponent[] = [];
  round: number = 1;
  malice: number;

  constructor(leaf: WorkspaceLeaf, villains?: Creature[], heroes?: Creature[]) {
    super(leaf);
    if (villains != null && villains.length > -1)
    {
       villains.forEach((creature) => this.villains.push(creature));
    }
    if (heroes != null && heroes.length > -1)
    {
      heroes.forEach((creature) => this.heroes.push(creature));
    }
  }

  getViewType() {
    return INITIATIVE_VIEW;
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
    this.gridEl.createEl('h3', {text: "Heroes"})
    this.createTable(true);
    this.gridEl.createEl('h3', {text: "Villains"})
    this.createTable(false);
  }

  async onClose() {
    // Nothing to clean up. FOR NOW
  }

  createInputSection() {
    this.formEl = this.gridEl.createDiv({cls: "fullScreen"});

    this.nameInput = new TextComponent(this.formEl).setPlaceholder("Name");
    this.nameInput.inputEl.addClass("padded-input");

    this.staminaInput = new TextComponent(this.formEl).setPlaceholder("Max Stamina");
    this.staminaInput.inputEl.addClass("padded-input");
    
    this.minionStaminaInput = new TextComponent(this.formEl).setPlaceholder("Minion Stamina");
    this.minionStaminaInput.inputEl.addClass("padded-input");
    this.minionStaminaInput.inputEl.hidden = true;

    this.minionCountInput = new DropdownComponent(this.formEl)
      .addOption("1", "1")
      .addOption("2", "2")
      .addOption("3", "3")
      .addOption("4", "4")
      .addOption("5", "5")
      .addOption("6", "6")
      .addOption("7", "7")
      .addOption("8", "8");
    this.minionCountInput.selectEl.title = "Minion Count";
    this.minionCountInput.selectEl.addClass("padded-input");
    this.minionCountInput.selectEl.hidden = true;

    this.typeInput = new DropdownComponent(this.formEl)
      .addOption(CreatureTypes.Hero.toString(), CreatureTypes.Hero.toString())
      .addOption(CreatureTypes.Minion.toString(), CreatureTypes.Minion.toString())
      .addOption(CreatureTypes.Platoon.toString(), CreatureTypes.Platoon.toString())
      .addOption(CreatureTypes.Band.toString(), CreatureTypes.Band.toString())
      .addOption(CreatureTypes.Troop.toString(), CreatureTypes.Troop.toString())
      .addOption(CreatureTypes.Leader.toString(), CreatureTypes.Leader.toString())
      .addOption(CreatureTypes.Solo.toString(), CreatureTypes.Solo.toString())
      .onChange((value: string) => {
        if (value == CreatureTypes.Minion.toString()) {
          this.minionStaminaInput.inputEl.hidden = false;
          this.minionCountInput.selectEl.hidden = false;
          this.staminaInput.inputEl.hidden = true;
        }
        else {
          this.minionStaminaInput.inputEl.hidden = true;
          this.minionCountInput.selectEl.hidden = true;
          this.staminaInput.inputEl.hidden = false;
        }
      });
    this.typeInput.selectEl.addClass("padded-input");
    let heroButtonComp = new ButtonComponent(this.formEl);
    heroButtonComp.setButtonText("Hero");
    heroButtonComp.setClass("padded-input");
    heroButtonComp.onClick( () => this.createCreatureRow(undefined, true));
    let villainButtonComp = new ButtonComponent(this.formEl);
    villainButtonComp.setButtonText("Villain");
    villainButtonComp.setClass("padded-input");
    villainButtonComp.onClick( () => this.createCreatureRow(undefined, false));
    this.createRoundSection();
  }
 
  createRoundSection(){
    this.roundEl= this.gridEl.createDiv( {cls: "tableStyle "});
    this.setRound(1);
    this.setMalice(0);
  }

  setMalice(malice: number, div? : HTMLDivElement){
    this.malice = malice;
    div = div ?? this.roundEl.createDiv({cls: "rightAlign maliceHeader"});
    div.setText("Malice: " + this.malice);
      let plusMalice = new ButtonComponent(div);
      plusMalice.setButtonText("+1");
      plusMalice.setClass("headerButtonLeft");
      plusMalice.onClick( () => {
        this.malice++;
        this.setMalice(this.malice, div);
      });
      let minusMalice = new ButtonComponent(div);
      minusMalice.setButtonText("-1");
      minusMalice.setClass("headerButtonLeft");
      minusMalice.onClick( () => {
        this.malice--;
        this.setMalice(this.malice, div);
      });
  }

  setRound(round: number, div? : HTMLDivElement){
    this.round = round;
    div = div ?? this.roundEl.createDiv({ cls: "leftAlign roundHeader"});
    div.setText("Round: " + this.round);
    let newRoundButton = new ButtonComponent(div);
    newRoundButton.setButtonText("New");
    newRoundButton.setClass("headerButtonLeft");
    newRoundButton.onClick( () => {
      if (div != undefined)
        this.newRound(div);
    });
    let resetRoundsButton = new ButtonComponent(div);
    resetRoundsButton.setButtonText("Reset");
    resetRoundsButton.setClass("headerButtonLeft");
    resetRoundsButton.onClick( () => {
      this.round == 1;
      this.setRound(1, div);
      this.resetActed();
    });
  }
  //Create a HTML Table
  createTable(isHero: boolean) {
    let classes = "Centered" + (isHero ? " heroes" : " villains") + ' trackerTableStyle'; 
    if (isHero)
    {
      this.heroesTableEl = this.gridEl.createEl('table', {cls: classes});
    }
    else
    {
      this.villainsTableEl = this.gridEl.createEl('table', {cls: classes});
    }
    let header = isHero ? this.heroesTableEl.createEl('tr') : this.villainsTableEl.createEl('tr');
    header.createEl('th', {text: 'Character', cls: 'name-Cell trackerTableCellStyle'});
    header.createEl('th', {text: 'Stamina', cls: 'stamina-Cell trackerTableCellStyle'});
    header.createEl('th', {text: 'TA', title: "Triggered Action", cls: 'trackerTableCellStyle'});
    header.createEl('th', {text: 'Acted', cls: 'trackerTableCellStyle'});
    
    let createButtonHeader = header.createEl('th', { cls: 'trackerTableCellStyle'});
    let resetButtonComp = new ButtonComponent(createButtonHeader)
    resetButtonComp.setButtonText("Clear");
    resetButtonComp.setClass("headerButtonRight");
    if (isHero) {
      resetButtonComp.onClick( () => {
        this.clearHeroesTable();
      });
    }
    else {
      resetButtonComp.onClick( () => {
        this.clearVillainsTable();
      });
    }
    if (isHero && this.heroes.length > -1)
      {
        this.heroes.forEach((creature) => this.createCreatureRow(creature, isHero));
      }
      else if (!isHero && this.villains.length > -1){
        this.villains.forEach((creature) => this.createCreatureRow(creature, isHero));
      }
      //buttonHeader.createEl('button', { text: "Create"});
    }

    createCreatureRow(creature: Creature = new Creature, isHero: boolean){
      if (creature.Name == "")
      {
        if (this.nameInput.getValue() == "")
        {
          return;
        }
        creature.Id = isHero ? (this.heroes.length + 1).toString() : (this.villains.length + 1).toString();
        creature.Name = this.nameInput.getValue();
        this.nameInput.setValue('');
        creature.Type = this.typeInput.getValue() as CreatureTypes;
        if (creature.Type == CreatureTypes.Minion)
        {
          creature.MinionStamina = +(this.minionStaminaInput.getValue());
          this.minionStaminaInput.setValue("")
          creature.MinionCount = +(this.minionCountInput.getValue());
          this.minionCountInput.setValue("1");
          creature.MaxStamina = creature.MinionStamina * creature.MinionCount;
        } else {
          creature.MaxStamina = this.staminaInput.getValue != undefined ? +this.staminaInput.getValue() : 0;
        }
        creature.IsHero = isHero;
        this.staminaInput.setValue('');
      }
      creature.CurrentStamina = creature.MaxStamina;
      this.addRow(creature, isHero);
    }
    
    addRow(creature: Creature, isHero: boolean){
      try{
        if (isHero)
          this.heroes.push(creature);
      else
        this.villains.push(creature);
      let row =  isHero ? this.heroesTableEl.createEl('tr', {cls: "Centered"}) : this.villainsTableEl.createEl('tr', {cls: "Centered"});
      row.id = isHero ? "Hero " + this.heroes.indexOf(creature) : "Villain " + this.villains.indexOf(creature);
      let nameCell = row.createEl('td', {text: creature.Name, cls: "Centered name-Cell trackerTableCellStyle"});
      nameCell.createDiv({text: creature.Type?.toString(), cls: "verticalType topAlign"})
      nameCell.createEl("br");
      let nameCellDiv = nameCell.createDiv({cls: "condition-buttons"});
      let button1 = new ExtraButtonComponent(nameCellDiv).setIcon("droplet").setTooltip("Bleeding"); //Bleeding
      button1.onClick( () => this.toggleColors(button1) )
      let button2 = new ExtraButtonComponent(nameCellDiv).setIcon("sparkles").setTooltip("Dazed"); //Dazed
      button2.onClick( () => this.toggleColors(button2) )
      let button3 = new ExtraButtonComponent(nameCellDiv).setIcon("frown").setTooltip("Frightened"); //Frightened
      button3.onClick( () => this.toggleColors(button3) )
      let button4 = new ExtraButtonComponent(nameCellDiv).setIcon("grab").setTooltip("Grabbed"); //Grabbed
      button4.onClick( () => this.toggleColors(button4) )
      let button5 = new ExtraButtonComponent(nameCellDiv).setIcon("arrow-down-to-line").setTooltip("Prone"); //Prone
      button5.onClick( () => this.toggleColors(button5) )
      let button6 = new ExtraButtonComponent(nameCellDiv).setIcon("link").setTooltip("Restrained"); //Restrained
      button6.onClick( () => this.toggleColors(button6) )
      let button7 = new ExtraButtonComponent(nameCellDiv).setIcon("snail").setTooltip("Slowed"); //Slowed
      button7.onClick( () => this.toggleColors(button7) )
      let button8 = new ExtraButtonComponent(nameCellDiv).setIcon("circle-alert").setTooltip("Taunted"); //Taunted
      button8.onClick( () => this.toggleColors(button8) )
      let button9 = new ExtraButtonComponent(nameCellDiv).setIcon("heart-crack").setTooltip("Weakened"); //Weakened
      button9.onClick( () => this.toggleColors(button9) )
      row.createEl('td', {text: "stamina", cls: "Centered stamina-Cell trackerTableCellStyle"})
      this.updateStamina(row, creature.CurrentStamina.toString(), creature.Type == CreatureTypes.Minion)
      let buttonCell = row.createEl('td', {cls: Green + " trackerTableCellStyle"});
      let buttonComp = new ButtonComponent(buttonCell);
      buttonComp.setButtonText(No);
      buttonComp.setClass(Fill);
      buttonComp.onClick( () => {
        this.changeTriggeredActionCell(row, buttonComp, buttonComp.buttonEl.getText() == No);
      });
      let actedButtonCell = row.createEl('td', {cls: Green + " trackerTableCellStyle"});
      let actedButtonComp = new ButtonComponent(actedButtonCell);
      actedButtonComp.setButtonText(No);
      actedButtonComp.setClass(Fill);
      actedButtonComp.onClick( () => {
        this.changeActedCell(row, actedButtonComp, actedButtonComp.buttonEl.getText() == No);
      });
      buttonCell = row.createEl('td', {cls: 'trackerTableCellStyle'});
      let removeButton = new ButtonComponent(buttonCell);
      removeButton.buttonEl.addClass("padded");
      removeButton.onClick(() => {this.removeRow(row)});
      buttonCell.createEl('br');
      removeButton.setButtonText("Remove");
    }
    catch(e)
    {
      if (e instanceof Error) 
      {
        console.log(e.message);
        console.log(e.name);
      }
    }
  }

  toggleColors(ebc: ExtraButtonComponent) {
    if (ebc.extraSettingsEl.classList.contains("activatedButton")) {
      ebc.extraSettingsEl.removeClass("activatedButton");
    } else {
      ebc.extraSettingsEl.addClass("activatedButton");
    }
  }

  removeRow(row: HTMLTableRowElement) {
    row.remove();
  }

  updateStamina(row: HTMLTableRowElement, stamina: string, isMinion: boolean){
    try{
      let staminaCell = row.children[1] as HTMLTableCellElement;
      let parsedId = staminaCell.parentElement?.id.split(" ");
      let maxStamina = 0;
      let minionStamina;
      if (parsedId != undefined) {
        if (parsedId[0] == "Hero"){
          maxStamina = this.heroes[+parsedId[1]].MaxStamina;
          minionStamina = this.heroes[+parsedId[1]].MinionStamina;
        } else {
          maxStamina = this.villains[+parsedId[1]].MaxStamina;
          minionStamina = this.villains[+parsedId[1]].MinionStamina;
        }
      }
      staminaCell.empty();
      let staminaDiv = staminaCell.createDiv({ cls: "tableStyle"})
      staminaDiv.createDiv({ text: "Max: " + maxStamina, cls: "tableCell"})
      if (isMinion)
        staminaDiv.createDiv({ text: "[" + minionStamina + "]", cls: "tableCell", title: "Per Minion"})
      staminaDiv.createDiv({ text: "Current: " + stamina, cls: "tableCell"})
      staminaCell.createEl('br');
      new ButtonComponent(staminaCell).setButtonText("+5").onClick(() => {this.updateStamina(row, (+stamina + 5).toString(), isMinion)}).setClass('slimButton');
      new ButtonComponent(staminaCell).setButtonText("+1").onClick(() => {this.updateStamina(row, (+stamina + 1).toString(), isMinion)}).setClass('slimButton');
      new ButtonComponent(staminaCell).setButtonText("-1").onClick(() => {this.updateStamina(row, (+stamina - 1).toString(), isMinion)}).setClass('slimButton');
      new ButtonComponent(staminaCell).setButtonText("-5").onClick(() => {this.updateStamina(row, (+stamina - 5).toString(), isMinion)}).setClass('slimButton');
    }
    catch(e)
    {
      let result = (e as Error).message;
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

  newRound(div: HTMLDivElement)
  {
    this.setRound(++this.round, div);
    this.resetActed();
  }

  resetActed() {
    for (let i = 1; i < this.heroesTableEl.children.length; i++)
      {
          let row =  (this.heroesTableEl.children[i] as (HTMLTableRowElement));
          let button = (row.children[2] as HTMLTableCellElement).children[0] as HTMLButtonElement;
          let triggeredActionButton = (row.children[3] as HTMLTableCellElement).children[0] as HTMLButtonElement;
          button.textContent = No;
          triggeredActionButton.textContent = No;
          row.children[3].removeClass(Red);
          row.children[2].removeClass(Red);
          row.children[3].addClass(Green);
          row.children[2].addClass(Green);
      }
    for (let i = 1; i < this.villainsTableEl.children.length; i++)
      {
          let row =  (this.villainsTableEl.children[i] as (HTMLTableRowElement));
          let button = (row.children[2] as HTMLTableCellElement).children[0] as HTMLButtonElement;
          let triggeredActionButton = (row.children[3] as HTMLTableCellElement).children[0] as HTMLButtonElement;
          button.textContent = No;
          triggeredActionButton.textContent = No;
          row.children[3].removeClass(Red);
          row.children[2].removeClass(Red);
          row.children[3].addClass(Green);
          row.children[2].addClass(Green);
      }
  }

  clearHeroesTable(){
    for(let i = 1; i < this.heroesTableEl.children.length; i++)
    {
      this.heroesTableEl.children[i].remove();
    }
  }
  clearVillainsTable(){
    for(let i = 1; i < this.villainsTableEl.children.length; i++)
    {
      this.villainsTableEl.children[i].remove();
    }
  }
}