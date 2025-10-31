const postButton = document.querySelector(".post-button");
const postInput = document.querySelector(".create-post-input");
const postFeed = document.querySelector(".post-feed");

function addPostToFeed(post) {
  const feed = document.querySelector(".post-feed");
  const postDiv = document.createElement("div");
  postDiv.classList.add("post");
  postDiv.innerHTML = `
    <div class="post-header">
      <img src="${post.author.avatar || 'images/user_profile.jpg'}" alt="${post.author.fullname}">
      <div>
        <span class="post-user">${post.author.fullname}</span><br>
        <span class="post-time">${new Date(post.createdAt).toLocaleString()}</span>
      </div>
    </div>
    <div class="post-content">
      ${post.content}
    </div>
    <div class="post-actions">
      <button>Like</button>
      <button>Comment</button>
      <button>Share</button>
    </div>
  `;
  feed.prepend(postDiv);
}

if (postButton && postInput && postFeed) {
  postButton.addEventListener("click", () => {
    const content = postInput.value.trim();
    if (content === "") return;

    fetch('/add-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to add post');
      }
      return response.json();
    })
    .then(post => {
      addPostToFeed(post);
      postInput.value = "";
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while adding the post.');
    });
  });
}

if (postFeed) {
  postFeed.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON" && e.target.textContent === "Like") {
      e.target.style.color = "#34c759";
      e.target.textContent = "Liked";
    }
  });
}


const toggleButton = document.getElementById("toggle-add-activity");
const formContainer = document.getElementById("add-activity-form-container");

if (toggleButton && formContainer) {
  toggleButton.addEventListener("click", () => {
    if (formContainer.style.display === "none" || formContainer.style.display === "") {
      formContainer.style.display = "block";
      toggleButton.textContent = "✖ Hide Form";
    } else {
      formContainer.style.display = "none";
      toggleButton.textContent = "➕ Add Activity";
    }
  });
}

const openAddBtn = document.getElementById("open-add-activity");

if (openAddBtn && formContainer) {
  openAddBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    if (toggleButton) toggleButton.textContent = "✖ Hide Form";
    const firstInput = formContainer.querySelector("input");
    if (firstInput) firstInput.focus();
  });
}

const noteInput = document.getElementById("note-input");
const addNoteBtn = document.getElementById("add-note-btn");
const userPosts = document.querySelector(".user-posts");

if (addNoteBtn && noteInput && userPosts) {
  addNoteBtn.addEventListener("click", () => {
    const text = noteInput.value.trim();
    if (text === "") return;

    const newPost = document.createElement("div");
    newPost.className = "post";

    const postHeader = document.createElement("div");
    postHeader.className = "post-header";

    const img = document.createElement("img");
    img.src = "images/user_profile.jpg";
    img.alt = "You";

    const infoDiv = document.createElement("div");
    const userSpan = document.createElement("span");
    userSpan.className = "post-user";
    userSpan.textContent = "You";
    const br = document.createElement("br");
    const timeSpan = document.createElement("span");
    timeSpan.className = "post-time";
    timeSpan.textContent = "Just now";

    infoDiv.append(userSpan, br, timeSpan);
    postHeader.append(img, infoDiv);

    const postContent = document.createElement("div");
    postContent.className = "post-content";
    postContent.textContent = text;

    const postActions = document.createElement("div");
    postActions.className = "post-actions";
    ["Like", "Comment", "Share"].forEach(action => {
      const btn = document.createElement("button");
      btn.textContent = action;
      postActions.appendChild(btn);
    });

    newPost.append(postHeader, postContent, postActions);

    userPosts.insertBefore(newPost, userPosts.children[1] || null);
    noteInput.value = "";
  });
}
document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    // On page load, check localStorage for theme and apply
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
      themeToggleBtn.textContent = '☀️';
    } else {
      themeToggleBtn.textContent = '🌒';
    }
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      if (document.body.classList.contains('light-mode')) {
        themeToggleBtn.textContent = '☀️'; 
        localStorage.setItem('theme', 'light');
      } else {
        themeToggleBtn.textContent = '🌒';
        localStorage.setItem('theme', 'dark');
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const addActivityForm = document.getElementById('add-activity-form');
  const activitiesList = document.querySelector('.activities-list');

  if (addActivityForm && activitiesList) {
    addActivityForm.addEventListener('submit', (e) => {
      e.preventDefault(); 

      const name = document.getElementById('activity-name').value.trim();
      const date = document.getElementById('activity-date').value.trim();
      const location = document.getElementById('activity-location').value.trim();
      const spots = document.getElementById('activity-spots').value.trim();

      if (!name || !date || !location || !spots) return;

      const card = document.createElement('div');
      card.classList.add('activity-card');
      card.innerHTML = `
        <h3> ${name}</h3>
        <p><strong>Date:</strong>${date}}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Spots Left:</strong> ${spots}</p>
        <button>Join</button>
      `;

      activitiesList.appendChild(card);
      addActivityForm.reset();
    });
  }
});
