import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { VscSyncIgnored } from "react-icons/vsc";

// Helper to build a tree from file paths
function buildFileTree(files) {
  const root = {};
  files.forEach(file => {
    const parts = file.filepath.split("/").filter(Boolean); // remove empty
    let node = root;
    parts.forEach((part, idx) => {
      if (!node[part]) {
        node[part] = idx === parts.length - 1 ? { __file: file } : {};
      }
      node = node[part];
    });
  });
  return root;
}

function isAllIgnored(node) {
  // If this is a file node
  if (node.__file) return !!node.__file.ignoreFile;
  // If this is a folder, check all children
  const entries = Object.values(node);
  if (entries.length === 0) return false;
  return entries.every(isAllIgnored);
}

function collectFileIds(node) {
  // Recursively collect all file ids under this node
  if (node.__file) return [node.__file.id];
  return Object.values(node).flatMap(collectFileIds);
}

function FileTree({ node, parentPath = "", refreshTree, onFilesUpdated }) {
  // Sort keys alphabetically, folders first, then files
  const sortedEntries = Object.entries(node).sort(([aName, aVal], [bName, bVal]) => {
    // Folders before files
    const aIsFile = aVal && aVal.__file;
    const bIsFile = bVal && bVal.__file;
    if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
    // Alphabetical
    return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
  });

  async function toggleIgnore(ids, current) {
    const res = await fetch('/file-sync/ignore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, ignoreFile: current ? 0 : 1 })
    });
    const data = await res.json();
    if (data && data.updated && onFilesUpdated) {
      onFilesUpdated(data.updated);
    } else if (refreshTree) {
      refreshTree();
    }
  }

  return (
    <ul style={{ listStyle: "none", paddingLeft: 18 }}>
      {sortedEntries.map(([name, value]) => {
        if (value && value.__file) {
          // It's a file
          const file = value.__file;
          const isIgnored = !!file.ignoreFile;
          return (
            <li key={file.id} style={{ marginBottom: 2, display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="file">📄</span>{" "}
              <span style={isIgnored ? { textDecoration: "line-through", color: "#888" } : {}}>{file.filename}</span>
              {file.fileurl && (
                <>
                  {" "}
                  <a href={file.fileurl} target="_blank" rel="noopener noreferrer">[link]</a>
                </>
              )}
              <button
                title={isIgnored ? "Unignore file" : "Ignore file"}
                onClick={() => toggleIgnore([file.id], isIgnored)}
                style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: isIgnored ? '#8888aa' : '#eb4034', fontSize: '1em' }}
              >
                <VscSyncIgnored />
              </button>
            </li>
          );
        } else {
          // It's a folder
          const allIgnored = isAllIgnored(value);
          const ids = collectFileIds(value);
          return (
            <li key={name} style={{ marginBottom: 2 }}>
              <details>
                <summary>
                  <span role="img" aria-label="folder">📁</span>{" "}
                  <span style={allIgnored ? { textDecoration: "line-through", color: "#888" } : {}}>{name}</span>
                  {ids.length > 0 && (
                    <button
                      title={allIgnored ? "Unignore all files in folder" : "Ignore all files in folder"}
                      onClick={e => { e.stopPropagation(); toggleIgnore(ids, allIgnored); }}
                      style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: allIgnored ? '#8888aa' : '#eb4034', fontSize: '1em' }}
                    >
                      <VscSyncIgnored />
                    </button>
                  )}
                </summary>
                <FileTree node={value} parentPath={parentPath + "/" + name} refreshTree={refreshTree} onFilesUpdated={onFilesUpdated} />
              </details>
            </li>
          );
        }
      })}
    </ul>
  );
}

export default function Files() {
  const [tree, setTree] = useState({});
  const [flatFiles, setFlatFiles] = useState({});
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    async function loadFiles() {
      const res = await fetch("/file-sync");
      const data = await res.json();
      setTree(buildFileTree(data.files || []));
      // Build a flat map for quick updates
      const flat = {};
      (data.files || []).forEach(f => { flat[f.id] = f; });
      setFlatFiles(flat);
    }
    loadFiles();
  }, [refresh]);

  function refreshTree() {
    setRefresh(r => r + 1);
  }

  // Incrementally update files in the tree
  function handleFilesUpdated(updatedFiles) {
    if (!updatedFiles || updatedFiles.length === 0) return;
    setFlatFiles(prev => {
      const next = { ...prev };
      updatedFiles.forEach(f => {
        if (next[f.id]) next[f.id] = { ...next[f.id], ignoreFile: f.ignoreFile };
      });
      // Rebuild the tree with updated ignoreFile values
      setTree(buildFileTree(Object.values(next)));
      return next;
    });
  }

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: "2rem" }}>
      <h1 style={{ marginTop: 0, marginBottom: "2rem", fontSize: "2rem", fontWeight: 700 }}>
        File Sync Table
      </h1>
      <Link to="/" style={{ display: "inline-block", marginBottom: "1em" }}>
        &#8592; Back to Main
      </Link>
      <div style={{ marginTop: "1.5rem", background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
        <FileTree node={tree} refreshTree={refreshTree} onFilesUpdated={handleFilesUpdated} />
      </div>
    </div>
  );
}
