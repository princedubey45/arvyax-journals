
export default function ProductCard({product}){
 return(
  <div style={{border:"1px solid #ddd",padding:10,margin:10,width:250}}>
   <h3>{product.name}</h3>
   <p>Price: ₹{product.price}</p>
   <button>Add to Cart</button>
  </div>
 )
}
