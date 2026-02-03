# Inspiration page – managing signature data

The **Inspiration** page shows a searchable gallery of signature styles. The data is loaded from a single JSON file so you can manage and update it without changing app code.

## Where the data lives

- **File:** `public/data/inspiration-signatures.json`
- The app fetches it at runtime (`/data/inspiration-signatures.json`), so **updating the file and redeploying is enough** to change what appears on the Inspiration page (no rebuild required if you only change this file on the server).

## JSON format

```json
{
  "updated": "2026-02-03",
  "signatures": [
    {
      "id": "unique-slug",
      "title": "Display name",
      "description": "Short description shown on the card.",
      "category": "Category name",
      "tags": ["tag1", "tag2", "tag3"],
      "imageUrl": "https://example.com/preview.png"
    }
  ]
}
```

| Field           | Required | Description |
|-----------------|----------|-------------|
| `id`            | Yes      | Unique slug (e.g. `minimal-modern`). Used as React key. |
| `title`         | Yes      | Title shown on the card. |
| `description`   | No       | Body text under the title (searchable). |
| `category`      | No       | Category label (e.g. "Minimal", "Corporate"). Shown and searchable. |
| `tags`          | No       | Array of strings. All are searchable. |
| `imageUrl`      | No*      | Full URL to the preview image. *Omit if using `signatureHtml`. |
| `signatureHtml` | No       | Raw HTML of the signature. If set, the card shows a **rendered preview** as the thumbnail and **clicking opens a full-size view** in a modal. Use this when you want the tile to show the live signature instead of a static image. |

You must provide either `imageUrl` or `signatureHtml` (or both; `signatureHtml` takes precedence for the thumbnail and click-to-expand).

Search matches **title**, **description**, **category**, and **tags** (case-insensitive).

## How to update the gallery

### Option 1: Edit the JSON in the repo (simplest)

1. Open `public/data/inspiration-signatures.json`.
2. Add or edit objects in the `signatures` array. Keep valid JSON (commas, quotes).
3. Commit, push, and redeploy. The Inspiration page will show the new data after deploy.

Use a real preview image URL for each entry (e.g. screenshot hosted on your CDN, imgur, or your site). The sample data uses placeholder images; replace with your own.

### Option 2: Regenerate the file (script or CMS)

- **Build script:** Write a small Node (or other) script that:
  - Reads from a spreadsheet, CMS API, or another source,
  - Outputs `public/data/inspiration-signatures.json` in the format above,
  - Runs before `npm run build` (or you run it manually before deploy).
- **Headless CMS:** Use Sanity, Contentful, Strapi, etc. with a “Signature” content type (title, description, category, tags, image). Add a build step that fetches entries and writes `public/data/inspiration-signatures.json`. Then “manage and regularly update” = edit in the CMS and redeploy.

### Option 3: Swap the file at deploy time

If you deploy by copying files to a server, you can:

- Build the app once, and
- Overwrite only `public/data/inspiration-signatures.json` (or the deployed path that serves `/data/inspiration-signatures.json`) when you want to update the gallery, without rebuilding the rest of the app.

## Adding new signatures

1. Take or create a **preview image** (e.g. 400×200 or similar) and host it (CDN, S3, your site).
2. Add a new object to `signatures` in `inspiration-signatures.json` with a unique `id`, `title`, `imageUrl`, and optional `description`, `category`, and `tags`.
3. Save, commit, and redeploy (or update the file on the server as above).

## Tips

- **Preview images:** Use a consistent aspect ratio (e.g. 2:1) so the grid looks even. The card uses `object-cover` so images are cropped to the same box.
- **Search:** Users can search by any word in title, description, category, or tags. Add tags like "minimal", "corporate", "with logo" to make discovery easier.
- **Validation:** Validate JSON after editing (e.g. paste into [jsonlint.com](https://jsonlint.com)) to avoid broken pages.
