const express = require("express");
const {
  chooseSubscription,
  activateSubscription,
  getSubscription,
  renewSubscription,
  changeSubscriptionPlan,
} = require("../controllers/subscription.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

router.post("/choose", chooseSubscription);
router.post("/activate", activateSubscription);
router.post("/renew", renewSubscription);
router.patch("/change-plan", authMiddleware, roleMiddleware("ADMIN"), changeSubscriptionPlan);
router.get("/current/:restaurantId", getSubscription);

module.exports = router;
