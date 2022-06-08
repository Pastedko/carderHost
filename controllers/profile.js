const {Router}=require('express');
const {login,getUserGames,updateProfile, removePicure}=require('../services/user');
const router=Router()
const multer = require('multer');
var  path  = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        
        cb(null, Date.now() + file.originalname)
    }
})
const upload = multer({storage: storage})
router.post("/getUserGames",async(req,res)=>{
    let user=req.body.user;
   
    let games=await getUserGames(user);
    res.status(200).send(games);
})

router.post("/updateWithPicture",upload.single('profilePicture'),async(req,res)=>{
    let user=req.body.user;
    let file=req.file.path;
    let changes=req.body;
    try{
        await updateProfile(user,changes,file);
        res.status(200).send(JSON.parse(JSON.stringify({12:123})))
    }
    catch(err){
        console.log(err)
        res.send(err.message)
    }
})
router.post("/updateWithoutPicture",upload.fields([]),async(req,res)=>{
    let user=req.body.user;
    let changes=req.body;
    let file=req.body.profilePicture
    // console.log(changes);
    try{
        await updateProfile(user,changes,file);
        res.status(200).send(JSON.parse(JSON.stringify({12:123})))
    }
    catch(err){
        console.log(err)
        res.send(err.message)
    }
})
router.get('/uploads/:id',async(req,res)=>{
    res.sendFile(req.params.id,{root:'D:/tedko/Softuni Project/server/framework/uploads/'});
})

router.post('/removePicture',async(req,res)=>{
    removePicure(req.body.user)
})





module.exports=router;