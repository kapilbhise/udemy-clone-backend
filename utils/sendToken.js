// send token
export const sendToken = (res, user, message, statusCode) => {
  const token = user.getJWTToken(); // get token
  const options = {
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), //expires in 15 days
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };
  // console.log("options:" + options.httpOnly);
  // console.log("token.options:" + token);
  return res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message: message,
    user: user,
  });
};
