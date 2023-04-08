import express from "express";
import {
  getAllCourses,
  createCourse,
  getCourseLectures,
  addLecture,
  deleteCourse,
  deleteLecture,
} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import {
  authorizedAdmin,
  isAuthenticated,
  authorizedSubscriber,
} from "../middlewares/Auth.js";

const router = express.Router();

// get all courses without lectures
router.route("/courses").get(getAllCourses);

// create a new course :only admin
router
  .route("/createCourse")
  .post(isAuthenticated, authorizedAdmin, singleUpload, createCourse);

// get course lectures, add lecture, delete course
router
  .route("/course/:id")
  .get(isAuthenticated, authorizedSubscriber, getCourseLectures)
  .post(isAuthenticated, authorizedAdmin, singleUpload, addLecture)
  .delete(isAuthenticated, authorizedAdmin, deleteCourse);

//delete lecture
router
  .route("/lecture")
  .delete(isAuthenticated, authorizedAdmin, deleteLecture);

// get course details

//delete lecture

export default router;
