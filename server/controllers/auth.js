// Get user with populated downloads
export const getUserWithDownloads = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await users.findById(id).populate("downloads");
    if (!user) return res.status(404).json({ message: "User not found" });
    // Format downloads for frontend
    const downloads = (user.downloads || []).map(v => ({
      _id: v._id,
      videotitle: v.videotitle,
      filename: v.filename,
      videochanel: v.videochanel,
      createdAt: v.createdAt
    }));
    res.json({ downloads });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch downloads" });
  }
};
import mongoose from "mongoose";
import users from "../Modals/Auth.js";

export const login = async (req, res) => {
  const { email, name, image } = req.body;

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({ email, name, image });
      return res.status(201).json({ result: newUser });
    } else {
      return res.status(200).json({ result: existingUser });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
