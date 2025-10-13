import Creature from 'lib/Models/Creature';
import { Red, Green, Orange, Yes, No, Fill, NEGOTIATION_VIEW } from 'lib/Models/Constants';
import { ButtonComponent, ItemView, TextAreaComponent, WorkspaceLeaf, Setting, TextComponent, ExtraButtonComponent, DropdownComponent, Modal, App, sanitizeHTMLToDom, SliderComponent } from 'obsidian';
import { CreatureTypes } from 'lib/Models/CreatureTypes';
import * as fs from 'fs';

export class NegotiationView extends ItemView {

    getViewType(): string {
        return NEGOTIATION_VIEW;
    }
    getDisplayText() {
        return 'Negotiation tracker';
    }

    getIcon() {
        return "messages-square";
    }

    constructor(leaf: WorkspaceLeaf, app: App) {
        super(leaf);
        this.app = app;
    }

    async onOpen() {
        this.contentEl.empty();
        let mainDiv = this.contentEl.createDiv({cls: ""})
        let patienceDiv = mainDiv.createDiv();
        
    }
}