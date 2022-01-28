const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const cors = require("cors");
require("dotenv").config();
const fileUpload = require('express-fileupload');

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5bgr9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});



async function run() {
    try {
        await client.connect();
    const database = client.db("travel-agency");
    const usersCollection = client.db("travel-agency").collection("users");
    const blogsCollection = client.db("travel-agency").collection("blogs");
    const reviewsCollection = client.db("travel-agency").collection("reviews");
        // save user api
        app.post('/users', async (req, res) => {
            const user = req.body;
            user["role"] = "user";
            const result = await usersCollection.insertOne(user);
            console.log('new user data saved');
            res.json(result);
        })

        // update user api
        app.put('/users', async (req, res) => {
            const user = req.body;
            const isOldUser = await usersCollection.findOne({ email: user.email });

            if (isOldUser) {
                const filter = { email: user.email };
                const options = { upsert: true };
                const updateDoc = { $set: user };
                const result = await usersCollection.updateOne(filter, updateDoc, options);

                console.log('old user data updated');
                res.json(result);
            }

            else {
                user["role"] = "user";
                const result = await usersCollection.insertOne(user);
                console.log('users data save with role');
                res.json(result);
            }
        })
       
        // get user api
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            console.log('Users found');
            res.send(users);
        })

        // change user role        
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            if (user.role === 'user') {
                const filter = { email: user.email };
                const updateDoc = { $set: { role: 'admin' } };
                const result = await usersCollection.updateOne(filter, updateDoc);

                console.log('user role set to admin');

                const data = { result, role: 'admin' }
                res.json(data);
            }
            // console.log(user)
            else {
                const filter = { email: user.email };
                const updateDoc = { $set: { role: 'user' } };
                const result = await usersCollection.updateOne(filter, updateDoc);
                console.log('user role set to user');
                const data = { result, role: 'user' }
                res.json(data);
            }
        })

        // check user role admin or not 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            console.log('admin : ', isAdmin);
            res.json(isAdmin);
        })
        // save blogs api
        app.post('/blogs', async (req, res) => {
            const data = req.body;
            const result = await blogsCollection.insertOne(data);

            res.json(result);
        })
        // blog collection
        app.get("/blogs", async (req, res) => {
            const cursor = blogsCollection.find({});
            const blogs = await cursor.toArray();
            res.send(blogs);
        });
        app.delete('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await blogsCollection.deleteOne(query);
            res.send(result);
        })
       
    // GET API for show data
    app.get("/blogs", async (req, res) => {
        const cursor = blogsCollection.find({});
        const blog = await cursor.toArray();
        res.send(blog);
      });
     //GET Dynamic (blog)
     app.get('/blogs/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await blogsCollection.findOne(query);
        res.send(result);
    });
    //post api for add review insert
    app.post("/review", async (req, res) => {
        const review = req.body;
        console.log("hit the post api", review);
        const result = await reviewsCollection.insertOne(review);
        console.log(result);
        res.json(result);
      });
      // GET API for show review
      app.get("/review", async (req, res) => {
        const cursor = reviewsCollection.find({});
        const review = await cursor.toArray();
        res.send(review);
      });

      //update review status 
    app.put('/review/:id' , async(req , res) => {
        const id = req.params.id;
        const updatedOrders = req.body;
        const query = {_id:ObjectId(id)};
        const options = { upsert : true}
        const updatedDoc = {
            $set: {  
              status:updatedOrders.status
            },
        };
        const result =await reviewsCollection.updateOne(query,updatedDoc,options)
        res.json(result)
    })
    // dynamic api for update blogs
    app.get('/blogs/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const blog = await blogsCollection.findOne(query);
        console.log('load blog with id: ', id);
        res.send(blog);
    })
     // update
     app.put('/blogs/:id', async (req, res) => {
        const id = req.params.id;
        const updatedBlogs = req.body;
        console.log(updatedBlogs);
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
              title: updatedBlogs.title,
              description: updatedBlogs.description,
              image: updatedBlogs.image,
              location: updatedBlogs.location,
              category: updatedBlogs.category,
              cost: updatedBlogs.cost,
              info: updatedBlogs.info
          },
      };
      const result = await blogsCollection.updateOne(filter, updateDoc, options)
      console.log('updating', id)
      res.json(result)
    })

    // rating update
    app.put('/rating', async (req, res) => {
        const id = req.body.id;
        const rating = req.body.blogRating;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                rating: rating
            },
        };
        const result = await blogsCollection.updateOne(filter, updateDoc, options)

        res.json(result)
        console.log(rating, id)
    })



    }
    finally {
        // await client.close();
    }
}








run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('end game!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})