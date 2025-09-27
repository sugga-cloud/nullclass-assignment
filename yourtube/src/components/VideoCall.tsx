import io from "socket.io-client";
import { useRef, useState, useEffect } from "react";

const SIGNAL_URL =
  process.env.NEXT_PUBLIC_SIGNAL_URL ||
  "https://nullclass-assignment-1serser.onrender.com";

const VideoCall: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<any>(null);

  // --- Recorder ---
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

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
        await handleOffer(data);
      } else if (data.type === "answer") {
        await handleAnswer(data);
      } else if (data.candidate) {
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
        socketRef.current.emit("signal", { room, data: e.candidate });
      }
    };

    pc.ontrack = (e) => {
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

      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = combinedStream;
      }

      return combinedStream;
    } catch (err) {
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
    } catch (err) {
      console.error("createOffer error:", err);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    const pc = pcRef.current || createPeerConnection();
    const stream = await getDisplayAndMicStream();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current.emit("signal", { room, data: answer });

    await flushCandidates();
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    await flushCandidates();
  };

  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!pcRef.current) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    if (
      !pcRef.current.remoteDescription ||
      !pcRef.current.remoteDescription.type
    ) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("ICE error:", err);
    }
  };

  const flushCandidates = async () => {
    if (!pcRef.current) return;
    const candidates = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const c of candidates) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
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

  // --- RECORDING ---
  const startRecording = () => {
    if (!localVideoRef.current || !remoteVideoRef.current) {
      setStatus("Video not ready for recording");
      return;
    }

    // Merge local + remote streams into one
    const combinedStream = new MediaStream();

    const localTracks = (localVideoRef.current.srcObject as MediaStream)
      ?.getTracks();
    const remoteTracks = (remoteVideoRef.current.srcObject as MediaStream)
      ?.getTracks();

    localTracks?.forEach((t) => combinedStream.addTrack(t));
    remoteTracks?.forEach((t) => combinedStream.addTrack(t));

    try {
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });
      recorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `video-call-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      recorder.start();
      setRecording(true);
      setStatus("Recording started...");
    } catch (err) {
      console.error("Recorder error:", err);
      setStatus("Recording not supported.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      setRecording(false);
      setStatus("Recording stopped. Downloading file...");
    }
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
      <button onClick={handleJoin} className="btn">
        Join Room
      </button>

      <div className="text-sm text-gray-600 my-2">{status}</div>

      <div className="flex gap-4">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-1/2 border bg-black"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-1/2 border bg-black"
        />
      </div>

      {joined && (
        <div className="mt-4">
          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Stop Recording
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCall;
