const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const usersModel = require("../models/userModel");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const otps = new Map();

const getAllUsers = async (req, res) => {
  try {
    const users = await usersModel.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await usersModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await usersModel.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  try {
    const updatedUser = await usersModel.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const changeUserActivity = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await usersModel.findById(id).select("isActive");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const changePassword = async (req, res) => {
  const userIdFromHeader = req.headers['user-id'];
  const { currentPassword, newPassword } = req.body;
  const token = req.headers['authorization']?.split(' ')[1];
console.log(req.headers);

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdFromToken = decoded.user.id;

  
    if (userIdFromHeader !== userIdFromToken.toString()) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

  
    const user = await usersModel.findById(userIdFromToken);

  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

 
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

   
    await usersModel.findByIdAndUpdate(userIdFromToken, { password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(`Change Password Error: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const register = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    city,
    country,
    category,
    experienceLevel,
    desiredJobType,
    qualifications,
    profilePhoto,
    skills,
    overview,
    socialMedia,
    isActive,
    education,
    workAndExperience
  } = req.body;
  try {
    let user = await usersModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const defaultProfilePhoto = "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-Image.png";
    const userProfilePhoto = profilePhoto && profilePhoto.trim() !== "" ? profilePhoto : defaultProfilePhoto;
    user = new usersModel({
      firstName,
      lastName,
      email,
      phone,
      password,
      city,
      country,
      category,
      experienceLevel,
      desiredJobType,
      qualifications,
      profilePhoto: userProfilePhoto,
      skills,
      overview,
      socialMedia,
      isActive,
      education,
      workAndExperience,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) {
          console.error(`JWT Error: ${err.message}`);
          throw err;
        }
        res.json({ token, user });
      }
    );
  } catch (err) {
    console.error(`Register Error: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log(`Attempting login for email: ${email}`);
    let user = await usersModel.findOne({ email });
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Invalid password for email: ${email}`);
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) {
          console.error(`JWT Error: ${err.message}`);
          throw err;
        }
        console.log(`Login successful for email: ${email}`);
        // Include the user object and the user ID in the response
        return res.json({ token, user: { ...user.toObject(), id: user.id } });
      }
    );
  } catch (err) {
    console.error(`Login Error: ${err.message}`);
    return res.status(500).json({ message: "Server error" });
  }
};





//REQUEST OTP
// const otps = new Map();
const RequestOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await usersModel.findOne({ email });
    if (!user) {
      console.log(`User with email ${email} not found`);
      return res.status(404).send("User not found");
    }

    const OTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    otps.set(user.id, { OTP, expiresAt });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Hello, Your OTP code is ${OTP}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to send OTP" });
      }
      console.log("Email sent: " + info.response);
      res.status(200).json({ message: "OTP sent successfully" });
    });
  } catch (err) {
    console.error(`RequestOTP Error: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};







//verify OTP
const verifyOTP = async (req, res) => {
  const { otp, email } = req.body;
  try {
    console.log("Verify OTP Payload:", { otp, email });
    const user = await usersModel.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(404).send("User not found");
    }

    const storedOtp = otps.get(user.id);
    console.log("Stored OTP:", storedOtp);
    if (!storedOtp || storedOtp.expiresAt < Date.now()) {
      console.log("OTP expired or invalid");
      return res.status(400).send("OTP expired or invalid");
    }

    if (typeof otp !== "string" || storedOtp.OTP !== otp) {
      console.log("Invalid OTP");
      return res.status(400).send("Invalid OTP");
    }

    // OTP is valid, mark it as verified
    storedOtp.verified = true;
    otps.set(user.id, storedOtp);

    res.send("OTP verified successfully");
  } catch (err) {
    console.error(`VerifyOTP Error: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

//RESET PASS
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await usersModel.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const storedOtp = otps.get(user.id);
    if (!storedOtp || !storedOtp.verified) {
      return res.status(400).send("OTP not verified or expired");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    otps.delete(user.id);
    res.send("Password reset successful");
  } catch (err) {
    console.error(`ResetPassword Error: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};





module.exports = {
  register,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  changeUserActivity,
  login,
  RequestOTP,
  verifyOTP,
  resetPassword,
  changePassword
};
