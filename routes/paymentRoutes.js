import express from "express";

import singleUpload from "../middlewares/multer.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/Auth.js";
import {
  buySubscription,
  cancelSubscription,
  getRazorPayKey,
  paymentVerification,
} from "../controllers/paymentController.js";

// router
const router = express.Router();

// buy subscription
router.route("/subscribe").get(isAuthenticated, buySubscription);

// verify payment and save payment reference in database
router.route("/paymentverification").get(isAuthenticated, paymentVerification);

// get razorpay key
router.route("/razorpaykey").get(getRazorPayKey);

// cancel subscription
router.route("/subscribe/cancel").delete(isAuthenticated, cancelSubscription)

// export router
export default router;
