import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const Schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: validator.isEmail,
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  subscription: {
    id: String,
    status: String,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  playlist: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
      },
      poster: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordExpire: String,
});

// hash the password  and update the password with hashed one before saving the user
Schema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
  next();
});

// get jwt token
Schema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  }); // generate jwt token by passing payload and secret and return
};

// compare user entered password with hashed password
Schema.methods.comparePassword = function (password) {
  // console.log("this.password", this.password);
  // console.log("password", password);
  return bcrypt.compare(password, this.password);
};

// reset token
Schema.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  // console.log("reset token: ", resetToken);
  // console.log("this.resetPasswordToken", this.resetPasswordToken);
  return resetToken;
};

// export user
export const User = mongoose.model("User", Schema);
