import { createPublicKey } from 'crypto';
import Creature from 'lib/Models/Creature';
import { VIEW_TYPE_EXAMPLE, Red, Green, Yes, No, Fill } from 'lib/Models/Constants';
import { ButtonComponent, ItemView, TextAreaComponent, WorkspaceLeaf, Setting, TextComponent, ExtraButtonComponent } from 'obsidian';
import { isSharedArrayBuffer } from 'util/types';

export class InitiativeView extends ItemView {
  gridEl: HTMLDivElement;
  formEl: HTMLDivElement;
  roundEl: HTMLDivElement;
  heroesTableEl: HTMLDivElement;
  villainsTableEl: HTMLDivElement;
  nameInput: TextComponent;
  staminaInput: TextComponent;
  villains: Creature[] = [];
  heroes: Creature[] = [];
  creatures: Creature[] = [];
  buttons: ButtonComponent[] = [];
  round: number = 1;
  malice: number;

  constructor(leaf: WorkspaceLeaf, villains?: Creature[], heroes?: Creature[]) {
    super(leaf);
    if (villains != null && villains.length > -1)
    {
      this.villains = villains;
    }
    if (heroes != null && heroes.length > -1)
    {
      this.heroes = heroes;
    }
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
   
    var heroButtonComp = new ButtonComponent(this.formEl);
    heroButtonComp.setButtonText("Hero");
    heroButtonComp.onClick( () => this.createCreatureRow(undefined, true));
    var villainButtonComp = new ButtonComponent(this.formEl);
    villainButtonComp.setButtonText("Villain");
    villainButtonComp.setClass("villainsButton");
    villainButtonComp.onClick( () => this.createCreatureRow(undefined, false));
    this.createRoundSection();
  }
 
  createRoundSection(){
    this.roundEl= this.gridEl.createDiv( {cls: "tableStyle "});
    this.setRound(0);
    this.setMalice(0);
  }

  setMalice(malice: number, div? : HTMLDivElement){
    this.malice = malice;
    div = div ?? this.roundEl.createDiv({cls: "rightAlign maliceHeader"});
    div.setText("Malice: " + this.malice);
      var plusMalice = new ButtonComponent(div);
      plusMalice.setButtonText("+1");
      plusMalice.setClass("headerButtonLeft");
      plusMalice.onClick( () => {
        this.malice++;
        this.setMalice(this.malice, div);
      });
      var minusMalice = new ButtonComponent(div);
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
    var resetRoundsButton = new ButtonComponent(div);
    resetRoundsButton.setButtonText("New");
    resetRoundsButton.setClass("headerButtonLeft");
    resetRoundsButton.onClick( () => {
      if (div != undefined)
        this.newRound(div);
    });
    var resetRoundsButton = new ButtonComponent(div);
    resetRoundsButton.setButtonText("Reset");
    resetRoundsButton.setClass("headerButtonLeft");
    resetRoundsButton.onClick( () => {
      this.round == 0;
      this.setRound(0, div);
      this.resetActed();
    });
  }
  //Create a HTML Table
  createTable(isHero: boolean) {
    var classes = "Centered" + (isHero ? " heroes" : " villains")
    if (isHero)
    {
      this.heroesTableEl = this.gridEl.createEl('table', {cls: classes});
    }
    else
    {
      this.villainsTableEl = this.gridEl.createEl('table', {cls: classes});
    }
    var header = isHero ? this.heroesTableEl.createEl('tr') : this.villainsTableEl.createEl('tr');
    header.createEl('th', {text: 'Character', cls: 'name-Cell'});
    header.createEl('th', {text: 'Stamina', cls: 'stamina-Cell'});
    header.createEl('th', {text: 'TA', title: "Triggered Action"});
    header.createEl('th', {text: 'Acted'});
    
    var createButtonHeader = header.createEl('th');
    var resetButtonComp = new ButtonComponent(createButtonHeader)
    resetButtonComp.setButtonText("Clear");
    resetButtonComp.setClass("headerButtonRight");
    resetButtonComp.onClick( () => {
      this.removeAllRows();
    });
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
        creature.Id = (this.creatures.length + 1).toString();
        creature.Name = this.nameInput.getValue();
        this.nameInput.setValue('');
        creature.MaxStamina = this.staminaInput != undefined ? +this.staminaInput.getValue() : 0;
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
      var row =  isHero ? this.heroesTableEl.createEl('tr', {cls: "Centered"}) : this.villainsTableEl.createEl('tr', {cls: "Centered"});
      row.id = isHero ? "Hero " + this.heroes.indexOf(creature) : "Villain " + this.villains.indexOf(creature);
      var nameCell = row.createEl('td', {text: creature.Name, cls: "Centered name-Cell"});
      nameCell.createEl("br");
      var nameCellDiv = nameCell.createDiv({cls: "condition-buttons"});
      var button1 = new ExtraButtonComponent(nameCellDiv).setIcon("droplet").setTooltip("Bleeding"); //Bleeding
      button1.onClick( () => this.toggleColors(button1) )
      var button2 = new ExtraButtonComponent(nameCellDiv).setIcon("sparkles").setTooltip("Dazed"); //Dazed
      button2.onClick( () => this.toggleColors(button2) )
      var button3 = new ExtraButtonComponent(nameCellDiv).setIcon("frown").setTooltip("Frightened"); //Frightened
      button3.onClick( () => this.toggleColors(button3) )
      var button4 = new ExtraButtonComponent(nameCellDiv).setIcon("grab").setTooltip("Grabbed"); //Grabbed
      button4.onClick( () => this.toggleColors(button4) )
      var button5 = new ExtraButtonComponent(nameCellDiv).setIcon("arrow-down-to-line").setTooltip("Prone"); //Prone
      button5.onClick( () => this.toggleColors(button5) )
      var button6 = new ExtraButtonComponent(nameCellDiv).setIcon("link").setTooltip("Restrained"); //Restrained
      button6.onClick( () => this.toggleColors(button6) )
      var button7 = new ExtraButtonComponent(nameCellDiv).setIcon("snail").setTooltip("Slowed"); //Slowed
      button7.onClick( () => this.toggleColors(button7) )
      var button8 = new ExtraButtonComponent(nameCellDiv).setIcon("circle-alert").setTooltip("Taunted"); //Taunted
      button8.onClick( () => this.toggleColors(button8) )
      var button9 = new ExtraButtonComponent(nameCellDiv).setIcon("heart-crack").setTooltip("Weakened"); //Weakened
      button9.onClick( () => this.toggleColors(button9) )
      row.createEl('td', {text: "stamina", cls: "Centered stamina-Cell"})
      this.updateStamina(row, creature.CurrentStamina.toString())
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

  updateStamina(row: HTMLTableRowElement, stamina: string){
    try{
      var staminaCell = row.children[1] as HTMLTableCellElement;
      console.log("updateStamina parent Id: " + staminaCell.parentElement?.id);
      var parsedId = staminaCell.parentElement?.id.split(" ");
      var maxStamina = 0;
      if (parsedId != undefined) {
        if (parsedId[0] == "Hero"){
          maxStamina = this.heroes[+parsedId[1]].MaxStamina;
        } else
        {
          maxStamina = this.villains[+parsedId[1]].MaxStamina;
        }
      }
      staminaCell.empty();
      staminaCell.setText('('+maxStamina+') '+ stamina);
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

  newRound(div: HTMLDivElement)
  {
    this.setRound(++this.round, div);
    this.resetActed();
  }

  resetActed() {
    var count = this.heroesTableEl.children.length;
    for (var i = 1; i < count; i++)
      {
          var row =  (this.heroesTableEl.children[i] as (HTMLTableRowElement));
          var button = (row.children[2] as HTMLTableCellElement).children[0] as HTMLButtonElement;
          var triggeredActionButton = (row.children[3] as HTMLTableCellElement).children[0] as HTMLButtonElement;
          button.textContent = No;
          triggeredActionButton.textContent = No;
          row.children[3].removeClass(Red);
          row.children[2].removeClass(Red);
          row.children[3].addClass(Green);
          row.children[2].addClass(Green);
      }
    var count = this.villainsTableEl.children.length;
    for (var i = 1; i < count; i++)
      {
          var row =  (this.villainsTableEl.children[i] as (HTMLTableRowElement));
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
    for(var i = 1; i < this.heroesTableEl.children.length; i++)
    {
      this.heroesTableEl.children[i].remove();
    }
  }
}