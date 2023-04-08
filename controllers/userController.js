import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";

import { sendMail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import getDataUri from "../utils/dataURI.js";
import crypto from "crypto";
import cloudinary from "cloudinary";
import { Stats } from "../models/Stats.js";

//errorHandler
import ErrorHandler from "../ErrorHandler.js";

//register user
export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  // get file from request.file
  const file = req.file;

  // check  if anything is missing
  if (!name || !email || !password || !file) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  // check if user already exist
  let user = await User.findOne({ email: email });
  if (user) {
    return next(new ErrorHandler("User already exists", 409));
  }

  const fileUri = getDataUri(file);
  //configure cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  // upload file on cloudinary
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  sendToken(res, user, "user registered successfully", 201);
});

// login
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  const file = req.file;

  // check  if anything is missing
  if (!email || !password) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  // check if user exist
  const user = await User.findOne({ email: email }).select("+password");

  // if user is null
  if (!user) {
    return next(new ErrorHandler("Incorrect email or password", 401));
  }

  const isMatch = await user.comparePassword(password);
  // console.log("isMatch " + isMatch);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect email or password", 401));
  }
  sendToken(res, user, "Welcome back, " + user.name, 201);
});

// logout
export const logout = catchAsyncError(async (req, res, next) => {
  return res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

// get my profile
export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  // console.log(user.name);
  // console.log(user._id);
  // console.log(user.email);
  // console.log(req.user.id);
  return res.status(200).json({
    success: true,
    user: user,
  });
});

// change password
export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  // check  if anything is missing
  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }
  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) {
    return next(new ErrorHandler("Incorrect OldPassword", 400));
  }

  // if old password matches the set new password
  user.password = newPassword;

  await user.save();
  return res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

//update Profile
export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);
  if (name) {
    user.name = name;
  }
  if (email) {
    user.email = email;
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
  });
});

// update Profile picture
export const updateProfilePicture = catchAsyncError(async (req, res, next) => {
  // get file from request.file
  const file = req.file;
  const fileUri = getDataUri(file);

  const user = await User.findById(req.user._id);

  //configure cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // upload new profile picture
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  // delete latest profile picture
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // set new profile picture avatar url
  user.avatar = {
    public_id: mycloud.public_id,
    url: mycloud.secure_url,
  };

  //save user
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile picture updated successfully",
  });
});

// forgot password
export const forgetPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });

  if (!user) {
    return next(new ErrorHandler("User not found", 400));
  }

  const resetToken = await user.getResetToken();

  await user.save();

  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  // url: http://localhost:3000/resetpassword/hjfwehuifhmdsjkfdsjkfjhdsjgjhfg

  const message =
    "Click on the link  to reset your password: " +
    url +
    " If you have not requested then please ignore";

  //send token via mail
  await sendMail(user.email, "Udemy-clone: Reset password", message);

  return res.status(200).json({
    success: true,
    message: `Reset token has been sent to ${user.email} `,
  });
});

// reset password
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(new ErrorHandler("Token is invalid or expired"));
  }

  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

// add to playlist
export const addToPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.body.id);

  if (!course) {
    return next(new ErrorHandler("Invalid Course ID", 404));
  }
  //check if course is already added to playlist
  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() == course._id.toString()) {
      return true;
    }
  });

  if (itemExist) {
    return next(
      new ErrorHandler(
        "Item already exist: course is already added to the playlist",
        409
      )
    );
  }
  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Course added to playlist successfully",
  });
});

// remove from playlist
export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.query.id);
  console.log("course", course);
  if (!course) {
    return next(new ErrorHandler("Invalid Course ID", 404));
  }

  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) {
      return item;
    }
  });
  // update playlist and save user
  user.playlist = newPlaylist;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Course removed from playlist successfully",
  });
});

// admin routes controllers
// get all users
export const getaAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find({});

  return res.status(200).json({
    success: true,
    message: "accessed all users",
    users,
  });
});

// update user role
export const updateUserRole = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  if (user.role === "user") {
    user.role = "admin";
  } else {
    user.role = "user";
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Role updated successfully",
  });
});

// delete user
export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //configure cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  // delete user details from cloudinary
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // cancel subscription of user

  // delete user details from database
  await User.deleteOne({ _id: req.params.id });

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// delete my profile
export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //configure cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  // delete user details from cloudinary
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // cancel subscription of user

  // delete user details from database
  await User.deleteOne({ _id: req.user._id });

  return res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Profile deleted successfully",
    });
});

// watch the user on change events and update the stats details
User.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);
  const subscription = await User.find({ "subscription.status": "active" });

  stats[0].users = await User.countDocuments();
  stats[0].subscriptions = subscription.length;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
