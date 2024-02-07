// Import required modules
const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

// Define server and agent variables
let server, agent;

// Function to extract CSRF token from response using Cheerio
function getTokenFromResponse(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

// Function to login user using provided agent
const loginUser = async (agent, email, password) => {
  // Perform GET request to signin page
  let res = await agent.get("/signin");
  // Extract CSRF token from response
  const csrfToken = getTokenFromResponse(res);
  // Perform POST request to session with email, password, and CSRF token
  res = await agent.post("/session").send({
    email,
    password,
    _csrf: csrfToken,
  });
};

// Integration test suite for managing course content
describe("Integration Test Suite for Managing Course Content", () => {
  // Setup before running tests
  beforeAll(async () => {
    // Sync database
    await db.sequelize.sync({ force: true });
    // Start server and create agent
    server = app.listen(3000);
    agent = request.agent(server);
  });

  // Teardown after tests are done
  afterAll(async () => {
    // Close database connection and server
    await db.sequelize.close();
    server.close();
  });

  // Test user signup functionality
  test("User Signup", async () => {
    // Perform GET request to signup page
    let res = await agent.get("/signup");
    // Extract CSRF token from response
    const csrfToken = getTokenFromResponse(res);
    // Perform POST request to signup with user details and CSRF token
    res = await agent.post("/signup").send({
      firstName: "Test User",
      lastName: "A",
      email: "testuser@example.com",
      password: "testpassword",
      role: "admin",
      _csrf: csrfToken,
    });
    // Expect response status code to be 302 (redirect)
    expect(res.statusCode).toBe(302);
  });

  // Test user signout functionality
  test("User Signout", async () => {
    // Perform GET request to show page
    let res = await agent.get("/show");
    // Expect response status code to be 200
    expect(res.statusCode).toBe(200);
    // Perform GET request to signout page
    res = await agent.get("/signout");
    // Expect response status code to be 302 (redirect)
    expect(res.statusCode).toBe(302);
    // Perform GET request to show page after signout
    res = await agent.get("/show");
    // Expect response status code to be 302 (redirect)
    expect(res.statusCode).toBe(302);
  });

  // Test course creation
  test("Create Course", async () => {
    // Login user
    await loginUser(agent, "testuser@example.com", "testpassword");
    // Perform GET request to course page
    let res = await agent.get("/course");
    // Extract CSRF token from response
    const csrfToken = getTokenFromResponse(res);
    // Perform POST request to create course with course details and CSRF token
    const response = await agent.post('/course').send({
      "heading": "Android Development",
      _csrf: csrfToken,
    });
    // Expect response status code to be 302 (redirect)
    expect(response.statusCode).toBe(302);
  });

  // Test chapter creation
  test("Create Chapter", async () => {
    // Login user
    await loginUser(agent, "testuser@example.com", "testpassword");
    // Perform GET request to course page
    let res = await agent.get("/course");
    // Extract CSRF token from response
    const csrfToken = getTokenFromResponse(res);
    // Perform POST request to create chapter with chapter details and CSRF token
    const response = await agent.post('/chapter').send({
      "title": "Flutter",
      "description": "This is a language",
      _csrf: csrfToken,
    });
    // Expect response status code to be 302 (redirect)
    expect(response.statusCode).toBe(302);
  });

  // Test page creation
  test("Create Page", async () => {
    // Login user
    await loginUser(agent, "testuser@example.com", "testpassword");
    // Perform GET request to page page
    let res = await agent.get("/page");
    // Extract CSRF token from response
    const csrfToken = getTokenFromResponse(res);
    // Perform POST request to create page with page details and CSRF token
    const response = await agent.post('/page').send({
      "word": "Welcome",
      _csrf: csrfToken,
      chapterId: 1
    });
    // Expect response status code to be 302 (redirect)
    expect(response.statusCode).toBe(302);
  });

  // Test reading a page
  test("Read Page", async () => {
    // Login user
    await loginUser(agent, "testuser@example.com", "testpassword");
    // Perform GET request to read page with specified value
    const aValue = 1;
    const response = await agent.get(`/read?a=${aValue}`);
    // Expect response status code to be 200
    expect(response.statusCode).toBe(200);
    // If response contains pages, expect it to be an array with length greater than 0
    if (response.body.pages) {
      expect(Array.isArray(response.body.pages)).toBe(true);
      expect(response.body.pages.length).toBeGreaterThan(0);
    }
  });

  // Test viewing user courses
  test("View User Courses", async () => {
    // Login user
    await loginUser(agent, "testuser@example.com", "testpassword");
    // Perform GET request to view user courses
    const response = await agent.get("/mycourse");
    // Expect response status code to be 200
    expect(response.statusCode).toBe(200);
    // If response content-type is not HTML, expect body to be defined
    if (!response.header["content-type"].includes("text/html")) {
      expect(response.body).toBeDefined();
    }
  });

  // Test enrolling in a course
  test("Enroll in Course", async () => {
    // Login user
    await loginUser(agent, "testuser@example.com", "testpassword");
    // Specify pack ID value
    const packIdValue = 1;
    // Perform GET request to enroll in course with specified pack ID value
    const response = await agent.get(`/enroll/${packIdValue}`);
    // Expect response status code to be 302 (redirect)
    expect(response.statusCode).toBe(302);
    // Expect redirect location to contain pack ID value
    expect(response.header.location).toContain(`/viewcourse?packId=${packIdValue}`);
  });

  // Test viewing a course
  test("View Course", async () => {
    // Login user
    await loginUser(agent, "testuser@example.com", "testpassword");
    // Specify pack ID value
    const packIdValue = 1;
    // Perform GET request to view course with specified pack ID value
    const response = await agent.get(`/viewcourse?packId=${packIdValue}`);
    // Expect response status code to be either 200 or 404
    expect([200, 404]).toContain(response.statusCode);
    // If response status code is 200, expect response text to contain "Chapters"
    if (response.statusCode === 200) {
      expect(response.text).toContain("Chapters");
    } 
    // If response status code is 404, expect response text to contain "no"
    else if (response.statusCode === 404) {
      expect(response.text).toContain("no");
    }
  });

  // Test marking a page as complete
  test("Mark Page as Complete", async () => {
    // Login user
    await loginUser(agent, "testuser@example.com", "testpassword");
    // Specify chapter ID and pack ID values
    const chapterIdValue = 1;
    const packIdValue = 1;
    // Perform GET request to access page with specified chapter ID and pack ID values
    const response = await agent.get(`/acpage/${chapterIdValue}/${packIdValue}`);
    // Expect response status code to be 200
    expect(response.statusCode).toBe(200);
    // If response content-type includes "text/html", expect response text to contain "pages"
    if (response.header["content-type"].includes("text/html")) {
      expect(response.text).toContain("pages");
    } 
    // If response content-type does not include "text/html", expect pages and pagestats to be defined in response body
    else {
      expect(response.body.pages).toBeDefined();
      expect(response.body.pagestats).toBeDefined();
    }
    // Perform GET request to page page
    res = await agent.get("/page");
    // Extract CSRF token from response
    csrfToken = getTokenFromResponse(res);
    // Perform PUT request to mark page as complete with CSRF token
    const markCompleteResponse = await agent.put("/page/1/1").send({
      _csrf: csrfToken,
    });
    // Parse update response
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    // Expect update response status to be true
    expect(parsedUpdateResponse.status).toBe(true);
  });

  // Test changing user password
  test("Change Password", async () => {
    // Login user
    await loginUser(agent, "testuser@example.com", "testpassword");
    // Perform GET request to change password page
    const res = await agent.get("/change");
    // Extract CSRF token from response
    const csrfToken = getTokenFromResponse(res);
    // Perform GET request to change password page again for verification
    const getPasswordPageResponse = await agent.get("/change");
    // Expect response status code to be 200
    expect(getPasswordPageResponse.statusCode).toBe(200);
    // Define new password
    const newPassword = "newPassword123";
    // Perform POST request to change password with current password, new password, and CSRF token
    const changePasswordResponse = await agent
      .post("/changepassword")
      .send({
        currentPassword: "testpassword",
        newPassword: newPassword,
        _csrf: csrfToken,
      });
    // Expect response status code to be 302 (redirect)
    expect(changePasswordResponse.statusCode).toBe(302);
    // Login user with new password
    await loginUser(agent, "testuser@example.com", newPassword);
    // Perform GET request to show page
    const loginResponse = await agent.get("/show");
    // Expect response status code to be 200
    expect(loginResponse.statusCode).toBe(200);
    // Perform GET request to signout page
    await agent.get("/signout");
  });
});
