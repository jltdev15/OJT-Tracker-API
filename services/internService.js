const User = require("../models/User.Model");
const Intern = require("../models/Intern.Model");
const InternVacancy = require("../models/InternVacancy.Model");
const InternApplication = require("../models/InternApplication.Model");
const jwtUtils = require("../utils/jwtUtils");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
class InternService {
  async loginIntern(username, password) {
    const user = await User.findOne({ username });
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? jwtUtils.generateToken(user._id) : null;
  }
  async getInternInformation(id) {
    const userData = await User.findOne({ _id: id }).exec();
    const profileData = await Intern.findOne({ _id: userData.profile });
    // .populate("appliedInternships")
    // .exec();
    console.log(profileData);
    return profileData;
  }
  // async getVacancy() {
  //   return await InternVacancy.find({ slots: { $gte: 1 } }).populate('hteId').exec();
  // }
  async getVacancy() {
    const allVacancyListed = await InternVacancy.find().populate('hte').exec()
   return allVacancyListed;
  }
  async getSingleVacancy(jobId) {
    return await InternVacancy.find({ _id: jobId }).exec();
  }
  async getInternApplicationList(id) {
    return await InternApplication.find({ internId: id });
  }
  async applyInternship(userId, jobId, payload) {
    console.log(jobId);
    console.log(userId);
    console.log(payload[0].path);
    console.log(payload[1].path);
    const userData = await User.findOne({_id:userId})
    console.log(userData);
    
    const vacancyData = await InternVacancy.findById({ _id: jobId });

    function checkDuplicate(obj) {
      return obj.toString() === userId;
    }
    const checkApplication = vacancyData.applicants.some(checkDuplicate);
    if (checkApplication) {
      return {
        ErrorMessage: 'Duplicate application'
      };
    }
    // pushing jobid to interns profile
    const intern = await User.findOne({ _id: userId });
    const profileId = intern.profile;
    const profileData = await Intern.findOne({ _id: profileId });
    const checkDuplicateApply = profileData.appliedInternships.some(
      (obj) => obj.toString() === jobId
    );
    if (checkDuplicateApply) {
      return {
        ErrorMessage: 'Duplicate application'
      };
    }
    profileData.appliedInternships.push(jobId);
    await profileData.save();

    // New object to save in InternApplication Collection
    const newApplication = new InternApplication({
      hteId: vacancyData.hte,
      internId: userData.profile,
      internVacancy: jobId,
      resumePath: payload[0].path,
      resumeFile: payload[0].filename,
      moaPath: payload[1].path,
      moaFile: payload[1].filename,

    });
    await newApplication.save();
    vacancyData.applicants.push(userData.profile);
    await vacancyData.save();
    return {
      message: 'Application sent'
    }
  }
}

module.exports = new InternService();
