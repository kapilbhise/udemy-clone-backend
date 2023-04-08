import app from "./app.js";
import { connectDB } from "./config/database.js";
import cloudinary from "cloudinary";
import RazorPay from "razorpay";
import nodeCron from "node-cron";
import { Stats } from "./models/Stats.js";

// connect to database
connectDB();

// configure cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_NAME,
  api_secret: process.CLOUDINARY_API_SECRET,
  secure: true,
});

//create razorpay instance
export const instance = new RazorPay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

// creating a new stat every month on day 1
nodeCron.schedule("0 0 0 1 * *", async () => {
  try {
    await Stats.create();
  } catch (err) {
    console.log(err);
  }
});

// create a new temp stat
// const temp = async () => {
//   await Stats.create({});
// };
// temp();

// listen on port
app.listen(process.env.PORT, () => {
  console.log("server started on port " + process.env.PORT);
});
