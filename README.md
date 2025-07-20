
# College Connect Hub 🎓🔗

A **full-stack web application** designed as a central hub for college campuses, offering two essential utilities:

- 🔍 **Lost & Found System**
- 📢 **Information Broadcast Platform**

This platform streamlines campus communication and helps students and staff manage lost items effectively while staying updated with official announcements.

---

## 🚀 Features

### ✅ User Authentication
- Secure login system with role-based access control
- Roles: **Student** and **Admin**

### 🔎 Lost & Found System
- Students can report lost items.
- Public list of reported lost items.
- Admins can upload found items with images.
- Searchable and filterable gallery of found items.

### 📢 Information Hub
- Admins can create and publish notices.
- All users can view announcements in a central feed.

### 🔐 Role-Based UI
- Interface adapts based on the logged-in user's role.
- Admins see upload/notice options; students see reports/feed only.

---

## 🛠 Tech Stack

### 🎨 Frontend
- **HTML5** – Semantic layout
- **CSS3 & Tailwind CSS** – Styling and responsiveness
- **Vanilla JavaScript** – Client-side logic and dynamic content

### ⚙️ Backend
- **Node.js** – JavaScript runtime
- **Express.js** – Backend framework

### ☁️ Firebase
- **Firestore** – NoSQL database (Users, Reports, Notices)
- **Cloud Storage** – Store item images
- **Admin SDK** – Server authentication & database operations

---

## 📦 Setup and Installation

### ⚙️ Prerequisites
- [Node.js](https://nodejs.org/) installed
- [Firebase Account](https://firebase.google.com/) with project access

---

### 🔧 Firebase Configuration

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project

2. **Set Up Firestore**
   - Go to **Build > Firestore Database**
   - Create a new database in **test mode**

3. **Set Up Storage**
   - Go to **Build > Storage**
   - Note down your **Bucket URL** (e.g., `your-project-id.appspot.com`)

4. **Create Firestore Index**
   - Go to **Firestore Database > Indexes**
   - Create a **composite index** on the `users` collection:
     - `username` - Ascending
     - `password` - Ascending

5. **Generate Service Account Key**
   - Go to **Project Settings > Service Accounts**
   - Click **Generate new private key**
   - Rename it to: `serviceAccountKey.json`
   - Move it to the project root folder

---

### 📁 Backend Setup

```bash
git clone <your-repository-url>
cd <repository-folder>
````

1. **Place `serviceAccountKey.json`** in the root directory.
2. **Install dependencies**:

```bash
npm install
```

3. **Update server.js**:

   * Replace `YOUR_FIREBASE_STORAGE_BUCKET_URL` with your actual Firebase bucket URL.

4. **Run the server**:

```bash
node server.js
```

* Server runs at: `http://localhost:3000`

---

### 🌐 Frontend Setup

1. Open `index.html` in any browser.

2. Log in using credentials available in the **users** collection in Firestore.

---

## 📁 File Structure

```
├── index.html              # Main frontend layout
├── style.css               # Custom styles + Tailwind classes
├── script.js               # Frontend logic and API calls
├── server.js               # Backend Express server
├── serviceAccountKey.json  # Firebase private key (kept secret!)

```

---



## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

---

## 📄 License

MIT License. See `LICENSE` file for more information.

---

## 🙌 Acknowledgements

Thanks to the Firebase, Node.js, and Tailwind CSS communities for the amazing tools.

 Contributors:
- [Priyanshu Tiwari](https://github.com/pds-37)
- [Anurag Dubey ](https://github.com/iamanu26)

