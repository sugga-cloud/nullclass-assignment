import React, { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Button } from "@/components/ui/button";

const Downloads = () => {
  const { user } = useUser();
  const [downloads, setDownloads] = useState<any[]>([]);
  useEffect(() => {
    // Try to get downloads from localStorage first
    const local = JSON.parse(localStorage.getItem("downloads") || "[]");
      setDownloads(local);
  }, [user]);

  const handleDelete = (id: string) => {
    const updated = downloads.filter((v) => v._id !== id);
    setDownloads(updated);
    localStorage.setItem("downloads", JSON.stringify(updated));
  };
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Your Downloads</h2>
      {downloads.length === 0 ? (
        <p className="text-gray-500">No videos downloaded yet.</p>
      ) : (
        <ul className="space-y-4">
          {downloads.map((video: any) => (
            <li key={video._id} className="flex items-center gap-4">
              <span className="font-medium">{video.videotitle}</span>
              <Button
                onClick={() => {
                  window.open(`${process.env.BACKEND_URL || "http://localhost:5000"}/uploads/${video.filename}`);
                }}
                variant="outline"
              >
                Download Again
              </Button>
              <Button
                onClick={() => handleDelete(video._id)}
                variant="destructive"
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Downloads;
