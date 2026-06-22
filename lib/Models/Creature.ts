import { CreatureTypes } from "lib/Models/CreatureTypes";
import { InitiativeView } from "lib/Views/InitiativeTrackerView";
import { ExtraButtonComponent } from "obsidian";

export default class Creature{
    Id: string;
    Name: string;
    MaxStamina: number;
    CurrentStamina: number;
    MinionStamina?: number;
    MinionCount?: number;
    Type?: CreatureTypes;
    HasActed: boolean;
    IsHero: boolean;

    Row: HTMLTableRowElement;
    ActButton: ExtraButtonComponent;
    SoloActButton: ExtraButtonComponent;

    constructor() {
        this.Id = "";
        this.Name = "";
        this.MaxStamina = 0;
        this.CurrentStamina = 0;
        this.HasActed = false;
        this.IsHero = false;
    }

    isBloodied() {
        return this.CurrentStamina <= Math.ceil(this.MaxStamina / 2)
    }
}