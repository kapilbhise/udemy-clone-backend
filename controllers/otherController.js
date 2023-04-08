import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Stats } from "../models/Stats.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { sendMail } from "../utils/sendEmail.js";

// contact  form
export const contact = catchAsyncError(async (req, res, next) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return next(new ErrorHandler("All fields must be provided", 400));
  }

  // send email
  const to = process.env.MY_MAIL;
  const subject = "Contact from CourseBundler";
  const text = `I am ${name} and my email is ${email}.\n${message}`;

  await sendMail(to, subject, text);
  return res.status(200).json({
    success: true,
    message: "Your message was sent successfully",
  });
});

// create course request
export const courseRequest = catchAsyncError(async (req, res, next) => {
  const { name, email, course } = req.body;
  if (!name || !email || !course) {
    return next(new ErrorHandler("All fields must be provided", 400));
  }

  // send email
  const to = process.env.MY_MAIL;
  const subject = "Requesting for a course";
  const text = `I am ${name} and my email is ${email}.\nI want the course ${course}`;

  await sendMail(to, subject, text);
  return res.status(200).json({
    success: true,
    message: "Your request has been successfully sent",
  });
});

// get admin dashboard stats
export const getDashboardStats = catchAsyncError(async (req, res, next) => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(12);

  const statsData = [];

  for (let i = 0; i < stats.length; i++) {
    statsData.unshift(stats[i]); // add to start of stats
  }

  const requiredSize = 12 - stats.length;

  for (let i = 0; i < requiredSize; i++) {
    statsData.unshift({
      users: 0,
      subscriptions: 0,
      views: 0,
    }); // add to start of stats
  }

  const usersCount = statsData[11].users;
  const subscriptionsCount = statsData[11].subscriptions;
  const viewsCount = statsData[11].views;

  let usersPercentage = 0,
    viewsPercentage = 0,
    subscriptionsPercentage = 0;

  let usersProfit = true,
    viewsProfit = true,
    subscriptionsProfit = true;
  if (statsData[10].users === 0) {
    usersPercentage = usersCount * 100;
  }
  if (statsData[10].views === 0) {
    viewsPercentage = viewsCount * 100;
  }
  if (statsData[10].subscriptions === 0) {
    subscriptionsPercentage = subscriptionsCount * 100;
  } else {
    const difference = {
      users: statsData[11].users - statsData[10].users,
      views: statsData[11].views - statsData[10].views,
      subscriptions: statsData[11].subscriptions - statsData[10].subscript,
    };
    usersPercentage = (difference.users * 100) / statsData[10].users;
    viewsPercentage = (difference.views * 100) / statsData[10].views;
    subscriptionsPercentage =
      (difference.subscriptions * 100) / statsData[10].subscriptions;

    if (usersPercentage < 0) {
      usersProfit = false;
    }
    if (subscriptionsPercentage < 0) {
      subscriptionsProfit = false;
    }
    if (viewsPercentage < 0) {
      viewsProfit = false;
    }
  }

  return res.status(200).json({
    success: true,
    stats: statsData,
    usersCount: usersCount,
    subscriptionsCount: subscriptionsCount,
    viewsCount: viewsCount,
    usersPercentage: usersPercentage,
    viewsPercentage: viewsPercentage,
    subscriptionsPercentage: subscriptionsPercentage,
    usersProfit: usersProfit,
    viewsProfit: viewsProfit,
    subscriptionsProfit: subscriptionsProfit,
  });
});
