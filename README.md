# LinkUp — Social Media Platform
LinkUp is a full-stack social media web application designed to help users connect, share posts, interact with other users. The project is developed using React for the frontend and Node.js, Express.js, and MongoDB for the backend.

- Twisted Task: Implemented a personalized social media feed using the Echo Chamber algorithm, prioritizing posts from the content category users interact with the most.

🌐 Live Demo

- Frontend+backend:
 https://fsd-1-social-media-platform-byte-vo.vercel.app


📌 Project Overview
LinkUp provides a social platform where users can create accounts, manage profiles, publish posts, and interact with content. The application follows a client-server architecture, with a React frontend communicating with a REST API built using Express.js.

The project focuses on full-stack development, API integration, database management, authentication, and responsive user interface design.

## ✨ Features

### 1. User Authentication

- User registration and login.
- Authentication-based access to protected features.
- User-specific actions and account management.

### 2. User Profiles and Follow System

- View user profiles and profile information.
- Edit personal profile details.
- Follow other users to stay updated with their posts.
- View followers and following counts.
- Track the number of users following a profile and the number of accounts that profile follows.

### 3. Posts and Interactions

- Create and publish social media posts.
- View posts shared by other users.
- Like and unlike posts.
- Display like counts on posts.
- Comment on posts and engage with other users.
- Delete your own posts.
- View other users' posts without having permission to delete them.

### 4. Personalized Home Feed

LinkUp provides three feed sections to help users discover relevant content.

#### Latest

Displays the newest posts first, allowing users to see recently published content.

#### Following

Displays posts published by users the current user follows, making it easier to keep up with their activity.

#### For You — Echo Chamber Algorithm

The **For You** feed implements the project's central recommendation concept: an Echo Chamber algorithm based on the content categories the user likes most.

The algorithm identifies the category in which the user has shown the greatest interest through likes and prioritizes posts from that category in the For You feed. This creates a personalized experience based on the user's interaction history.

The recommendation logic focuses on the user's most-liked category rather than simply displaying all posts in chronological order.

### 5. Explore and Category-Based Search

- Explore posts from different categories.
- Search for posts by category to discover specific types of content.
- Find content beyond the posts displayed in the personalized feed.
- Discover posts based on interests and selected categories.

### 6. Notifications and Inbox

LinkUp includes notification and messaging features to help users stay informed about activity on the platform.

- **Inbox:** Access messages and conversations.
- **Post Likes:** Receive notifications when another user likes your post.
- **Post Comments:** Receive notifications when another user comments on your post.
- **Followed Users' New Posts:** Receive notifications when a user you follow publishes a new post.

These notifications help users keep track of interactions with their content and activity from accounts they follow.

### 7. User Interface

- Landing page.
- Login and registration pages.
- Home feed with Latest, Following, and For You sections.
- Create post page.
- User profile and edit profile pages.
- Post details page.
- Explore and category-based search.
- Inbox and notifications interface.

### 8. Privacy and Content Permissions

- Users can create and publish their own posts.
- Users can delete their own posts.
- Users can view other users' posts, but cannot delete posts created by other users.
- Follow relationships help personalize feeds and notifications.

## 🚀 Future Improvements

- **Continue with Google:** Implement Google OAuth authentication to allow users to register or log in using their Google accounts.
- **Enhanced Recommendation System:** Improve the Echo Chamber algorithm to provide more relevant and personalized post recommendations.
- **Improved Search:** Add more advanced search and filtering options for posts, categories, and users.
- **Enhanced Messaging:** Expand messaging functionality with additional conversation features.

## ⚙️ Vercel Configuration

The backend uses the following `vercel.json` configuration to route incoming requests to the Express server:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```
Author:

muskanpatoli25-gif | Arithmatrix AVIP 2026
