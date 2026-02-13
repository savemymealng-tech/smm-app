# iOS Credentials Setup for EAS Build

Your Android builds are working, but iOS builds are failing due to missing credentials. Follow this guide to set up iOS credentials.

## Current Status

✅ **Android**: Credentials configured and working  
❌ **iOS**: Needs credential setup

## Why iOS Builds Are Failing

The error message indicates:
```
You're in non-interactive mode. EAS CLI couldn't find any credentials suitable for internal distribution.
```

This happens because iOS builds require:
1. Apple Developer Account
2. Distribution certificates
3. Provisioning profiles

## Setup Options

### Option 1: Set Up iOS Credentials (Recommended)

#### Prerequisites
- Apple Developer Account ($99/year)
- Access to your Apple Developer account credentials

#### Steps

1. **Run interactive build locally** (one-time setup):
   ```bash
   eas build --platform ios --profile preview
   ```

2. **EAS will guide you through**:
   - Login to your Apple Developer account
   - Generate/select signing certificates
   - Create/select provisioning profiles
   - Set up credentials for internal distribution

3. **Choose credential management**:
   - **Recommended**: Let EAS manage credentials (easiest)
   - **Alternative**: Use your own credentials

4. **After setup, the credentials are stored on Expo servers** and will work in CI/CD

### Option 2: Build iOS Manually (Until Setup)

If you're not ready to set up iOS credentials yet:

1. **Android builds will continue working automatically**
2. **Build iOS manually when needed**:
   ```bash
   eas build --platform ios --profile preview
   ```

### Option 3: Disable iOS Builds in Workflows

If you only need Android builds for now, you can comment out the iOS steps:

**`.github/workflows/preview.yml`:**
```yaml
# - name: 🚀 Build Preview (iOS)
#   run: eas build --platform ios --profile preview --non-interactive --no-wait
#   env:
#     EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Setting Up iOS Credentials Step-by-Step

### 1. Ensure you have Apple Developer Account
- Sign up at: https://developer.apple.com
- Enrollment costs $99/year
- Account must be active

### 2. Login to EAS with Apple credentials
```bash
eas login
```

### 3. Configure Apple credentials
```bash
eas credentials
```

Select:
- Platform: **iOS**
- Profile: **preview** (or production)
- Follow the prompts to:
  - Login to Apple Developer
  - Generate certificates
  - Create provisioning profiles

### 4. Test the setup
```bash
eas build --platform ios --profile preview
```

This should now work without errors.

### 5. Verify credentials are stored
```bash
eas credentials --platform ios
```

You should see your certificates and profiles listed.

## Understanding iOS Distribution Types

### Internal Distribution (Preview)
- For testing within your organization
- No App Store submission
- Can install on registered devices
- **Requires**: Development or Ad Hoc provisioning profile

### Production Distribution
- For App Store submission
- Public distribution
- **Requires**: App Store provisioning profile

## Troubleshooting

### "No suitable credentials found"
**Solution**: Run interactive build once to set up:
```bash
eas build --platform ios --profile preview
```

### "Apple Developer account not found"
**Solution**: Ensure you're logged into a valid Apple Developer account:
```bash
eas credentials
```

### "Provisioning profile expired"
**Solution**: Regenerate credentials:
```bash
eas credentials --platform ios
# Select option to regenerate
```

### Want to use existing certificates?
**Solution**: You can provide your own:
```bash
eas credentials --platform ios
# Choose "Use existing credentials"
```

## Current Workflow Behavior

With the updated workflows:

✅ **Android builds**: Will always run successfully  
⚠️ **iOS builds**: Will attempt but not fail the workflow (continue-on-error: true)

This means:
- Your workflows won't fail due to iOS credential issues
- Android builds will always succeed
- iOS builds will succeed once credentials are set up
- You'll see warnings for iOS until credentials are configured

## Next Steps

**Choose one:**

1. ✅ **Set up iOS credentials now**: Run `eas build --platform ios --profile preview` and follow prompts
2. ⏸️ **Set up later**: Android builds will continue working; set up iOS when ready
3. 🔧 **Android only**: Comment out iOS build steps in workflow files

## Helpful Resources

- [EAS Build iOS Setup](https://docs.expo.dev/build/setup/#ios)
- [iOS Credentials](https://docs.expo.dev/app-signing/managed-credentials/)
- [Apple Developer Portal](https://developer.apple.com/account)
- [Internal Distribution Guide](https://docs.expo.dev/build/internal-distribution/)

## Quick Reference Commands

```bash
# Interactive iOS build (sets up credentials)
eas build --platform ios --profile preview

# View/manage credentials
eas credentials --platform ios

# Build both platforms
eas build --platform all --profile preview

# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

---

**Note**: Once you set up iOS credentials interactively one time, all future builds (including CI/CD) will work automatically.
