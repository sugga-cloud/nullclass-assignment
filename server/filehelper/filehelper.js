"use strict";
import multer from "multer";
const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    // Sanitize filename: replace spaces and non-ASCII chars with underscores
    const sanitized = file.originalname
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .replace(/\s+/g, "_");
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + sanitized
    );
  },
});
const filefilter = (req, file, cb) => {
  if (file.mimetype === "video/mp4") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage: storage, fileFilter: filefilter });
export default upload;
