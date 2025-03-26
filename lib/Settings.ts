import Creature from "./Models/Creature";

export interface RetainerSettings {
    mySetting: string;
    playerCharacters: Creature[];
}

export const DEFAULT_SETTINGS: RetainerSettings = {
    mySetting: 'default',
    playerCharacters: [],
}

