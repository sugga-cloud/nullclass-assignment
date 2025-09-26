import video from "../Modals/video.js";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dmhjf0t58",
  api_key: process.env.CLOUDINARY_API_KEY || "375732268832297",
  api_secret: process.env.CLOUDINARY_API_SECRET || "LPMBOd1Bzpyvy_fBaPcNFXJ_dDU",
});
console.log("Cloudinary Configured:", cloudinary.config());
export const uploadvideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload an MP4 video file only" });
  }

  try {
    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video", // for mp4
      folder: "videos",       // optional: saves in "videos/" folder
    });

    // Save details in MongoDB (same schema as before)
    const file = new video({
      videotitle: req.body.videotitle,
      filename: req.file.originalname,
      filepath: result.secure_url, // Cloudinary URL instead of local path
      filetype: req.file.mimetype,
      filesize: req.file.size,
      videochanel: req.body.videochanel,
      uploader: req.body.uploader,
    });

    await file.save();
    return res.status(201).json("File uploaded successfully");
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallvideo = async (req, res) => {
  try {
    const files = await video.find();
    return res.status(200).send(files);
  } catch (error) {
    console.error("Fetch Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
