import dynamic from "next/dynamic";

const VideoCall = dynamic(() => import("@/components/VideoCall"), { ssr: false });

export default function VideoCallPage() {
  return <VideoCall />;
}
