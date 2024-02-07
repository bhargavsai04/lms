const express = require("express")
var csrf = require("csurf");
const app = express();
const flash = require("connect-flash");
const path = require("path");
app.set("views", path.join(__dirname, "views"));
const sanitizeHtml = require('sanitize-html');
const { Note, Chapter, User, Page, Enroll, PageStat } = require('./models');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login')
const session = require('express-session')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')
const saltRounds = 10;
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser("ssh! some secret string"));
app.use(csrf({ cookie: true }))
app.set("view engine", "ejs");

//-----------------------------------------------------------------------------------------
//midddleware
// Initialize flash messages
app.use(flash());

// Configure session middleware
app.use(session({
    secret: "my-super-secret-key-2156238736988",
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Middleware to pass flash messages to views
app.use(function (req, res, next) {
    res.locals.messages = req.flash();
    console.log(res.locals.messages);
    next();
});

// Initialize Passport authentication
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy for user authentication
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, (email, password, done) => {
    // Find user by email
    User.findOne({ where: { email } })
        .then(async (user) => {
            if (!user) {
                return done(null, false, { message: "User does not exist" });
            }
            // Compare passwords
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: "Invalid password" });
            }
        })
        .catch((error) => {
            return done(error);
        });
}));

// Serialize user for session storage
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session storage
passport.deserializeUser((id, done) => {
    User.findByPk(id)
        .then(user => {
            if (user) {
                done(null, user); // User found
            } else {
                done(null, false); // No user found
            }
        })
        .catch(error => {
            done(error);
        });
});


//----------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------
//user related

// Endpoint to create a new chapter under a note
app.get("/create-chapter", async (req, res) => {
    // Retrieve note from request object
    var note = req.note;
    console.log(note);
    // Create a new chapter titled "Motion and Speed" under the note
    const createdChapter = await note.createChapter({ title: "Motion and Speed" });
    // Find all chapters related to the note
    const allChapters = await Chapter.findAll({
        where: {
            NoteId: note.id
        }
    });
    // Send the list of chapters as response
    res.send(allChapters);
});

// Endpoint to retrieve user's notes including a specific note
app.get("/user-notes", async (req, res) => {
    // Retrieve user with ID 1 and include associated notes
    const userNotes = await User.findAll({
        include: Note,
        where: {
            id: 1
        }
    });
    // Send the user's notes as response
    res.send(userNotes);
});

// Endpoint to render or send JSON response for course page
app.get("/course", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    // Redirect to show page if user is a student
    if (req.user.roll == "student") {
        res.redirect("/show");
    } else {
        // Render course page for admin
        if (req.accepts("html")) {
            res.render('course', {
                csrfToken: req.csrfToken()
            });
        } else {
            // Send JSON response with CSRF token for non-HTML request
            res.json({
                csrfToken: req.csrfToken()
            });
        }
    }
});

// Endpoint to create a new note for the logged-in user
app.post("/course", async (req, res) => {
    // Retrieve the logged-in user
    var currentUser = req.user;
    // Create a new note with the provided heading
    const createdNote = await currentUser.createNote({ heading: req.body.heading });
    // Redirect to chapter page
    res.redirect("/chapter");
});

//---------------------------------------------------------------------------------------------------------------------
//======================================================================================================================

// Endpoint to handle the creation of a new chapter
app.post("/show", async (req, res) => {
    try {
        // Create a new chapter with the provided details
        const chapter = await Chapter.create({ NoteId: req.body.notesid, title: req.body.title });
        console.log(chapter);

        // Redirect to the '/show' page after creating the chapter
        return res.redirect("/show");
    } catch (error) {
        // If an error occurs, send the error message as response
        res.status(500).send(error.message);
    }
});

// Endpoint to render the 'show' page
app.get("/show", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Fetch all notes, chapters, users, and enrollments
        const packs = await Note.findAll();
        const chaps = await Chapter.findAll();
        const userss = await User.findAll();
        const enrolls = await Enroll.findAll();
        const ensds = await Enroll.findAll({ where: { studentId: req.user.id } });
        const a = req.user;
        const b = a.id;

        // Filter out notes that the user is not enrolled in
        const packIds = packs.map(pack => pack.id);
        const ensdscourseID = ensds.map(ensd => ensd.courseId);
        const filterpacks = packIds.filter(element => !ensdscourseID.includes(element));
        const notesForFilterPacks = [];

        // Retrieve notes that the user is not enrolled in
        for (const packId of filterpacks) {
            const notes = await Note.findOne({ where: { id: packId } });
            notesForFilterPacks.push(notes);
        }

        // Render the appropriate page based on user role
        if (req.user.roll == "admin") {
            res.render('display', {
                packs,
                chaps,
                userss,
                a,
                enrolls,
                csrfToken: req.csrfToken()
            });
        } else {
            res.render('display2', {
                packs,
                chaps,
                userss,
                a,
                enrolls,
                ensds,
                notesForFilterPacks,
                b,
                csrfToken: req.csrfToken()
            });
        }
    } catch (error) {
        // Handle errors gracefully
        console.error("Error rendering 'show' page:", error);
        res.status(500).send("Internal Server Error");
    }
});

//-------------------------------
// Endpoint to handle requests to the root URL
app.get("/", async function (req, res) {
    try {
        // Check if the user is authenticated
        if (req.user) {
            // If authenticated, redirect to the '/show' page
            res.redirect("/show");
        } else {
            // If not authenticated, render the 'fronts' page for login/signup
            res.render('fronts', {
                csrfToken: req.csrfToken()
            });
        }
    } catch (error) {
        // Handle errors gracefully
        console.error("Error processing request:", error);
        res.status(500).send("Internal Server Error");
    }
});

//---------
// Endpoint to render the signup page
app.get("/signup", (req, res) => {
    try {
        if (req.accepts("html")) {
            // Render the signup page with CSRF token
            res.render('signup', {
                csrfToken: req.csrfToken()
            });
        } else {
            // Respond with JSON if the client does not accept HTML
            res.json({});
        }
    } catch (error) {
        // Handle errors gracefully
        console.error("Error rendering signup page:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Endpoint to handle signup form submission
app.post("/signup", async (req, res) => {
    try {
        // Hash the password using bcrypt
        const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);

        // Validate password length
        if (req.body.password.length < 6) {
            req.flash("error", "Please enter a valid password of minimum length of 6 characters");
            return res.redirect("/signup");
        }

        // Create a new user with hashed password
        const user = await User.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPwd,
            roll: req.body.userType
        });

        // Log in the user after successful signup
        req.login(user, (err) => {
            if (err) {
                console.error("Error logging in user:", err);
            }
            res.redirect("/show");
        });
    } catch (error) {
        // Handle signup errors
        console.error("Error signing up user:", error);
        req.flash("error", "User already exists or an error occurred during signup.");
        res.redirect("/signup");
    }
});

//---------------------------------------------------------------
// Endpoint to render the signin page
app.get("/signin", async (req, res) => {
    if (req.accepts("html")) {
        // Render the signin page with CSRF token
        res.render('signin', {
            csrfToken: req.csrfToken()
        });
    } else {
        // Return JSON response if requested format is not HTML
        res.json({
            csrfToken: req.csrfToken()
        });
    }
});

// Endpoint to redirect to the home page for login
app.get("/login", async (req, res) => {
    // Redirect to the home page
    res.redirect("/");
});

// Endpoint to handle user authentication
app.post(
    "/session",
    passport.authenticate("local", {
        failureRedirect: "/signin", // Redirect to signin page on authentication failure
        failureFlash: true, // Enable flash messages on failure
    }),
    function (request, response) {
        // Redirect to the show page upon successful authentication
        response.redirect("/show");
    }
);

//---------------------------------------------------

//---------------------------------------------------
// Endpoint to render the chapter creation page
app.get("/chapter", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Find all notes belonging to the logged-in user
    const notees = await Note.findAll({ where: { userId: req.user.id } });
    
    // Get the last note created by the user
    const notee = notees[notees.length - 1];

    if (notee) {
        if (req.accepts("html")) {
            // Render the chapter creation page with CSRF token
            res.render('chapter', {
                notee,
                csrfToken: req.csrfToken()
            });
        } else {
            // Return JSON response with CSRF token
            res.json({
                csrfToken: req.csrfToken()
            });
        }
    } else {
        // If no notes exist, redirect with error message
        req.flash("error", "Please create a course first.");
        res.redirect("/show");
    }
});

// Endpoint to handle chapter creation
app.post("/chapter", async (req, res) => {
    // Find all notes belonging to the logged-in user
    const notees = await Note.findAll({ where: { userId: req.user.id } });
    
    // Get the last note created by the user
    const notee = notees[notees.length - 1];
    
    // Create a new chapter for the last note with provided title and description
    notee.createChapter({ title: req.body.title, description: req.body.description });

    // Redirect to the page endpoint after chapter creation
    res.redirect("/page");
});
//-----------------------------
// Endpoint to render the page view
app.get("/page", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Find all notes belonging to the logged-in user
    const notees = await Note.findAll({ where: { userId: req.user.id } });
    
    // Get the last note created by the user
    const notee = notees[notees.length - 1];

    if (notee) {
        // Find all chapters belonging to the last note
        const chapters = await Chapter.findAll({ where: { NoteId: notee.id } });
        
        if (req.accepts("html")) {
            // Render the page view with note, chapters, and CSRF token
            res.render('page', {
                notee,
                chapters,
                csrfToken: req.csrfToken()
            });
        } else {
            // Return JSON response with CSRF token
            res.json({
                csrfToken: req.csrfToken()
            });
        }
    } else {
        // If no note exists, redirect with error message
        req.flash("error", "Please create a chapter first.");
        res.redirect("/show");
    }
});

// Endpoint to handle page creation
app.post("/page", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Create a new page with the provided word and chapter ID
    const ao = await Page.create({ word: req.body.word, chapterId: req.body.chapterId, completed: false });
    
    // Extract the chapter ID from the request body
    const a = req.body.chapterId;
    
    // Redirect to the read page endpoint with the chapter ID as a query parameter
    res.redirect(`/read?a=${a}`);
});
//---------------------------------------------------------------

// Endpoint to render the read page view
app.get("/read", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Redirect students to the show page
    if (req.user.roll == "student") {
        res.redirect("/show");
    } else {
        // Retrieve the 'a' value from the query parameter
        const a = req.query.a;

        // Check if 'a' parameter is missing
        if (!a) {
            return res.status(400).send("Invalid request: Chapter ID is required");
        }

        // Find all pages belonging to the specified chapter ID
        const pages = await Page.findAll({ where: { chapterId: a } });

        // Check the request format and render the appropriate response
        if (req.accepts("html")) {
            // Render the read page view with pages and CSRF token
            res.render('read', {
                pages,
                csrfToken: req.csrfToken()
            });
        } else {
            // Return JSON response with pages
            res.json({ pages });
        }
    }
});
//----------------------------
// Endpoint to render the user's courses page
app.get("/mycourse", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Find all courses belonging to the current user
    const packs = await Note.findAll({ where: { userId: req.user.id } });

    // Check the request format and render the appropriate response
    if (req.accepts("html")) {
        // Render the mycourse page view with packs and CSRF token
        res.render('mycourse', {
            packs,
            csrfToken: req.csrfToken()
        });
    } else {
        // Return an empty JSON response
        res.json({});
    }
});
//---------------------------
// Endpoint to handle course enrollment
app.get('/enroll/:packId', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Retrieve the packId from the request parameters
    const packId = req.params.packId;

    // Check if the user is already enrolled in the course
    const enrollment = await Enroll.findOne({ where: { studentId: req.user.id, courseId: packId } });
    if (enrollment) {
        // Redirect to show page with error message if already enrolled
        req.flash("error", "You are already enrolled. Find it in the My Courses section.");
        res.redirect("/show");
    } else {
        // Create a new enrollment for the user
        const newEnrollment = await Enroll.create({ studentId: req.user.id, courseId: packId });

        // Find all chapters of the enrolled course
        const chapters = await Chapter.findAll({ where: { NoteId: packId } });

        // Initialize an array to store page IDs
        const pageIds = [];

        // Iterate through each chapter to find its pages
        for (const chapter of chapters) {
            // Find all pages of the chapter
            const pages = await Page.findAll({ where: { chapterId: chapter.id } });

            // Map page IDs and add them to the array
            const chapterPageIds = pages.map(page => page.id);
            pageIds.push(...chapterPageIds);
        }

        // Create page stats for each page of the course
        for (const pageId of pageIds) {
            await PageStat.create({
                studentId: req.user.id,
                courseId: packId,
                chapterId: 0, // Placeholder chapter ID, to be updated later
                pageId: pageId,
                status: false
            });
        }

        // Redirect to viewcourse page with the enrolled course's packId
        res.redirect(`/viewcourse?packId=${packId}`);
    }
});
//-------------------------------------

app.get("/viewcourse", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    const packId = req.query.packId;
    a = req.user.id
    p = await Enroll.findOne({ where: { studentId: req.user.id } })
    if (p) {
        const Chapters = await Chapter.findAll({ where: { NoteId: packId } })
        res.render("access", {
            Chapters,
            packId,
            a,
            csrfToken: req.csrfToken()
        })
    } else {
        res.send("no")
    }
});

//----------------------------------------
app.get("/acpage/:chapterId/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {

    const chapterId = req.params.chapterId;
    const packId = req.params.packId;
    const pages = await Page.findAll({ where: { chapterId: chapterId } })
    const pagestats = await PageStat.findAll({ where: { studentId: req.user.id, courseId: packId } })

    if (req.accepts("html")) {
        res.render('readforst', {
            packId,
            pages,
            pagestats,
            userid: req.user.id,
            csrfToken: req.csrfToken()
        });
    } else {
        res.json({
            pages,
            pagestats,
            csrfToken: req.csrfToken()
        });
    }
});
//----------------------------------------
// Endpoint to generate reports for user's courses and enrollments
app.get("/reports", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Retrieve courses created by the current user
    const packs = await Note.findAll({ where: { userId: req.user.id } });

    // Retrieve all enrollments
    const enrolls = await Enroll.findAll();

    // Check if client accepts HTML response
    if (req.accepts("html")) {
        // Render HTML page with course reports
        res.render('reports', {
            packs: packs,
            enrolls: enrolls,
            csrfToken: req.csrfToken()
        });
    } else {
        // Return JSON response with course reports
        res.json({
            packs: packs,
            enrolls: enrolls
        });
    }
});

//----------------------------------------
// Endpoint to display progress of a course
app.get("/progress/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Extract packId from the request parameters
    const packId = req.params.packId;

    // Retrieve all enrollments for the specified course
    const enrolls = await Enroll.findAll({ where: { courseId: packId } });

    // Retrieve all chapters of the specified course
    const chapters = await Chapter.findAll({ where: { NoteId: packId } });

    // Retrieve all page statistics for the specified course
    const pagestats = await PageStat.findAll({ where: { courseId: packId } });

    // Retrieve all users
    const users = await User.findAll();

    // Retrieve all pages
    const pages = await Page.findAll();

    // Check if client accepts HTML response
    if (req.accepts("html")) {
        // Render HTML page with course progress
        res.render('progress', {
            chapters: chapters,
            pages: pages,
            enrolls: enrolls,
            users: users,
            pagestats: pagestats,
            packId: packId,
            csrfToken: req.csrfToken()
        });
    } else {
        // Return JSON response with course progress
        res.json({
            chapters: chapters,
            pages: pages,
            enrolls: enrolls,
            users: users,
            pagestats: pagestats,
            packId: packId
        });
    }
});

//----------------------------------------
// Endpoint to update completion status of a page
app.put("/page/:id/:ip", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Find the page statistics entry for the specified page, course, and student
        const pagestats = await PageStat.findOne({ 
            where: { 
                pageId: req.params.id, 
                courseId: req.params.ip, 
                studentId: req.user.id 
            } 
        });

        // Update the completion status of the page
        const updatedPageStat = await pagestats.setCompletionStatus();

        // Return JSON response with the updated page statistics
        return res.json(updatedPageStat);
    } catch (error) {
        console.error(error);
        // Return a 422 Unprocessable Entity status with the error message if an error occurs
        return res.status(422).json(error);
    }
});

//----------------------------------------
// Endpoint to retrieve student progress for a specific course
app.get("/student/:studentId/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Extract studentId and courseId from request parameters
        const studentId = req.params.studentId;
        const courseId = req.params.packId;

        // Count the number of completed pages for the student in the specified course
        const completed = await PageStat.count({ where: { studentId: studentId, courseId: courseId, status: true } });

        // Count the total number of pages for the student in the specified course
        const all = await PageStat.count({ where: { studentId: studentId, courseId: courseId } });

        // Calculate the percentage of completion
        const completionPercentage = (completed / all) * 100;

        if (req.accepts("html")) {
            // Render HTML view with student progress information
            res.render('studentprog', {
                completed,
                all,
                p: completionPercentage,
                csrfToken: req.csrfToken()
            });
        } else {
            // Return JSON response with student progress information
            res.json({
                completed,
                all,
                p: completionPercentage
            });
        }
    } catch (error) {
        console.error(error);
        // Return a 500 Internal Server Error status with the error message if an error occurs
        res.status(500).json({ error: "An error occurred while retrieving student progress." });
    }
});

//----------------------------------------
// Endpoint to view chapters of a specific course
app.get("/viewcourses/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Extract packId from request parameters
        const packId = req.params.packId;
        
        // Find all chapters related to the specified course
        const chapters = await Chapter.findAll({ where: { NoteId: packId } })

        if (req.accepts("html")) {
            // Render HTML view with chapters information
            res.render('see', {
                chapters,
                packId,
                csrfToken: req.csrfToken()
            });
        } else {
            // Return JSON response with chapters information
            res.json({
                chapters,
                packId
            });
        }
    } catch (error) {
        console.error(error);
        // Return a 500 Internal Server Error status with the error message if an error occurs
        res.status(500).json({ error: "An error occurred while retrieving chapters." });
    }
});

//----------------------------------------
// Endpoint to view courses of a specific student
app.get("/mycoursestudent/:studentID", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Extract studentID from request parameters
        const studentId = req.params.studentID
        
        // Retrieve all enrollments, users, notes, and enrollments related to the specified student
        const enrolls = await Enroll.findAll()
        const userss = await User.findAll()
        const packs = await Note.findAll()
        const ensds = await Enroll.findAll({ where: { studentId: studentId } })
        
        if (req.accepts("html")) {
            // Render HTML view with student's course information
            res.render('mycoursestudent', {
                studentId,
                enrolls,
                userss,
                packs,
                ensds,
                csrfToken: req.csrfToken()
            });
        } else {
            // Return JSON response with student's course information
            res.json({
                studentId,
                enrolls,
                userss,
                ensds
            });
        }
    } catch (error) {
        console.error(error);
        // Return a 500 Internal Server Error status with the error message if an error occurs
        res.status(500).json({ error: "An error occurred while retrieving student's courses." });
    }
});

//----------------------------------------
// Endpoint to view progress of a specific student in a course
app.get("/myprogresses/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Get the current user's ID
        const userId = req.user.id
        
        // Extract packId from request parameters
        const packId = req.params.packId
        
        // Count completed and total pages for the user in the specified course
        const completed = await PageStat.count({ where: { studentId: userId, courseId: packId, status: true } })
        const all = await PageStat.count({ where: { studentId: userId, courseId: packId } })
        
        // Calculate percentage of completion
        const completionPercentage = (completed / all) * 100

        if (req.accepts("html")) {
            // Render HTML view with user's progress information
            res.render('myprog', {
                completed,
                all,
                completionPercentage,
                userId,
                csrfToken: req.csrfToken()
            });
        } else {
            // Return JSON response with user's progress information
            res.json({
                completed,
                all,
                completionPercentage
            });
        }
    } catch (error) {
        console.error(error);
        // Return a 500 Internal Server Error status with the error message if an error occurs
        res.status(500).json({ error: "An error occurred while retrieving user's progress." });
    }
});

//----------------------------------------
// Endpoint to render the change password form
app.get("/change", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Render the change password form with CSRF token
        res.render("changepass", {
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error(error);
        // Return a 500 Internal Server Error status with the error message if an error occurs
        res.status(500).json({ error: "An error occurred while rendering the change password form." });
    }
});

//----------------------------------------
// Endpoint to handle password change request
app.post("/changepassword", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Extract current and new passwords from request body
        const enteredCurrentPassword = req.body.currentPassword;
        const newpassword = req.body.newPassword;

        // Retrieve the user from the database
        const user = await User.findByPk(req.user.id);

        // Compare the entered current password with the stored hashed password
        const passwordMatch = await bcrypt.compare(enteredCurrentPassword, user.password);

        // If the current password doesn't match, handle the error
        if (!passwordMatch) {
            req.flash("error", "Current password is incorrect.");
            return res.redirect("/change");
        }
        // If the confirm password doesn't match the new password, handle the error
        else if (req.body.confirmPassword != req.body.newPassword) {
            req.flash("error", "Confirm password does not match the new password.");
            return res.redirect("/change");
        }
        // If the new password length is less than 6 characters, handle the error
        else if (req.body.newPassword.length < 6) {
            req.flash("error", "Password length should be more than 6 characters.");
            return res.redirect("/change");
        }
        else {
            // Hash the new password
            const saltRounds = 10; // You can adjust this value
            const hashedNewPassword = await bcrypt.hash(newpassword, saltRounds);

            // Update the user's password in the database
            await user.update({ password: hashedNewPassword });

            // Redirect to sign-in page after successful password change
            return res.redirect("/signin");
        }
    } catch (error) {
        console.error(error);
        // Return a 500 Internal Server Error status with the error message if an error occurs
        res.status(500).json({ error: "An error occurred while processing the password change request." });
    }
});

//----------------------------------------
// Endpoint to handle user sign out
app.get("/signout", (req, res, next) => {
    // Log out the user
    req.logOut((err) => {
        if (err) {
            // If an error occurs during log out, handle it
            return next(err);
        } else {
            // Redirect to the home page after successful sign out
            res.redirect("/");
        }
    });
});

//----------------------------------------
// Endpoint to view course details for administrators
app.get("/CourseViewerAdmin/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Check if the user is an admin
    if (req.user.roll == "admin") {
        // Extract the packId from the request parameters
        const packId = req.params.packId;
        
        // Retrieve all chapters belonging to the specified packId
        const chapters = await Chapter.findAll({ where: { NoteId: packId } });
        
        // Extract the user ID
        const userId = req.user.id;
        
        // Render the CourseViewerAdmin template with the appropriate data
        res.render("CourseViewerAdmin", {
            packId: packId,
            userId: userId,
            chapters: chapters,
            csrfToken: req.csrfToken()
        });
    } else {
        // Redirect to the show page if the user is not an admin
        res.redirect("/show");
    }
});

//----------------------------------------
// Endpoint to view pages for administrators
app.get("/adminpage/:chapterId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Check if the user is an admin
    if (req.user.roll == "admin") {
        // Extract the chapterId from the request parameters
        const chapterId = req.params.chapterId;
        
        // Retrieve the chapter based on the provided chapterId
        const chapter = await Chapter.findOne({ where: { id: chapterId } });
        
        // Extract the packId from the retrieved chapter
        const packId = chapter.NoteId;

        // Retrieve all pages belonging to the specified chapterId
        const pages = await Page.findAll({ where: { chapterId: chapterId } });

        // Extract the user ID
        const userId = req.user.id;

        // Render the viewpageadmin template with the appropriate data
        res.render("PageViewerAdmin", {
            chapterId: chapterId,
            packId: packId,
            pages: pages,
            userId: userId,
            csrfToken: req.csrfToken()
        });
    } else {
        // Redirect to the show page if the user is not an admin
        res.redirect("/show");
    }
});

//----------------------------------------
// Endpoint to view courses for administrators
app.get("/viewcoursesadmin/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Extract the packId from the request parameters
    const packId = req.params.packId;

    // Retrieve all chapters associated with the specified packId
    const chapters = await Chapter.findAll({ where: { NoteId: packId } });

    // Check if the client accepts HTML content
    if (req.accepts("html")) {
        // Render the seeadmin template with the chapters and packId
        res.render('ViewAdmin', {
            chapters: chapters,
            packId: packId,
            csrfToken: req.csrfToken()
        });
    } else {
        // Send JSON response with chapters and packId
        res.json({
            chapters: chapters,
            packId: packId
        });
    }
});

//----------------------------------------
// Endpoint to render the page for editing a course
app.get("/edit/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Extract the packId from the request parameters
    const packId = req.params.packId;

    // Find the note associated with the specified packId
    const notee = await Note.findOne({ where: { id: packId } });

    // Check if the note exists
    if (notee) {
        // Check if the client accepts HTML content
        if (req.accepts("html")) {
            // Render the chapteredit template with the note information
            res.render('chapteredit', {
                notee: notee,
                csrfToken: req.csrfToken()
            });
        } else {
            // Send JSON response with CSRF token
            res.json({
                csrfToken: req.csrfToken()
            });
        }
    } else {
        // If the note does not exist, redirect to create a course
        req.flash("error", "Please create a course first");
        res.redirect("/show");
    }
});

//----------------------------------------
// Endpoint to handle the creation of a new chapter for a course
app.post("/chapteredit/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Extract the packId from the request parameters
    const packId = req.params.packId;

    // Find the note associated with the specified packId
    const notee = await Note.findOne({ where: { id: packId } });

    // Create a new chapter for the course with the provided title and description
    notee.createChapter({ title: req.body.title, description: req.body.description });

    // Redirect the user to the page for editing chapters of the course
    res.redirect(`/pageedit?packId=${packId}`);
});

//----------------------------------------
// Endpoint to render the page for editing chapters of a course
app.get("/pageedit", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Extract the packId from the query parameters
    const packId = req.query.packId;

    // Find the note associated with the specified packId
    const notee = await Note.findOne({ where: { id: packId } });

    // Find all chapters belonging to the course identified by the packId
    const chapters = await Chapter.findAll({ where: { NoteId: notee.id } });

    // Check if the client accepts HTML content
    if (req.accepts("html")) {
        // Render the pageedit view with the retrieved data
        res.render('pageedit', {
            notee,
            chapters,
            packId,
            csrfToken: req.csrfToken()
        });
    } else {
        // Respond with JSON containing the CSRF token
        res.json({
            csrfToken: req.csrfToken()
        });
    }
});

//----------------------------------------
// Endpoint to handle the creation of a new page and update page stats for enrolled students
app.post("/pageedit/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    // Log a message for debugging
    console.log('hellow');

    // Extract the packId from the request parameters
    const packId = req.params.packId;

    // Create a new page with the provided data
    const newPage = await Page.create({ word: req.body.word, chapterId: req.body.chapterId, completed: false });
    const chapterId = req.body.chapterId;

    // Log a message for debugging
    console.log('hellow1');

    // Find all pages associated with the chapter
    const pages = await Page.findAll({ where: { chapterId } });
    
    // Get the last created page
    const page = pages[pages.length - 1];

    // Find all enrolled students for the course
    const enstudents = await PageStat.findAll({ where: { courseId: packId } });

    // Log the page ID for debugging
    console.log(page.id);

    // Initialize an array to store unique student IDs
    const uniqueStudentIds = [];

    // Extract unique student IDs from enstudents
    for (const enstudent of enstudents) {
        const studentId = enstudent.studentId;
        uniqueStudentIds.push(studentId);
    }

    // Filter out duplicate student IDs
    const uniqueStudentIdsFiltered = uniqueStudentIds.filter((item, i, arr) => arr.indexOf(item) === i);

    // Log the unique student IDs for debugging
    console.log(uniqueStudentIdsFiltered);
    console.log('hellow2');

    // Iterate over unique student IDs and create page stats for each student
    for (const uniqueStudentId of uniqueStudentIdsFiltered) {
        console.log('hellow3');
        await PageStat.create({
            studentId: uniqueStudentId,
            courseId: packId,
            chapterId: 3,
            pageId: page.id,
            status: false
        });
    }

    // Redirect to the read page passing the chapter ID as a query parameter
    res.redirect(`/read?a=${chapterId}`);
});

//----------------------------------------
// Endpoint to retrieve all packs
app.get("/packs", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Retrieve all packs from the database
        const packs = await Note.findAll();

        // Send the packs as a response
        res.send(packs);
    } catch (error) {
        // Handle errors gracefully
        console.error("Error retrieving packs:", error);
        res.status(500).send("Internal Server Error");
    }
});

//----------------------------------------
// Endpoint to render the admin view of an online course
app.get("/CourseViewManagerOnline/:packId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.user.roll == "admin") {
            // Retrieve the packId from the request parameters
            const packId = req.params.packId;
            
            // Retrieve all chapters related to the packId
            const chapters = await Chapter.findAll({ where: { NoteId: packId } });
            
            // Render the admin view of the online course
            res.render("CourseViewManagerOnline", {
                a: packId,
                p: req.user.id,
                chapters,
                csrfToken: req.csrfToken()
            });
        } else {
            // Redirect to the show page if the user is not an admin
            res.redirect("/show");
        }
    } catch (error) {
        // Handle errors gracefully
        console.error("Error rendering admin view of online course:", error);
        res.status(500).send("Internal Server Error");
    }
});

//----------------------------------------
// Endpoint to render the admin view of an online course page
app.get("/adminpageonline/:chapterId", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.user.roll == "admin") {
            // Retrieve the chapterId from the request parameters
            const chapterId = req.params.chapterId;
            
            // Find the chapter based on the chapterId
            const chapter = await Chapter.findOne({ where: { id: chapterId } });
            const packId = chapter.NoteId;

            // Retrieve all pages related to the chapter
            const pages = await Page.findAll({ where: { chapterId } });

            // Render the admin view of the online course page
            res.render("viewpageadminonline", {
                a: chapterId,
                p: req.user.id,
                packid: packId,
                pages,
                csrfToken: req.csrfToken()
            });
        } else {
            // Redirect to the show page if the user is not an admin
            res.redirect("/show");
        }
    } catch (error) {
        // Handle errors gracefully
        console.error("Error rendering admin view of online course page:", error);
        res.status(500).send("Internal Server Error");
    }
});

//----------------------------------------
// Endpoint to render the positivity view
app.get("/posit", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Find all users with the role of "admin"
        const admins = await User.findAll({ where: { roll: "admin" } });
        
        // Find all available courses
        const courses = await Note.findAll();
        
        // Arrays to store course names and enrollment counts
        const courseNames = [];
        const enrollments = [];

        // Iterate through courses to collect course names and enrollment counts
        for (const course of courses) {
            // Retrieve course name and id
            const courseName = course.heading;
            const courseId = course.id;
            
            // Count the number of enrollments for the course
            const enrollmentCount = await Enroll.count({ where: { courseId } });
            
            // Push course name and enrollment count to respective arrays
            courseNames.push(courseName);
            enrollments.push(enrollmentCount);
        }

        // Render the positivity view with data
        res.render("posit", {
            courseNames,
            enrollments,
            courses,
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error rendering positivity view:", error);
        res.status(500).send("Internal Server Error");
    }
});

//----------------------------------------
// Endpoint to render the 'About' page
app.get("/about", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Render the 'About' page with CSRF token for security
        res.render("about", {
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error rendering About page:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Endpoint to render the 'Contact' page
app.get("/contact", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        // Render the 'Contact' page with CSRF token for security
        res.render("contact", {
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error rendering Contact page:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Export the 'app' object to be used in other modules
module.exports = app;



