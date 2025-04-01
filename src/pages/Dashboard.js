import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function PostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [filterType, setFilterType] = useState("all");
  const [titleFilter, setTitleFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const { getUserLoginDetails } = useAuth();
  const { email } = getUserLoginDetails();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(
          `https://ai.1upmedia.com:443/aiagent/posts/${email}`
        );
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        } else {
          console.error("Failed to fetch posts.");
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [email]);

  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/posts/${email}/${postId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.post_id !== postId)
        );
        alert("Post deleted successfully!");
      } else {
        console.error("Failed to delete post.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Get unique categories and tags from posts
  const { categories, tags } = useMemo(() => {
    const categories = new Set();
    const tags = new Set();
    posts.forEach((post) => {
      post.categories.forEach((category) => categories.add(category));
      post.tags.forEach((tag) => tags.add(tag));
    });
    return {
      categories: Array.from(categories).sort(),
      tags: Array.from(tags).sort(),
    };
  }, [posts]);

  // Filter options combining categories and tags
  const filterOptions = useMemo(
    () => ({
      all: ["All"],
      category: ["All", ...categories],
      tag: ["All", ...tags],
      title: [],
      date: [],
    }),
    [categories, tags]
  );

  // Updated filter logic
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterType === "all") return true;
      if (filterType === "category" && filter !== "All") {
        return post.categories.includes(filter);
      }
      if (filterType === "tag" && filter !== "All") {
        return post.tags.includes(filter);
      }
      if (filterType === "title") {
        return post.title.toLowerCase().includes(titleFilter.toLowerCase());
      }
      if (filterType === "date") {
        const postDate = new Date(post.schedule_time);
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end) : null;

        if (start && end) {
          return postDate >= start && postDate <= end;
        }
        return true;
      }
      return true;
    });
  }, [posts, filter, filterType, titleFilter, dateRange]);

  // Sort posts based on sortConfig.
  const sortedPosts = useMemo(() => {
    let sortablePosts = [...filteredPosts];
    if (sortConfig.key) {
      sortablePosts.sort((a, b) => {
        let aValue, bValue;
        switch (sortConfig.key) {
          case "title":
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case "tags":
            aValue = a.tags.join(", ").toLowerCase();
            bValue = b.tags.join(", ").toLowerCase();
            break;
          case "categories":
            aValue = a.categories.join(", ").toLowerCase();
            bValue = b.categories.join(", ").toLowerCase();
            break;
          case "schedule_time":
            aValue = new Date(a.schedule_time);
            bValue = new Date(b.schedule_time);
            break;
          default:
            break;
        }
        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortablePosts;
  }, [filteredPosts, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Helper function to display sort arrow indicators
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? " ▲" : " ▼";
    }
    return "";
  };

  const renderFilterControls = () => (
    <div className="filter-controls">
      <select
        value={filterType}
        onChange={(e) => {
          setFilterType(e.target.value);
          setFilter("All");
          setTitleFilter("");
          setDateRange({ start: "", end: "" });
        }}
      >
        <option value="all">All</option>
        <option value="category">By Category</option>
        <option value="tag">By Tag</option>
        <option value="title">By Title</option>
        <option value="date">By Date</option>
      </select>

      {filterType === "title" && (
        <input
          type="text"
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          placeholder="Search by title..."
        />
      )}

      {filterType === "date" && (
        <div className="date-range">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
          />
        </div>
      )}

      {(filterType === "category" || filterType === "tag") && (
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {filterOptions[filterType].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!sortedPosts.length) {
    return (
      <div>
        <div className="top-actions">{renderFilterControls()}</div>
        <div>No posts found.</div>
      </div>
    );
  }

  return (
    <div className="posts-table-container">
      <div className="top-actions">
        <button
          onClick={() => navigate("/agents/content-creation/by-seo-ideas")}
          className="generate-button"
        >
          Generate Post
        </button>
        {renderFilterControls()}
      </div>

      <h2>All Posts</h2>
      <table className="posts-table">
        <thead>
          <tr>
            <th className="title-column" onClick={() => requestSort("title")}>
              Title{getSortIndicator("title")}
            </th>
            <th className="tags-column" onClick={() => requestSort("tags")}>
              Tags{getSortIndicator("tags")}
            </th>
            <th
              className="categories-column"
              onClick={() => requestSort("categories")}
            >
              Categories{getSortIndicator("categories")}
            </th>
            <th
              className="schedule-column"
              onClick={() => requestSort("schedule_time")}
            >
              Scheduled Date{getSortIndicator("schedule_time")}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPosts.map((post) => (
            <tr key={post.post_id}>
              <td className="title-column">{post.title}</td>
              <td className="tags-column">{post.tags.join(", ")}</td>
              <td className="categories-column">
                {post.categories.join(", ")}
              </td>
              <td className="schedule-column">
                {new Date(post.schedule_time).toLocaleDateString()}
              </td>
              <td>
                <button
                  className="view-button"
                  onClick={() =>
                    navigate(`/post-details/${post.post_id}`, {
                      state: { post },
                    })
                  }
                >
                  View
                </button>
                <button
                  className="edit-button"
                  onClick={() =>
                    navigate(`/edit-post/${post.post_id}`, { state: { post } })
                  }
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => deletePost(post.post_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PostsList;
