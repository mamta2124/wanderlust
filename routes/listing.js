const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const{isLoggedIn, isOwner, validateListing}= require("../middleware.js");
const listingController=require("../controllers/liistings.js");
const multer  = require("multer");
const {storage} =require("../cloudConfig.js");
const upload = multer({storage });

router .route("/")
 .get( wrapAsync(listingController.index))
 .post(
    isLoggedIn,
    validateListing,
     upload.single("listing[image]"),
    wrapAsync(listingController.createListing) 
);

// Search route
router.get("/search", async (req, res) => {
  let query = req.query.q || "";  // jo search box me type kiya
  try {
    // case-insensitive search
    const listings = await Listing.find({
      $or: [
        { title:{ $regex: query, $options: "i"}},
        {location:{ $regex: query, $options: "i"}},
        {Description :{ $regex: query, $options: "i"}}
     ]
    });

    res.render("listings/index", { 
      allListings: listings, 
      currUser: req.user, 
      query 
    });
  } catch (err) {
    console.log(err);
    res.redirect("/listings");
  }
});

// Category filter route
router.get("/category/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const listings = await Listing.find({ category: { $regex: category, $options: "i" } });
    res.render("listings/index", { 
      allListings: listings, 
      currUser: req.user, 
      query: category 
    });
  } catch (err) {
    console.log(err);
    res.redirect("/listings");
  }
});

// Nayi listing create karne ka route
router.post("/", async (req, res) => {
  try {
    const { title, description, price, imageUrl, category } = req.body;

    // Listing object create karo
    const listing = new Listing({
      title,
      description,
      price,
      image: { url: imageUrl, filename: imageUrl.split("/").pop() },
      category,
      owner: { username: req.user?.username ?? "Admin" } // agar user login nahi hai to default "Admin"
    });
await listing.save();
    res.redirect("/listings"); // save hone ke baad listings page par redirect
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating listing");
  }
});

// New Route
router.get("/new", isLoggedIn, listingController.renderNewForm)

router.route("/:id")
.get( wrapAsync(listingController.showListing))
.put(
    isLoggedIn,
    isOwner,
    validateListing,
    upload.single("listing[image]"),
    wrapAsync(listingController.updateListing)
)
.delete(
    isLoggedIn,
    isOwner,
    
    wrapAsync(listingController.destroyListing)
);

// Edit Route
router.get("/:id/edit",
    isLoggedIn,
    isOwner,
     wrapAsync(listingController.renderEditForm)
    );

module.exports = router;