import jwt from "jsonwebtoken";

import ErrorHandler from "../utils/ErrorHandler.js";
import { User } from "../models/User.js";
import { catchAsyncError } from "./catchAsyncError.js";

// check if it is authenticated i.e logged in or not
export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("User not logged in", 401)); //unauthorized
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded._id);
  //   console.log(req.user);
  next();
});

// authorrised admin i.e. check if user is admin or not
export const authorizedAdmin = (req, res, next) => {
  if (req.user.role != "admin") {
    return next(
      new ErrorHandler(
        `${req.user.role} is not not allowed to access this resource`,
        403 //not authorized
      )
    );
  }
  next();
};

// check if user is already subscribed or not
export const authorizedSubscriber = (req, res, next) => {
  if (req.user.subscription.status !== "active" && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `Only subscribers can access this`,
        403 //not authorized
      )
    );
  }
  next();
};
