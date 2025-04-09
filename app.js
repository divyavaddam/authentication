const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDBAndServer();

// Register User
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 20);
  const searchUser = `
    SELECT * FROM user WHERE username = '${username}';
  `;
  const user = await db.get(searchUser);

  if (user === undefined) {
    const addUser = `
           INSERT INTO user(username, name, password, gender, location)
           VALUES('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');
         `;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(addUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `
      SELECT * FROM user WHERE username = '${username}';
    `;
  const user = await db.get(getUser);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

// API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 20);
  const getPassword = `
    SELECT password FROM user 
    WHERE username = '${username}';
  `;
  const password = await db.get(getPassword);
  const isPasswordMatched = await bcrypt.compare(
    oldPassword,
    password.password
  );
  const updatePassword = `
    UPDATE user 
    SET 
      password = '${hashedPassword}';
    WHERE username = '${username}';
  `;
  if (isPasswordMatched === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(updatePassword);
      response.status(200);
      response.send("Password updated");
    }
  }
});
module.exports = app;
