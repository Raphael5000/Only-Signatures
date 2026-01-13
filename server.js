// Simple Express server for CodeCapsules with correct MIME types
const express = require('express');
const path = require('path');
const OpenAI = require('openai');

const app = express();
// CodeCapsules uses PORT environment variable, fallback to 3000 for local
const PORT = process.env.PORT || 3000;
// Bind to 0.0.0.0 to accept connections from any network interface (required for Docker/containers)
const HOST = '0.0.0.0';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// API endpoint for field detection
app.post('/api/detect-fields', async (req, res) => {
  try {
    const { html } = req.body;

    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // Create a prompt for OpenAI to detect fields
    const prompt = `You are analyzing an HTML email signature. Your task is to identify all editable fields that should be replaced.

Identify the following types of fields:
1. **Name** - Full name or person's name
2. **Position/Title** - Job title, position, or role
3. **Email** - Email address (both displayed text and mailto: links)
4. **Phone** - Phone number (both displayed text and tel: links)
5. **Address** - Physical address or location
6. **Social Links** - Social media profile URLs (LinkedIn, Twitter, Facebook, Instagram, etc.)
7. **Company** - Company name
8. **Website** - Company or personal website URL

For each field you find, provide:
- key: A unique identifier (e.g., "name", "email", "phone", "position", "address", "socialLinks", "company", "website")
- label: A human-readable label (e.g., "Name", "Email", "Phone")
- originalValue: The exact value found in the HTML (for replacement purposes)
- suggestedValue: The same value (user can edit this later)

IMPORTANT:
- For email: Include both the email text AND any mailto: links in replacementTargets array
- For phone: Include both the phone text AND any tel: links in replacementTargets array
- For social links: Combine all social media links into one "socialLinks" field with replacementTargets array containing all URLs
- Extract the exact text/values as they appear in the HTML for accurate replacement
- Return a JSON object with a "fields" property containing an array

Here is the HTML to analyze:
${html}

Return a JSON object in this exact format:
{
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "originalValue": "John Doe",
      "suggestedValue": "John Doe",
      "enabled": true
    },
    {
      "key": "email",
      "label": "Email",
      "originalValue": "john@example.com",
      "suggestedValue": "john@example.com",
      "enabled": true,
      "replacementTargets": ["john@example.com", "mailto:john@example.com"]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for cost efficiency, can upgrade to gpt-4o if needed
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes HTML email signatures and extracts editable fields. Always return valid JSON arrays only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      response_format: { type: 'json_object' } // Force JSON response
    });

    const responseContent = completion.choices[0].message.content;
    
    // Parse the JSON response
    let fields = [];
    try {
      const parsed = JSON.parse(responseContent);
      
      // Extract fields from the response (should be in parsed.fields)
      fields = parsed.fields || parsed.data || (Array.isArray(parsed) ? parsed : []);
      
      if (!Array.isArray(fields)) {
        throw new Error('Fields is not an array');
      }
      
      // Validate and ensure all required fields are present
      fields = fields.map(field => ({
        key: field.key || 'unknown',
        label: field.label || field.key || 'Unknown',
        originalValue: field.originalValue || '',
        suggestedValue: field.suggestedValue || field.originalValue || '',
        enabled: field.enabled !== false,
        replacementTargets: field.replacementTargets || undefined
      })).filter(field => field.originalValue && field.originalValue.trim()); // Remove fields without values
      
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Response content:', responseContent);
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        details: 'The AI response was not in the expected format. Please try again.'
      });
    }

    res.json({ fields });
  } catch (error) {
    console.error('Error detecting fields:', error);
    res.status(500).json({ 
      error: 'Failed to detect fields',
      details: error.message 
    });
  }
});

// Serve static files from dist directory with correct MIME types
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Internal Server Error');
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Serving files from: ${path.join(__dirname, 'dist')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

