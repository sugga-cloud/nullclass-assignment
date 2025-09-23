import mongoose from "mongoose";

const commentschema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    commentbody: { type: String },
    usercommented: { type: String },
    commentedon: { type: Date, default: Date.now },
    city: { type: String },
    language: { type: String },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    translatedComment: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentschema);
