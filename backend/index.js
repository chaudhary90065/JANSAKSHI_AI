const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('./db');
const crypto = require('crypto');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// AI Priority — complaint submit hote hi priority turant calculate karta hai
const { analyzeComplaintPriority } = require('./services/aiCategorizer');

// ===== BADGE SYSTEM (added) =====
const badgeService = require('./services/badgeService');
// ===== END ADDED =====

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const JWT_SECRET = process.env.JWT_SECRET;

async function ensureResetColumns() {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reset_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
    `);
  } catch (err) {
    console.error('Could not add reset columns:', err);
  }
}
ensureResetColumns();
async function ensureFeedbackEvidenceColumns() {
  try {
    await pool.query(`
      ALTER TABLE complaints
      ADD COLUMN IF NOT EXISTS feedback_evidence TEXT,
      ADD COLUMN IF NOT EXISTS feedback_evidence_type TEXT;
    `);
  } catch (err) {
    console.error('Could not add feedback evidence columns:', err);
  }
}
ensureFeedbackEvidenceColumns();

// AI enrichment columns — priority/summary/suggestedAction/language complaint
// submit hote hi analyzeComplaintPriority se aate hain aur yaha store hote hain
async function ensureAIColumns() {
  try {
    await pool.query(`
      ALTER TABLE complaints
      ADD COLUMN IF NOT EXISTS priority TEXT,
      ADD COLUMN IF NOT EXISTS ai_summary TEXT,
      ADD COLUMN IF NOT EXISTS suggested_action TEXT,
      ADD COLUMN IF NOT EXISTS language_detected TEXT;
    `);
  } catch (err) {
    console.error('Could not add AI columns:', err);
  }
}
ensureAIColumns();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ========== EMAIL HELPERS ==========
// Note: we can only email a PLAINTEXT password for accounts we auto-generate
// (e.g. the WhatsApp bot flow). For normal website signups we only ever store
// a bcrypt hash, so those emails skip the password line entirely.

function isRealEmail(email) {
  return !!email && !email.endsWith('@janasakshi.bot');
}

async function sendComplaintConfirmationEmail(user, complaint, generatedPassword = null) {
  if (!isRealEmail(user.email)) return; // whatsapp-only fake email, skip
  try {
    const credentialsBlock = generatedPassword
      ? `<p><strong>Login details:</strong><br/>Email: ${user.email}<br/>Password: ${generatedPassword}</p>`
      : '';

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: `Complaint Registered - #${complaint.id} - JanaSakshi AI`,
      html: `
        <p>Hi ${user.name},</p>
        <p>Your complaint has been registered successfully.</p>
        <ul>
          <li><strong>Complaint ID:</strong> #${complaint.id}</li>
          <li><strong>Title:</strong> ${complaint.title}</li>
          <li><strong>Category:</strong> ${complaint.category}</li>
          <li><strong>Department:</strong> ${complaint.department}</li>
        </ul>
        ${credentialsBlock}
        <p>We will try to resolve this issue as soon as possible. You can log in to your account anytime to check the status.</p>
        <p>Once it's resolved, we'll email you again to collect your feedback — this helps us hold authorities accountable and improve the system for everyone.</p>
      `,
    });

    if (error) console.error('Confirmation email error:', error);
  } catch (err) {
    console.error('Confirmation email error:', err);
  }
}
async function sendResolutionFeedbackEmail(user, complaint) {
  if (!isRealEmail(user.email)) return;
  try {
    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: `Action Needed: Confirm Resolution for Complaint #${complaint.id}`,
      html: `
        <p>Hi ${user.name},</p>
        <p>The department has marked your complaint <strong>#${complaint.id} (${complaint.title})</strong> as work-complete.</p>
        <p>Please log in and visit your Complaints section to confirm whether the issue is actually resolved, by leaving your feedback and rating. Your feedback decides whether this complaint is closed as resolved — it's what holds authorities accountable.</p>
      `,
    });

    if (error) console.error('Resolution email error:', error);
  } catch (err) {
    console.error('Resolution email error:', err);
  }
}

// ========== END EMAIL HELPERS ==========

app.post('/api/auth/register', async (req, res) => {
  try {
    // SECURITY: this is the public self-signup endpoint — it only ever
    // creates citizen accounts. Authority (admin) accounts are created
    // directly in the database by a trusted operator, never through here.
    const { name, email, password, phone, district } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, district)
       VALUES ($1, $2, $3, 'citizen', $4, $5)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, phone || null, district || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/auth/login-authority', async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    if (!employeeId || !password) {
      return res.status(400).json({ error: 'Employee ID and password are required' });
    }
    const result = await pool.query('SELECT * FROM users WHERE employee_id = $1', [employeeId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid employee ID or password' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid employee ID or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employee_id,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during authority login' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    }
    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000);

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, expiry, user.id]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: email,
  subject: 'Password Reset - JanaSakshi AI',
  html: `<p>Hi ${user.name},</p>
    <p>Click the link below to reset your password. This link expires in 1 hour.</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>If you didn't request this, ignore this email.</p>`,
});

if (error) {
  console.error('Resend error:', error);
  return res.status(500).json({ error: 'Failed to send reset email' });
}

console.log('Email sent successfully:', data);
    res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while processing request' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const result = await pool.query(
      'SELECT id, reset_token_expiry FROM users WHERE reset_token = $1',
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }
    const user = result.rows[0];
    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: 'This reset link has expired' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [passwordHash, user.id]
    );
    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while resetting password' });
  }
});

const CATEGORY_TO_DEPARTMENT = {
  ROAD: 'Public Works Department (PWD)',
  WATER: 'Water Supply Department',
  ELECTRICITY: 'Electricity Board',
  SANITATION: 'Sanitation Department',
  DRAINAGE: 'Sanitation Department',
  OTHER: 'Public Works Department (PWD)',
  SCHOOL: 'Education Department',
  POLICE: 'Police Department',
};

function detectDepartment(category, title, description) {
  const text = `${title} ${description}`.toLowerCase();

  const policeKeywords = ['fir', 'murder', 'theft', 'robbery', 'assault', 'crime', 'kidnap', 'harassment', 'violence'];
  const electricityKeywords = ['electricity', 'power cut', 'transformer', 'streetlight', 'voltage', 'short circuit', 'power outage'];
  const schoolKeywords = ['school', 'teacher', 'classroom', 'education', 'college', 'student'];
  const waterKeywords = ['water supply', 'pipeline', 'drinking water', 'water leak'];
  const sanitationKeywords = ['garbage', 'sewage', 'drainage', 'sanitation', 'sewer', 'waste', 'trash'];
  const roadKeywords = ['road', 'pothole', 'street', 'highway', 'bridge', 'construction'];

  if (policeKeywords.some((k) => text.includes(k))) return 'Police Department';
  if (electricityKeywords.some((k) => text.includes(k))) return 'Electricity Board';
  if (schoolKeywords.some((k) => text.includes(k))) return 'Education Department';
  if (waterKeywords.some((k) => text.includes(k))) return 'Water Supply Department';
  if (sanitationKeywords.some((k) => text.includes(k))) return 'Sanitation Department';
  if (roadKeywords.some((k) => text.includes(k))) return 'Public Works Department (PWD)';

  return CATEGORY_TO_DEPARTMENT[category] || 'Public Works Department (PWD)';
}

// Random password generator
function generatePassword() {
  return Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100);
}

// WhatsApp ko message bhejna
async function sendWhatsAppMessage(to, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('WhatsApp send error:', err.response?.data || err.message);
  }
}

// Gemini se complaint text ko structured JSON mein convert karna
async function extractComplaintDetails(messageText) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are extracting structured data from a citizen's complaint message sent in Hindi, Bhojpuri, Maithili, or English. 
Extract the following as JSON only (no markdown, no extra text):
{
  "name": "citizen's name if mentioned, else null",
  "district": "district name if mentioned, else null",
  "block": "block/area name if mentioned, else null",
  "village": "village name if mentioned, else null",
  "address": "any address details mentioned, else null",
  "title": "a short 5-8 word title summarizing the complaint",
  "description": "the full complaint translated/rewritten clearly in English",
  "category": "one of: ROAD, WATER, ELECTRICITY, SANITATION, DRAINAGE, SCHOOL, POLICE, OTHER"
}

Message: """${messageText}"""`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text().trim();
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

app.post('/api/complaints', authenticateToken, async (req, res) => {
  try {
    const { category, title, description, district, block, village, address, latitude, longitude } = req.body;
    if (!category || !title || !description) {
      return res.status(400).json({ error: 'Category, title, and description are required' });
    }
    const department = detectDepartment(category, title, description);

    // AI se priority turant nikalo — fail ho to bhi MEDIUM default milega,
    // complaint submission kabhi block nahi hoga
    const priorityResult = await analyzeComplaintPriority(title, description);

    const result = await pool.query(
      `INSERT INTO complaints (
         user_id, category, title, description, district, block, village, address,
         latitude, longitude, department, priority, ai_summary, suggested_action, language_detected
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        req.user.id, category, title, description,
        district || null, block || null, village || null, address || null,
        latitude || null, longitude || null, department,
        priorityResult.priority, priorityResult.summary,
        priorityResult.suggestedAction, priorityResult.languageDetected,
      ]
    );
    const complaint = result.rows[0];

    // Send confirmation email — fire-and-forget so the API response isn't
    // delayed by the email provider.
    pool.query('SELECT name, email FROM users WHERE id = $1', [req.user.id])
      .then((userResult) => {
        if (userResult.rows.length > 0) {
          sendComplaintConfirmationEmail(userResult.rows[0], complaint);
        }
      })
      .catch((err) => console.error('Could not fetch user for confirmation email:', err));

    res.status(201).json({ complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while submitting complaint' });
  }
});

app.get('/api/complaints/mine', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ complaints: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching complaints' });
  }
});

app.get('/api/complaints', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'citizen') {
      return res.status(403).json({ error: 'Use /api/complaints/mine to view your own complaints' });
    }
    const userResult = await pool.query('SELECT department FROM users WHERE id = $1', [req.user.id]);
    const department = userResult.rows[0]?.department;
    let result;
    if (department) {
      result = await pool.query(
        'SELECT * FROM complaints WHERE department = $1 ORDER BY created_at DESC',
        [department]
      );
    } else {
      result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
    }
    res.json({ complaints: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching complaints' });
  }
});
app.get('/api/complaints/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'citizen') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const userResult = await pool.query('SELECT department FROM users WHERE id = $1', [req.user.id]);
    const department = userResult.rows[0]?.department;

    let complaintsResult;
    if (department) {
      complaintsResult = await pool.query(
        'SELECT status, feedback_rating FROM complaints WHERE department = $1',
        [department]
      );
    } else {
      complaintsResult = await pool.query('SELECT status, feedback_rating FROM complaints');
    }

    const all = complaintsResult.rows;
    const total = all.length;
    const resolved = all.filter((c) => c.status === 'resolved').length;
    const active = total - resolved;

    const performanceScore = resolved * 5;

    const ratedComplaints = all.filter(
      (c) => c.feedback_rating !== null && c.feedback_rating !== undefined
    );
    const avgRating =
      ratedComplaints.length > 0
        ? ratedComplaints.reduce((sum, c) => sum + c.feedback_rating, 0) / ratedComplaints.length
        : 0;

    res.json({
      activeComplaints: active,
      resolvedComplaints: resolved,
      performanceScore,
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratedComplaints.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching stats' });
  }
});

// ===== BADGE SYSTEM ENDPOINTS (added) =====
// Citizen: counts every complaint the logged-in citizen has filed.
app.get('/api/badges/citizen/:userId', authenticateToken, async (req, res) => {
  try {
    const verifiedComplaints = await badgeService.getVerifiedComplaintCount(req.params.userId);
    const result = badgeService.computeCitizenBadge(verifiedComplaints);
    res.json({ verifiedComplaints, ...result });
  } catch (err) {
    console.error('citizen badge error:', err);
    res.status(500).json({ error: 'Could not compute citizen badge' });
  }
});

// Officer: counts complaints THIS officer marked complete that the citizen
// then rated 3+ stars (status auto-becomes 'resolved' — see the /complete
// and /feedback routes below). Relies on resolved_by, which is now set in
// the /complete route.
app.get('/api/badges/officer/:officerId', authenticateToken, async (req, res) => {
  try {
    const { citizenConfirmedResolutions, avgResponseHours } =
      await badgeService.getOfficerResolutionStats(req.params.officerId);
    const result = badgeService.computeOfficerBadge(citizenConfirmedResolutions, avgResponseHours);
    res.json({ citizenConfirmedResolutions, avgResponseHours, ...result });
  } catch (err) {
    console.error('officer badge error:', err);
    res.status(500).json({ error: 'Could not compute officer badge' });
  }
});
// ===== END ADDED =====

// ========== PUBLIC COMPLAINT CLASSIFIER (read-only, no login needed) ==========
// Ye endpoint bina auth ke accessible hai — koi bhi total complaints,
// department-wise breakdown, aur har complaint ki detail (title, status,
// filed date, kitne din se pending hai) dekh sakta hai. Read-only hai —
// koi edit/update yahan se possible nahi.
// IMPORTANT: ye route /api/complaints/:id se PEHLE define hona zaroori hai,
// warna Express "classifier-stats" ko :id samajh kar wahi route match kar
// dega aur Postgres integer-parse error dega.
app.get('/api/complaints/classifier-stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, category, department, status, created_at
       FROM complaints
       ORDER BY created_at DESC`
    );
    const complaints = result.rows;
    const now = new Date();

    const byDepartment = {};

    complaints.forEach((c) => {
      const dept = c.department || 'Unassigned';
      if (!byDepartment[dept]) {
        byDepartment[dept] = {
          department: dept,
          total: 0,
          resolved: 0,
          pending: 0,
          complaints: [],
        };
      }

      const isResolved = c.status === 'resolved';
      const daysPending = isResolved
        ? null
        : Math.floor((now - new Date(c.created_at)) / (1000 * 60 * 60 * 24));

      byDepartment[dept].total += 1;
      if (isResolved) {
        byDepartment[dept].resolved += 1;
      } else {
        byDepartment[dept].pending += 1;
      }

      byDepartment[dept].complaints.push({
        id: c.id,
        title: c.title,
        category: c.category,
        status: c.status,
        createdAt: c.created_at,
        daysPending,
      });
    });

    res.json({
      totalComplaints: complaints.length,
      departments: Object.values(byDepartment),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching classifier stats' });
  }
});
// ========== END PUBLIC COMPLAINT CLASSIFIER ==========

// ========== HOTSPOT DETECTION (same-location complaint clustering) ==========
// GPS coordinates ke aadhar par complaints ko group karta hai — agar
// multiple log same jagah (within ~150 meters) ki same-category complaint
// karte hain, to unhe ek "hotspot" ke roop mein group karke dikhata hai.
// Sirf un complaints ko consider karta hai jinke paas latitude/longitude
// hai. Public read-only endpoint hai.

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.get('/api/complaints/hotspots', async (req, res) => {
  try {
    const HOTSPOT_RADIUS_METERS = parseInt(req.query.radius) || 150;

    const result = await pool.query(
      `SELECT id, title, category, department, status, district, block, village,
              address, latitude, longitude, created_at
       FROM complaints
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       ORDER BY created_at DESC`
    );
    const complaints = result.rows;
    const now = new Date();

    // Category ke andar hi group karo — alag category ki complaints ek
    // hotspot mein mix nahi honi chahiye, chahe jagah same ho
    const byCategory = {};
    complaints.forEach((c) => {
      const cat = c.category || 'OTHER';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(c);
    });

    const hotspots = [];

    Object.entries(byCategory).forEach(([category, catComplaints]) => {
      const used = new Set();

      catComplaints.forEach((c, i) => {
        if (used.has(c.id)) return;

        const cluster = [c];
        used.add(c.id);

        catComplaints.forEach((other, j) => {
          if (i === j || used.has(other.id)) return;
          const dist = haversineDistanceMeters(
            parseFloat(c.latitude), parseFloat(c.longitude),
            parseFloat(other.latitude), parseFloat(other.longitude)
          );
          if (dist <= HOTSPOT_RADIUS_METERS) {
            cluster.push(other);
            used.add(other.id);
          }
        });

        // Sirf un clusters ko hotspot maano jinme 2+ alag complaints hain
        if (cluster.length >= 2) {
          const avgLat = cluster.reduce((sum, x) => sum + parseFloat(x.latitude), 0) / cluster.length;
          const avgLng = cluster.reduce((sum, x) => sum + parseFloat(x.longitude), 0) / cluster.length;

          hotspots.push({
            category,
            department: cluster[0].department,
            complaintCount: cluster.length,
            centerLatitude: avgLat,
            centerLongitude: avgLng,
            placeDetail: {
              district: cluster[0].district,
              block: cluster[0].block,
              village: cluster[0].village,
              address: cluster[0].address,
            },
            complaints: cluster.map((x) => ({
              id: x.id,
              title: x.title,
              status: x.status,
              district: x.district,
              block: x.block,
              village: x.village,
              address: x.address,
              latitude: x.latitude,
              longitude: x.longitude,
              createdAt: x.created_at,
              daysPending: x.status === 'resolved'
                ? null
                : Math.floor((now - new Date(x.created_at)) / (1000 * 60 * 60 * 24)),
            })),
          });
        }
      });
    });

    hotspots.sort((a, b) => b.complaintCount - a.complaintCount);

    res.json({
      radiusUsedMeters: HOTSPOT_RADIUS_METERS,
      totalHotspots: hotspots.length,
      hotspots,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while detecting hotspots' });
  }
});
// ========== END HOTSPOT DETECTION ==========

app.get('/api/complaints/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No complaint found with that ID' });
    }
    const complaint = result.rows[0];
    if (complaint.user_id !== req.user.id) {
      return res.status(403).json({ error: 'This complaint does not belong to your account' });
    }
    res.json({ complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching complaint' });
  }
});

app.patch('/api/complaints/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'waiting_feedback', 'resolved', 'unsatisfactory'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status must be one of: pending, in_progress, waiting_feedback, resolved, unsatisfactory' });
    }

    const complaintCheck = await pool.query('SELECT department FROM complaints WHERE id = $1', [id]);
    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const userResult = await pool.query('SELECT department FROM users WHERE id = $1', [req.user.id]);
    const userDepartment = userResult.rows[0]?.department;

    if (userDepartment && complaintCheck.rows[0].department !== userDepartment) {
      return res.status(403).json({ error: 'You can only update complaints assigned to your department' });
    }

    const result = await pool.query(
      `UPDATE complaints SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    res.json({ complaint: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating status' });
  }
});

app.patch('/api/complaints/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { completionPhoto } = req.body;
    if (!completionPhoto) {
      return res.status(400).json({ error: 'A completion photo is required' });
    }

    const complaintCheck = await pool.query('SELECT department FROM complaints WHERE id = $1', [id]);
    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const userResult = await pool.query('SELECT department FROM users WHERE id = $1', [req.user.id]);
    const userDepartment = userResult.rows[0]?.department;

    if (userDepartment && complaintCheck.rows[0].department !== userDepartment) {
      return res.status(403).json({ error: 'You can only update complaints assigned to your department' });
    }

    // status ab seedha 'resolved' nahi hota — 'waiting_feedback' set hota hai.
    // Final status (resolved/unsatisfactory) citizen ke feedback rating se decide hota hai.
    // ===== BADGE SYSTEM (added): resolved_by = req.user.id, taaki baad mein
    // officer badges ke liye pata chal sake ki kaam kisne kiya =====
    const result = await pool.query(
      `UPDATE complaints SET status = 'waiting_feedback', completion_photo = $1, resolved_by = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [completionPhoto, req.user.id, id]
    );
    // ===== END ADDED =====
    const complaint = result.rows[0];

    pool.query('SELECT name, email, phone FROM users WHERE id = $1', [complaint.user_id])
      .then((citizenResult) => {
        if (citizenResult.rows.length > 0) {
          const citizen = citizenResult.rows[0];
          sendResolutionFeedbackEmail(citizen, complaint);
          if (citizen.phone) {
            sendWhatsAppMessage(
              citizen.phone.replace('+', ''),
              `🔔 Aapki complaint #${complaint.id} par department ne kaam complete kar diya hai. Kripya website pe login karke confirm karein aur apna feedback dein — tabhi ye "Resolved" mana jayega.`
            );
          }
        }
      })
      .catch((err) => console.error('Could not notify citizen of resolution:', err));

    res.json({ complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while marking complete' });
  }
});

app.patch('/api/complaints/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, evidence, evidenceType } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const VALID_EVIDENCE_TYPES = ['photo', 'audio', 'video'];
    if (evidence && !VALID_EVIDENCE_TYPES.includes(evidenceType)) {
      return res.status(400).json({ error: 'evidenceType must be one of: photo, audio, video' });
    }

    const check = await pool.query('SELECT user_id, status FROM complaints WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    if (check.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only give feedback on your own complaints' });
    }
    if (check.rows[0].status !== 'waiting_feedback') {
      return res.status(400).json({ error: 'You can only give feedback once the department has marked this complaint as work-complete' });
    }

    // Rating decide karta hai final status: 3+ stars = resolved, 1-2 stars = unsatisfactory
    // (department ko dobara kaam karna padega)
    const finalStatus = rating >= 3 ? 'resolved' : 'unsatisfactory';

    const result = await pool.query(
      `UPDATE complaints
       SET feedback_rating = $1, feedback_comment = $2, feedback_evidence = $3, feedback_evidence_type = $4, status = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [rating, comment || null, evidence || null, evidence ? evidenceType : null, finalStatus, id]
    );
    res.json({ complaint: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while submitting feedback' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
// Meta verification (ek baar setup ke time call hota hai)
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Actual incoming messages yahan aayenge
app.post('/api/whatsapp/webhook', async (req, res) => {
  console.log('WEBHOOK HIT:', JSON.stringify(req.body, null, 2)); 
  res.sendStatus(200); // Meta ko turant reply do, warna retry karega

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message) return; // status updates (delivered/read) bhi is webhook pe aate hain, unhe ignore karo

    const from = message.from; // customer ka phone number, jaise "919876543210"
    const text = message.text?.body;

    if (!text) {
      await sendWhatsAppMessage(from, 'Abhi hum sirf text messages support karte hain. Kripya apni complaint likh kar bhejein.');
      return;
    }

    // Step 1: Gemini se extract karo
    const extracted = await extractComplaintDetails(text);

    // Step 2: User dhoondo ya banao
    const phoneForDb = `+${from}`;
    let userResult = await pool.query('SELECT * FROM users WHERE phone = $1', [phoneForDb]);
    let user;
    let generatedPassword = null;

    if (userResult.rows.length === 0) {
      generatedPassword = generatePassword();
      const passwordHash = await bcrypt.hash(generatedPassword, 10);
      const fakeEmail = `${from}@janasakshi.bot`;

      const insertResult = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, phone, district)
         VALUES ($1, $2, $3, 'citizen', $4, $5) RETURNING *`,
        [extracted.name || 'WhatsApp User', fakeEmail, passwordHash, phoneForDb, extracted.district || null]
      );
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // Step 3: Priority analyze karo (same AI jo website complaints ke liye use hoti hai)
    const priorityResult = await analyzeComplaintPriority(extracted.title, extracted.description);

    // Step 4: Complaint create karo
    const department = detectDepartment(extracted.category, extracted.title, extracted.description);
    const complaintResult = await pool.query(
      `INSERT INTO complaints (
         user_id, category, title, description, district, block, village, address,
         department, priority, ai_summary, suggested_action, language_detected
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        user.id,
        extracted.category || 'OTHER',
        extracted.title,
        extracted.description,
        extracted.district || null,
        extracted.block || null,
        extracted.village || null,
        extracted.address || null,
        department,
        priorityResult.priority,
        priorityResult.summary,
        priorityResult.suggestedAction,
        priorityResult.languageDetected,
      ]
    );
    const complaint = complaintResult.rows[0];

    // Step 5: Reply bhejo (WhatsApp)
    let replyText = `✅ Aapki complaint darj ho gayi hai!\n\nComplaint ID: #${complaint.id}\nDepartment: ${department}\nPriority: ${complaint.priority}\n\n`;
    if (generatedPassword) {
      replyText += `Login details:\nEmail: ${user.email}\nPassword: ${generatedPassword}\n\n`;
    }
    replyText += `Hum aapko update denge jaise hi complaint resolve ho jaayegi. Aap website pe login karke bhi status check kar sakte hain.`;

    await sendWhatsAppMessage(from, replyText);

    // Step 6: Agar user ka real email hai (fake @janasakshi.bot nahi), to confirmation email bhi bhejo
    if (isRealEmail(user.email)) {
      await sendComplaintConfirmationEmail(user, complaint, generatedPassword);
    }
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
  }
});
// ========== AI-BASED PRIORITY SUGGESTIONS (batch, on-demand) ==========
// Ye batch endpoint alag hai — dashboard pe "Analyze Cases" button dabane pe
// pending/in_progress complaints ko ek saath re-analyze karta hai. Priority
// ab automatic bhi set ho jaati hai submission ke time (upar wala change),
// isliye ye button ek bonus/manual-refresh feature ki tarah kaam karega.
//
// NOTE: Gemini API key ke setup issues (service-account-bound key, invalid
// key, etc.) ki wajah se ye ab local rule-based logic use karta hai — koi
// external API call nahi. Response format wahi hai jo pehle Gemini deta tha,
// isliye frontend/UI mein koi change nahi karna pada.
function getAIPrioritySuggestions(complaints) {
  const now = new Date();

  return complaints.map((c) => {
    const ageHours = (now - new Date(c.created_at)) / (1000 * 60 * 60);
    const text = `${c.title} ${c.description}`.toLowerCase();

    const urgentKeywords = [
      'fire', 'accident', 'crime', 'theft', 'robbery', 'assault', 'murder',
      'health', 'emergency', 'danger', 'stolen', 'kidnap', 'violence',
    ];
    const isUrgent = urgentKeywords.some((k) => text.includes(k));

    let priority, reason;
    if (isUrgent) {
      priority = 'HIGH';
      reason = 'Urgent keywords detected in complaint';
    } else if (ageHours < 24) {
      priority = 'HIGH';
      reason = 'Filed within the last 24 hours';
    } else if (ageHours <= 168) {
      priority = 'MEDIUM';
      reason = 'Standard issue, 1-7 days old';
    } else {
      priority = 'LOW';
      reason = 'Older than 7 days';
    }

    return { id: c.id, priority, reason };
  });
}

// Endpoint: Police dashboard ko priority suggestions dena
app.get('/api/complaints/priorities/suggest', authenticateToken, async (req, res) => {
  try {
    // Sirf authorities access kar sakte hain
    if (req.user.role === 'citizen') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const userResult = await pool.query('SELECT department FROM users WHERE id = $1', [req.user.id]);
    const department = userResult.rows[0]?.department;

    // Department ke sab pending/in_progress complaints lao
    let complaintsResult;
    if (department) {
      complaintsResult = await pool.query(
        `SELECT id, title, description, category, status, created_at 
         FROM complaints 
         WHERE department = $1 AND status IN ('pending', 'in_progress')
         ORDER BY created_at DESC
         LIMIT 20`,
        [department]
      );
    } else {
      complaintsResult = await pool.query(
        `SELECT id, title, description, category, status, created_at 
         FROM complaints 
         WHERE status IN ('pending', 'in_progress')
         ORDER BY created_at DESC
         LIMIT 20`
      );
    }

    const complaints = complaintsResult.rows;

    if (complaints.length === 0) {
      return res.json({ 
        suggestions: [],
        message: 'No pending complaints to prioritize' 
      });
    }

    // Rule-based suggestions lao (no external API dependency)
    const suggestions = getAIPrioritySuggestions(complaints);

    res.json({ 
      suggestions,
      totalCases: complaints.length,
      processedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while getting AI suggestions' });
  }
});

// ========== END OF PRIORITY FEATURES ==========

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
