import { createPublicKey } from 'crypto';
import Creature from 'lib/Models/Creature';
import { INITIATIVE_VIEW, Red, Green, Orange, Yes, No, Fill } from 'lib/Models/Constants';
import { ButtonComponent, ItemView, TextAreaComponent, WorkspaceLeaf, Setting, TextComponent, ExtraButtonComponent, DropdownComponent, Modal, App } from 'obsidian';
import { isSharedArrayBuffer } from 'util/types';
import { CreatureTypes } from 'lib/Models/CreatureTypes';
import { group } from 'console';
import { clearScreenDown } from 'readline';

export class InitiativeView extends ItemView {
  gridEl: HTMLDivElement;
  formEl: HTMLDivElement;
  roundEl: HTMLDivElement;
  draggedItemIndex: number;
  heroesTableDragIndex: number;
  villainsTableDragIndex: number;
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
  app: App;

  constructor(leaf: WorkspaceLeaf, app: App, villains?: Creature[], heroes?: Creature[]) {
    super(leaf);
    this.app = app;
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
    return 'Initiative tracker';
  }

  getIcon() {
    return "scroll-text";
  }

  async onOpen() {

    function createHeader(header:string, parent:HTMLElement): void {
      let headerElement = parent.createDiv({cls: "flex"});
      headerElement.createEl('h3', {text: header})
      headerElement.id = header;
    }

    this.contentEl.empty();
    this.gridEl = this.contentEl.createDiv();
    this.createInputSection();

    createHeader("Heroes", this.gridEl);
    this.createTable(true);
    
    createHeader("Villains", this.gridEl);
    this.createTable(false);
  }

  async onClose() {
    // Nothing to clean up. FOR NOW
  }

  createInputSection() {
    this.formEl = this.gridEl.createDiv({cls: "fullScreen"});

    this.nameInput = new TextComponent(this.formEl).setPlaceholder("Name");
    this.nameInput.inputEl.addClass("padded-input");
    this.nameInput.inputEl.addClass("minthirdWidth");

    this.staminaInput = new TextComponent(this.formEl).setPlaceholder("Max stamina");
    this.staminaInput.inputEl.addClass("padded-input");
    this.staminaInput.inputEl.addClass("minthirdWidth");
    
    this.minionStaminaInput = new TextComponent(this.formEl).setPlaceholder("Minion stamina");
    this.minionStaminaInput.inputEl.addClass("padded-input");
    this.minionStaminaInput.inputEl.addClass("minthirdWidth");
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
    this.minionCountInput.selectEl.title = "Minion count";
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
    let minusMalice = new ButtonComponent(div);
    minusMalice.setButtonText("-1");
    minusMalice.setClass("headerButtonLeft");
    minusMalice.onClick( () => {
      this.malice--;
      this.setMalice(this.malice, div);
    });
    let plusMalice = new ButtonComponent(div);
    plusMalice.setButtonText("+1");
    plusMalice.setClass("headerButtonLeft");
    plusMalice.onClick( () => {
      this.malice++;
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
      let groupButton = new ButtonComponent(this.gridEl.children[2] as HTMLElement);
      groupButton.setButtonText("Add Group");
      groupButton.onClick(() => {this.createGroupRow(true);});
      groupButton.setClass("adjustInitiativeHeaderButton");
      this.heroesTableEl = this.gridEl.createEl('table', {cls: classes});
    }
    else
    {
      let groupButton = new ButtonComponent(this.gridEl.children[4] as HTMLElement);
      groupButton.setButtonText("Add Group");
      groupButton.onClick(() => {this.createGroupRow(false);});
      groupButton.setClass("adjustInitiativeHeaderButton");
      this.villainsTableEl = this.gridEl.createEl('table', {cls: classes});
    }
    let header = isHero ? this.heroesTableEl.createEl('tr') : this.villainsTableEl.createEl('tr');
    header.createEl('th', {text: 'Character', cls: 'name-Cell trackerTableCellStyle'});
    header.createEl('th', {text: 'Stamina', cls: 'stamina-Cell trackerTableCellStyle'});
    header.createEl('th', {text: 'TA', title: "Triggered Action", cls: 'trackerTableCellStyle'});
    header.createEl('th', {text: 'Acted', cls: 'trackerTableCellStyle'});
    
    let createButtonHeader = header.createEl('th', { cls: 'trackerTableCellStyle'});
    let resetButtonComp = new ExtraButtonComponent(createButtonHeader)
    resetButtonComp.extraSettingsEl.setText("Clear");
    resetButtonComp.extraSettingsEl.addClass("headerButtonRight");
    resetButtonComp.extraSettingsEl.addClass("twentyPixelHeight");
    resetButtonComp.extraSettingsEl.addClass("interactiveColor");
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

  createGroupRow(isHero: boolean){
    let row =  isHero ? this.heroesTableEl.createEl('tr', {cls: "Centered rowHeight"}) : this.villainsTableEl.createEl('tr', {cls: "Centered rowHeight"});
    let creatureType = row.createDiv({text: "Group", cls: "verticalType" })
    row.createEl("td", {cls: "rowHeight"} );
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
      try{
        if (isHero)
          this.heroes.push(creature);
      else
        this.villains.push(creature);
      let row =  isHero ? this.heroesTableEl.createEl('tr', {cls: "Centered"}) : this.villainsTableEl.createEl('tr', {cls: "Centered"});

      row.draggable = true;
      row.ondragstart = (e) => this.onHeroTableRowDragStart(e, creature);
      row.ondragend = (e) => this.onHeroTableRowDragEnd(e);  
      row.ondragenter = (e) => this.onHeroTableRowDragEnter(e, this.heroes.indexOf(creature));

      row.id = isHero ? "Hero " + this.heroes.indexOf(creature) : "Villain " + this.villains.indexOf(creature);
      let nameCell = row.createEl('td', {cls: "Centered name-Cell trackerTableCellStyle"});
      let nameTable =  nameCell.createDiv({cls: "tableStyle"});

      let nameRow = nameTable.createDiv({cls: "tableRowStyle"});
      let creatureType = nameRow.createDiv({text: creature.Type?.toString(), cls: "verticalType topAlign" })
      creatureType.setAttribute('rowspan', '2'); 
      
      nameRow.createDiv({text: creature.Name, cls: "tableCell fullWidth"})
      //this.nameInput = new TextComponent(this.formEl).setPlaceholder("Name");
      let renameField = new TextComponent(nameRow);
      let renameid = "rename" +  (isHero ? "Hero " + this.heroes.indexOf(creature) : "Villain " + this.villains.indexOf(creature))
      renameField.inputEl.id = renameid;
      renameField.setValue(creature.Name);
      renameField.inputEl.hidden = true;
      renameField.inputEl.addClass("fullWidth");
      renameField.inputEl.addClass("Centered");
      renameField.inputEl.addClass("fontFifteen");
      
      let changeNameButton = new ExtraButtonComponent(nameRow).setIcon("pencil-line").setTooltip("Rename");
      changeNameButton.onClick(() => this.allowRename(nameRow, renameid));
      changeNameButton.extraSettingsEl.addClass("rightAlign");
      changeNameButton.extraSettingsEl.addClass("tableCell");
      changeNameButton.extraSettingsEl.addClass("renameButton");
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
      let buttonComp = new ExtraButtonComponent(buttonCell);
      buttonComp.extraSettingsEl.setText(No);
      buttonComp.extraSettingsEl.addClass("trackerCellButtonStyle");
      buttonComp.onClick( () => {
        this.changeTriggeredActionCell(row, buttonComp, buttonComp.extraSettingsEl.getText() == No);
      });
      let actedButtonCell = row.createEl('td', {cls: Green + " trackerTableCellStyle"});
      let actedButtonComp = new ExtraButtonComponent(actedButtonCell);
      actedButtonComp.extraSettingsEl.setText(No);
      actedButtonComp.extraSettingsEl.addClass("trackerCellButtonStyle");
      actedButtonComp.onClick( () => {
        this.changeActedCell(row, actedButtonComp, actedButtonComp.extraSettingsEl.getText() == No);
      });
      if (creature.Type == "Solo") {
        let secondActedButtonComp = new ExtraButtonComponent(actedButtonCell);
        secondActedButtonComp.extraSettingsEl.setText(No);
        secondActedButtonComp.extraSettingsEl.addClass("trackerCellButtonStyle");
        secondActedButtonComp.extraSettingsEl.addClass("trackerCellButtonHalfHeight");
        actedButtonComp.extraSettingsEl.addClass("trackerCellButtonHalfHeight");
        secondActedButtonComp.onClick( () => {
          this.actedButtonTwoClick(row, secondActedButtonComp, secondActedButtonComp.extraSettingsEl.getText() == No);
        });
        actedButtonComp.onClick( () => {
        this.actedButtonOneClick(row, actedButtonComp, actedButtonComp.extraSettingsEl.getText() == No);
      });
      } else
      {
        actedButtonComp.extraSettingsEl.addClass("trackerCellButtonStyle");
        actedButtonComp.extraSettingsEl.addClass("trackerCellButtonFullHeight");
      }
      buttonCell = row.createEl('td', {cls: 'trackerTableCellStyle'});
      let removeButton = new ExtraButtonComponent(buttonCell);
      removeButton.extraSettingsEl.addClass("trackerCellRemoveButtonStyle");
      removeButton.extraSettingsEl.addClass("interactiveColor");
      removeButton.onClick(() => {this.removeRow(row)});
      buttonCell.createEl('br');
      removeButton.extraSettingsEl.setText("Remove");
    }
    catch(e)
    {
      if (e instanceof Error) 
      {
        //debug
        //console.log(e.message);
        //console.log(e.name);
      }
    }
  }
    

  onHeroTableRowDragStart(event: DragEvent, creature: Creature) {
    this.draggedItemIndex = this.heroes.indexOf(creature);
    //console.log(this.heroes.indexOf(creature));
    if (event.dataTransfer != null){
      event.dataTransfer.dropEffect = "move";
      event.dataTransfer.effectAllowed = "all";
    }
  }
  
  onHeroTableRowDragEnter(event: DragEvent, index: number){
    if (event.dataTransfer != null){
      this.heroesTableDragIndex = index
      //console.log(this.heroesTableDragIndex);
    }
  }

  onHeroTableRowDragEnd(event: DragEvent) {
    //console.log("END");
    
  }

  onHeroTableRowDrop(event: DragEvent, creature: Creature){
    //console.log("Dropping");
    //console.log(creature.Name);
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
      new ButtonComponent(staminaCell).setButtonText("-5").onClick(() => {this.updateStamina(row, (+stamina - 5).toString(), isMinion)}).setClass('slimButton');
      new ButtonComponent(staminaCell).setButtonText("-1").onClick(() => {this.updateStamina(row, (+stamina - 1).toString(), isMinion)}).setClass('slimButton');
      new ButtonComponent(staminaCell).setButtonText("+1").onClick(() => {this.updateStamina(row, (+stamina + 1).toString(), isMinion)}).setClass('slimButton');
      new ButtonComponent(staminaCell).setButtonText("+5").onClick(() => {this.updateStamina(row, (+stamina + 5).toString(), isMinion)}).setClass('slimButton');
    }
    catch(e)
    {
      let result = (e as Error).message;
      //console.log("ERROR:");
      //console.log(result);
    }
  }

  changeActedCell(row : HTMLTableRowElement, buttonComp : ExtraButtonComponent, hasActed : boolean) {
    if (hasActed)
    {
      buttonComp.extraSettingsEl.setText(Yes);
      row.children[3].addClass(Red);
      row.children[3].removeClass(Green);
    }
    else
    {
      buttonComp.extraSettingsEl.setText(No);
      row.children[3].addClass(Green);
      row.children[3].removeClass(Red);
    }
  }

  actedButtonOneClick(row : HTMLTableRowElement, buttonComp : ExtraButtonComponent, hasActed : boolean) {
    this.soloActedButtonClickInner(row, buttonComp, hasActed, 1);
  }
  actedButtonTwoClick(row : HTMLTableRowElement, buttonComp : ExtraButtonComponent, hasActed : boolean) {
    this.soloActedButtonClickInner(row, buttonComp, hasActed, 0);
  }
  soloActedButtonClickInner(row : HTMLTableRowElement, buttonComp : ExtraButtonComponent, hasActed : boolean, child: number){
    let otherHasActed = row.children[3].children[child].textContent == "Yes";
    
    if (hasActed)
    {
      buttonComp.extraSettingsEl.setText(Yes);
      if (otherHasActed)
      {
        row.children[3].addClass(Red);
        row.children[3].removeClass(Orange);
      }
      else
      {
        row.children[3].addClass(Orange);
      }
      row.children[3].removeClass(Green);
    }
    else
    {
      buttonComp.extraSettingsEl.setText(No);
      if (otherHasActed)
      {
        row.children[3].addClass(Orange);
      }
      else
      {
        row.children[3].addClass(Green);
        row.children[3].removeClass(Orange);
      }
      row.children[3].removeClass(Red);
    }
  }

  changeTriggeredActionCell(row : HTMLTableRowElement, buttonComp : ExtraButtonComponent, hasActed : boolean) {
    if (hasActed)
    {
      buttonComp.extraSettingsEl.setText(Yes);
      row.children[2].addClass(Red);
      row.children[2].removeClass(Green);
    }
    else
    {
      buttonComp.extraSettingsEl.setText(No);
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

  openCreateGroupModal() {
    let modal = new Modal(this.app);
    modal.open();
  }

  allowRename( row: HTMLDivElement, id: string){
    let nameField = row.children[1] as HTMLDivElement;
    let renameField = row.children[2] as HTMLInputElement;
    if (!renameField.hidden)
    {
      nameField.setText(renameField.value); 
    }
    renameField.hidden = !renameField.hidden;
    if(nameField.classList.contains("hideStyle")) {
      nameField.removeClass("hideStyle");
      nameField.addClass("fullWidth");
      nameField.addClass("tableCell");
    }
    else {
      nameField.addClass("hideStyle");
      nameField.removeClass("fullWidth");
      nameField.removeClass("tableCell");
    }
    if (!renameField.hidden)
      document.getElementById(id)?.focus();
  }
}