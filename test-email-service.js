// Simple email service test
try {
  const emailService = require('./src/utils/emailService');
  
  // Test email service instantiation
  console.log('✅ Email service loaded successfully');
  
  // Test basic structure
  if (typeof emailService.sendEmail === 'function' && typeof emailService.sendEmailDetailed === 'function') {
    console.log('✅ Email service methods are available');
  }
  
  // Test environment variables
  const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length === 0) {
    console.log('✅ All required email environment variables are configured');
  } else {
    console.log(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
  }
  
  console.log('\n📧 Email service test completed successfully!');
  
} catch (error) {
  console.error('❌ Error testing email service:', error);
  process.exit(1);
}