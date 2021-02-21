const express = require("express");


const router=express.Router()
const ctrlPdfReport=require('../controllers/pdfreport.controller')

router.post('/pdf1',ctrlPdfReport.pdf1)
router.post('/pdf2',ctrlPdfReport.pdf2)
router.post('/pdf3',ctrlPdfReport.pdf3)



module.exports = router;