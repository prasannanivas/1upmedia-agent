// import React, { useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import { useToast } from "../context/ToastProvider";

// function Integrations() {
//   const { authState } = useAuth();
//   const { email } = authState;
//   const { PositiveToast, NegativeToast } = useToast();

//   const [wordpressDetails, setWordpressDetails] = useState({
//     url: "",
//     username: "",
//     applicationPassword: "",
//   });

//   const [message, setMessage] = useState(null);
//   const [error, setError] = useState(null);
//   const [showPluginMessage, setShowPluginMessage] = useState(false);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setWordpressDetails((prevState) => ({
//       ...prevState,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage(null);
//     setError(null);
//     setShowPluginMessage(false);

//     const { url, username, applicationPassword } = wordpressDetails;

//     // Validate form input
//     if (!url || !username || !applicationPassword) {
//       setError("All fields are required.");
//       NegativeToast("All fields are required.");
//       return;
//     }

//     try {
//       // Make a test call to WordPress REST API
//       const base64Credentials = btoa(`${username}:${applicationPassword}`);
//       const response = await fetch(`${url}/wp-json/wp/v2/users/me`, {
//         headers: {
//           Authorization: `Basic ${base64Credentials}`,
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.log(errorData);
//         setError(
//           errorData?.message ||
//             "Authentication failed. Please check your credentials or ensure the Basic Auth plugin is installed."
//         );
//         NegativeToast(
//           errorData?.message ||
//             "Authentication failed. Please check your credentials or ensure the Basic Auth plugin is installed."
//         );
//         setShowPluginMessage(true);

//         return;
//       }

//       const userDetails = await response.json();

//       // Send data to backend
//       const backendResponse = await fetch(
//         "https://ai.1upmedia.com:443/aiagent/store-social-media",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             email: email,
//             social_media: {
//               social_media_name: "wordpress",
//               profile_picture: userDetails.avatar_urls?.["96"] || "",
//               account_name: userDetails.name,
//               access_token: base64Credentials,
//               dynamic_fields: { url },
//             },
//           }),
//         }
//       );

//       if (!backendResponse.ok) {
//         const errorData = await backendResponse.json();
//         if (backendResponse.message_type !== "Positive") {
//           setError(
//             errorData.error ||
//               errorData.message ||
//               "Failed to save WordPress details."
//           );
//           NegativeToast(
//             errorData.error ||
//               errorData.message ||
//               "Failed to save WordPress details."
//           );
//         } else {
//           setMessage(backendResponse.message);
//           PositiveToast(backendResponse.message);
//         }

//         return;
//       }

//       const backendResult = await backendResponse.json();

//       setMessage(backendResult.message);
//       PositiveToast(backendResult.message);
//     } catch (err) {
//       console.error("Error:", err);
//       setError(
//         "Failed to connect to the WordPress site. Authentication failed. Please check your credentials"
//       );
//       NegativeToast(
//         err +
//           " Failed to connect to the WordPress site. Authentication failed. Please check your credentials"
//       );
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <h2 style={styles.header}>Integrate Your WordPress Site</h2>
//       <form style={styles.form} onSubmit={handleSubmit}>
//         <div style={styles.inputGroup}>
//           <label style={styles.label}>
//             WordPress URL:
//             <input
//               type="url"
//               name="url"
//               value={wordpressDetails.url}
//               onChange={handleInputChange}
//               style={styles.input}
//               placeholder="https://yourwordpresssite.com"
//               required
//             />
//           </label>
//         </div>
//         <div style={styles.inputGroup}>
//           <label style={styles.label}>
//             Username:
//             <input
//               type="text"
//               name="username"
//               value={wordpressDetails.username}
//               onChange={handleInputChange}
//               style={styles.input}
//               placeholder="Your WordPress Username"
//               required
//             />
//           </label>
//         </div>
//         <div style={styles.inputGroup}>
//           <label style={styles.label}>
//             Application Password:
//             <input
//               type="password"
//               name="applicationPassword"
//               value={wordpressDetails.applicationPassword}
//               onChange={handleInputChange}
//               style={styles.input}
//               placeholder="Your Application Password"
//               required
//             />
//           </label>
//         </div>
//         <button style={styles.button} type="submit">
//           Integrate
//         </button>
//       </form>

//       {message && <p style={styles.success}>{message}</p>}
//       {error && <p style={styles.error}>{error}</p>}

//       {showPluginMessage && (
//         <div style={styles.pluginMessage}>
//           <h3>Please Install the Basic Auth Plugin</h3>
//           <p>
//             To use this integration, you need to install the{" "}
//             <strong>Basic Auth Plugin</strong> on your WordPress site.
//           </p>
//           <a
//             href="https://github.com/WP-API/Basic-Auth/archive/master.zip"
//             download
//             style={styles.downloadLink}
//           >
//             Download Basic Auth Plugin
//           </a>
//           <ol>
//             <li>Download the plugin using the link above.</li>
//             <li>Log in to your WordPress Admin Dashboard.</li>
//             <li>
//               Navigate to <strong>{"Plugins > Add New > Upload Plugin"}</strong>
//               .
//             </li>
//             <li>Upload the downloaded ZIP file and activate the plugin.</li>
//           </ol>
//         </div>
//       )}
//     </div>
//   );
// }

// const styles = {
//   container: {
//     fontFamily: "Arial, sans-serif",
//     maxWidth: "600px",
//     margin: "50px auto",
//     padding: "20px",
//     borderRadius: "8px",
//     background: "#f9f9f9",
//     boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//   },
//   header: {
//     textAlign: "center",
//     color: "#333",
//   },
//   form: {
//     marginTop: "20px",
//   },
//   inputGroup: {
//     marginBottom: "15px",
//   },
//   label: {
//     display: "block",
//     fontWeight: "bold",
//     marginBottom: "5px",
//     color: "#555",
//   },
//   input: {
//     width: "100%",
//     padding: "10px",
//     fontSize: "16px",
//     border: "1px solid #ccc",
//     borderRadius: "4px",
//   },
//   button: {
//     width: "100%",
//     padding: "10px",
//     fontSize: "16px",
//     color: "#fff",
//     background: "#007BFF",
//     border: "none",
//     borderRadius: "4px",
//     cursor: "pointer",
//   },
//   success: {
//     color: "green",
//     marginTop: "10px",
//   },
//   error: {
//     color: "red",
//     marginTop: "10px",
//   },
//   pluginMessage: {
//     marginTop: "20px",
//     padding: "15px",
//     background: "#fff5e6",
//     borderRadius: "5px",
//     border: "1px solid #ffd966",
//   },
//   downloadLink: {
//     color: "#007BFF",
//     fontWeight: "bold",
//     textDecoration: "none",
//   },
// };

// export default Integrations;

import React from "react";

export default function ActiveIntegrations() {
  return <div>ActiveIntegrations</div>;
}
