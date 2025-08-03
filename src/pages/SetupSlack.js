import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocialMedia } from "../context/SocialMediaContext";

const BACKEND = "https://ai.1upmedia.com:443/slack";

function SetupSlack() {
  const { loadingPages: loading, slackProfile } = useSocialMedia();

  console.log("Loading:", loading);
  console.log("Slack Profile:", slackProfile);
  const [auth, setAuth] = useState({
    accessToken: slackProfile?.access_token || "",
    team: slackProfile?.dynamic_fields?.team || {},
    user: slackProfile?.dynamic_fields?.user || {},
    channelId: slackProfile?.dynamic_fields?.channelId || "",
  });

  useEffect(() => {
    if (slackProfile) {
      // Support new profile structure with dynamic_fields
      const accessToken = slackProfile.access_token || slackProfile.accessToken;
      const team = slackProfile.dynamic_fields?.team || slackProfile.team || {};
      const user = slackProfile.dynamic_fields?.user || slackProfile.user || {};
      const channelId =
        slackProfile.dynamic_fields?.channelId || slackProfile.channelId || "";
      setAuth({ accessToken, team, user, channelId });

      console.log("Auth set:", { accessToken, team, user });

      // Fill channel info from slackProfile
      if (channelId) {
        setChannelId(channelId);
        loadTasks(accessToken, channelId);
      } else {
        setChannelId("");
        setTasks([]);
      }
    } else {
      setChannelId("");
      setTasks([]);
    }
  }, [slackProfile]);

  const { handleSlackAuth } = useAuth();
  const [channelId, setChannelId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ text: "" });
  const [result, setResult] = useState("");

  // Step 1: OAuth popup
  const openSlackAuth = () => {
    window.open(`${BACKEND}/auth`, "slackAuthPopup", "width=550,height=750");
    window.addEventListener("message", async (event) => {
      if (event.data?.type === "slackAuthSuccess") {
        const token = event.data.token;
        const team = event.data.team;
        const user = event.data.user;

        setAuth({ accessToken: token, team, user, channelId: "" });
        setResult(`Authenticated as: ${user.name} in workspace: ${team.name}`);

        // Ensure the 1UP Media channel exists
        try {
          const res = await fetch(`${BACKEND}/ensure-channel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: token }),
          });
          const data = await res.json();
          if (data.success) {
            setChannelId(data.channelId);
            setResult("Connected to #1up-media channel");

            // Load tasks from the channel
            loadTasks(token, data.channelId);

            // Get user email from auth context
            const userInfo = handleSlackAuth({
              accessToken: token,
              team,
              user,
              channelId: data.channelId,
            });
          }
        } catch (err) {
          setResult("Error ensuring channel: " + err.message);
        }
      }
    });
  };

  // Step 2: Load tasks from channel
  const loadTasks = async (token, chId) => {
    setResult("Loading tasks...");
    if (!token || !chId) {
      setResult("Missing authentication or channel.");
      return;
    }
    try {
      const res = await fetch(
        `${BACKEND}/task?accessToken=${encodeURIComponent(
          token
        )}&channelId=${encodeURIComponent(chId)}`
      );
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
        setResult(`Loaded ${data.tasks.length} task(s).`);
      } else {
        setResult("Task load error: " + data.error);
      }
    } catch (err) {
      setResult("Error: " + err.message);
    }
  };

  // Step 3: Create a task
  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.text) return setResult("Please enter a task.");
    setResult("Creating task...");
    try {
      const res = await fetch(`${BACKEND}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          channelId: channelId,
          text: newTask.text,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult("Task created: " + data.task);
        setNewTask({ text: "" });
        loadTasks(auth.accessToken, channelId);
      } else {
        setResult("Task creation failed: " + data.error);
      }
    } catch (err) {
      setResult("Error: " + err.message);
    }
  };

  // Step 4: Mark task as complete
  const completeTask = async (taskTs, taskText) => {
    setResult("Completing task...");
    try {
      const res = await fetch(`${BACKEND}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          channelId: channelId,
          lastTaskTs: taskTs,
          text: taskText,
          isComplete: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult("Task marked complete");
        loadTasks(auth.accessToken, channelId);
      } else {
        setResult("Task completion failed: " + data.error);
      }
    } catch (err) {
      setResult("Error: " + err.message);
    }
  };

  // Step 5: Create multiple tasks (for bulk creation from other parts of the app)
  const createTasksFromItems = async (items) => {
    setResult("Creating multiple tasks...");
    if (!Array.isArray(items) || items.length === 0) {
      setResult("No tasks to create.");
      return;
    }
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const item of items) {
        const taskText = item.text || String(item);
        const res = await fetch(`${BACKEND}/task`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: auth.accessToken,
            channelId: channelId,
            text: taskText,
          }),
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      setResult(`Created ${successCount} tasks, ${errorCount} failed.`);
      loadTasks(auth.accessToken, channelId); // Refresh task list
    } catch (err) {
      setResult("Error creating tasks: " + err.message);
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
          color: "#4A154B", // Slack purple
        }}
      >
        Slack Setup <span style={{ color: "#222" }}>({"1UP Media"})</span>
      </h2>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div
            style={{
              display: "inline-block",
              width: 48,
              height: 48,
              border: "6px solid #e0e0e0",
              borderTop: "6px solid #4A154B", // Slack purple
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
            Loading Slack Profile...
          </div>
        </div>
      ) : slackProfile && slackProfile.dynamic_fields?.channelId ? (
        <div
          style={{
            background: "linear-gradient(90deg,#4A154B 0%,#36C5F0 100%)", // Slack colors
            color: "#fff",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          }}
        >
          <h3 style={{ marginTop: 0, fontWeight: 700, fontSize: 22 }}>
            Connected Slack Workspace
          </h3>
          <div style={{ marginBottom: 12 }}>
            <b>Team:</b> {slackProfile.dynamic_fields.team?.name || "1UP Media"}
          </div>
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <b>Channel:</b> #1up-media
            </div>
            <button
              onClick={() => loadTasks(auth.accessToken, channelId)}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Refresh Tasks
            </button>
          </div>

          {/* Display tasks fetched from backend */}
          {Array.isArray(tasks) && tasks.length > 0 ? (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
                Current Tasks
              </h4>
              {tasks.map((task) => (
                <div
                  key={task.ts}
                  style={{
                    marginBottom: 18,
                    background: "#fff",
                    color: "#222",
                    borderRadius: 8,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: 16 }}>
                    {task.text}
                  </div>
                  <button
                    onClick={() => completeTask(task.ts, task.text)}
                    style={{
                      background: "#36C5F0",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Complete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 24, color: "#fff" }}>
              <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
                Tasks
              </h4>
              <div
                style={{
                  background: "rgba(255,255,255,0.1)",
                  padding: 16,
                  borderRadius: 8,
                }}
              >
                No active tasks found.
              </div>
            </div>
          )}

          {/* Form to create new task */}
          <div style={{ marginTop: 24 }}>
            <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
              Create New Task
            </h4>
            <form onSubmit={createTask} style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={newTask.text}
                onChange={(e) => setNewTask({ text: e.target.value })}
                placeholder="Enter task description"
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 16,
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#2EB67D", // Slack green
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </form>

            {/* Sample tasks import button */}
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button
                onClick={() =>
                  createTasksFromItems([
                    { text: "Sample task 1: Research competitors" },
                    { text: "Sample task 2: Prepare project timeline" },
                    { text: "Sample task 3: Schedule team meeting" },
                  ])
                }
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: 14,
                  marginTop: 10,
                }}
              >
                Import Sample Tasks
              </button>
            </div>
          </div>
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
          No Slack Connected
        </div>
      )}

      {/* Show connect button only if not connected and not loading */}
      {(!slackProfile || !slackProfile.dynamic_fields?.channelId) &&
        !loading && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={openSlackAuth}
              style={{
                padding: "14px 32px",
                fontWeight: "bold",
                fontSize: 18,
                background: "linear-gradient(90deg,#4A154B 0%,#36C5F0 100%)", // Slack colors
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
              {loading ? "Loading..." : "Connect Slack (OAuth)"}
            </button>
          </div>
        )}

      {/* Show result only if not connected and not loading */}
      {!loading &&
        (!slackProfile || !slackProfile.dynamic_fields?.channelId) &&
        result && (
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

export default SetupSlack;
