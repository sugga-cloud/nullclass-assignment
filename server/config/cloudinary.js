import video from "../Modals/video.js";
import cloudinary from "../config/cloudinary.js";

export const uploadvideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload an MP4 video file only" });
  }

  try {
    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video", // IMPORTANT for mp4
      folder: "videos",       // optional: folder in cloudinary
    });

    // Save details in MongoDB
    const file = new video({
      videotitle: req.body.videotitle,
      filename: req.file.originalname,
      filepath: result.secure_url, // cloudinary URL
      filetype: req.file.mimetype,
      filesize: req.file.size,
      videochanel: req.body.videochanel,
      uploader: req.body.uploader,
      public_id: result.public_id, // helpful for future deletions
    });

    await file.save();
    return res.status(201).json({ message: "File uploaded successfully", file });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallvideo = async (req, res) => {
  try {
    const files = await video.find();
    return res.status(200).json(files);
  } catch (error) {
    console.error("Fetch Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
