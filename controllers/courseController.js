import cloudinary from "cloudinary";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Course } from "../models/Course.js";
import getDataUri from "../utils/dataURI.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// get all courses without lectures
export const getAllCourses = catchAsyncError(async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";
  const courses = await Course.find({
    title: {
      $regex: keyword,
      $options: "i",
    },
    category: {
      $regex: category,
      $options: "i",
    },
  }).select("-lectures");
  console.log(courses);
  res.status(200).json({ success: true, courses: courses });
});

// create a new course
export const createCourse = catchAsyncError(async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new ErrorHandler("Please add all fields", 400));
  }
  const file = req.file;
  console.log("file", file);

  const fileUri = getDataUri(file);

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  // console.log("mycloud: ", mycloud);
  await Course.create({
    title,
    description,
    category,
    createdBy,
    poster: {
      public_id: mycloud.public_id, //mycloud.public_id
      url: mycloud.secure_url, //mycloud.secure_url
    },
  });
  return res.status(201).json({
    success: true,
    message: "Course created Successfully. You can add lectures now.",
  });
});

//get course lectures
export const getCourseLectures = catchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  console.log(course);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  // update the views and save the course
  course.view += 1;
  await course.save();

  return res.status(200).json({
    success: true,
    lectures: course.lectures,
  });
});

// add course lecture : max video size 100MB
export const addLecture = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const file = req.file;
  console.log("file", file);

  if (!title || !description || !file) {
    return next(new ErrorHandler("Enter all fiels", 400));
  }

  const course = await Course.findById(id);
  // console.log(course);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  // add file here
  const fileUri = getDataUri(file);

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });

  course.lectures.push({
    title,
    description,
    video: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  // update the number of lectures and save the course
  course.numOfVideos = course.lectures.length;
  await course.save();

  return res.status(200).json({
    success: true,
    message: "Lecture added in course successfully",
  });
});

// delete the course with all the lectures in the course
export const deleteCourse = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return next(new Error("Course not found", 404));
  }

  // configure cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  await cloudinary.v2.uploader.destroy(course.poster.public_id); // delete poster from cloudinary

  for (let i = 0; i < course.lectures.length; i++) {
    const singleLecture = course.lectures[i];
    console.log(singleLecture.video.public_id);
    await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
      resource_type: "video",
    }); //delete lecture
  }

  await Course.deleteOne({ _id: id }); //remove course from database
  return res.status(200).json({
    success: true,
    message: "Course deleted Successfully.",
  });
});

//delete lecture
export const deleteLecture = catchAsyncError(async (req, res, next) => {
  const { courseId, lectureId } = req.query;

  const course = await Course.findById(courseId);
  if (!course) {
    return next(new Error("Course not found", 404));
  }

  // get the lecture
  const lecture = course.lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) {
      return item;
    }
  });

  // configure cloudinary and delete lecture from cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: "video",
  });

  // filter the lecture
  course.lectures = course.lectures.filter((item) => {
    if (item._id.toString() !== lectureId.toString()) {
      return item;
    }
  });

  // update no of videos
  course.numOfVideos = course.lectures.length;
  await course.save();

  // for (let i = 0; i < course.lectures.length; i++) {
  //   const singleLecture = course.lectures[i];
  //   console.log(singleLecture.video.public_id);
  //   await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
  //     resource_type: "video",
  //   }); //delete lecture
  // }

  return res.status(200).json({
    success: true,
    message: "Lecture deleted Successfully.",
  });
});
// export default { getAllCourses };

// monitor courses and update the stats views
Course.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  const courses = await Course.find({});
  let totalViews = 0;

  for (let i = 0; i < courses.length; i++) {
    totalViews += courses[i].views;
  }

  stats[0].views = totalViews;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
