const express=require('express');
const app=express();
const path=require('path');
const methodOverride=require('method-override');
const ejsMate=require('ejs-mate');
const session=require("express-session");
const flash=require('connect-flash');
const mongoose = require('mongoose');
const User=require('./models/user');
const { userInfo } = require('os');
const multer = require('multer');
const {spawn}=require('child_process');
const fs = require('fs');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB limit (adjust as needed)
        files: 1 // Maximum number of files allowed (adjust as needed)
    }
});

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"public")));
app.use(express.static('uploads'));

let isLoggedIn=false;

app.use(
    session({
      secret: 'holySonOfJesus',
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 900000,
      },
    })
);



async function main(){
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/encrypt");
        console.log("MongoDB connected");
    } catch (err) {
        console.error(err);
    }
}

main();



app.get('/',(req,res) => {
    res.render('index.ejs',{isLoggedIn});
});

app.get('/signup',(req,res)=>{
    res.render('signup.ejs');
});

app.post('/signupsubmit',async(req, res) => {
    const userInfo = req.body.userInfo; // Access the data sent from the client
    console.log(userInfo);
    const newUser = new User({
        faceid: userInfo.faceId,
        email: userInfo.email,
    });
    try
    {
        const result = await newUser.save({maxTimeMS: 30000});
        console.log(result);
    } catch (err) {
        console.error(err);
    }
    isLoggedIn=true;
    req.session.isLoggedIn = isLoggedIn;
    res.status(200).json({ status: 'success', userInfo });
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get("/endecrypt",(req, res) => {
    if(isLoggedIn){
        req.session.faceId = req.query.faceId;
        console.log(res.locals);
        res.render('endecrypt.ejs');
    }
    else{
        res.send("You have to be logged in to access this feature");
    }
});

app.post('/loginsubmit', (req, res) => {
    let userInfo = req.body.userInfo;
    if (userInfo) {
        isLoggedIn = true;
        req.session.isLoggedIn = isLoggedIn;
        res.status(200).json({ status: 'success', userInfo });
    }
    else{
        res.status(404).json({ status: 'error', message: 'Invalid credentials' });
    }
});

app.get('/download/:filename', (req, res) => {
    if(isLoggedIn)
    {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    res.download(filePath, (err) => {
        if (err) {
            res.status(404).send('File not found');
        } else {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    // Handle the error if unable to delete the file
                    console.error('Error deleting the file:', unlinkErr);
                }
            });
        }
    });
    }
    else{
        res.send("You have to be logged in to avail this functionality");
    }
});

app.post('/encryptformsubmit', upload.single('file'), (req, res) => {
    if(isLoggedIn)
    {
    const filename = req.file.filename;
    const faceId = req.session.faceId;
    console.log(filename);
    console.log(req.session.faceId);
    const py = spawn('python', ['encrypt.py', filename, faceId]);

    py.stdout.on('data', (data) => {
        url=data.toString();
        res.render('encryptformsubmit.ejs',{url});
    });

    py.stderr.on('data', (data) => {
        console.error(data.toString());
        res.status(500).send('An error occurred during encryption.');
    });
    }
    else{
        res.send("You have to be logged in to avail this functionality");
    }
});

app.post('/decryptformsubmit', upload.single('file'), (req, res) => {
    if(isLoggedIn)
    {
    const filename = req.file.filename;
    const faceId = req.session.faceId;
    console.log(filename);
    console.log(req.session.faceId);
    const py = spawn('python', ['decrypt.py', filename, faceId]);

    py.stdout.on('data', (data) => {
        url=data.toString();
        res.render('decryptformsubmit.ejs',{url});
    });

    py.stderr.on('data', (data) => {
        console.error(data.toString());
        res.status(500).send('An error occurred during encryption.');
    });
    }
    else{
        res.send("You have to be logged in to avail this functionality");
    }
});

app.get("/logout", (req, res) => {
    isLoggedIn = false;
    req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

app.listen(3000,() => {
    console.log("Listening on port 3000");
});