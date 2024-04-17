const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;
const path = require("path");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
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
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUsernameQuery = `
  SELECT * FROM user
  WHERE username='${username}'
  `;
  const user = await db.get(getUsernameQuery);
  if (user === undefined) {
    const insertUserQuery = `
  INSERT INTO user(username, name, password, gender, location)
  VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');
  `;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(insertUserQuery);
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
  const getUserQuery = `
  SELECT * FROM user 
  WHERE username='${username}';
  `;
  const user = await db.get(getUserQuery);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
// API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const getUserQuery = `
  SELECT * FROM user 
  WHERE username='${username}';
  `;
  const user = await db.get(getUserQuery);
  if (user === undefined) {
    response.status(400);
    response.send("User not Registered");
  } else {
    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const updatePassword = `
      UPDATE user 
      SET password='${hashedPassword}'
      WHERE username='${username}';
      `;
        await db.run(updatePassword);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
