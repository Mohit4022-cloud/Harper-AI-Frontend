# Page snapshot

```yaml
- text: H
- heading "Welcome to Harper AI" [level=1]
- paragraph: Sign in to your account to continue
- heading "Sign In" [level=3]
- paragraph: Enter your credentials to access your account
- text: Email
- img
- textbox "Email"
- text: Password
- img
- textbox "Password"
- button:
  - img
- checkbox "Remember me"
- text: Remember me
- link "Forgot password?":
  - /url: /forgot-password
- button "Sign In"
- text: Or continue with
- button "Google":
  - img
  - text: Google
- button "Microsoft":
  - img
  - text: Microsoft
- paragraph:
  - text: Don't have an account?
  - link "Sign up":
    - /url: /register
- paragraph:
  - text: 🚀
  - strong: Development Mode
- link "Skip Login (Dev Bypass) →":
  - /url: /dev-login
- region "Notifications (F8)":
  - list
- alert
- button "Open Next.js Dev Tools":
  - img
```