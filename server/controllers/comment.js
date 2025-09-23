import mongoose from "mongoose";
import { translate }from "@vitalets/google-translate-api";
import comment from "../Modals/comment.js";

// Like a comment
export const likeComment = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const updated = await comment.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Comment not found" });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Dislike a comment and auto-delete if dislikes reach 2
export const dislikeComment = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const updated = await comment.findByIdAndUpdate(
      id,
      { $inc: { dislikes: 1 } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Comment not found" });

    if (updated.dislikes >= 2) {
      await comment.findByIdAndDelete(id);
      return res.status(200).json({ deleted: true });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Translate comment using Google Translate API
export const translateComment = async (req, res) => {
  const { id } = req.params;
  const { targetLanguage } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }
    if (!targetLanguage) {
      return res.status(400).json({ message: "Target language is required" });
    }

    const comm = await comment.findById(id);
    if (!comm) return res.status(404).json({ message: "Comment not found" });

    const result = await translate(comm.commentbody, { to: targetLanguage });
    comm.translatedComment = result.text;
    await comm.save();

    res.status(200).json(comm);
  } catch (error) {
    res.status(500).json({ message: "Translation failed", error: error.message });
  }
};

// Post a new comment
export const postcomment = async (req, res) => {
  let { commentbody, usercommented, userid, videoid, city, language } = req.body;

  if (!commentbody || !usercommented || !userid || !videoid) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Block comments with unwanted special characters
  if (/[^a-zA-Z0-9\s.,!?]/.test(commentbody)) {
    return res.status(400).json({ message: "Special characters are not allowed in comments." });
  }

  const newComment = new comment({
    commentbody,
    usercommented,
    userid,
    videoid,
    city: city || "Unknown",
    language: language || "Unknown",
    likes: 0,
    dislikes: 0,
    translatedComment: ""
  });

  try {
    await newComment.save();
    return res.status(201).json(newComment);
  } catch (error) {
    console.error("Post comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Get all comments of a video
export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid });
    res.status(200).json(commentvideo);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Delete a comment
export const deletecomment = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid comment ID" });
  }

  try {
    const deleted = await comment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Comment not found" });

    res.status(200).json({ deleted: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Edit a comment
export const editcomment = async (req, res) => {
  const { id } = req.params;
  const { commentbody } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid comment ID" });
  }
  if (!commentbody) {
    return res.status(400).json({ message: "Comment body is required" });
  }

  try {
    const updatecomment = await comment.findByIdAndUpdate(
      id,
      { $set: { commentbody } },
      { new: true }
    );
    if (!updatecomment) return res.status(404).json({ message: "Comment not found" });

    res.status(200).json(updatecomment);
  } catch (error) {
    console.error("Edit comment error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
