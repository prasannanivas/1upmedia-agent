import React, { useState, useEffect } from "react";
import { useSocialMedia } from "../context/SocialMediaContext";
import { useAuth } from "../context/AuthContext";

const BACKEND = "http://localhost:3000/jira";

function SetupJira() {
  const [auth, setAuth] = useState({
    accessToken: "",
    refreshToken: "",
    cloudId: "",
    name: "",
    email: "",
    status: "Not authenticated",
  });
  const [board, setBoard] = useState(null);
  // Removed sprints-related state
  const [newCard, setNewCard] = useState({ summary: "", description: "" });
  const [result, setResult] = useState("");
  const [cards, setCards] = useState([]);
  // Fetch all cards for the board
  const loadCards = async () => {
    if (!auth.accessToken || !auth.cloudId || !board) return;
    setResult("Loading cards…");
    try {
      const res = await fetch(
        `${BACKEND}/cards?boardId=${board.id}&accessToken=${auth.accessToken}&cloudId=${auth.cloudId}`
      );
      const data = await res.json();
      if (data.success) {
        setCards(data.cards || []);
        setResult(`Loaded ${data.cards.length} cards`);
      } else {
        setResult("Error loading cards: " + data.error);
      }
    } catch (err) {
      setResult("Error loading cards: " + err.message);
    }
  };

  const { jiraProfile, loadingPages } = useSocialMedia();
  const { handleJiraAuth } = useAuth();
  // launch OAuth popup
  // Load Jira profile from context if available
  useEffect(() => {
    if (jiraProfile && jiraProfile.dynamic_fields) {
      setAuth({
        accessToken: jiraProfile.access_token,
        refreshToken: jiraProfile.refresh_token || "",
        cloudId: jiraProfile.dynamic_fields.cloudId || "",
        name: jiraProfile.dynamic_fields.name || "",
        email: jiraProfile.dynamic_fields.email || "",
        status: "Authenticated",
      });
      setBoard(jiraProfile.dynamic_fields.board || null);
      // Removed sprints loading if board exists
    }
  }, [jiraProfile]);
  const openJiraAuth = () => {
    const handleMessage = async (event) => {
      if (event.data.type !== "jiraAuthSuccess") return;
      window.removeEventListener("message", handleMessage);

      const { accessToken, refreshToken, cloudId, name, email } = event.data;
      setAuth({
        accessToken,
        refreshToken,
        cloudId,
        name,
        email,
        status: "Authenticated",
      });
      setResult("Authenticated as: " + name);

      // 1) try to get existing board
      let boardData = null;
      try {
        const res = await fetch(
          `${BACKEND}/boards?cloudId=${cloudId}&accessToken=${accessToken}`
        );
        const data = await res.json();
        if (data.success && data.boards.length > 0) {
          boardData = data.boards[0];
        }
      } catch (err) {
        console.warn("Could not list boards:", err);
      }

      // 2) if none, create it (backend will ensure project+filter exist)
      if (!boardData) {
        setResult("Creating board…");
        try {
          const res = await fetch(`${BACKEND}/create-board`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken, cloudId }),
          });
          const data = await res.json();
          if (data.success) {
            boardData = data.board;
            setResult("Board created: " + data.board.name);
          } else {
            throw new Error(data.error || JSON.stringify(data.details));
          }
        } catch (err) {
          setResult("Error creating board: " + err.message);
          return;
        }
      } else {
        setResult("Found existing board: " + boardData.name);
      }

      await handleJiraAuth({
        accessToken,
        refreshToken,
        cloudId,
        name,
        email,
        board: boardData,
      });

      // Removed sprints loading after board creation
      setBoard(boardData);
    };

    // 4) Store Jira credentials and board in context

    window.addEventListener("message", handleMessage);
    window.open(`${BACKEND}/auth`, "jiraAuth", "width=600,height=600");
  };

  // Removed sprints fetching function

  // create a new issue in the project
  const createCard = async (e) => {
    e.preventDefault();
    if (!newCard.summary.trim()) return setResult("Please enter a summary.");
    setResult("Creating issue…");
    try {
      const res = await fetch(`${BACKEND}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          cloudId: auth.cloudId,
          summary: newCard.summary,
          description: newCard.description,
          issueType: "Task",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult("Issue created: " + (data.card.key || data.card.id));
        setNewCard({ summary: "", description: "" });
      } else {
        throw new Error(data.error || JSON.stringify(data.details));
      }
    } catch (err) {
      setResult("Error creating issue: " + err.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        padding: 32,
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
        borderRadius: 24,
        boxShadow: "0 8px 32px rgba(60,60,120,0.12)",
        fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        color: "#222",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: 1,
          marginBottom: 32,
          color: "#3b82f6",
        }}
      >
        Jira Setup — 1UPMedia
      </h2>

      {!board ? (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={openJiraAuth}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 32px",
              fontSize: 18,
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(60,60,120,0.10)",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#2563eb")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#3b82f6")}
          >
            {auth.status === "Not authenticated"
              ? "Connect to Jira"
              : auth.status}
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(60,60,120,0.08)",
              padding: 20,
              marginBottom: 24,
            }}
          >
            <p style={{ margin: 0 }}>
              <strong style={{ color: "#6366f1" }}>Connected as:</strong>{" "}
              {auth.name} ({auth.email})
            </p>
            <p style={{ margin: "8px 0 0 0" }}>
              <strong style={{ color: "#6366f1" }}>Board:</strong> {board.name}
            </p>
          </div>

          <button
            onClick={loadCards}
            style={{
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 28px",
              fontSize: 16,
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(60,60,120,0.10)",
              cursor: "pointer",
              marginBottom: 20,
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#4338ca")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#6366f1")}
          >
            List All Cards
          </button>

          {cards.length > 0 && (
            <div
              style={{
                marginBottom: 32,
                background: "#f3f4f6",
                borderRadius: 12,
                boxShadow: "0 1px 4px rgba(60,60,120,0.06)",
                padding: 18,
              }}
            >
              <h3
                style={{
                  color: "#6366f1",
                  fontWeight: 700,
                  fontSize: 22,
                  marginBottom: 16,
                }}
              >
                Cards
              </h3>
              <ul
                style={{
                  paddingLeft: 0,
                  listStyle: "none",
                  margin: 0,
                }}
              >
                {cards.map((card) => (
                  <li
                    key={card.id || card.key}
                    style={{
                      background: "#fff",
                      borderRadius: 8,
                      boxShadow: "0 1px 4px rgba(60,60,120,0.05)",
                      marginBottom: 12,
                      padding: "12px 16px",
                    }}
                  >
                    <strong style={{ color: "#2563eb", fontSize: 17 }}>
                      {card.summary || card.name}
                    </strong>
                    {card.key ? (
                      <span style={{ color: "#64748b", fontWeight: 500 }}>
                        {" "}
                        ({card.key})
                      </span>
                    ) : (
                      ""
                    )}
                    {card.description ? (
                      <div style={{ color: "#334155", marginTop: 6 }}>
                        {card.description}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form
            onSubmit={createCard}
            style={{
              marginTop: 24,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(60,60,120,0.08)",
              padding: 24,
            }}
          >
            <h3
              style={{
                color: "#6366f1",
                fontWeight: 700,
                fontSize: 22,
                marginBottom: 18,
              }}
            >
              Create Issue
            </h3>
            <input
              type="text"
              placeholder="Summary"
              value={newCard.summary}
              onChange={(e) =>
                setNewCard({ ...newCard, summary: e.target.value })
              }
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                marginBottom: 12,
                borderRadius: 6,
                border: "1px solid #c7d2fe",
                fontSize: 16,
                fontFamily: "inherit",
                background: "#f8fafc",
              }}
            />
            <textarea
              placeholder="Description"
              value={newCard.description}
              onChange={(e) =>
                setNewCard({ ...newCard, description: e.target.value })
              }
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                marginBottom: 12,
                borderRadius: 6,
                border: "1px solid #c7d2fe",
                fontSize: 16,
                fontFamily: "inherit",
                background: "#f8fafc",
              }}
            />
            <button
              type="submit"
              style={{
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 28px",
                fontSize: 16,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(60,60,120,0.10)",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#2563eb")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#3b82f6")}
            >
              Create Issue
            </button>
          </form>
        </>
      )}

      {result && (
        <div
          style={{
            marginTop: 28,
            color: "#334155",
            background: "#e0e7ff",
            borderRadius: 8,
            padding: "12px 18px",
            fontSize: 15,
            fontFamily: "inherit",
            boxShadow: "0 1px 4px rgba(60,60,120,0.06)",
          }}
        >
          <pre
            style={{
              margin: 0,
              background: "none",
              color: "inherit",
              fontFamily: "inherit",
            }}
          >
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}

export default SetupJira;
