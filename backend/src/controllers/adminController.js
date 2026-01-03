const Users = require("../models/User")


const getUsers = async (req, res) => {
    try{
        const users = await Users.findAll();
        res.json(users);
    }
    catch(err){
        res.status(500),json({eror : err.message});
    }
};

module.exports = {getUsers};