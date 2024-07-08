const JobModel = require('../models/JobModel');
const company =require('../models/CompanyModel')

const getAllJobs = async (req, res) => {
    try {
        let jobs = await JobModel.find().populate('companyId', 'companyLogo companyName');

        res.status(200).json({
            jobs: jobs.map(job => {
                let companyLogo = null;
                let companyName = null;

                if (job.companyId) {
                    companyLogo = job.companyId.companyLogo;
                    companyName = job.companyId.companyName;
                } else {
                    console.error(`Company ID is null for job ID: ${job._id}`);
                }

                return {
                    ...job.toObject(),
                    companyLogo,
                    companyName
                };
            })
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
 


const getJobById = async (req, res) => {
    let { id } = req.params;
    try {
        let foundedJob = await JobModel.findById(id).populate('companyId', 'companyLogo companyName');
        if (foundedJob) {
            res.status(200).json({ 
                foundedJob: {
                    ...foundedJob.toObject(),
                    companyLogo: foundedJob.companyId.companyLogo,
                    companyName: foundedJob.companyId.companyName
                }
            });
        } else {
            res.status(404).json({ message: 'Job not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const getJobsByCompanyId = async (req, res) => {
    const { companyId } = req.params;
    try {
        const jobs = await JobModel.find({ companyId }).populate('companyId', 'companyLogo companyName');
        if (jobs.length > 0) {
            res.status(200).json({
                jobs: jobs.map(job => ({
                    ...job.toObject(),
                    companyLogo: job.companyId.companyLogo,
                    companyName: job.companyId.companyName
                }))
            });
        } else {
            res.status(404).json({ message: 'No jobs found for the specified company ID' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const foundedJobByIdDona = async (req, res) => {
    let { id } = req.params;
    try {
        let foundedJob = await JobModel.findById(id).populate('companyId', 'companyLogo companyName');
        if (foundedJob) {
            res.status(200).json({ 
                    ...foundedJob.toObject(),
                    companyLogo: foundedJob.companyId.companyLogo,
                    companyName: foundedJob.companyId.companyName
            });
        } else {
            res.status(404).json({ message: 'Job not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


const getJobsByCompanyName = async (req, res) => {
    let { companyName } = req.params;
    try {
        let jobs = await JobModel.find({ companyName });
        if (jobs.length > 0){
            res.status(200).json({ jobs });
        }else {
            res.status(404).json({ message: 'No jobs found for the specified company name' });
        }
    }catch (error) {
        res.status(500).json({ message: error.message });
    }
}


const getJobsBySalary = async (req, res) => {
    try {
        let jobs = await JobModel.find().sort({ salary: -1 });
        if (jobs.length > 0) {
            res.status(200).json({ jobs });
        } else {
            res.status(404).json({ message: 'No jobs found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


const postNewJob = async (req, res) => {
    const job = req.body;
    try {
        const newJob = await JobModel.create(job);
        res.status(201).json({ newJob });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


const updateJobById = async (req, res) => {
    let { id } = req.params;
    let job = req.body;
    try {
        let updatedJob = await JobModel.findByIdAndUpdate(id, job, { new: true });
        if (updatedJob) {
            res.status(200).json({ updatedJob });
        } else {
            res.status(404).json({ message: "Job not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const deleteJobById = async (req, res) => {
    let { id } = req.params;
    try {
        let deletedJob = await JobModel.findByIdAndDelete(id);
        if (deletedJob) {
            res.status(200).json({ message: 'Job deleted successfully', deletedJob });
        } else {
            res.status(404).json({ message: "Job not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const deleteAllJobs = async (req, res) => {
    try {
        let deletedJobs = await JobModel.deleteMany();
        if (deletedJobs.deletedCount > 0) {
            res.status(200).json({ message: 'All jobs deleted successfully' });
        } else {
            res.status(404).json({ message: 'No jobs found to delete' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



const filterJobsByLocationState = async (req, res) => {
    let { State } = req.params
    try {
        let jobs = await JobModel.find({ 'jobLocation.State':State });
        if (jobs.length > 0) {
            res.status(200).json({ jobs });
        } else {
            res.status(404).json({ message: 'No jobs found for the specified location' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const filterSalaryBudget= async (req, res) => {
    const { minBudget, maxBudget } = req.body;
    try {
      const filterdSalary = await Job.find({
        salary: { $gte: minBudget,$lte: maxBudget }
      });
      res.status(200).send(filterdSalary);
    } catch (error) {
      res.status(500).send(error);
    }
  };

const filterJobsByLocationGovernment=async(req,res)=>{

    let { government } = req.params;
    try{
        let Jobs=await JobModel.find({'jobLocation.government':government})
    if(Jobs.length>0){
        res.status(200).json({Jobs})
    }else res.status(404).json({Jobs})
    }catch(error)
    {
        res.status(500).json({message:error.message})
    }
}

const getAllCounts = async (req, res) => {
    try {
        let count = await JobModel.find().countDocuments();
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getCountByCompanyName=async(req,res)=>{
try{

    let {companyName}=req.params;
    let JobCount=await JobModel.find({companyName}).countDocuments()

res.status(200).json({count:JobCount})

}catch(error){
    res.status(500).json({message:error.message})
}}



const getCountByState=async(req,res)=>{
try{
    let {State}=req.params
    let JobCount=await JobModel.find({'jobLocation.State':State}).countDocuments()
    res.status(200).json({JobCount})
}catch(error){
    res.status(500).json({message:error.message})
}
}



//module.exports = {postNewJob,getAllJobs,getJobById,updateJobById,deleteJobById,deleteAllJobs,getJobsByCompanyName,filterJobsByLocationState,getJobsBySalary,filterJobsByLocationGovernment,getCountByCompanyName,getCountByState,getAllCounts,filterSalaryBudget};
// const filterSalaryBudget= async (req, res) => {
//     const { minBudget, maxBudget } = req.body;
//     try {
//       const filterdSalary = await Job.find({
//         salary: { $gte: minBudget,$lte: maxBudget }
//       });
//       res.status(200).send(filterdSalary);
//     } catch (error) {
//       res.status(500).send(error);
//     }
//   };



module.exports = {filterSalaryBudget,postNewJob,getAllJobs,getJobById,updateJobById,deleteJobById,deleteAllJobs,getJobsByCompanyName,filterJobsByLocationState,getJobsBySalary,filterJobsByLocationGovernment,getCountByCompanyName,getCountByState,getAllCounts,getJobsByCompanyId, foundedJobByIdDona};
