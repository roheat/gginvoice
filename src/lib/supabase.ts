import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and keys
const getSupabaseUrl = () => {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable');
  }
  return key;
};

const getSupabaseServiceKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return key;
};

// Client-side client (for uploads from browser)
export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
)

// Server-side client (for admin operations like deletion)
export const supabaseAdmin = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Upload a company logo to Supabase Storage
 * @param userId - The user's ID
 * @param file - The file to upload
 * @returns Object with publicUrl and filePath
 */
export async function uploadCompanyLogo(userId: string, file: File) {
  // Create unique file path
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  // Upload file using admin client (bypasses RLS)
  const { data, error } = await supabaseAdmin.storage
    .from('gginvoice-client-logos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('gginvoice-client-logos')
    .getPublicUrl(filePath)

  return {
    publicUrl,
    filePath
  }
}

/**
 * Delete a company logo from Supabase Storage
 * @param filePath - The path to the file in storage
 */
export async function deleteCompanyLogo(filePath: string) {
  const { error } = await supabaseAdmin.storage
    .from('gginvoice-client-logos')
    .remove([filePath])

  if (error) {
    console.error('Error deleting logo:', error)
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Validate file before upload
 * @param file - The file to validate
 * @returns Object with isValid and error message
 */
export function validateLogoFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 1024 * 1024 // 1MB
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 1MB'
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File must be PNG, JPEG, SVG, or WebP'
    }
  }

  return { isValid: true }
}

