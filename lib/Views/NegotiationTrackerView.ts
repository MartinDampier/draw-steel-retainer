import Creature from 'lib/Models/Creature';
import { Red, Green, Orange, Yes, No, Fill, NEGOTIATION_VIEW } from 'lib/Models/Constants';
import { ButtonComponent, ItemView, TextAreaComponent, WorkspaceLeaf, Setting, TextComponent, ExtraButtonComponent, DropdownComponent, Modal, App } from 'obsidian';
import { CreatureTypes } from 'lib/Models/CreatureTypes';

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
}