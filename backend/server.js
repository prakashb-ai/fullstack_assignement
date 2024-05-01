const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./userModel');
const Post = require('./postModel')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config()

const app = express();
const PORT = 3000;

app.use(bodyParser.json());



mongoose.connect(process.env.DATABASE_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));




app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }
  } catch (error) {
    console.error('Error checking existing user:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });

    await newUser.save();

    const token = jwt.sign({ username: newUser.username }, 'your-secret-key');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});




function authenticate(req, res, next) {
    const isAuthenticated = true; 
    if (!isAuthenticated) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
  }



app.get('/posts', authenticate, async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
  
    try {
      const posts = await Post.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  
      const totalPosts = await Post.countDocuments();
  
      const totalPages = Math.ceil(totalPosts / limit);
  
      res.status(200).json({
        success: true,
        page,
        limit,
        totalPages,
        totalPosts,
        posts
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
