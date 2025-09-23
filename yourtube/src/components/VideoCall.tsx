import io from "socket.io-client";
import { useRef, useState, useEffect } from "react";

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || "https://nullclass-assignment-1serser.onrender.com";

const VideoCall: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<any>(null);

  // --- SOCKET ---
  useEffect(() => {
    if (!joined) return;

    const socket = io(SIGNAL_URL);
    socketRef.current = socket;
    socket.emit("join", room);
    setStatus("Waiting for peer...");

    socket.on("peer-joined", async () => {
      setStatus("Peer joined. Creating offer...");
      await createOffer();
    });

    socket.on("signal", async (data: any) => {
      if (data.type === "offer") {
        console.log("Received offer:", data);
        await handleOffer(data);
      } else if (data.type === "answer") {
        console.log("Received answer:", data);
        await handleAnswer(data);
      } else if (data.candidate) {
        console.log("Received ICE candidate:", data);
        await handleCandidate(data);
      }
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [joined]);

  // --- CREATE PEER ---
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("Sending ICE candidate:", e.candidate);
        socketRef.current.emit("signal", { room, data: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      console.log("Track received:", e.streams[0].getTracks());
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pcRef.current = pc;
    return pc;
  };

  // --- SCREEN SHARE + MIC ---
  const getDisplayAndMicStream = async (): Promise<MediaStream> => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Combine display and mic audio
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = combinedStream;
      }

      console.log("Local stream created:", combinedStream.getTracks());
      return combinedStream;
    } catch (err) {
      console.error("Screen share or mic not available:", err);
      setStatus("Error: Screen share or mic not available.");
      return new MediaStream();
    }
  };

  // --- OFFER/ANSWER ---
  const createOffer = async () => {
    const pc = pcRef.current || createPeerConnection();
    const stream = await getDisplayAndMicStream();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("signal", { room, data: offer });
      console.log("Offer created and sent:", offer);
    } catch (err) {
      console.error("createOffer error:", err);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    const pc = pcRef.current || createPeerConnection();
    const stream = await getDisplayAndMicStream();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log("Remote description set from offer.");

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current.emit("signal", { room, data: answer });
    console.log("Answer created and sent:", answer);

    // Flush queued ICE candidates after remote description is set
    await flushCandidates();
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("Remote description set from answer.");
    await flushCandidates();
  };

  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!pcRef.current) {
      console.log("PC not ready, queuing candidate:", candidate);
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    // If remote description is not set yet, queue the candidate
    if (!pcRef.current.remoteDescription || !pcRef.current.remoteDescription.type) {
      console.log("Remote description not set, queuing candidate:", candidate);
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("ICE candidate added successfully:", candidate);
    } catch (err) {
      console.error("ICE error:", err);
    }
  };

  // After setting remote description, flush queued candidates
  const flushCandidates = async () => {
    if (!pcRef.current) return;
    const candidates = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    console.log(`Flushing ${candidates.length} queued ICE candidates.`);
    for (const c of candidates) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
        console.log("Flushed ICE candidate:", c);
      } catch (err) {
        console.error("ICE flush error:", err);
      }
    }
  };

  const handleJoin = () => {
    if (!room) return;
    setJoined(true);
    setStatus("Joining room...");
  };

  // --- UI ---
  return (
    <div className="p-4 border rounded-lg max-w-xl mx-auto mt-8 bg-white shadow">
      <h2 className="text-lg font-bold mb-2">Screen Sharing Call</h2>

      <input
        type="text"
        placeholder="Room ID"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="border p-1 rounded mr-2"
      />
      <button onClick={handleJoin} className="btn">Join Room</button>

      <div className="text-sm text-gray-600 my-2">{status}</div>

      <div className="flex gap-4">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-1/2 border bg-black" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-1/2 border bg-black" />
      </div>
    </div>
  );
};

export default VideoCall;
