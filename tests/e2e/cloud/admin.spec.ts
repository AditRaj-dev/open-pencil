import { expect, test } from '@playwright/test'

const enabled = process.env.OPENPENCIL_CLOUD_E2E === '1'
const serverURL = process.env.OPENPENCIL_CLOUD_E2E_URL ?? ''

test.describe('Cloud enrollment and administration', () => {
  test.skip(!enabled, 'Cloud browser E2E environment is unavailable')

  test('submits a non-enumerating waitlist request', async ({ page }) => {
    await page.goto(`${serverURL}/join`)
    await page.getByLabel('Email').fill('waitlist@example.com')
    await page.getByLabel('Name (optional)').fill('Waitlist Person')
    await page.getByRole('button', { name: 'Request access' }).click()
    await expect(page.getByText('Your request was received.')).toBeVisible()
    await page.reload()
    await page.getByLabel('Email').fill('waitlist@example.com')
    await page.getByRole('button', { name: 'Request access' }).click()
    await expect(page.getByText('Your request was received.')).toBeVisible()
  })

  test('redirects unauthenticated admin visitors to sign in', async ({ page }) => {
    await page.goto(`${serverURL}/admin/enrollment`)
    await expect(page).toHaveURL(`${serverURL}/admin/sign-in`)
    await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible()
  })

  test('allows the deployment administrator to review enrollment', async ({ context, page }) => {
    await context.addCookies([
      { name: 'openpencil-cloud-e2e-session', value: 'owner', url: serverURL }
    ])
    await page.goto(`${serverURL}/admin/enrollment`)
    await expect(page.getByRole('heading', { name: 'Enrollment' })).toBeVisible()
    const row = page.getByRole('row').filter({ hasText: 'waitlist@example.com' })
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: 'Approve' }).click()
    await expect(row).toContainText('approved')
  })
})
