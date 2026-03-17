const { Router } = require("express");
const FaqController = require("../controllers/faq.controller.js");

const router = Router();

router.get("/faqs", /* #swagger.tags = ['FAQs'] */ FaqController.getFaqs);
router.post("/faqs", /* #swagger.tags = ['FAQs'] */ FaqController.createFaq);
router.put("/faqs/:id", /* #swagger.tags = ['FAQs'] */ FaqController.updateFaq);
router.delete("/faqs/:id", /* #swagger.tags = ['FAQs'] */ FaqController.deleteFaq);

module.exports = router;
