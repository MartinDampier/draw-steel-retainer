import { NEGOTIATION_VIEW } from "lib/Models/Constants";
import { RetainerSettings } from "lib/Settings";
import { ButtonComponent, DropdownComponent, ItemView, TextAreaComponent, TextComponent, WorkspaceLeaf } from "obsidian";

export class NegotiationView extends ItemView {
    isCreate: boolean;
    wizardEl: HTMLElement;
    settings: RetainerSettings;

    constructor(leaf: WorkspaceLeaf, settings: RetainerSettings, isCreate: boolean) {
        super(leaf);
        this.settings = settings;
        this.isCreate = isCreate;
    }

    getViewType() {
        return NEGOTIATION_VIEW;
      }
    
    getDisplayText() {
        return 'Negotiation tracker';
    }
    getIcon() {
        return "messages-square";
    }
    async onOpen() {
        this.buildWizard();
    }
    
    private buildWizard() {

        function addLabel(element: HTMLElement, label: string){
            element.createEl('br');
            element.createEl('label', {text: label})
            element.createEl('br');
        }

        function addOption(element: HTMLElement, placeholder: string)
        {
            let x = new TextAreaComponent(element).setPlaceholder(placeholder);
             x.inputEl.addClass('padded-input');
             x.inputEl.addClass('offerStyle');
        }

        this.contentEl.empty();
        this.wizardEl = this.contentEl.createDiv();
        this.wizardEl.addClass('wizard');
        this.wizardEl.addClass('paddedFill');
        this.wizardEl.createEl('label', {text: 'Character name', cls: 'leftAlign'});
        this.wizardEl.createEl('br');
        new TextComponent(this.wizardEl).setPlaceholder('John Smith').inputEl.addClass('fill');

        let languageDiv = this.wizardEl.createDiv();
        addLabel(languageDiv, 'Languages');
        let languageDropdown =  new DropdownComponent(languageDiv);
        languageDropdown.selectEl.addClass('wizardSelect');
        for (let i = 0; i < this.settings.languages.length; i++) {
            let language = this.settings.languages[i].Name;
            languageDropdown.addOption(language, language);
        }
        new ButtonComponent(languageDiv).setIcon('plus').buttonEl.addClass('wizardButton');

        let motivationDiv = this.wizardEl.createDiv();
        addLabel(motivationDiv, 'Motivations');
        let motivationOneDropdown = new DropdownComponent(motivationDiv);
        let motivationTwoDropdown = new DropdownComponent(motivationDiv);
        motivationOneDropdown.selectEl.addClass('wizardSelect');
        motivationTwoDropdown.selectEl.addClass('wizardSelect');
        for (let i = 0; i < this.settings.motivationPitfall.length; i++) {
            let motivation = this.settings.motivationPitfall[i].Name;
            motivationOneDropdown.addOption(motivation, motivation);
            motivationTwoDropdown.addOption(motivation, motivation);
        }

        let pitfallDiv = this.wizardEl.createDiv();
        addLabel(pitfallDiv, 'Pitfalls');
        let pitfallOneDropdown = new DropdownComponent(pitfallDiv);
        let pitfallTwoDropdown = new DropdownComponent(pitfallDiv);
        pitfallOneDropdown.selectEl.addClass('wizardSelect');
        pitfallTwoDropdown.selectEl.addClass('wizardSelect');
        for (let i = 0; i < this.settings.motivationPitfall.length; i++) {
            let pitfall = this.settings.motivationPitfall[i].Name;
            pitfallOneDropdown.addOption(pitfall, pitfall);
            pitfallTwoDropdown.addOption(pitfall, pitfall);
        }
        
        addLabel(this.wizardEl, 'Offers');
        addOption(this.wizardEl, 'No and Die!');
        addOption(this.wizardEl, 'No');
        addOption(this.wizardEl, 'Yes but no');
        addOption(this.wizardEl, 'Yes');
        addOption(this.wizardEl, 'Yes and !');
        let submitButton = new ButtonComponent(this.wizardEl);
        submitButton.setButtonText('Submit');
        submitButton.setClass('rightAlign');
    }

    private buildTracker() {
        this.contentEl.empty();
        this.buildSliderSection();
    }

    private buildSliderSection() {
        let inputGrid = this.contentEl.createDiv({cls: 'Centered'});
        inputGrid.createEl('label', {text: 'Patience'})
        inputGrid.createEl('br');
        let patience = inputGrid.createEl('input', {type:'range', cls: 'slider'})
        let patienceDataList = inputGrid.createEl('datalist', {cls: 'Centered'});
        inputGrid.createEl('label', {text: 'Intrique'})
        inputGrid.createEl('br');
        let intrigue = inputGrid.createEl('input', {type:'range'})
        let intrigueDataList = inputGrid.createEl('datalist', {cls: 'Centered'});

        patienceDataList.id = 'values';
        for (let i = 0; i < 6; i++)
        {
            let option = patienceDataList.createEl('option', {value: i.toString()});
            option.label = i.toString();
        }
        
        patience.setAttribute('list', 'values')
        patience.min = "0";
        patience.max = "5";
        patience.step = "1";

        intrigueDataList.id = 'values';
        for (let i = 0; i < 6; i++)
        {
            let option = intrigueDataList.createEl('option', {value: i.toString()});
            option.label = i.toString();
        }

        intrigue.setAttribute('list', 'values')
        intrigue.min = "0";
        intrigue.max = "5";
        intrigue.step = "1";
    }

    async onClose() {
        // Nothing to clean up. FOR NOW
    }

}