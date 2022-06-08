const { default: mongoose } = require('mongoose');
const {Schema,model,Types:{ObjectId}}=require('mongoose');
const {Game}=require('./Games');


const userSchema=new Schema({
    username:{type:String,required:true},
    email:{type:String,required:true},
    hashedPassword:{type:String,required:true},
    profilePicture:{type:String,default:"http://localhost:3000/uploads/guest-user-250x250.jpg"},
    currentGame:{type:ObjectId,ref:"Game",default:null},
    allGames:{type:[ObjectId],ref:"Game",default:[]},
    gender:{type:String,default:""},
    birthday:{type:Date},
    city:{type:String,default:""},
    wins:{type:Number,default:0},
    losses:{type:Number,default:0}
})

userSchema.index({email:1},{
    unique:true,
    collation:{
        locale:'en',
        strength:2
    }
})
userSchema.index({username:1},{
    unique:true,
    collation:{
        locale:'en',
        strength:2
    }
})


const User=model('User',userSchema);

module.exports=User;