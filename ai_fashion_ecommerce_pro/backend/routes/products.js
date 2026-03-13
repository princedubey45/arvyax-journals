
const router = require("express").Router()

const products=[
 {_id:1,name:"Casual Shirt",price:1200},
 {_id:2,name:"Denim Jacket",price:2500},
 {_id:3,name:"Running Shoes",price:3200}
]

router.get("/",(req,res)=>{
 res.json(products)
})

module.exports = router
