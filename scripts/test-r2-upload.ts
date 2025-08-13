import { CloudflareR2Service } from '../src/utils/cloudflare-r2.service';
import { ConfigService } from '@nestjs/config';

async function testR2Upload() {
  // Create a mock config service for testing
  const mockConfigService = {
    get: (key: string): string | undefined => {
      const config: { [key: string]: string | undefined } = {
        R2_ENDPOINT: process.env.R2_ENDPOINT,
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'warung-telegram',
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
      };
      return config[key];
    },
  } as ConfigService;

  const r2Service = new CloudflareR2Service(mockConfigService);

  try {
    console.log('Testing Cloudflare R2 upload...');

    // Test with a sample image URL
    const testImageUrl = 'https://via.placeholder.com/300x200.jpg';

    const result = await r2Service.uploadImageFromUrl(testImageUrl);

    console.log('Upload successful!');
    console.log('Key:', result.key);
    console.log('Public URL:', result.publicUrl);
    console.log('Presigned URL:', result.presignedUrl);

    return result;
  } catch (error) {
    console.error('R2 Upload test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testR2Upload()
    .then(() => {
      console.log('R2 test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('R2 test failed:', error);
      process.exit(1);
    });
}

export { testR2Upload };
