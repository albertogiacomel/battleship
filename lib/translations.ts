import { Language } from '../types';

export const DICTIONARY = {
  en: {
    title: "BATTLESHIP",
    subtitle: "Tactical Naval Warfare",
    systemsCheck: "SYSTEMS CHECK",
    combatMode: "COMBAT MODE ACTIVE",
    setupTitle: "FLEET DEPLOYMENT",
    enemyWaters: "ENEMY WATERS",
    homeFleet: "HOME FLEET",
    enemyTargeting: "ENEMY TARGETING...",
    deployMsg: "Welcome, Admiral. Deploy your ships.",
    battleStart: "Battle engaged! Awaiting orders.",
    hit: "Direct Hit!",
    miss: "Shot missed.",
    sunk: (name: string) => `Confirmed! Enemy ${name} sunk!`,
    victory: "Victory Achieved!",
    defeat: "Fleet Destroyed. Defeat.",
    enemyHit: "Alert! We've been hit!",
    enemyMiss: "Enemy shot missed.",
    enemySunk: (name: string) => `Critical! Our ${name} has been sunk!`,
    
    // GameControls
    deployFleet: "Deploy Fleet",
    deployInstructionsPre: "Place ships. Press",
    deployInstructionsPost: "to rotate.",
    externalAi: "External AI Endpoint",
    aiIntelligence: "AI Intelligence",
    remainingShips: "Remaining Ships:",
    allReady: "All ships ready!",
    rotate: "Rotate",
    random: "Random",
    startBattle: "START BATTLE",
    playAgain: "Play Again",
    totalShots: "TOTAL SHOTS",
    enemySurviving: "ENEMY SURVIVING",
    victoryTitle: "VICTORY!",
    defeatTitle: "DEFEAT",
    victoryBody: "Admiral, you've neutralized the enemy fleet.",
    defeatBody: "Your fleet has been decimated. Better luck next time.",
    
    // FleetStatus
    enemyIntel: "Enemy Fleet Intel",
    alliedStatus: "Allied Fleet Status",
    lost: "LOST",

    // Board
    you: "YOU",
    enemy: "ENEMY",

    // Ships
    ships: {
      carrier: "Carrier",
      battleship: "Battleship",
      cruiser: "Cruiser",
      submarine: "Submarine",
      destroyer: "Destroyer"
    }
  },
  it: {
    title: "BATTAGLIA NAVALE",
    subtitle: "Guerra Navale Tattica",
    systemsCheck: "CONTROLLO SISTEMI",
    combatMode: "COMBATTIMENTO ATTIVO",
    setupTitle: "SCHIERAMENTO FLOTTA",
    enemyWaters: "ACQUE NEMICHE",
    homeFleet: "FLOTTA ALLEATA",
    enemyTargeting: "NEMICO IN PUNTAMENTO...",
    deployMsg: "Benvenuto, Ammiraglio. Schiera le navi.",
    battleStart: "Battaglia iniziata! In attesa di ordini.",
    hit: "Colpo a segno!",
    miss: "Mancato.",
    sunk: (name: string) => `Confermato! ${name} nemica affondata!`,
    victory: "Vittoria Raggiunta!",
    defeat: "Flotta Distrutta. Sconfitta.",
    enemyHit: "Allarme! Siamo stati colpiti!",
    enemyMiss: "Il nemico ha mancato il bersaglio.",
    enemySunk: (name: string) => `Critico! La nostra ${name} è affondata!`,

    // GameControls
    deployFleet: "Schiera Flotta",
    deployInstructionsPre: "Posiziona navi. Premi",
    deployInstructionsPost: "per ruotare.",
    externalAi: "Endpoint AI Esterno",
    aiIntelligence: "Intelligenza AI",
    remainingShips: "Navi Rimanenti:",
    allReady: "Tutte le navi pronte!",
    rotate: "Ruota",
    random: "Casuale",
    startBattle: "INIZIA BATTAGLIA",
    playAgain: "Gioca Ancora",
    totalShots: "COLPI TOTALI",
    enemySurviving: "NEMICI RIMASTI",
    victoryTitle: "VITTORIA!",
    defeatTitle: "SCONFITTA",
    victoryBody: "Ammiraglio, hai neutralizzato la flotta nemica.",
    defeatBody: "La tua flotta è stata decimata. Andrà meglio la prossima volta.",

    // FleetStatus
    enemyIntel: "Intel Flotta Nemica",
    alliedStatus: "Stato Flotta Alleata",
    lost: "PERSA",

    // Board
    you: "TU",
    enemy: "NEMICO",

    // Ships
    ships: {
      carrier: "Portaerei",
      battleship: "Corazzata",
      cruiser: "Incrociatore",
      submarine: "Sottomarino",
      destroyer: "Cacciatorpediniere"
    }
  }
};