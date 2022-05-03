const weaponTypes = {
  simpleM: ['simple', 'melee'],
  militaryM: ['military', 'melee'],
  superiorM: ['superior', 'melee'],
  improvM: ['improvised', 'melee'],
  simpleR: ['simple', 'ranged'],
  militaryR: ['military', 'ranged'],
  superiorR: ['superior', 'ranged'],
  improvR: ['improvised', 'ranged'],
  implement: ['implement'],
  siegeM: ['siege', 'melee'],
  siegeR: ['siege', 'ranged'],
  naturalM: ['natural', 'melee'],
  naturalR: ['natural', 'ranged'],
  improv: ['improvised'],
};

const shortHands = {
  Strength: 'str',
  Dexterity: 'dex',
  Constitution: 'con',
  Intelligence: 'int',
  Wisdom: 'wis',
  Charisma: 'cha',
  Fortitude: 'fort',
  Reflex: 'ref',
  AC: 'ac',
  Will: 'wil',
};
const ABILITIES = {
  Strength: 'str',
  Dexterity: 'dex',
  Constitution: 'con',
  Intelligence: 'int',
  Wisdom: 'wis',
  Charisma: 'cha',
};
const DEFENSES = {
  Fortitude: 'fort',
  Reflex: 'ref',
  AC: 'ac',
  Will: 'wil',
};
const POWERTYPES = {
  augmentable: 'augmentable',
  aura: 'aura',
  beast: 'beast',
  beastform: 'beastForm',
  channeldivinity: 'channelDiv',
  charm: 'charm',
  conjuration: 'conjuration',
  disease: 'disease',
  elemental: 'elemental',
  enchantment: 'enchantment',
  evocation: 'evocation',
  fear: 'fear',
  fulldiscipline: 'fullDis',
  gaze: 'gaze',
  healing: 'healing',
  illusion: 'illusion',
  invigorating: 'invigorating',
  mount: 'mount',
  necromancy: 'necro',
  nethermancy: 'nether',
  poison: 'poison',
  polymorph: 'polymorph',
  rage: 'rage',
  rattling: 'rattling',
  reliable: 'reliable',
  runic: 'runic',
  sleep: 'sleep',
  spirit: 'spirit',
  stance: 'stance',
  summoning: 'summoning',
  teleportation: 'teleportation',
  transmutation: 'transmutation',
  zone: 'zone',
};

const actionTypes = ['none', 'standard', 'move', 'minor', 'free', 'reaction', 'interrupt', 'opportunity'];

const typesOfArmor = {
  cloth: ['cloth'],
  light: ['hide', 'studded', 'leather'],
  heavy: ['chainmail', 'scale', 'plate', 'ring mail', 'banded mail', 'splint mail'],
};

const DAMAGETYPES = [
  'acid',
  'cold',
  'electricity',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
  'bludgeoning',
  'piercing',
  'slashing',
];
const POWERSOURCES = ['arcane', 'divine', 'martial', 'elemental', 'ki', 'primal', 'psionic', 'shadow'];
export { weaponTypes, shortHands, POWERTYPES, actionTypes, typesOfArmor, ABILITIES, DEFENSES, DAMAGETYPES, POWERSOURCES };
