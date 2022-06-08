const authController=require('../controllers/auth')
const gamesController=require('../controllers/games')
const gameController=require('../controllers/game');
const profileController=require("../controllers/profile")

module.exports=(app)=>{
    app.use(authController);
    app.use(gamesController);
    app.use(gameController);
    app.use(profileController);
}