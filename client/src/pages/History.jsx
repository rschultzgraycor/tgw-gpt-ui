import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { marked } from "marked";
import { MarkdownConverter } from "../utilities/documentUtils";

export default function History() {
  const [history, setHistory] = useState([]);
  const [modal, setModal] = useState({ open: false, response: "" });

  useEffect(() => {
    async function loadHistory() {
      const res = await fetch("/query-history");
      const data = await res.json();
      setHistory(data.history || []);
    }
    loadHistory();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: "2rem" }}>
      <h1 style={{ marginTop: 0, marginBottom: "2rem", fontSize: "2rem", fontWeight: 700 }}>
        Query History
      </h1>
      <Link to="/" style={{ display: "inline-block", marginBottom: "1em" }}>
        &#8592; Back to Main
      </Link>
      <div style={{ overflowX: "auto", marginTop: "1.5rem" }}>
        <table
          style={{
            borderCollapse: "separate",
            borderSpacing: 0,
            width: "100%",
            background: "#fff",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          }}
        >
          <thead>
            <tr style={{ background: "#f5f7fa" }}>
              <th style={{ padding: "0.75rem", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Query</th>
              <th style={{ padding: "0.75rem", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Time To Result (seconds)</th>
              <th style={{ padding: "0.75rem", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Created DateTime</th>
              <th style={{ padding: "0.75rem", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Created By</th>
              <th style={{ padding: "0.75rem", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Feedback</th>
              <th style={{ padding: "0.75rem", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Response</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => (
              <tr
                key={i}
                style={{
                  background: i % 2 === 0 ? "#f9fafb" : "#fff",
                  transition: "background 0.2s",
                  cursor: "pointer",
                }}
              >
                <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>{row.query}</td>
                <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
                  {row.timeToResult != null ? (row.timeToResult / 1000).toFixed(2) : ""}
                </td>
                <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
                  {row.createdDateTime ? new Date(row.createdDateTime).toLocaleString() : ""}
                </td>
                <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>{row.createdBy ?? ""}</td>
                <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
                  {row.thumbsUp === null ? "" : row.thumbsUp ? "👍" : "👎"}
                </td>
                <td style={{ padding: "0.25rem", borderBottom: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <button 
                      onClick={() => setModal({ open: true, response: row.response })}
                      style={{
                        padding: "0.15rem 0.5rem",
                        fontSize: "0.95rem",
                        borderRadius: "4px",
                        border: "1px solid rgb(97, 218, 251)",
                        background: "rgb(245, 247, 250)",
                        color: "rgb(26, 34, 51)",
                        cursor: "pointer",
                        marginRight: "0.25rem;"
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => MarkdownConverter(row.response, `Response_${i}.docx`)}
                      style={{
                        padding: "0.15rem 0.5rem",
                        fontSize: "0.95rem",
                        borderRadius: "4px",
                        border: "1px solid rgb(97, 218, 251)",
                        background: "rgb(245, 247, 250)",
                        color: "rgb(26, 34, 51)",
                        cursor: "pointer"
                      }}
                    >
                      Save
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal.open && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setModal({ open: false, response: "" })}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "10px",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
              position: "relative",
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModal({ open: false, response: "" })}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#888",
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="prose lg:prose-lg"
              dangerouslySetInnerHTML={{ __html: marked.parse(modal.response || "") }}
              style={{ fontSize: "1.1rem", color: "#222" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}