import React, { useState } from "react";
import axios from "axios";

const WebflowIntegration = () => {
  const [accessToken, setAccessToken] = useState("");
  const [sites, setSites] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [content, setContent] = useState({
    title: "",
    body: "",
    image: "",
    tags: "",
  });
  const [collectionFields, setCollectionFields] = useState({});
  const [matchingCollection, setMatchingCollection] = useState(null);
  const [showCreateCollectionButton, setShowCreateCollectionButton] =
    useState(false);

  // Step 1: Login with Webflow (OAuth)
  const handleLogin = () => {
    const authUrl = `https://ai.1upmedia.com:443/webflow/auth`;
    const popup = window.open(authUrl, "Webflow Login", "width=600,height=700");

    const receiveMessage = (event) => {
      if (event.data.accessToken) {
        setAccessToken(event.data.accessToken);
        console.log("User Profile:", event.data.userProfile);
        alert("Webflow Authentication Successful!");
        popup.close();
        window.removeEventListener("message", receiveMessage);
      }
    };

    window.addEventListener("message", receiveMessage);
  };

  // Step 2: Fetch Webflow Sites
  const fetchSites = async () => {
    if (!accessToken) return alert("Please login with Webflow first.");

    try {
      const response = await axios.get(
        "https://ai.1upmedia.com:443/webflow/sites",
        {
          params: { accessToken },
        }
      );
      setSites(response.data.sites.sites);
      alert("Webflow Sites Fetched!");
    } catch (error) {
      console.error("Error fetching sites:", error);
      alert("Failed to fetch sites.");
    }
  };

  const createSchemaCollection = async () => {
    try {
      const response = await axios.post(
        "https://ai.1upmedia.com:443/webflow/create-collection",
        {
          accessToken,
          siteId: selectedSite,
          collectionData: {
            displayName: "Content Collection",
            singularName: "Content Item",
            fields: [
              { displayName: "Title", slug: "name", type: "PlainText" }, // Required
              { displayName: "Body", slug: "body", type: "RichText" }, // Required
              { displayName: "Image", slug: "image", type: "Image" }, // ✅ Corrected Image Field Type
              { displayName: "Tags", slug: "tags", type: "PlainText" }, // Optional
              {
                displayName: "Categories",
                slug: "categories",
                type: "PlainText",
              }, // Optional
            ],
          },
        }
      );

      alert("Schema Collection Created Successfully!");
      fetchCollections(); // Refresh collections list
    } catch (error) {
      console.error(
        "Error creating schema collection:",
        error.response?.data || error.message
      );
      alert("Failed to create schema collection.");
    }
  };

  // Step 3: Fetch CMS Collections
  const fetchCollections = async () => {
    if (!selectedSite) return alert("Please select a site first.");

    try {
      const response = await axios.get(
        "https://ai.1upmedia.com:443/webflow/collections",
        {
          params: { accessToken, siteId: selectedSite },
        }
      );

      const fetchedCollections = response.data.collections?.collections || [];

      let foundCollection = null;

      for (let collection of fetchedCollections) {
        const fieldsResponse = await axios.get(
          "https://ai.1upmedia.com:443/webflow/collection-fields",
          {
            params: { accessToken, collectionId: collection.id },
          }
        );

        const fields = fieldsResponse.data.collectionFields.fields.map(
          (f) => f.slug
        );

        if (
          fields.includes("title") && // Title (Required)
          fields.includes("body") && // Body (Required)
          (fields.includes("image") ||
            fields.includes("tags") ||
            fields.includes("categories")) // At least one optional field
        ) {
          foundCollection = collection;
          break;
        }
      }

      if (foundCollection) {
        setMatchingCollection(foundCollection);
        setShowCreateCollectionButton(false);
        alert("Matching Collection Found!");
      } else {
        setMatchingCollection(null);
        setShowCreateCollectionButton(true);
        alert("No matching collection found! Please create one.");
      }

      setCollections(fetchedCollections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      alert("Failed to fetch collections.");
    }
  };
  // Step 4: Fetch Collection Fields
  const fetchCollectionFields = async (collectionId) => {
    if (!collectionId) return;
    try {
      const response = await axios.get(
        "https://ai.1upmedia.com:443/webflow/collection-fields",
        {
          params: { accessToken, collectionId },
        }
      );

      const fields = response.data.collectionFields.fields.reduce(
        (acc, field) => {
          acc[field.displayName.toLowerCase()] = field.slug;
          return acc;
        },
        {}
      );

      setCollectionFields(fields);
      console.log("Fetched Collection Fields:", fields);
    } catch (error) {
      console.error("Error fetching collection fields:", error);
    }
  };

  // Step 5: Publish Content
  const publishContent = async () => {
    if (!selectedCollection) return alert("Please select a collection first.");
    if (Object.keys(collectionFields).length === 0) {
      return alert("Collection fields not loaded. Try again.");
    }

    // ✅ Ensure only valid field names are used
    const validFields = {};
    if (collectionFields["title"])
      validFields[collectionFields["title"]] = content.title;
    if (collectionFields["body"])
      validFields[collectionFields["body"]] = content.body;
    if (collectionFields["image"])
      validFields[collectionFields["image"]] = { url: content.image };
    if (collectionFields["tags"])
      validFields[collectionFields["tags"]] = content.tags || "";
    if (collectionFields["categories"])
      validFields[collectionFields["categories"]] = content.categories || "";

    // ✅ Ensure a unique slug by appending a timestamp
    if (collectionFields["slug"]) {
      validFields[collectionFields["slug"]] =
        content.title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    } else {
      console.error("❌ No slug field found in collectionFields.");
    }

    console.log("Publishing with Fields:", validFields); // Debugging output

    try {
      const response = await axios.post(
        "https://ai.1upmedia.com:443/webflow/publish-content",
        {
          accessToken,
          collectionId: selectedCollection,
          content: validFields, // ✅ Use only valid fields
        }
      );

      alert("✅ Content Published Successfully!");
      console.log("Published Content:", response.data);
    } catch (error) {
      console.error(
        "❌ Error publishing content:",
        error.response?.data || error.message
      );
      alert("Failed to publish content.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Webflow Integration</h1>

      {/* Step 1: OAuth Login */}
      <button onClick={handleLogin} style={buttonStyle("#5c6ac4")}>
        Login with Webflow
      </button>

      {/* Step 2: Fetch Webflow Sites */}
      {accessToken && (
        <>
          <button onClick={fetchSites} style={buttonStyle("#4caf50")}>
            Fetch Webflow Sites
          </button>
          <br />
          {sites.length > 0 && (
            <select
              onChange={(e) => setSelectedSite(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select a Site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {/* Step 3: Fetch CMS Collections */}
      {selectedSite && (
        <>
          <button onClick={fetchCollections} style={buttonStyle("#2196f3")}>
            Fetch CMS Collections
          </button>
        </>
      )}

      {/* Step 4: Display CMS Collections */}
      {selectedSite && collections.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Available Collections</h3>
          <select
            onChange={(e) => {
              setSelectedCollection(e.target.value);
              fetchCollectionFields(e.target.value);
            }}
            style={selectStyle}
          >
            <option value="">Select a Collection</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.displayName} ({collection.singularName})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Show Schema Validation Message */}
      {showCreateCollectionButton && (
        <div style={{ marginTop: "20px", color: "red" }}>
          <p>No collection found that matches the required schema!</p>
          <button
            onClick={createSchemaCollection}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff9800",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Create Schema Collection
          </button>
        </div>
      )}

      {/* Step 5: Publish Content */}
      {/* Step 5: Publish Content */}
      {selectedCollection && (
        <div style={{ marginTop: "20px" }}>
          <h3>Publish Content</h3>
          <input
            type="text"
            placeholder="Title"
            value={content.title}
            onChange={(e) => setContent({ ...content, title: e.target.value })}
            style={inputStyle}
          />
          <br />
          <textarea
            placeholder="Body (HTML Allowed)"
            value={content.body}
            onChange={(e) => setContent({ ...content, body: e.target.value })}
            style={textareaStyle}
          />
          <br />
          <input
            type="text"
            placeholder="Image URL"
            value={content.image}
            onChange={(e) => setContent({ ...content, image: e.target.value })}
            style={inputStyle}
          />
          <br />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={content.tags}
            onChange={(e) => setContent({ ...content, tags: e.target.value })}
            style={inputStyle}
          />
          <br />
          <input
            type="text"
            placeholder="Categories (comma-separated)"
            value={content.categories}
            onChange={(e) =>
              setContent({ ...content, categories: e.target.value })
            }
            style={inputStyle}
          />
          <br />
          <button onClick={publishContent} style={buttonStyle("#f44336")}>
            Publish to Webflow
          </button>
        </div>
      )}
    </div>
  );
};

// Reusable Styles
const buttonStyle = (bgColor) => ({
  padding: "10px 20px",
  backgroundColor: bgColor,
  color: "#fff",
  borderRadius: "5px",
  cursor: "pointer",
  marginBottom: "20px",
  marginLeft: "10px",
});

const selectStyle = {
  padding: "10px",
  marginTop: "10px",
};

const inputStyle = {
  padding: "10px",
  marginBottom: "10px",
};

const textareaStyle = {
  padding: "10px",
  width: "300px",
  height: "100px",
  marginBottom: "10px",
};

export default WebflowIntegration;
