require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Application = require('./models/Application');
const connectDB = require('../config/database');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Public routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ApplyTrack API is running' });
});

app.use('/api/auth', authRoutes);

// Every application route below requires a valid login token.
app.use('/api/applications', authMiddleware);

// Create an application for the signed-in user
app.post('/api/applications', async (req, res) => {
  try {
    const application = await Application.create({
      ...req.body,
      userId: req.userId,
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// List only this user's applications, with optional search and status filters
app.get('/api/applications', async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = { userId: req.userId };

    if (status) {
      filter.status = status;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.$or = [
        { company: { $regex: safeSearch, $options: 'i' } },
        { role: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const applications = await Application.find(filter).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update only an application owned by this user
app.put('/api/applications/:id', async (req, res) => {
  try {
    const allowedFields = [
      'company',
      'role',
      'jobLink',
      'status',
      'dateApplied',
      'notes',
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete only an application owned by this user
app.delete('/api/applications/:id', async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ message: 'Application deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on PORT: ${PORT}`);
    });
  } catch (error) {
    console.error('Could not start server:', error.message);
    process.exit(1);
  }
}

startServer();