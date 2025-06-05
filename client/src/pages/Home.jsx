import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { Link } from "react-router-dom";
import { marked } from "marked";
import { MarkdownConverter } from "../utilities/documentUtils";

export default function Home() {
  const { instance, accounts } = useMsal();
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [meta, setMeta] = useState("");
  const [lastQueryId, setLastQueryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [thumbClicked, setThumbClicked] = useState(false);

  async function sendQuery() {
    setResponse("");
    setLoading(true);
    setThumbClicked(false);
    const request = {
      scopes: [
        `api://de1c371c-8904-44ce-82ae-e2cd07fc4a69/access_as_user`
      ],
      account: accounts[0],
    };
    const { accessToken } = await instance.acquireTokenSilent(request);
    const res = await fetch("/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query,
      }),
    });
    if (!res.body) {
      setResponse("No response body received.");
      setLoading(false);
      return;
    }
    setQuery("");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      chunk.split("data: ").forEach(line => {
        console.info("Received line:", JSON.stringify(line));
        if (line === "[DONE]") return;
        if (line === "[") line = `\n${line}`;
        if (!line.startsWith("[QUERYID]") && !line.startsWith("[TTR]")) {
          setResponse(prev => prev + line);
        }
        if (line.startsWith("[QUERYID]")) {
          const queryId = line.split(" - ")[1];
          setLastQueryId(queryId);
        }
        if (line.startsWith("[TTR]")) {
          const timeToResult = parseInt(line.split(" - ")[1]);
          setMeta(`🕒 Time to Result: ${(timeToResult / 1000).toFixed(2)}s`);
        }
      });
    }
    setLoading(false);
  }

  async function sendFeedback(thumbsUp) {
    await fetch("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queryId: parseInt(lastQueryId), thumbsUp }),
    });
    setThumbClicked(true);
  }

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: "2rem" }}>
      <h1 style={{ marginTop: 0, marginBottom: "2rem", fontSize: "2rem", fontWeight: 700 }}>
        The Graycor Way AI Agent
      </h1>
      <Link to="/history" style={{ display: "inline-block", marginBottom: "1em" }}>
        View Query History
      </Link>
      <textarea
        rows={4}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Enter your question here..."
        style={{ width: "100%", fontSize: "1rem", marginTop: "1rem", backgroundColor: "field", border: "1px solid black", padding: ".4em" }}
      />
      <button 
        onClick={sendQuery} 
        disabled={loading} 
        style={{ 
          width: "100%", 
          fontSize: "1rem", 
          marginTop: "1rem", 
          background: loading ? '#b3e0f7' : '#61dafb',
          color: loading ? '#888' : '#1a2233',
          border: 'none',
          borderRadius: 6,
          fontWeight: 600,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        Submit
      </button>
      {response && 
        (<div id="response" style={{ marginTop: "2rem", background: "#f5f5f5", padding: "1rem", borderRadius: 5 }}>
        {/* <span dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(response) : response }} /> */}
        <div className="prose lg:prose-lg" dangerouslySetInnerHTML={{ __html: marked.parse(response) }} />

        <div style={{ marginTop: "1em" }}>
          <button
            onClick={() => sendFeedback(1)}
            style={{ fontSize: "1.5em" }}
            disabled={loading || !lastQueryId || thumbClicked}
          >
            👍
          </button>
          <button
            onClick={() => sendFeedback(0)}
            style={{ fontSize: "1.5em" }}
            disabled={loading || !lastQueryId || thumbClicked}
          >
            👎
          </button>
          <button
            onClick={() => MarkdownConverter(response, "AI-Response.docx")}
            style={{ fontSize: "1.5em"}}
            disabled={loading || !lastQueryId}
          >
            📄
          </button>
        </div>
      </div>)}
      <div id="meta" style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
        {meta}
      </div>
    </div>
  );
}