import React, { useState } from "react";
import axios from "axios";

const ShopifyLogin = () => {
  const [shop, setShop] = useState("");
  const [shopDetails, setShopDetails] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [selectedBlog, setSelectedBlog] = useState("");
  const [blogPosts, setBlogPosts] = useState("");
  const [content, setContent] = useState({
    title: "",
    body: "",
    tags: "",
    image: "",
  });

  const handleLogin = () => {
    if (!shop) {
      alert("Please enter your Shopify store name.");
      return;
    }

    const authUrl = `https://ai.1upmedia.com:443/shopify/auth?shop=${shop}.myshopify.com`;
    const popup = window.open(authUrl, "Shopify Login", "width=600,height=700");

    window.addEventListener("message", (event) => {
      if (event.data.type === "shopifyAuthSuccess") {
        setShopDetails(event.data.shopInfo);
        setAccessToken(event.data.accessToken);
        alert("Shopify Authentication Successful!");
        popup.close();
      }
    });
  };

  const fetchBlogs = async () => {
    if (!shopDetails) return alert("Please login first.");
    try {
      const response = await axios.post(
        "https://ai.1upmedia.com:443/shopify/fetch-blogs",
        {
          shop: shopDetails.domain,
          accessToken: accessToken,
        }
      );
      setBlogs(response.data.blogs);
    } catch (error) {
      alert("Failed to fetch blogs.");
    }
  };

  const postContent = async (e) => {
    e.preventDefault();
    if (!selectedBlog) return alert("Select a blog first!");
    try {
      await axios.post("https://ai.1upmedia.com:443/shopify/post-content", {
        shop: shopDetails.domain,
        accessToken: accessToken,
        blogId: selectedBlog,
        content,
      });
      alert("Blog post created!");
    } catch (error) {
      alert("Failed to post content.");
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const response = await axios.post(
        "https://ai.1upmedia.com:443/shopify/fetch-blog-posts",
        {
          shop: shopDetails.domain,
          accessToken,
          blogId: selectedBlog,
        }
      );

      setBlogPosts(response.data.blogPosts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      alert("Failed to fetch blog posts.");
    }
  };

  return (
    <div>
      <h1>Shopify Authentication</h1>
      <input
        type="text"
        placeholder="Shop Name"
        onChange={(e) => setShop(e.target.value)}
      />
      <button onClick={handleLogin}>Login with Shopify</button>

      {shopDetails && <button onClick={fetchBlogs}>Fetch Blogs</button>}
      <select onChange={(e) => setSelectedBlog(e.target.value)}>
        <option>Select Blog</option>
        {blogs.map((blog) => (
          <option key={blog.id} value={blog.id}>
            {blog.title}
          </option>
        ))}
      </select>

      {selectedBlog && (
        <button onClick={fetchBlogPosts}>Fetch Blog posts</button>
      )}

      <form onSubmit={postContent}>
        <input
          type="text"
          placeholder="Title"
          onChange={(e) => setContent({ ...content, title: e.target.value })}
        />
        <textarea
          placeholder="Body"
          onChange={(e) => setContent({ ...content, body: e.target.value })}
        />
        <button type="submit">Post to Shopify</button>
      </form>
    </div>
  );
};

export default ShopifyLogin;
