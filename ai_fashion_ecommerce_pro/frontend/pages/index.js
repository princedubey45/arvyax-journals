
import ProductCard from "../components/ProductCard"
import { useEffect, useState } from "react"
import axios from "axios"

export default function Home(){
  const [products,setProducts] = useState([])

  useEffect(()=>{
    axios.get("http://localhost:5000/api/products")
      .then(res=>setProducts(res.data))
  },[])

  return (
    <div style={{padding:40}}>
      <h1>AI Fashion Store</h1>
      <p>Myntra‑style AI powered ecommerce</p>

      <div>
        {products.map(p=>(
          <ProductCard key={p._id} product={p}/>
        ))}
      </div>
    </div>
  )
}
