import express from "express";
import {
  register,
  login,
  logout,
  getMyProfile,
  changePassword,
  updateProfile,
  updateProfilePicture,
  forgetPassword,
  resetPassword,
  addToPlaylist,
  removeFromPlaylist,
  getaAllUsers,
  updateUserRole,
  deleteUser,
  deleteMyProfile,
} from "../controllers/userController.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/Auth.js";
import singleUpload from "../middlewares/multer.js";

// router
const router = express.Router();

// user registration
router.route("/register").post(singleUpload, register);

// user login
router.route("/login").post(login);

// user logout
router.route("/logout").post(logout);

// get my profile
router.route("/me").get(isAuthenticated, getMyProfile);

// get my profile
router.route("/me").delete(isAuthenticated, deleteMyProfile);

// change password
router.route("/changepassword").put(isAuthenticated, changePassword);

// update profile
router.route("/updateprofile").put(isAuthenticated, updateProfile);

// update profile picture
router
  .route("/updateprofilepicture")
  .put(isAuthenticated, singleUpload, updateProfilePicture);

// forget password
router.route("/forgetpassword").post(forgetPassword);

// forget password
router.route("/resetpassword/:token").put(resetPassword);

// add course to playlist
router.route("/addtoplaylist").post(isAuthenticated, addToPlaylist);

//remove course from playlist
router.route("/removefromplaylist").delete(isAuthenticated, removeFromPlaylist);

// Admin routes
// get all users
router
  .route("/admin/users")
  .get(isAuthenticated, authorizedAdmin, getaAllUsers);

//update user role
router
  .route("/admin/users/:id")
  .put(isAuthenticated, authorizedAdmin, updateUserRole)
  .delete(isAuthenticated, authorizedAdmin, deleteUser);

// export
export default router;
