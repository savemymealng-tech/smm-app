# Expo EAS Build Setup with GitHub Actions

## Quick Setup Guide

### Current Status

✅ **Android**: Fully configured and working  
⚠️ **iOS**: Needs credential setup (see [IOS_CREDENTIALS_SETUP.md](IOS_CREDENTIALS_SETUP.md))

The workflows are configured to continue even if iOS builds fail, so your CI/CD will work for Android immediately.

### 1. Get Your Expo Token

```bash
# Login to Expo (if not already logged in)
eas login

# Generate an access token
# Visit: https://expo.dev/accounts/[your-username]/settings/access-tokens
# Or use EAS CLI to generate one
```

### 2. Add Token to GitHub

1. Go to: `https://github.com/[your-username]/[your-repo]/settings/secrets/actions`
2. Click **"New repository secret"**
3. Name: `EXPO_TOKEN`
4. Value: Paste your Expo access token
5. Click **"Add secret"**

### 3. Create Production Branch

```bash
# Create and push production branch
git checkout -b production
git push -u origin production
```

### 4. Configure App Store Submission (Optional)

#### For Android:
1. Create a Google Service Account
2. Download the JSON key
3. Add to GitHub Secrets as `ANDROID_SERVICE_ACCOUNT_JSON`
4. Update `eas.json` submit configuration

#### For iOS:
1. Get your App Store Connect App ID
2. Update `eas.json` with your `ascAppId`
3. Configure App Store Connect API Key in Expo

### 5. Test the Workflows

#### Test Preview Build:
```bash
git checkout main
git add .
git commit -m "Test preview build"
git push origin main
```

#### Test Production Build:
```bash
git checkout production
git merge main
git push origin production
```

Or trigger manually from GitHub Actions tab.

## Workflow Behavior

### Preview Builds (main branch)
- ✅ Triggers on push to `main`
- ✅ Triggers on PRs to `main`
- ✅ Builds both Android (APK) and iOS
- ✅ Internal distribution
- ✅ Non-blocking (returns immediately)
- ✅ Comments on PRs with build link
- ✅ Uses Yarn for dependency installation

### Production Builds (production branch)
- ✅ Triggers on push to `production`
- ✅ Can be manually triggered
- ✅ Builds both Android (AAB) and iOS
- ✅ Auto-increments version
- ✅ Waits for build completion
- ✅ Auto-submits to stores (if configured)
- ✅ Uses Yarn for dependency installation

## Checking Build Status

1. **Expo Dashboard**: https://expo.dev/accounts/[your-account]/projects/savemymeal/builds
2. **GitHub Actions**: Your repo → Actions tab
3. **Email**: Expo sends emails on build completion

## Common Commands

```bash
# Check EAS login status
eas whoami

# Manually trigger a preview build
eas build --platform android --profile preview

# Manually trigger a production build
eas build --platform all --profile production

# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

## Environment Variables

You can add environment variables to your workflows or EAS profiles:

```json
// eas.json
{
  "build": {
    "production": {
      "env": {
        "ENVIRONMENT": "production",
        "API_URL": "https://api.yourapp.com"
      }
    }
  }
}
```

## Troubleshooting

### Build fails with "Invalid credentials"
- Regenerate your `EXPO_TOKEN` and update GitHub secret

### Build takes too long
- Preview builds use `--no-wait` flag (returns immediately)
- Production builds wait for completion (for auto-submit)

### Want to build only one platform?
Edit the workflow files and remove/comment out the platform you don't need.

### Need to cancel a build?
```bash
eas build:cancel [BUILD_ID]
```

## Additional Resources

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Expo Secrets](https://docs.expo.dev/build-reference/variables/#using-secrets-in-environment-variables)

## Next Steps

1. ✅ Set up `EXPO_TOKEN` in GitHub Secrets
2. ✅ Create `production` branch
3. ✅ Test preview build by pushing to `main`
4. ✅ Test production build by pushing to `production`
5. ⚠️ **Set up iOS credentials** (see [IOS_CREDENTIALS_SETUP.md](IOS_CREDENTIALS_SETUP.md))
6. 🔧 Configure app store submission (optional)
7. 🔧 Add additional notifications (Slack/Discord)
8. 🔧 Set up environment-specific configurations

## iOS Credentials

Currently, **Android builds work perfectly** but **iOS builds require setup**.

👉 **See [IOS_CREDENTIALS_SETUP.md](IOS_CREDENTIALS_SETUP.md) for detailed instructions**

Quick setup:
```bash
# Run this once interactively to set up iOS credentials
eas build --platform ios --profile preview
```

After this one-time setup, iOS builds will work automatically in CI/CD!
