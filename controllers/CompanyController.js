
const {companyModel} = require('../models/CompanyModel');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const uploadOptions = require('../middlewares/uploadImage');
const nodemailer = require('nodemailer');


const smtpTransport = require('nodemailer-smtp-transport');

const signup = async (req, res, next) => {
  const files = req.files;
  const company = req.body;
  console.log('Received Data:', company);

  try {
    console.log(req.protocol);
    console.log(req.get("host"));

    const { companyName, companyIndustry, companyEmail, companyPassword, companySize, foundedYear, phone, city, state, companyLogo, companyImage } = req.body;

    if (!companyName || !companyIndustry || !companyEmail || !companyPassword || !companySize || !foundedYear || !phone || !state || !city) {
      return res.status(400).json({ message: 'Email, password, name, industry, state, and city are required' });
    }

    const existingCompany = await companyModel.findOne({ companyEmail });
    if (existingCompany) {
      return res.status(409).json({ message: "Company with this email already exists" });
    }

    const defaultLogoPath = "https://pic.onlinewebfonts.com/svg/img_148020.svg";
    const defaultImagePath = "https://d31kswug2i6wp2.cloudfront.net/fallback/company/medium_logo_default.png";

    const logoPath = files && files.companyLogo && files.companyLogo[0] ? `${req.protocol}://${req.get("host")}/uploads/${files.companyLogo[0].filename}` : defaultLogoPath;
    const imagePath = files && files.companyImage && files.companyImage[0] ?` ${req.protocol}://${req.get("host")}/uploads/${files.companyImage[0].filename} `: defaultImagePath;
    const newCompany = new companyModel({
      companyName,
      companyIndustry,
      companyEmail,
      companySize,
      foundedYear,
      phone,
      city,
      state,
      companyPassword,
      companyLogo: logoPath,
      companyImage: imagePath
    });

    await newCompany.save();

    return res.status(201).json({ message: "Company created successfully", company: newCompany });
  } catch (error) {
    return res.status(500).json({ message: "Error creating company", error: error.message });
  }
};
const companyLogin = async (req, res) => {
  let { companyEmail, companyPassword } = req.body;

  console.log('Login attempt:', { companyEmail, companyPassword });

  if (!companyEmail || !companyPassword) {
    return res
      .status(400)
      .json({ message: "You must provide email and password" });
  }

  try {
    let company = await companyModel.findOne({ companyEmail });
    console.log('Company found:', company);

    if (!company) {
      console.log('Company not found:', companyEmail);
      return res.status(404).json({ message: 'Invalid email or password' });
    }

    console.log('Stored hash:', company.companyPassword);

    let isValid = await bcrypt.compare(companyPassword, company.companyPassword);
    console.log('Password valid:', isValid);

    if (!isValid) {
      console.log('Invalid password for email:', companyEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let token = jwt.sign({ data: { companyEmail: company.companyEmail, id: company._id } }, 'This_is_my_jwt', { expiresIn: '1h' });
    console.log('Token generated:', token);

    res.status(200).json({ 
      message: 'Success', 
      token: token,
      company: {
        companyEmail: company.companyEmail,
        id: company._id,
        companyName: company.companyName,
        companyIndustry:company.companyIndustry,
        companySize:company.companySize,
        foundedYear:company.foundedYear,
        phone:company.phone,
        city:company.city,
        state:company.state,
        companyPassword:company.companyPassword
       
      }
    });
  } catch (error) {
    console.error('Server error during login:', error);
    res.status(500).json({ message: 'Server error. Please try again later.', error: error.message });
  }
};




const sendEmail = async (req, res, next) => {
  const companyEmail = req.body.companyEmail;
  console.log('Login attempt:', { companyEmail });
  const existingCompany = await companyModel.findOne({ companyEmail });
  if (!existingCompany) {
    console.log('Company not found:', companyEmail);
    return res.status(404).json({ message: 'Invalid email' });
  }
  const payload = {
    companyEmail: existingCompany.companyEmail,
  };
  const expireTime = 300;
  let token = jwt.sign({ data: { companyEmail: existingCompany.companyEmail, id: existingCompany._id } }, 'This_is_my_jwt');
  console.log('Token generated:', token);
  const transporter = nodemailer.createTransport(smtpTransport({
    service: 'Gmail',
    auth: {
      user: 'safynazabdelraheem@gmail.com',
      pass: 'mgxe xfke ptba atvr'
    },
    tls: {
      rejectUnauthorized: false
    }
  }));
  const resetUrl = `${'http://localhost:4200/rest'}?token=${token}`;
  let emailDetails = {
    from: "safynazabdelraheem@gmail.com",
    to: companyEmail,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset. Please click the following link to reset your password:</p><a href="${resetUrl}">Reset Password</a>`
  };
  transporter.sendMail(emailDetails, async (error, data) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Error sending email', error: error.message });
    } else {
      console.log('Email sent:', data.response);
      await new companyTokenModel({ companyId: existingCompany._id, token }).save();
      res.status(200).json({ message: 'Email sent successfully' });
    }
  });
};

const resetPassword = async (req, res, next) => {
  try {
    const token = req.query.token; // Extract token from query parameters
    const { newPassword, confirmPassword } = req.body;

    console.log('Received Data:', req.body);

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields must be provided' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    // Verify the token synchronously using async/await
    const decodedToken = await jwt.verify(token, 'This_is_my_jwt');
    console.log('Decoded Token:', decodedToken);

    const companyEmail = decodedToken.data.companyEmail;
    console.log('Company Email:', companyEmail);

    const user = await companyModel.findOne({ companyEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(newPassword, salt);
    
    // user.companyPassword = encryptedPassword;
    // console.log("compare",user.companyPassword,encryptedPassword)
    const updatedUser = await companyModel.findOneAndUpdate(
      {_id:user._id},
      {companyPassword:encryptedPassword},
      {new:true}
    )
    await updatedUser.save();

    console.log('Password updated successfully for email:', companyEmail);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Reset link is expired' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};





















const getCompanyById = async (req, res) => {
  let { id } = req.params;
  try {
    let company = await companyModel.findById(id).exec();
    if (company) {
      res.status(200).json({ message: "success", data: company });
    } else {
      res.status(400).json({ message: `Company doesn't exist` });
    }
  } catch (err) {
    res.status(500).json({ message: `try again please` });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    let allCompany = await companyModel.find();
    res.status(200).json({ message: "succes", data: allCompany });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

const updateCompanyData = async (req, res) => {
  let { id } = req.params;
  let { name } = req.body;

  try {
    let updatedData = await companyModel.findByIdAndUpdate(
      id,
      { companyName: name },
      { new: true }
    );
    res
      .status(200)
      .json({ message: `company data updated Sucessfully`, data: updatedData });
  } catch (error) {
    res.status(422).json({ message: error.message });
  }
};

const deleteCompanyData = async (req, res) => {
  let { id } = req.params;
  try {
    const deleteCompanyAccount = await companyModel.findByIdAndDelete(id);
    if (deleteCompanyAccount) {
      res.status(200).json({ message: `account deleted Successfully` });
    } else {
      res.status(404).json({ message: `account not found ` });
    }
  } catch (error) {
    res.status(422).json({ message: error.message });
  }
};

// search by city
const getCompaniesByCity = async (req, res) => {
  let { city } = req.params;
  try {
    let companies = await companyModel.find({ "companyLocation.city": city });
    if (companies.length > 0) {
      res.status(200).json({ message: "success", data: companies });
    } else {
      res.status(404).json({ message: `No companies found in ${city}` });
    }
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// count by city
const countCompaniesInCity = async (req, res) => {
  let { city } = req.params;

  try {
    if (!city) {
      return res.status(400).json({ message: "City parameter is required" });
    }

    let count = await companyModel.countDocuments({
      "companyLocation.city": city,
    });
    res.status(200).json({ message: "success", count: count });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};
// count all companies

const countAllCompanies = async (req, res) => {
  try {
    let count = await companyModel.countDocuments();
    // console.log(`Number of companies: ${count}`);
    res.status(200).json({ message: "success", count: count });
  } catch (error) {
    // console.error(`Error counting all companies: ${error.message}`);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};



const logout = (req, res) => {
  res.clearCookie('token');
  console.log('Token cleared from cookies');
  res.status(200).json({ message: 'Logout successful' });
};






module.exports = {signup, getCompanyById,getAllCompanies, companyLogin,updateCompanyData,deleteCompanyData,getCompaniesByCity,countCompaniesInCity,countAllCompanies,sendEmail,resetPassword,logout};
