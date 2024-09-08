const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174","https://i-bos-job-task.vercel.app","https://66dd2d4d19010d387b662af4--poetic-kangaroo-5badd4.netlify.app"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oj7uysy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Attempt to connect to the MongoDB client
    await client.connect();
    console.log('Successfully connected to MongoDB');

    // Define the collections
    const cardCollection = client.db('ibos').collection('productsData');
    const cartCollection = client.db('ibos').collection('cartData');

    // Get products data
    app.get('/products', async (req, res) => {
      try {
        const cursor = cardCollection.find();
        const result = await cursor.toArray();

        if (result.length === 0) {
          return res.status(404).send({ message: 'No products found' });
        }
        res.send(result);
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send({ message: 'Error fetching products', error });
      }
    });

    // Add product to cart
    app.post('/cart', async (req, res) => {
      try {
        const { email, product } = req.body;
    
        if (!email || !product) {
          return res.status(400).send({ message: 'Email and product data are required' });
        }
    
        // Structure the cart item
        const cartItem = {
          product,
          userEmail: email,
          quantity: 1,
          addedAt: new Date(),
        };
    
        // Check if the product already exists in the user's cart
        const existingItem = await cartCollection.findOne({ userEmail: email, "product._id": product._id });
    
        if (existingItem) {
          // Product already exists in the cart, return a message indicating this
          return res.status(200).send({ message: 'You already added this product to the cart' });
        } else {
          // Insert new product in the cart if not already present
          const result = await cartCollection.insertOne(cartItem);
          res.status(201).send({ message: 'Product added to cart', result });
        }
      } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).send({ message: 'Error adding product to cart', error });
      }
    });
    

    // Get cart data
    app.get('/cart/:email', async (req, res) => {
      try {
        const { email } = req.params; // Get email from URL parameter

        if (!email) {
          return res.status(400).send({ message: 'Email parameter is required' });
        }

        // Query the cart collection for items with the provided email
        const cartItems = await cartCollection.find({ userEmail: email }).toArray();

        if (cartItems.length === 0) {
          return res.status(404).send({ message: 'No items found in cart for this user' });
        }

        res.send(cartItems);
      } catch (error) {
        console.error('Error fetching cart data:', error.message);
        res.status(500).send({ message: 'Error fetching cart data', error: error.message });
      }
    });

    // Ping to check MongoDB connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. Successfully connected to MongoDB!');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

// Start the MongoDB client and server
run().catch(console.dir);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Listen on the specified port
app.listen(port, () => {
  console.log(`iBos server is running on port ${port}`);
});
