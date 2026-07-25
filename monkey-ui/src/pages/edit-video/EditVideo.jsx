import { useState, useEffect } from "react";
import axios from "axios";
import { baseUrl } from "../homepage/const";

export default function EditVideo() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [degrees, setDegrees] = useState(0);
  const [mode, setMode] = useState("download"); // 'download' or 'rotate'

  const handleSubmit = async () => {
    try {
      if (mode === "download") {
        const res = await axios.post(`${baseUrl}/api/video/download`, { url });
        setJobId(res.data.jobId);
      } else {
        const res = await axios.post(`${baseUrl}/api/video/rotate`, { url, degrees });
        setJobId(res.data.jobId);
      }
    } catch (err) {
      console.error(err);
    }
  };
  // 2. poll progress
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/video/progress/${jobId}`);

        const data = res.data.data;

        setProgress(data.progress);
        setStatus(data.status);

        if (data.status === "done" || data.status === "error") {
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div style={styles.container}>
      <h2>Edit / Rotate Video</h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>
          <input type="radio" checked={mode === "download"} onChange={() => setMode("download")} />{" "}
          Download original
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="radio" checked={mode === "rotate"} onChange={() => setMode("rotate")} />{" "}
          Rotate and download
        </label>
      </div>

      <input
        style={styles.input}
        placeholder="Nhập URL video (mp4 or page)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      {mode === "rotate" && (
        <div style={{ marginBottom: 12 }}>
          <label>Degrees: </label>
          <input
            type="number"
            value={degrees}
            onChange={(e) => setDegrees(Number(e.target.value))}
            style={{ width: 80, marginLeft: 8 }}
          />
          <div style={{ marginTop: 8 }}>
            <video
              src={url}
              controls
              style={{ maxWidth: "100%", transform: `rotate(${degrees}deg)` }}
            />
          </div>
        </div>
      )}

      <button style={styles.button} onClick={handleSubmit}>
        Start
      </button>

      {jobId && (
        <div style={styles.box}>
          <p>Job ID: {jobId}</p>

          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progress,
                width: `${progress}%`,
              }}
            />
          </div>

          <p>{progress}%</p>
          <p>Status: {status}</p>

          {status === "done" && (
            <button
              style={styles.download}
              onClick={() =>
                (window.location.href =
                  mode === "download"
                    ? `${baseUrl}/api/video/download/${jobId}`
                    : `${baseUrl}/api/video/rotate/download/${jobId}`)
              }>
              Download
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 500,
    margin: "50px auto",
    fontFamily: "Arial",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
  },
  button: {
    padding: 10,
    width: "100%",
    cursor: "pointer",
  },
  box: {
    marginTop: 20,
    padding: 20,
    border: "1px solid #ddd",
  },
  progressBar: {
    width: "100%",
    height: 10,
    background: "#eee",
    marginTop: 10,
  },
  progress: {
    height: "100%",
    background: "green",
    transition: "0.3s",
  },
  download: {
    marginTop: 10,
    padding: 10,
    cursor: "pointer",
  },
};
