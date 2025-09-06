if(process.env.NODE_ENV!="production"){
require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsmate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport= require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const reviewRoutes = require("./routes/review");
app.use("/listings/:id/reviews", reviewRoutes);

const dbUrl=process.env.ATLASDB_URL;

main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method")); 
app.engine('ejs', ejsmate);
app.use(express.static(path.join(__dirname, "/public")));

const store=MongoStore.create({
  mongoUrl:dbUrl,
  crypto:{
    secret:process.env.SECRET,
  },
  touchAfter:24*3600,
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
 
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser= req.user;
    next();
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);

app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

app.get("/listings/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const listings = await Listing.find({ category:new RegExp(`^${category}$`, "i") });
    console.log(listings);
    res.render("listings/index", { allListings: listings });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

//icons
app.post("/listings", async (req, res) => {
  try {
    const { title, description, price, imageUrl, category } = req.body;
    const listing = new Listing({
      title,
      description,
      price,
      image: { url: imageUrl, filename: imageUrl.split("/").pop() },
      category
    });
    await listing.save();
    res.redirect("/listings");
  } catch (err) {
    console.error(err);
    res.send("Error creating listing");
  }
});


app.listen(8080, () => {
    console.log("server is listening to port 8080");
});
