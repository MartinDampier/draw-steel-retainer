import Creature from "./Models/Creature";

export interface MyPluginSettings {
    mySetting: string;
    playerCharacters: Creature[];
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: 'default',
    playerCharacters: [],
}

