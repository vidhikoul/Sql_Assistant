const db = require("../config/db");
const {hash, compare} = require("bcryptjs");
const {sign} = require("jsonwebtoken");

function login(req, res){
    const {uid, password} = req.body;
    if(!uid || !password){
        return res.status(404).json({message : "Some fields are missing"});
    }
    const QUERY = "SELECT password FROM users WHERE uid = ?";
    try{
        db.query(QUERY, [uid], (err, result)=>{
            if(err){
                console.log("Login DB error " + err);
                return res.status(500).json({message : "DB error"});
            }
            compare(password, result[0].password, (error, isMatch)=>{
                if(error){
                    console.log("Login Error : " + error);
                    return res.status(500).json({message : "Internal Server error"});
                }
                if(!isMatch){
                    return res.status(401).json({menubar : "Authentication failed"});
                }
                else{
                    const token = sign({uid : uid}, process.env.TOKEN_SECRET_KEY, {
                        expiresIn : process.env.TOKEN_EXPIRY
                    });
                    return res.status(200).json({token : token});
                }
            });
        });
    }catch(error){
        console.log("Login Error : " + error);
        return res.status(500).json({message : "Internal Server error"});
    }
}

function register(req, res){
    const {uid, password} = req.body;
    const QUERY = "INSERT INTO users(uid, password) VALUES(?, ?)";
    if(!uid || !password){
        return res.status(404).json({message : "Some fields are missing"});
    }
    try{
        hash(password, 10, (err, p)=>{
            if(err){
                console.log("hashing error : " + err);
                return res.status(500).json({message : "Internal server error"});
            }
            db.query(QUERY, [uid, p], (db_err, result)=>{
                if(db_err){
                    console.log("Register db error: " + db_err);
                    return res.status(500).json({message : "Database error"});
                }
                const token = sign({uid : uid}, process.env.TOKEN_SECRET_KEY, {expiresIn : process.env.TOKEN_EXPIRY});
                return res.status(201).json({token : token});
            })
        })
    }catch(error){
        console.log("Register error : " + error);
        return res.status(500).json({message : "Internal server error"});
    }
}

module.exports = {login, register}