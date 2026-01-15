import { Certificate, createPublicKey } from 'crypto';
import Creature from 'lib/Models/Creature';
import * as cssConstants from 'lib/Models/Constants';
import { ButtonComponent, ItemView, WorkspaceLeaf, TextComponent, ExtraButtonComponent, DropdownComponent, Modal, App } from 'obsidian';
import { CreatureTypes } from 'lib/Models/CreatureTypes';
import * as Behaviors from 'lib/Behaviors/TextInputBehaviors';

export class InitiativeView extends ItemView {
  app: App;
  gridEl: HTMLDivElement;
  formEl: HTMLDivElement;
  roundEl: HTMLDivElement;
  maliceEl: HTMLDivElement;
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
    return cssConstants.INITIATIVE_VIEW;
  }

  getDisplayText() {
    return 'Initiative tracker';
  }

  getIcon() {
    return "scroll-text";
  }

  async onOpen() {
    this.contentEl.empty();
    this.gridEl = this.contentEl.createDiv();
    this.createInputSection();
    this.createTable(true);
    this.createTable(false);
  }

  async onClose() {
    // Nothing to clean up. FOR NOW
  }
/***
 * Creates the input section seen at the top of the Initiative Tracker.
 */
  createInputSection() {
    this.formEl = this.gridEl.createDiv({cls: "fullScreen"});

    this.createTextInput(this.nameInput = new TextComponent(this.formEl), "Name", false);
    this.createTextInput(this.staminaInput = new TextComponent(this.formEl), "Max stamina", false);
    this.createTextInput(this.minionStaminaInput = new TextComponent(this.formEl), "Minion stamina", true);

    let minionCount: Record<string, string> = {"1" : "1",  "2" : "2", "3" : "3", "4" : "4", "5" : "5", "6" : "6", "7" : "7", "8" : "8"};
    this.minionCountInput = new DropdownComponent(this.formEl)
      .addOptions(minionCount);

    this.minionCountInput.selectEl.title = "Minion count";
    this.minionCountInput.selectEl.addClass("padded-input");
    this.minionCountInput.selectEl.hidden = true;

    this.typeInput = new DropdownComponent(this.formEl)
      .addOption(CreatureTypes.Hero.toString(), CreatureTypes.Hero.toString())
      .addOption(CreatureTypes.Minion.toString(), CreatureTypes.Minion.toString())
      .addOption(CreatureTypes.Horde.toString(), CreatureTypes.Horde.toString())
      .addOption(CreatureTypes.Platoon.toString(), CreatureTypes.Platoon.toString())
      .addOption(CreatureTypes.Elite.toString(), CreatureTypes.Elite.toString())
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

    this.setInputButtonComponent(new ButtonComponent(this.formEl), "Hero",() => this.createCreatureRow(undefined, true) );
    this.setInputButtonComponent(new ButtonComponent(this.formEl), "Villain",() => this.createCreatureRow(undefined, false) );
    this.createRoundSection();
  }

  setInputButtonComponent(component: ButtonComponent, text: string, callback: (evt: MouseEvent) => any){
    component.setButtonText(text);
    component.setClass("padded-input");
    component.onClick(callback);
  }

   createTextInput( component: TextComponent, placeHolder: string, isHidden: boolean){
    component.setPlaceholder(placeHolder);
    component.inputEl.addClasses(["padded-input", "minthirdWidth"]);
    component.inputEl.hidden = isHidden;
  }
 
  createRoundSection(){
    this.roundEl= this.gridEl.createDiv( {cls: "tableStyle "});
    this.setRound(1);
    this.setMalice(1 + this.heroes.length);
  }

  setMalice(malice: number, div? : HTMLDivElement){
    this.malice = malice;
    this.maliceEl = this.maliceEl ?? this.roundEl.createDiv({cls: "rightAlign maliceHeader"});
    this.maliceEl.setText("Malice: " + this.malice);
    let minusMalice = new ButtonComponent(this.maliceEl);
    minusMalice.setButtonText("-1");
    minusMalice.setClass("headerButtonLeft");
    minusMalice.onClick( () => {
      this.malice--;
      this.setMalice(this.malice, this.maliceEl);
    });
    let plusMalice = new ButtonComponent(this.maliceEl);
    plusMalice.setButtonText("+1");
    plusMalice.setClass("headerButtonLeft");
    plusMalice.onClick( () => {
      this.malice++;
      this.setMalice(this.malice, this.maliceEl);
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
    let classes = cssConstants.centered + (isHero ? " heroes" : " villains") + ' trackerTableStyle fiveTopAndBottomMargin'; 
    if (isHero)
    {
      this.heroesTableEl = this.gridEl.createEl('table', {cls: classes});
    }
    else
    {
      this.villainsTableEl = this.gridEl.createEl('table', {cls: classes});
    }
    let header = isHero ? this.heroesTableEl.createEl('tr', {cls: 'tableHeaderHeight'}) : this.villainsTableEl.createEl('tr', {cls: 'tableHeaderHeight'});
    let titleCell = header.createEl('th', { cls: `${cssConstants.eightyPercentWidth} leftAlign`});
    isHero ? titleCell.createEl("h4", {text: "Heroes", cls: "noPaddingNoMargin"}) : titleCell.createEl("h4", {text: "Villains", cls: "noPaddingNoMargin"});
    let createButtonHeader = header.createEl('th', {cls: `${cssConstants.twentyPercentWidth} ${cssConstants.flex}`});
    let createGroupButton = new ExtraButtonComponent(createButtonHeader)
    createGroupButton.onClick(() => this.createGroupRow(isHero ? this.heroesTableEl : this.villainsTableEl));
    createGroupButton.extraSettingsEl.setText("Group");
    createGroupButton.extraSettingsEl.addClasses(["headerButtonRight", "fullFill", "interactiveColor"]);
    let resetButtonComp = new ExtraButtonComponent(createButtonHeader)
    resetButtonComp.extraSettingsEl.setText("Clear");
    resetButtonComp.extraSettingsEl.addClasses(["headerButtonRight", "fullFill", "interactiveColor"]);
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
  }

  createGroupRow(table: HTMLDivElement){
    let groupRow = table.createEl('tr').createDiv();
    groupRow.ondragover = (e) =>{
      e.preventDefault();
    };
    groupRow.ondrop = this.groupRowDrop;
    let groupTable = groupRow.createEl('table');
    groupTable.addClasses([cssConstants.group, cssConstants.trackerRowTableStyle, cssConstants.centered, cssConstants.leftAlign, cssConstants.fullScreen]);
    let groupHeader = groupTable.createEl('tr', {cls: `${cssConstants.groupHeader}`});
    groupHeader.createEl('th', {text: 'Group', cls: `${cssConstants.paddingLeft5} ninetyPercentWidth`});
    var actButton = new ExtraButtonComponent(groupHeader.createEl('th'));
    actButton.extraSettingsEl.setText('ACT');
    actButton.extraSettingsEl.addClasses(['.tenPercentWidth', 'headerButtonRight', cssConstants.height25])
    groupTable.createEl('tr')

  }

  groupRowDrop(e: DragEvent){
      e.preventDefault();
      let data = e.dataTransfer?.getData("text");
      JSON.parse()
  };

  createCreatureObject(isHero: boolean){
    let creature = new Creature();
    creature.Id = isHero ? (this.heroes.length + 1).toString() : (this.villains.length + 1).toString();
    creature.Name = this.nameInput.getValue();
    creature.Type = this.typeInput.getValue() as CreatureTypes;
    if (creature.Type == CreatureTypes.Minion)
    {
      creature.MinionStamina = +(this.minionStaminaInput.getValue());
      creature.MinionCount = +(this.minionCountInput.getValue());
      creature.MaxStamina = creature.MinionStamina * creature.MinionCount;
    } else {
      creature.MaxStamina = this.staminaInput.getValue != undefined ? + this.staminaInput.getValue() : 0;
    }
    creature.CurrentStamina = creature.MaxStamina;
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
      if (isHero && !this.heroes.contains(creature)){
        this.heroes.push(creature);
      }
      if (!isHero && !this.villains.contains(creature)){
        this.villains.push(creature);
      }
      let row =  isHero ? this.heroesTableEl.createEl('tr', {cls: cssConstants.centered}) : this.villainsTableEl.createEl('tr', {cls: cssConstants.centered});

      row.draggable = true;
      row.ondragstart = (e) => this.onHeroTableRowDragStart(e, creature);
      row.ondragend = (e) => this.onHeroTableRowDragEnd(e);  
      row.ondragenter = (e) => this.onHeroTableRowDragEnter(e, this.heroes.indexOf(creature));

      row.id = isHero ? "Hero " + this.heroes.indexOf(creature) : "Villain " + this.villains.indexOf(creature);
      
      let tableCell = row.createEl("td", { attr: {"colspan": 2}}) 
      let tempTable = tableCell.createEl('table', {cls: 'fullScreen trackerRowTableStyle'})
      let tempHeader = tempTable.createEl('tr');
      tempHeader.createEl('th' , {text: 'Name', cls: 'trackerTableCellStyle tenRadiusTopLeft'});
      tempHeader.createEl('th' , {text: 'Stamina', cls: 'trackerTableCellStyle'});
      tempHeader.createEl('th' , {text: 'FTA', cls: 'trackerTableCellStyle'});
      tempHeader.createEl('th' , {text: 'Acted', cls: 'trackerTableCellStyle'});
      tempHeader.createEl('th' , {text: '', cls: 'trackerTableCellStyle tenRadiusTopRight'});

      let tempRow = tempTable.createEl('tr');
      tempRow.id = row.id;
      let nameCell = tempRow.createEl('td', {cls: "Centered name-Cell trackerTableNameCellStyle"});
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
      renameField.inputEl.addClass(cssConstants.centered);
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

      tempRow.createEl('td', {text: "stamina", cls: "Centered stamina-Cell trackerTableCellStyle"})
      this.updateStamina(tempRow, creature.CurrentStamina.toString(), creature.Type == CreatureTypes.Minion)
      let buttonCell = tempRow.createEl('td', {cls: cssConstants.green + " trackerTableCellWithMaxWidthStyle max50Width"});
      let buttonComp = new ExtraButtonComponent(buttonCell);
      buttonComp.extraSettingsEl.setText(cssConstants.no);
      buttonComp.extraSettingsEl.addClass("trackerCellButtonStyle");
      buttonComp.extraSettingsEl.addClass("trackerCellButtonFullHeight");
      buttonComp.onClick( () => {
        this.changeTriggeredActionCell(tempRow, buttonComp, buttonComp.extraSettingsEl.getText() == cssConstants.no);
      });
      let actedButtonCell = tempRow.createEl('td', {cls: cssConstants.green + " trackerTableCellWithMaxWidthStyle max50Width"});
      let actedButtonComp = new ExtraButtonComponent(actedButtonCell);
      actedButtonComp.extraSettingsEl.setText(cssConstants.no);
      actedButtonComp.extraSettingsEl.addClass("trackerCellButtonStyle");
      actedButtonComp.onClick( () => {
        this.changeActedCell(tempRow, actedButtonComp, actedButtonComp.extraSettingsEl.getText() == cssConstants.no);
      });
      if (creature.Type == "Solo") {
        let secondActedButtonComp = new ExtraButtonComponent(actedButtonCell);
        secondActedButtonComp.extraSettingsEl.setText(cssConstants.no);
        secondActedButtonComp.extraSettingsEl.addClass("trackerTableCellWithMaxWidthStyle");
        secondActedButtonComp.extraSettingsEl.addClass("trackerCellButtonHalfHeight");
        actedButtonComp.extraSettingsEl.addClass("trackerCellButtonHalfHeight");
        secondActedButtonComp.onClick( () => {
          this.actedButtonTwoClick(tempRow, secondActedButtonComp, secondActedButtonComp.extraSettingsEl.getText() == cssConstants.no);
        });
        actedButtonComp.onClick( () => {
        this.actedButtonOneClick(tempRow, actedButtonComp, actedButtonComp.extraSettingsEl.getText() == cssConstants.no);
      });
      } else
      {
        actedButtonComp.extraSettingsEl.addClass("trackerCellButtonStyle");
        actedButtonComp.extraSettingsEl.addClass("trackerCellButtonFullHeight");
      }
      buttonCell = tempRow.createEl('td', {cls: 'trackerTableRemoveCellStyle max50Width'});
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
      }
    }
  }

  onHeroTableRowDragStart(event: DragEvent, creature: Creature) {
    this.draggedItemIndex = this.heroes.indexOf(creature);
    if (event.dataTransfer != null){
      event.dataTransfer.dropEffect = "move";
       
      let jsonCreature = JSON.stringify(creature);
      console.log(jsonCreature);
      event.dataTransfer.setData("text", JSON.stringify(creature));
    }
  }
  
  onHeroTableRowDragEnter(event: DragEvent, index: number){
    if (event.dataTransfer != null){
      this.heroesTableDragIndex = index
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
    let staminaCell = row.children[1] as HTMLTableCellElement;
    let parsedId = row.id.split(" ");
    let maxStamina = 0;
    let minionStamina : number | undefined = 0;
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
    let staminaDiv = staminaCell.createDiv({ cls: "tableStyle"});
    let header = staminaDiv.createEl('tr');
    if (isMinion)
    {
      header.createEl('th', {text: ` Max: ${maxStamina} (${minionStamina} per minion)`})
    }
    else
    {
      header.createEl('th', {text: ` Max: ${maxStamina}`})
    }
    let bodyCell = staminaDiv.createEl('tr').createEl('td').createDiv({cls:"centered contents"});
    new ButtonComponent(bodyCell).setButtonText('-1').onClick(() => {this.updateStamina(row, (+stamina - 1).toString(), isMinion)});
    let staminaInput = new TextComponent(bodyCell) ;
    staminaInput.inputEl.addClasses(['centerText', 'max60Width']);
    staminaInput.setValue(stamina.toString()).inputEl.onkeydown = Behaviors.NumbersOnly;
    new ButtonComponent(bodyCell).setButtonText('+1').onClick(() => {this.updateStamina(row, (+stamina + 1).toString(), isMinion)});
   }


  changeActedCell(row : HTMLTableRowElement, buttonComp : ExtraButtonComponent, hasActed : boolean) {
    if (hasActed)
    {
      buttonComp.extraSettingsEl.setText(cssConstants.yes);
      row.children[3].addClass(cssConstants.red);
      row.children[3].removeClass(cssConstants.green);
    }
    else
    {
      buttonComp.extraSettingsEl.setText(cssConstants.no);
      row.children[3].addClass(cssConstants.green);
      row.children[3].removeClass(cssConstants.red);
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
      buttonComp.extraSettingsEl.setText(cssConstants.yes);
      if (otherHasActed)
      {
        row.children[3].addClass(cssConstants.red);
        row.children[3].removeClass(cssConstants.orange);
      }
      else
      {
        row.children[3].addClass(cssConstants.orange);
      }
      row.children[3].removeClass(cssConstants.green);
    }
    else
    {
      buttonComp.extraSettingsEl.setText(cssConstants.no);
      if (otherHasActed)
      {
        row.children[3].addClass(cssConstants.orange);
      }
      else
      {
        row.children[3].addClass(cssConstants.green);
        row.children[3].removeClass(cssConstants.orange);
      }
      row.children[3].removeClass(cssConstants.red);
    }
  }

  changeTriggeredActionCell(row : HTMLTableRowElement, buttonComp : ExtraButtonComponent, hasActed : boolean) {
    if (hasActed)
    {
      buttonComp.extraSettingsEl.setText(cssConstants.yes);
      row.children[2].addClass(cssConstants.red);
      row.children[2].removeClass(cssConstants.green);
    }
    else
    {
      buttonComp.extraSettingsEl.setText(cssConstants.no);
      row.children[2].addClass(cssConstants.green);
      row.children[2].removeClass(cssConstants.red);
    }
  }

  newRound(div: HTMLDivElement)
  {
    let round = ++this.round;
    this.setRound(round, div);
    let malice = this.malice + round + this.heroes.length
    this.setMalice(malice)
    this.resetActed();
  }

  resetActed() {
    for (let i = 1; i < this.heroesTableEl.children.length; i++)
      {
          let row =  ((this.heroesTableEl.children[i] as (HTMLTableRowElement)).children[0] as HTMLTableElement).children[0].children[1];
          
          let button = (row.children[2] as HTMLTableCellElement).children[0] as HTMLButtonElement;
          let triggeredActionButton = (row.children[3] as HTMLTableCellElement).children[0] as HTMLButtonElement;
          button.textContent = cssConstants.no;
          triggeredActionButton.textContent = cssConstants.no;
          row.children[3].removeClass(cssConstants.red);
          row.children[2].removeClass(cssConstants.red);
          row.children[3].addClass(cssConstants.green);
          row.children[2].addClass(cssConstants.green);
      }
    for (let i = 1; i < this.villainsTableEl.children.length; i++)
      {
          let row =  ((this.villainsTableEl.children[i] as (HTMLTableRowElement)).children[0] as HTMLTableElement).children[0].children[1];
          let button = (row.children[2] as HTMLTableCellElement).children[0] as HTMLButtonElement;
          let triggeredActionButton = (row.children[3] as HTMLTableCellElement).children[0] as HTMLButtonElement;
          button.textContent = cssConstants.no;
          triggeredActionButton.textContent = cssConstants.no;
          row.children[3].removeClass(cssConstants.red);
          row.children[2].removeClass(cssConstants.red);
          row.children[3].addClass(cssConstants.green);
          row.children[2].addClass(cssConstants.green);
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