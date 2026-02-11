# GitHub Workflows for Expo Builds

This directory contains GitHub Actions workflows for building the Savemymeal app.

## Workflows

### 1. Preview Build (`preview.yml`)
- **Trigger**: Pushes to `main` branch or Pull Requests targeting `main`
- **Profile**: `preview` (internal distribution)
- **Behavior**: 
  - Builds both Android and iOS apps
  - Runs in non-blocking mode (`--no-wait`)
  - Comments on PRs with build status

### 2. Production Build (`production.yml`)
- **Trigger**: Pushes to `production` branch or manual workflow dispatch
- **Profile**: `production` (with auto-increment)
- **Behavior**:
  - Builds both Android and iOS apps
  - Waits for build completion
  - Auto-submits to app stores (if configured)

## Setup Instructions

### 1. Get Expo Token
```bash
eas whoami
# If not logged in:
eas login

# Generate a token
eas build:configure
```

Or get your token from: https://expo.dev/accounts/[your-account]/settings/access-tokens

### 2. Add Expo Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Your Expo access token
6. Click **Add secret**

### 3. EAS Configuration

Make sure your `eas.json` has the required profiles. Current configuration:

```json
{
  "build": {
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### 4. Branch Setup

- **main**: Development and preview builds
- **production**: Production-ready builds for app stores

## Usage

### Preview Builds
Push to `main` branch or create a PR:
```bash
git push origin main
```

### Production Builds
Push to `production` branch:
```bash
git checkout production
git merge main
git push origin production
```

Or manually trigger from GitHub Actions tab.

## Customization

### Build Only One Platform
Edit the workflow to remove or comment out the platform you don't need:

```yaml
# Remove this step to skip Android
- name: 🚀 Build Preview (Android)
  run: eas build --platform android --profile preview --non-interactive --no-wait

# Remove this step to skip iOS
- name: 🚀 Build Preview (iOS)
  run: eas build --platform ios --profile preview --non-interactive --no-wait
```

### Change Build Profiles
Modify the `--profile` flag in the workflow files to use different EAS profiles.

### Add Build Notifications
You can add Slack, Discord, or email notifications by adding additional steps to the workflows.

## Troubleshooting

### Builds Failing?
1. Check that `EXPO_TOKEN` is correctly set in GitHub Secrets
2. Verify your EAS account has the necessary permissions
3. Check build logs in the [Expo dashboard](https://expo.dev)
4. Ensure your `eas.json` configuration is valid

### Token Expired?
Generate a new token and update the GitHub secret:
```bash
eas build:configure
```

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo GitHub Action](https://github.com/expo/expo-github-action)
