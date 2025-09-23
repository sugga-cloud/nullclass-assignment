import video from "../Modals/video.js";
import users from "../Modals/Auth.js";

const PLAN_LIMITS = {
  free: 5,
  bronze: 7,
  silver: 10,
  gold: Infinity
};

export const streamVideo = async (req, res) => {
  const userId = req.user.id;
  const { videoId } = req.params;
  try {
    const user = await users.findById(userId);
    const plan = user.plan || 'free';
    const limit = PLAN_LIMITS[plan];
    // Assume req.query.duration is the requested watch duration in minutes
    const requestedDuration = parseInt(req.query.duration, 10) || 0;
    if (limit !== Infinity && requestedDuration > limit) {
      return res.status(403).json({ message: `Your plan allows only ${limit} minutes per video.` });
    }
    // ...stream logic here (pseudo)
    // const file = await video.findById(videoId);
    // stream file to user
    res.status(200).json({ message: `Streaming allowed for ${Math.min(requestedDuration, limit)} minutes.` });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
