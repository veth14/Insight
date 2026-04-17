#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET_NAME || 'academic-papers';

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.');
    process.exitCode = 2;
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const logoPath = path.resolve(__dirname, '..', '..', 'mobile', 'assets', 'logo.png');
  if (!fs.existsSync(logoPath)) {
    console.error('Logo file not found at', logoPath);
    process.exitCode = 3;
    return;
  }

  const fileBuffer = fs.readFileSync(logoPath);
  const destPath = `defaults/logo.png`;

  console.log('Uploading', logoPath, 'to bucket', BUCKET, 'as', destPath);

  try {
    const { error } = await supabase.storage.from(BUCKET).upload(destPath, fileBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

    if (error) {
      console.error('Supabase upload error:', error);
      process.exitCode = 4;
      return;
    }

    // Get public URL
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(destPath);
    console.log('Uploaded successfully. Public URL:');
    console.log(data.publicUrl);
    console.log('\nTo make this the backend default, set DEFAULT_SYSTEM_IMAGE_URL to the full URL above in your Railway environment variables.');
  } catch (err) {
    console.error('Upload failed:', err);
    process.exitCode = 5;
  }
}

main();
