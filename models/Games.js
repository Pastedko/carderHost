const {Schema,model}=require('mongoose');
const User=require('./User')
const gamesSchema=new Schema({
    players:{type:[],default:[["",0,false],["",0,false],["",0,false],["",0,false]]},
    active:{type:Boolean,required:true},
    score:{type:[Number],default:[0,0]},
    handScore:{type:[Number],default:[0,0]},
    premiums:{type:Object,default:{1:[],2:[]}},
    contract:{type:Number,default:-1},
    teamCalled:{type:Number,default:0},
    password:{type:String},
    name:{type:String},
    startingPlayer:{},
    lastStarted:{type:Number,default:3},
    lastHandWinner:{type:Number,default:-1},
    playedCards:{type:Array,default:[]},
    passCount:{type:Number,default:0},
    cards:{type:[],default:[[],[],[],[]]},
    exists:{type:Boolean,default:true}
})

const Game=model('Game',gamesSchema);
module.exports=Game;