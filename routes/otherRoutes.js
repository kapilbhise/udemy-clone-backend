import express from "express";
import {
  contact,
  getDashboardStats,
  courseRequest,
} from "../controllers/otherController.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/Auth.js";

// router
const router = express.Router();

// contact form
router.route("/contact").post(contact);

// request form
router.route("/courserequest").post(courseRequest);

// get admin dashboard stats
router
  .route("/admin/stats")
  .get(isAuthenticated, authorizedAdmin, getDashboardStats);

// export router
export default router;
