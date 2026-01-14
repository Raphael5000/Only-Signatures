// Simple Express server for CodeCapsules with correct MIME types
const express = require('express');
const path = require('path');
const OpenAI = require('openai');
const https = require('https');
const http = require('http');

const app = express();
// CodeCapsules uses PORT environment variable, fallback to 3000 for local
const PORT = process.env.PORT || 3000;
// Bind to 0.0.0.0 to accept connections from any network interface (required for Docker/containers)
const HOST = '0.0.0.0';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to get image dimensions from URL
async function getImageDimensions(url) {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string') {
      resolve(null);
      return;
    }

    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const request = client.get(url, (response) => {
        if (response.statusCode !== 200) {
          resolve(null);
          return;
        }

        const chunks = [];
        let totalBytes = 0;
        const maxBytes = 1024 * 10; // Read first 10KB which should be enough for image headers

        response.on('data', (chunk) => {
          chunks.push(chunk);
          totalBytes += chunk.length;
          if (totalBytes >= maxBytes) {
            response.destroy();
            parseImageDimensions(Buffer.concat(chunks), resolve, reject);
          }
        });

        response.on('end', () => {
          if (chunks.length > 0) {
            parseImageDimensions(Buffer.concat(chunks), resolve, reject);
          } else {
            resolve(null);
          }
        });
      });

      request.on('error', () => {
        resolve(null);
      });

      request.setTimeout(5000, () => {
        request.destroy();
        resolve(null);
      });
    } catch (error) {
      resolve(null);
    }
  });
}

// Parse image dimensions from buffer (supports PNG, JPEG, GIF)
function parseImageDimensions(buffer, resolve, reject) {
  try {
    // PNG: First 8 bytes are signature, then IHDR chunk with width (4 bytes) and height (4 bytes) at offset 16
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      resolve({ width, height });
      return;
    }

    // JPEG: Look for SOF markers (0xFFC0, 0xFFC1, 0xFFC2, etc.)
    let i = 0;
    while (i < buffer.length - 8) {
      if (buffer[i] === 0xFF && buffer[i + 1] >= 0xC0 && buffer[i + 1] <= 0xC3) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        resolve({ width, height });
        return;
      }
      i++;
    }

    // GIF: Width and height at offset 6 (2 bytes each, little-endian)
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      resolve({ width, height });
      return;
    }

    // SVG: Try to parse from XML (simplified)
    const svgString = buffer.toString('utf8', 0, Math.min(buffer.length, 2000));
    const widthMatch = svgString.match(/width=["'](\d+)/i);
    const heightMatch = svgString.match(/height=["'](\d+)/i);
    const viewBoxMatch = svgString.match(/viewBox=["']\d+\s+\d+\s+(\d+)\s+(\d+)/i);
    
    if (viewBoxMatch) {
      const width = parseInt(viewBoxMatch[1]);
      const height = parseInt(viewBoxMatch[2]);
      if (width && height) {
        resolve({ width, height });
        return;
      }
    }
    
    if (widthMatch && heightMatch) {
      const width = parseInt(widthMatch[1]);
      const height = parseInt(heightMatch[1]);
      if (width && height) {
        resolve({ width, height });
        return;
      }
    }

    resolve(null);
  } catch (error) {
    resolve(null);
  }
}

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
6. **Social Links** - Social media profile URLs (LinkedIn, Twitter/X, Facebook, Instagram, YouTube, GitHub, Behance, Dribbble, Pinterest, TikTok, etc.). Each social link should be a SEPARATE field.
7. **Company** - Company name
8. **Website** - Company or personal website URL

For each field you find, provide:
- key: A unique identifier (e.g., "name", "email", "phone", "position", "address", "socialLinks", "company", "website")
- label: A human-readable label (e.g., "Name", "Email", "Phone")
- originalValue: The exact value found in the HTML (for replacement purposes)
- suggestedValue: The same value (user can edit this later)

IMPORTANT:
- For email: Include both the email text AND any mailto: links in replacementTargets array
- For phone: If there are multiple phone numbers (e.g., mobile and office), create SEPARATE fields with unique keys like "phone", "phone2", "mobile", "office", etc. Each phone field should include both the phone text AND any tel: links in its replacementTargets array
- For social links: Each social media link should be a SEPARATE field with a unique key. Use descriptive keys like "linkedin", "twitter", "facebook", "instagram", "youtube", "github", etc. If there are multiple of the same type, use "linkedin", "linkedin2", etc. Each social link field should include the full URL in originalValue and replacementTargets array (include the exact URL as it appears in href attributes)
- Extract the exact text/values as they appear in the HTML for accurate replacement
- Each field MUST have a unique "key" value - if you find multiple instances of the same field type, use unique keys (e.g., "phone", "phone2", "email", "email2", "linkedin", "linkedin2")
- Look for ALL links in the HTML, including those in <a> tags with href attributes, and identify which ones are social media links
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
    },
    {
      "key": "linkedin",
      "label": "LinkedIn",
      "originalValue": "https://linkedin.com/in/johndoe",
      "suggestedValue": "https://linkedin.com/in/johndoe",
      "enabled": true,
      "replacementTargets": ["https://linkedin.com/in/johndoe"]
    },
    {
      "key": "twitter",
      "label": "Twitter",
      "originalValue": "https://twitter.com/johndoe",
      "suggestedValue": "https://twitter.com/johndoe",
      "enabled": true,
      "replacementTargets": ["https://twitter.com/johndoe"]
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

// API endpoint for generating email signatures
app.post('/api/generate-signature', async (req, res) => {
  try {
    const { name, position, contactNumber, emailAddress, website, socialLinks, logo, userPrompt } = req.body;

    if (!name || !emailAddress) {
      return res.status(400).json({ error: 'Name and email address are required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // Detect logo dimensions if logo is provided
    let logoAspectRatio = null;
    let logoDimensions = null;
    if (logo) {
      try {
        logoDimensions = await getImageDimensions(logo);
        if (logoDimensions && logoDimensions.width && logoDimensions.height) {
          logoAspectRatio = logoDimensions.width / logoDimensions.height;
        }
      } catch (error) {
        console.warn('Could not detect logo dimensions:', error.message);
      }
    }

    // Build the information string
    let informationString = `Name: ${name}\n`;
    if (position) informationString += `Position: ${position}\n`;
    if (contactNumber) informationString += `Contact Number: ${contactNumber}\n`;
    informationString += `Email Address: ${emailAddress}\n`;
    if (website) informationString += `Website: ${website}\n`;
    if (socialLinks) {
      informationString += `Social Links:\n${socialLinks}\n`;
    }
    if (logo) {
      informationString += `Logo URL: ${logo}\n`;
      if (logoDimensions) {
        informationString += `Logo Dimensions: ${logoDimensions.width}x${logoDimensions.height}px (aspect ratio: ${logoAspectRatio.toFixed(2)})\n`;
      }
    }

    // Enhanced prompt with specific design guidance
    let prompt = `You are an award-winning email signature designer. Create a stunning, modern HTML email signature that stands out while remaining professional.

DESIGN REQUIREMENTS:
- Use table-based layout with nested tables for maximum email client compatibility (Gmail, Outlook, Apple Mail, etc.)
- Apply modern design principles: visual hierarchy, balanced spacing, thoughtful typography
- Use a color scheme that's professional yet distinctive - consider subtle gradients, accent colors, or brand colors
- Typography: Use web-safe fonts (Arial, Helvetica, Georgia, Times New Roman) with appropriate font sizes (name: 16-20px, details: 11-13px)
- Spacing: Generous padding (10-15px) between elements, proper line-height (1.4-1.6)
- Visual elements: Consider subtle dividers, icons for contact methods, or decorative accents
- Social media: Use icon-based links with hover effects (if possible) or styled text links
- Mobile responsiveness: Ensure it looks great on mobile devices with appropriate font scaling

CRITICAL LOGO PLACEMENT RULES (MUST FOLLOW):
${logo ? `- Logo is provided: ${logo}
${logoDimensions ? `- Logo dimensions: ${logoDimensions.width}x${logoDimensions.height}px (aspect ratio: ${logoAspectRatio.toFixed(2)})
- **HORIZONTAL LOGO (width > height, aspect ratio > 1.2)**: 
  * MUST be placed in a ROW layout (horizontally)
  * MUST be positioned BELOW the position/title text, on its own row
  * The logo should span horizontally, typically 200-300px wide
  * Structure: Name and Position on top row, then Logo on second row, then contact info below
- **SQUARE OR VERTICAL LOGO (aspect ratio <= 1.2)**: 
  * CAN be placed NEXT TO the text content in a column layout
  * Logo should be on the left or right side, with text content beside it
  * Typical size: 60-100px width/height for square logos
  * Structure: Logo and text side-by-side in a table row
${logoAspectRatio > 1.2 ? `- **THIS IS A HORIZONTAL LOGO** - You MUST place it in a row below the position text, NOT next to the text.` : `- **THIS IS A SQUARE/VERTICAL LOGO** - You CAN place it next to the text content.`}` : `- Logo dimensions unknown - analyze the logo URL or filename to determine if it's horizontal or square/vertical
- If the logo appears to be horizontal (wider than tall), place it in a ROW below the position text
- If the logo appears to be square or vertical, you can place it NEXT TO the text content`}` : `- No logo provided`}

DESIGN STYLES TO CONSIDER:
- Modern minimalist: Clean lines, ample white space, subtle colors
- Bold & colorful: Vibrant accents, strong typography, eye-catching layout
- Corporate professional: Traditional layout with refined styling
- Creative/designer: Unique layouts, creative typography, artistic elements
- Tech/startup: Modern, sleek, with tech-forward aesthetics

TECHNICAL REQUIREMENTS:
- All CSS must be inline (no external stylesheets)
- Use table-based layout for compatibility
- Include proper mailto: links for emails
- Include proper tel: links for phone numbers
- Make all social links clickable with proper href attributes
- Use web-safe fonts or fallback fonts
- Ensure proper contrast ratios for accessibility
- Test for dark mode compatibility where possible

User Information:
${informationString}`;

    // Add user's additional prompt if provided
    if (userPrompt && userPrompt.trim()) {
      prompt += `\n\nAdditional Instructions: ${userPrompt.trim()}`;
    }

    prompt += `\n\nGenerate a unique, visually striking email signature that goes beyond basic templates. Make it memorable and professional. Return ONLY the HTML code - no explanations, no markdown, just clean HTML.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Upgraded from gpt-4o-mini for better quality
      messages: [
        {
          role: 'system',
          content: 'You are an expert HTML email signature designer with years of experience creating award-winning email signatures. You understand modern design trends, email client limitations, and how to create visually stunning yet functional signatures. Always return clean HTML code without markdown formatting or code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8, // Increased from 0.7 for more creative variation
    });

    let html = completion.choices[0].message.content.trim();

    // Clean up the response - remove markdown code blocks if present
    html = html.replace(/^```html\n?/i, '').replace(/^```\n?/i, '').replace(/\n?```$/i, '').trim();

    // Validate that we got HTML
    if (!html || html.length < 10) {
      throw new Error('Generated HTML is too short or invalid');
    }

    res.json({ html, signature: html });
  } catch (error) {
    console.error('Error generating signature:', error);
    res.status(500).json({ 
      error: 'Failed to generate signature',
      details: error.message 
    });
  }
});

// Only serve static files in production (in dev, Vite handles this)
if (process.env.NODE_ENV === 'production') {
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
}

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

