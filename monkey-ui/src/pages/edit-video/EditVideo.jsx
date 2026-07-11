import { useState, useEffect } from "react";
import axios from "axios";
import { baseUrl } from "../homepage/const";

export default function EditVideo() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${baseUrl}/api/video/download`, {
        url,
      });

      setJobId(res.data.jobId);

      const disposition = res.headers["content-disposition"];

      let fileName = "video.mp4";

      if (disposition) {
        const match = disposition.match(/filename\*=UTF-8''(.+)/);

        if (match) {
          fileName = decodeURIComponent(match[1]);
        }
      }

      const blob = new Blob([res.data], {
        type: "video/mp4",
      });

      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 5000);
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
      <h2>Video Downloader UI</h2>

      <input
        style={styles.input}
        placeholder="Nhập URL video"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

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
              onClick={() => (window.location.href = `${baseUrl}/api/video/download/${jobId}`)}>
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
