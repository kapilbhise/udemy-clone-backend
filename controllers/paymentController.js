import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { instance } from "../server.js";
import crypto from "crypto";
// import models
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";

// buy a subscription
export const buySubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.role == "admin") {
    return next(new ErrorHandler("Admin don't need to buy subscription", 400));
  }
  const plan_id = process.env.PLAN_ID || "plan_LZmxOgOLbCbAPW";
  //   console.log(user);
  //   console.log(plan_id);
  // create new instance of subscription
  const subscription = await instance.subscriptions.create({
    plan_id: plan_id,
    customer_notify: 1,
    total_count: 12,
  });
  //   console.log(subscription);

  //set the subscription status and subscription id in user instance
  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;

  // save user instance
  await user.save();

  return res.status(201).json({
    success: true,
    subscriptionId: subscription.id,
  });
});

// payment verification
export const paymentVerification = catchAsyncError(async (req, res, next) => {
  const { razorpay_signature, razorpay_payment_id, razorpay_subscription_id } =
    req.body;

  const user = await User.findById(req.user._id);

  if (user.role == "admin") {
    return next(new ErrorHandler("Admin don't need to buy subscription", 400));
  }

  const subscription_id = user.subscription_id;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id + "utf-8")
    .digest("hex");

  // check if generated signature is equal to razorpay signature
  const isAuthentic = razorpay_signature === generated_signature;
  if (!isAuthentic) {
    // redirect to failure page
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfailed`);
  }

  //if is authentic
  // create payment instance in database
  await Payment.create({
    razorpay_signature,
    razorpay_payment_id,
    razorpay_subscription_id,
  });

  // set user subscription status
  user.subscription.status = "active";

  // save user
  await user.save();

  // redirect to success page
  return res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );
});

// get razorpay key
export const getRazorPayKey = catchAsyncError(async (req, res, next) => {
  return res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
});

// cancel subscription
export const cancelSubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const subscriptionId = user.subscription.id;

  let refund = false;
  await instance.subscriptions.cancel(subscriptionId);

  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });

  const gap = Date.now() - payment.createdAt;
  const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;
  if (gap < refundTime) {
    await instance.payments.refund(payment.razorpay_payment_id);
    refund = true;
  }

  await payment.remove(); //await Payment.deleteOne({ _id: id });

  user.subscription.id = undefined;
  user.subscription.status = undefined;
  await user.save();
  return res.status(200).json({
    success: true,
    message: refund
      ? "Subscription cancelled, you will receive full refund in 7 days"
      : "Subscription cancelled, no refund initiated as subscription was cancelled after 7 days",
  });
});
