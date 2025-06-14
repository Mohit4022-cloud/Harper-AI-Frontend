# GitHub Webhook Check

1. Go to: https://github.com/Mohit4022-cloud/Harper-AI-Frontend/settings/hooks

2. Look for a webhook with URL like:
   - `https://api.render.com/github`
   - or `https://deploy.render.com/...`

3. Check the webhook status:
   - ✅ Green checkmark = Active
   - ❌ Red X = Failed
   - 🟡 Yellow = Issues

4. Click on the webhook to see "Recent Deliveries"

5. Check if recent pushes show:
   - Status: 200 OK
   - Response time: < 1s

6. If deliveries are failing:
   - Click "Redeliver" on the latest one
   - Or delete and recreate the webhook

7. Webhook should trigger on:
   - Push events
   - Branch: main