const express = require("express")
const router = express.Router()

const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/userAuthentication')
const multer = require('multer')
const storage = require('../multer/multerConfig')
const User = require('../models/user')


const upload = multer({ storage: storage });

//signup
router.post("/signup", async (req, res) => {
    try {
        const Existuser = await User.findOne({ email: req.body.email })
        if (Existuser) {
            return res.json({ error: 'user already exist' })
        }


        const salt = await bcrypt.genSalt();

        const hashedpassword = await bcrypt.hash(req.body.Password, salt)
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            role: 'user',
            password: hashedpassword,
            profile: "./src/assets/profileimg.jpg"
        })
        const savedUser = await newUser.save()


        //create the token
        const token = jwt.sign({
            user: savedUser._id
        }, process.env.JWT_SECRET)

        //send the token in a http only cookie
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24,
        }).json({ success: true })

    } catch (error) {
        console.log(error);
    }


})

///login
router.post("/login", async (req, res) => {

    try {
        const existingUser = await User.findOne({ email: req.body.email });

        if (!existingUser) {

            return res.json({ emailerr: "User not found" });
        }

        const passwordCorrect = await bcrypt.compare(req.body.password, existingUser.password);

        if (!passwordCorrect) {

            return res.json({ passworderr: "Wrong password" });
        }

        const token = jwt.sign({
            user: existingUser._id
        }, process.env.JWT_SECRET);

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24,
        }).json({ success: true });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


//update profile
router.post('/uploadprofileimage', upload.single('profile'), async (req, res) => {

    try {
        const token = req.cookies.token
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({ _id: verified.user })
        const imageUrl = user.profile;

        //deleting existin profile image
        if (imageUrl !== "./src/assets/profileimg.jpg") {

            const parsedUrl = new URL(imageUrl);
            const imageName = path.basename(parsedUrl.pathname);

            const folderPath = './public/assets';
            const imagePath = path.join(folderPath, imageName);
            if (fs.existsSync(imagePath)) {

                fs.unlinkSync(imagePath);
                console.log(`${imageName} has been deleted successfully.`);
            } else {
                console.log(`${imageName} does not exist in the folder.`);
            }
        }
        const path_image = process.env.IMAGE_PATH + `profileimages/${req.file.filename}`
        const data = await User.updateOne({ _id: verified.user }, { $set: { profile: path_image } });
        res.json(data)

    } catch (error) {
        console.log(error);
    }

})

//update profile credentials
router.post('/editprofile', async (req, res) => {
    try {

        const name = req.body.name
        const orgpassword = req.body.password
        const currentPassword = req.body.currentpassword
        const newPassword = req.body.newpassword

        if (currentPassword.length && newPassword.length) {
            const passwordCorrect = await bcrypt.compare(currentPassword, orgpassword);
            if (!passwordCorrect) {
                res.json({ error: "incorrect password" })
            } else {
                const salt = await bcrypt.genSalt();
                const hashedNewPass = await bcrypt.hash(newPassword, salt)
                await User.updateOne({ _id: req.body._id }, {
                    $set: {
                        name: name,
                        password: hashedNewPass
                    }
                })
            }
        } else {
            await User.updateOne({ _id: req.body._id }, {
                $set: {
                    name: name

                }
            })
        }

        res.json({ success: true })
    } catch (error) {
        console.log(error);
    }
})



//logout
router.get('/logout', auth, (req, res) => {
    try {

        res.clearCookie("token").send({ something: "here" })
    } catch (error) {
        console.log(error);
    }

})






//fetch data using cookies
router.get('/fetchuserdata', async (req, res) => {
    try {
        const token = req.cookies.token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const data = await User.findOne({ _id: verified.user })
        res.json(data)

    } catch (error) {
        console.log(error);
    }
})

module.exports = router;

