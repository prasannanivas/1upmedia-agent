import React, { use, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocialMedia } from "../context/SocialMediaContext";

const BACKEND = "https://ai.1upmedia.com:443/trello";

function SetupTrello() {
  const { loadingPages: loading, trelloProfile } = useSocialMedia();

  console.log("Loading:", loading);
  console.log("Trello Profile:", trelloProfile);
  const [auth, setAuth] = useState({
    accessToken: trelloProfile?.access_token || "",
    accessTokenSecret: trelloProfile?.dynamic_fields?.accessTokenSecret || "",
    username:
      trelloProfile?.username || trelloProfile?.dynamic_fields?.username || "",
    boardId: trelloProfile?.dynamic_fields?.board?.id || "",
  });

  useEffect(() => {
    if (trelloProfile) {
      // Support new profile structure with dynamic_fields
      const accessToken =
        trelloProfile.access_token || trelloProfile.accessToken;
      const accessTokenSecret =
        trelloProfile.dynamic_fields?.accessTokenSecret ||
        trelloProfile.accessTokenSecret;
      const username =
        trelloProfile.username || trelloProfile.dynamic_fields?.username || "";
      const boardId =
        trelloProfile.dynamic_fields?.board?.id || trelloProfile.boardId || "";
      setAuth({ accessToken, accessTokenSecret, username, boardId });

      console.log("Auth set:", { accessToken, accessTokenSecret, username });

      // Fill boards, lists, selectedBoardId from trelloProfile
      const board = trelloProfile.dynamic_fields?.board;

      const workspace = trelloProfile.dynamic_fields?.workspace;
      if (board) {
        setBoards([board]);
        setSelectedBoardId(board.id);
        loadLists(board.id);
        // If board.lists exists, fill lists
        if (board.lists && Array.isArray(board.lists)) {
          setLists(board.lists);
        } else {
          setLists([]);
        }
      } else {
        setBoards([]);
        setLists([]);
        setSelectedBoardId("");
      }
    } else {
      setBoards([]);
      setLists([]);
      setSelectedBoardId("");
    }
  }, [trelloProfile]);

  const { handleTrelloAuth } = useAuth();
  const [workspaceId, setWorkspaceId] = useState("");
  const [boards, setBoards] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [newCard, setNewCard] = useState({ idList: "", name: "", desc: "" });
  const [result, setResult] = useState("");

  // Step 1: OAuth popup
  const openTrelloAuth = () => {
    const popup = window.open(
      `${BACKEND}/auth`,
      "trelloAuthPopup",
      "width=550,height=750"
    );
    window.addEventListener("message", async (event) => {
      if (event.data?.type === "trelloAuthSuccess") {
        const accessToken = event.data.accessToken;
        const accessTokenSecret = event.data.accessTokenSecret;
        const username = event.data.username;
        const boardId = event.data.board?.id || "";

        setAuth({ accessToken, accessTokenSecret, username, boardId });
        setResult("Authenticated as: " + username);

        // 1. Check for 1UPMedia workspace
        let orgId = null;
        let orgData = null;
        try {
          const res = await fetch(
            `${BACKEND}/workspaces?accessToken=${encodeURIComponent(
              accessToken
            )}&accessTokenSecret=${encodeURIComponent(accessTokenSecret)}`
          );
          const data = await res.json();
          if (data.success) {
            orgData = data.workspaces.find((w) => w.name === "1UPMedia");
            if (orgData) {
              orgId = orgData.id;
              setWorkspaceId(orgId);
              setResult("Found workspace: 1UPMedia");
            }
          }
        } catch (err) {
          setResult("Error loading workspaces: " + err.message);
        }

        // 2. Create workspace if not found
        if (!orgId) {
          setResult("Creating workspace: 1UPMedia...");
          try {
            const res = await fetch(`${BACKEND}/create-workspace`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken, accessTokenSecret }),
            });
            const data = await res.json();
            if (data.success) {
              orgId = data.orgId;
              setWorkspaceId(orgId);
              setResult("Workspace created: 1UPMedia");
            } else {
              setResult("Workspace creation failed: " + data.error);
              return;
            }
          } catch (err) {
            setResult("Error: " + err.message);
            return;
          }
        }

        // 3. Check for ROIRecovery board
        let boardData = null;
        try {
          const res = await fetch(
            `${BACKEND}/boards?orgId=${orgId}&accessToken=${encodeURIComponent(
              accessToken
            )}&accessTokenSecret=${encodeURIComponent(accessTokenSecret)}`
          );
          const data = await res.json();
          if (data.success) {
            boardData = data.boards.find((b) => b.name === "ROIRecovery");
            if (boardData) {
              setResult("Found board: ROIRecovery");
            }
          }
        } catch (err) {
          setResult("Error loading boards: " + err.message);
        }

        // 4. Create board if not found
        if (!boardData) {
          setResult("Creating board: ROIRecovery...");
          try {
            const res = await fetch(`${BACKEND}/create-board`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken,
                accessTokenSecret,
                name: "ROIRecovery",
                organizationId: orgId,
              }),
            });
            const data = await res.json();
            if (data.success) {
              boardData = data.board;
              setResult("Board created: ROIRecovery");
            } else {
              setResult("Board creation failed: " + data.error);
              return;
            }
          } catch (err) {
            setResult("Error: " + err.message);
            return;
          }
        }

        // 5. Send everything to handleTrelloAuth
        handleTrelloAuth({
          accessToken,
          accessTokenSecret,
          username,
          workspace: orgData || { id: orgId, name: "1UPMedia" },
          board: boardData,
        });
      }
    });
  };

  // Step 2: Create the workspace (1UPMedia)
  const createWorkspace = async () => {
    setResult("Creating workspace...");
    try {
      const res = await fetch(`${BACKEND}/create-workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          accessTokenSecret: auth.accessTokenSecret,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspaceId(data.orgId);
        setResult("Workspace created: 1UPMedia");
      } else {
        setResult("Workspace creation failed: " + data.error);
      }
    } catch (err) {
      setResult("Error: " + err.message);
    }
  };

  // Step 3: Create board inside the workspace
  const createBoard = async () => {
    if (!workspaceId) return setResult("Workspace not created yet.");
    setResult("Creating board...");
    try {
      const res = await fetch(`${BACKEND}/create-board`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          accessTokenSecret: auth.accessTokenSecret,
          name: "ROIRecovery",
          organizationId: workspaceId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult("Board created: ROIRecovery");
        loadBoards(); // refresh list
      } else {
        setResult("Board creation failed: " + data.error);
      }
    } catch (err) {
      setResult("Error: " + err.message);
    }
  };

  // Step 4: Load boards (restricted to 1UPMedia)
  const loadBoards = async () => {
    if (!workspaceId) return setResult("Workspace not created yet.");
    setResult("Loading boards...");
    if (!auth.accessToken || !auth.accessTokenSecret) {
      setResult("Missing authentication tokens.");
      return;
    }
    try {
      const res = await fetch(
        `${BACKEND}/boards?orgId=${workspaceId}&accessToken=${encodeURIComponent(
          auth.accessToken
        )}&accessTokenSecret=${encodeURIComponent(auth.accessTokenSecret)}`
      );
      const data = await res.json();
      if (data.success) {
        setBoards(data.boards);
        setResult(`Loaded ${data.boards.length} board(s).`);
      } else {
        setResult("Board load error: " + data.error);
      }
    } catch (err) {
      setResult("Error: " + err.message);
    }
  };

  // Step 5: Load lists from selected board
  const loadLists = async (boardId) => {
    setSelectedBoardId(boardId);
    setLists([]);
    setResult("Loading lists...");
    if (!boardId) {
      setResult("No board selected.");
      return;
    }
    if (!auth.accessToken || !auth.accessTokenSecret) {
      setResult("Missing authentication tokens.");
      return;
    }
    try {
      const res = await fetch(
        `${BACKEND}/lists?boardId=${boardId}&accessToken=${encodeURIComponent(
          auth.accessToken
        )}&accessTokenSecret=${encodeURIComponent(auth.accessTokenSecret)}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.lists)) {
        // For each list, fetch cards
        const listsWithCards = await Promise.all(
          data.lists.map(async (list) => {
            try {
              const cardsRes = await fetch(
                `${BACKEND}/cards?boardId=${
                  auth.boardId || boardId
                }&accessToken=${encodeURIComponent(
                  auth.accessToken
                )}&accessTokenSecret=${encodeURIComponent(
                  auth.accessTokenSecret
                )}`
              );
              const cardsData = await cardsRes.json();
              if (cardsData.success && Array.isArray(cardsData.cards)) {
                return { ...list, cards: cardsData.cards };
              }
              return { ...list, cards: [] };
            } catch {
              return { ...list, cards: [] };
            }
          })
        );
        setLists(listsWithCards);
        setResult(`Loaded ${listsWithCards.length} list(s).`);
      } else {
        setResult("List load error: " + data.error);
      }
    } catch (err) {
      setResult("Error: " + err.message);
    }
  };

  // Step 6: Create a card
  const createCard = async (e) => {
    e.preventDefault();
    if (!newCard.idList) return setResult("Please select a list.");
    setResult("Creating card...");
    try {
      const res = await fetch(`${BACKEND}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          accessTokenSecret: auth.accessTokenSecret,
          idList: newCard.idList,
          name: newCard.name,
          desc: newCard.desc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult("Card created: " + data.card.name);
        setNewCard({ idList: "", name: "", desc: "" });
      } else {
        setResult("Card creation failed: " + data.error);
      }
    } catch (err) {
      setResult("Error: " + err.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "40px auto",
        fontFamily: "Inter, Arial, sans-serif",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: 32,
        position: "relative",
        minHeight: 350,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 800,
          fontSize: 28,
          marginBottom: 24,
          letterSpacing: "-1px",
          color: "#0079bf",
        }}
      >
        Trello Setup <span style={{ color: "#222" }}>({"1UPMedia"})</span>
      </h2>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div
            style={{
              display: "inline-block",
              width: 48,
              height: 48,
              border: "6px solid #e0e0e0",
              borderTop: "6px solid #0079bf",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ marginTop: 16, color: "#888", fontSize: 18 }}>
            Loading Trello Profile...
          </div>
        </div>
      ) : trelloProfile && trelloProfile.dynamic_fields?.board ? (
        <div
          style={{
            background: "linear-gradient(90deg,#0079bf 0%,#70b500 100%)",
            color: "#fff",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          }}
        >
          <h3 style={{ marginTop: 0, fontWeight: 700, fontSize: 22 }}>
            Connected Trello Board
          </h3>
          <div style={{ marginBottom: 12 }}>
            <b>Workspace:</b>{" "}
            {trelloProfile.dynamic_fields.workspace?.name || "1UPMedia"}
          </div>
          <div style={{ marginBottom: 12 }}>
            <b>Board:</b> {trelloProfile.dynamic_fields.board.name}
          </div>

          {/* Display lists and cards fetched from backend */}
          {Array.isArray(lists) && lists.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
                Lists & Cards
              </h4>
              {lists.map((list) => (
                <div
                  key={list.id}
                  style={{
                    marginBottom: 18,
                    background: "#fff",
                    color: "#222",
                    borderRadius: 8,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    padding: "12px 16px",
                  }}
                >
                  <div
                    style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}
                  >
                    {list.name}
                  </div>
                  {Array.isArray(list.cards) && list.cards.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {list.cards.map((card) => (
                        <li key={card.id} style={{ marginBottom: 6 }}>
                          <span style={{ fontWeight: 500 }}>{card.name}</span>
                          {card.desc && (
                            <span style={{ color: "#888", marginLeft: 8 }}>
                              - {card.desc}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: "#888", fontSize: 14 }}>
                      No cards in this list.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "40px 0 24px 0",
            color: "#888",
            fontSize: 20,
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>
            🔗
          </span>
          No Trello Connected
        </div>
      )}

      {/* Show connect button only if not connected and not loading */}
      {(!trelloProfile || !trelloProfile.dynamic_fields?.board) && !loading && (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={openTrelloAuth}
            style={{
              padding: "14px 32px",
              fontWeight: "bold",
              fontSize: 18,
              background: "linear-gradient(90deg,#0079bf 0%,#70b500 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
              marginBottom: 8,
              transition: "background 0.2s",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Loading..." : "Connect Trello (OAuth)"}
          </button>
        </div>
      )}

      {/* Show result only if not connected and not loading */}
      {!loading && (!trelloProfile || !trelloProfile.board) && result && (
        <div
          style={{
            background: "#f6f8fa",
            marginTop: 20,
            padding: 16,
            borderRadius: 8,
            color: "#333",
            fontSize: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <pre style={{ margin: 0, fontFamily: "inherit" }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

// Helper inside SetupTrello: add a card by name if not exists
// Usage: await addCardIfNotExists(cardName)

export default SetupTrello;
