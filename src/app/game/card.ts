export class Card{
    face:string;
    suit:string;
    player:any;
    name:string;
    facePower:number;
    suitPower:number;
    points:number;
    team:number;
    cardOrder:number;
    belot:boolean;
    constructor(face:string, suit:string, player:any, name:string, facePower:number, suitPower:number, points:number,team:number,cardOrder:number) {
        this.face = face;
        this.suit = suit;
        this.player = player;
        this.name = name;
        this.facePower = facePower;
        this.suitPower = suitPower;
        this.points=points;
        this.team=team;
        this.cardOrder=cardOrder
        this.belot=false;
    }
  }