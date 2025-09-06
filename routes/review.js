const express=require("express");
const router= express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapAsync.js")
const ExpressError =require("../utils/ExpressError.js")
const Review = require ("../models/review.js");
const Listing = require ("../models/listing.js");
const {validateReview, isLoggedIn, isReviewAuthor}= require("../middleware.js");
const { createReview } = require("../controllers/reviews.js");

const reviewController=require("../controllers/reviews.js");

//Post Review Route
router.post("/",
    isLoggedIn,
     validateReview,
     wrapAsync(reviewController.createReview));

//delete Review Route
router.delete(
    "/:reviewId",
    isLoggedIn,
    isReviewAuthor,
     wrapAsync(reviewController.destroyReview)
);

// UPDATE review
router.put("/:reviewId", async (req, res) => {
    const { id, reviewId } = req.params;   // id = listing id, reviewId = review id
    const { comment } = req.body;          // jo naya comment user ne dala

    await Review.findByIdAndUpdate(reviewId, { comment });

    res.redirect(`/listings/${id}`);
});

module.exports =router;