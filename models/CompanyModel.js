const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const companySchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true
    },
    companyIndustry: {
        type: String,
        required: true
    },
    companyEmail: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(em) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(em);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    companyLogo: {
        type: String
    },
    foundedYear: {
        type: Number,
        required: true,
      },
      phone: {
        type: String,
      },
    createdAt: {
        type: Date,
        default: Date.now
    },
    companyPassword: {
        type: String,
        required: true
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    companyImage: {
        type: String
    },
    companySize: {
        type: String,
      }
}, { timestamps: true });


companySchema.pre('save', async function (next) {
    if (this.isModified('companyPassword')) {
      const salt = await bcrypt.genSalt(10);
      this.companyPassword = await bcrypt.hash(this.companyPassword, salt);
    }
    next();
  });

const companyModel = mongoose.model('Company', companySchema);
module.exports = {companyModel};
