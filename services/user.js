const User = require('../models/User');
const { compare, hash } = require('bcrypt');
const Game = require('../models/Games');
const findRemoveSync = require('find-remove');

//TODO add all fields required
async function register(email, password, username) {
    const existing = await getUserByEmail(email);
    if (existing) {
        throw new Error('Email is already in use');
    }
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
  {
    throw new Error("You have entered an invalid email address!")
  }
    const existing2 = await getUserByUsername(username);
    if (existing2) {
        throw new Error('Username is already in use')
    }
    if(password.length<=5){
        throw new Error("Password must be atleast 6 characters long")
    }
    const hashedPassword = await hash(password, 10);
    const user = new User({
        username,
        email,
        hashedPassword
    });
    await user.save();
    return user;
}

async function login(email, password) {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new Error('Incorrect email or password.');
    }
    const hasMatch = await compare(password, user.hashedPassword);
    if (!hasMatch) {
        throw new Error('Incorrect email or password.')
    }
    return user;
}
//TODO change identifier

async function updateProfile(user, updates, file) {
    const myUser = await User.findById(user);
    if (myUser) {
        const existing2 = await getUserByUsername(updates.username);
        if (existing2) {
            if (JSON.stringify(existing2) != JSON.stringify(myUser))
                throw new Error('Username is already in use')
        }
        myUser.username = updates.username;
            if (myUser.profilePicture != '/uploads/guest-user-250x250.jpg') {
                //var result = findRemoveSync('uploads', { files: myUser.profilePicture.split('uploads\\')[1] })
            }
            if(file.includes("http://localhost:3000")){
                myUser.profilePicture=file;
            }
            else
            myUser.profilePicture = ' /' + file;
        myUser.gender = updates.gender;
        myUser.birthday = updates.birthday | null;
        myUser.city = updates.city;
        await myUser.save();
        return myUser;
    }
    else throw new Error("User not found");
}

async function removePicure(user) {
    const myUser = await User.findById(user._id);
    if (myUser.profilePicture != '/uploads/guest-user-250x250.jpg') {
        var result = findRemoveSync('uploads', { files: myUser.profilePicture.split('uploads\\')[1] });
        myUser.profilePicture = '/uploads/guest-user-250x250.jpg';
        myUser.save()
    }
}
async function getUserByEmail(email) {
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    return user;
}
async function getUserByUsername(username) {
    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    return user
}

async function getUserById(id) {
    const user = await User.findById(id);
    return user
}

async function getUserGames(user) {
    let myUser = await User.findById(user._id).populate("allGames");
    let games = myUser.allGames;
    return games;
}

async function saveGameInMatchHistory(user,game,result){
    let myUser=await User.findById(user._id);
    if(result=="win"){
        myUser.wins++;
    }
    else
    myUser.losses++;
    let filter={_id:myUser._id}
    myUser.allGames.push(game._id);
    let updates={allGames:myUser.allGames,wins:myUser.wins,losses:myUser.losses}
   await User.findOneAndUpdate(filter,updates);
}
module.exports = {
    login,
    register,
    getUserById,
    getUserGames,
    updateProfile,
    removePicure,
    saveGameInMatchHistory
}