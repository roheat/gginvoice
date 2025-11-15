# Supabase Storage Setup for Company Logos

## Overview
This document describes the Supabase Storage configuration for the company logo upload feature.

## Storage Bucket Configuration

### Bucket Details
- **Name:** `gginvoice-client-logos`
- **Public Access:** Enabled (logos need to be publicly accessible)
- **File Size Limit:** 1MB (1048576 bytes)
- **Allowed MIME Types:** 
  - `image/png`
  - `image/jpeg`
  - `image/jpg`
  - `image/svg+xml`
  - `image/webp`

## Required Storage Policies

You need to set up the following Row Level Security (RLS) policies in Supabase:

### 1. Allow Authenticated Uploads
```sql
-- Policy Name: Allow authenticated uploads
-- Allowed operation: INSERT
-- Policy definition:
(bucket_id = 'gginvoice-client-logos' AND auth.role() = 'authenticated')
```

### 2. Public Read Access
```sql
-- Policy Name: Public read access
-- Allowed operation: SELECT
-- Policy definition:
(bucket_id = 'gginvoice-client-logos')
```

### 3. Allow Users to Delete Their Own Files
```sql
-- Policy Name: Allow users to delete own files
-- Allowed operation: DELETE
-- Policy definition:
(bucket_id = 'gginvoice-client-logos' AND auth.role() = 'authenticated')
```

## Environment Variables

Make sure these are set in your `.env.local`:

```env
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

## File Structure

Files are stored with the following path structure:
```
{userId}/{userId}-{timestamp}.{extension}
```

Example: `user123/user123-1699123456789.png`

## Features Implemented

### Settings Page
- Upload company logo (max 1MB)
- Preview logo before/after upload
- Remove logo
- Validation for file size and type
- Real-time feedback with toast notifications

### Invoice View Page
- Display logo above "Bill From" section
- Responsive sizing (192px × 96px container)
- Only shows if logo is uploaded

### PDF Generation
- Logo appears at the top of the PDF
- Same sizing as web view
- Automatically included when generating invoices

## Database Schema

The `UserSettings` model includes:
```prisma
companyLogoUrl  String?  // Public URL to the logo
companyLogoPath String?  // Storage path for deletion
```

## API Endpoints

### POST `/api/settings/logo`
Upload a new logo (replaces existing if present)

**Request:** `multipart/form-data` with `logo` field
**Response:** 
```json
{
  "success": true,
  "logoUrl": "https://xxxxx.supabase.co/storage/v1/object/public/..."
}
```

### DELETE `/api/settings/logo`
Delete the current logo

**Response:**
```json
{
  "success": true,
  "message": "Logo deleted successfully"
}
```

## Testing Checklist

- [ ] Upload a PNG logo (< 1MB)
- [ ] Upload a JPEG logo (< 1MB)
- [ ] Upload an SVG logo (< 1MB)
- [ ] Try uploading a file > 1MB (should fail with error)
- [ ] Try uploading a non-image file (should fail with error)
- [ ] Replace existing logo with new one (old one should be deleted)
- [ ] Remove logo
- [ ] View invoice with logo
- [ ] Generate PDF with logo
- [ ] View invoice without logo (should not show logo section)

## Troubleshooting

### Logo not appearing in invoice
1. Check that `companyLogoUrl` is saved in database
2. Verify the URL is publicly accessible
3. Check browser console for CORS errors

### Upload fails
1. Verify Supabase credentials in `.env.local`
2. Check Storage policies are correctly configured
3. Verify bucket name is `gginvoice-client-logos`
4. Check file size and type restrictions

### PDF generation fails with logo
1. Ensure logo URL is publicly accessible (no authentication required)
2. Check that the image format is supported by `@react-pdf/renderer`
3. Verify the logo URL returns a valid image (test in browser)

