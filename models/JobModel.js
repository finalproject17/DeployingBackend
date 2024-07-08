const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const company = require("./CompanyModel");

const JobSchema = new Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  companyName:{
    type: String,
    ref: 'Company'
  },
  JobTitle: {
    type: String,
    required: [true, "Job Title is required"],
    trim: true,
  },
  JobCategory: {
    type: String,
    required: true,
  },
  JobSubCategory: {
    type: [String],
    default: "other",
  },
  description: {
    type: String,
    required: true,
    maxLength: 1000,
    minLength: 50,
  },
  JobType: {
    type: String,
    enum: ["Full-Time", "Part-Time", "Internship", "Contract"],
    default: "Part-Time",
  },
  salary: { type: { from: Number, to: Number } },
  skills: {
    type: [String]
  },
  JobHours: {
    type: { from: Number, to: Number }
  },
  jobLocation: {
    type: { State: String, government: String },
    trim: true,
  },
  JoblocationType: {
    type: String,
    enum: ["Onsite", "Remote", "Hybrid"],
  },
  jobLevel: {
    type: String,
    enum: ["EntryLevel", "MidLevel", "Senior"],
  },
  jobRequirements: {
    type: [String],
  },
  timeStamp: {
    type: Date,
    default:Date.now
  },
  hiredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["Open", "Closed"],
  },
  JobSeekersCounts: {
    type: Number,
    default: 0,
  },

  additionalJobForm: {
    type: Boolean,
    default:false,
  },
});

const JobModel = mongoose.model("Job", JobSchema);
module.exports = JobModel;
