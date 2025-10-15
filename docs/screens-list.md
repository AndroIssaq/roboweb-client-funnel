# Roboweb Client Funnel System - Screens List

## Public Pages
1. **Portfolio Showcase** (`/portfolio`)
   - Grid layout with project cards
   - Category filters
   - Search functionality
   - Project detail modal

## Authentication
2. **Login Page** (`/login`)
   - Email/password login
   - Role-based redirect
   - Forgot password link

3. **Register Page** (`/register`)
   - Client registration
   - Affiliate registration
   - Email verification

## Client Portal
4. **Client Dashboard** (`/client/dashboard`)
   - Project overview cards
   - Progress timeline
   - Quick actions
   - Recent notifications

5. **Contract Signing** (`/client/contract/[id]`)
   - Contract preview
   - Terms & conditions
   - Signature pad
   - Submit button

6. **Onboarding Form** (`/client/onboarding`)
   - Multi-step form (5 sections)
   - Progress indicator
   - File uploads
   - Auto-save

7. **Project Details** (`/client/project/[id]`)
   - Project information
   - Deliverables list
   - File downloads
   - Revision requests
   - Communication thread

8. **Delivery Page** (`/client/delivery/[id]`)
   - Final deliverables
   - Download links
   - Acceptance form
   - Feedback submission

## Affiliate Portal
9. **Affiliate Dashboard** (`/affiliate/dashboard`)
   - Referral stats
   - Earnings overview
   - Referral link generator
   - Recent referrals

10. **Earnings Page** (`/affiliate/earnings`)
    - Commission history
    - Pending vs paid
    - Payout requests
    - Payment methods

11. **Referrals Page** (`/affiliate/referrals`)
    - Referral list
    - Status tracking
    - Commission per referral

## Admin Panel
12. **Admin Dashboard** (`/admin/dashboard`)
    - Key metrics
    - Charts & analytics
    - Recent activity
    - Quick stats

13. **Contracts Management** (`/admin/contracts`)
    - Contracts list
    - Search & filters
    - Status management
    - Contract details

14. **Clients Management** (`/admin/clients`)
    - Clients list
    - Client profiles
    - Onboarding status
    - CRUD operations

15. **Projects Management** (`/admin/projects`)
    - Projects list
    - Status updates
    - Progress tracking
    - Deliverables management

16. **Portfolio Management** (`/admin/portfolio`)
    - Portfolio items list
    - Add/edit items
    - Image management
    - Publish controls

17. **Affiliates Management** (`/admin/affiliates`)
    - Affiliates list
    - Commission rates
    - Performance stats
    - Status management

18. **Payouts Management** (`/admin/payouts`)
    - Payout requests
    - Approval workflow
    - Payment processing
    - Payout history

19. **Users Management** (`/admin/users`)
    - Users list
    - Role management
    - CRUD operations
    - Activity log

20. **Settings** (`/admin/settings`)
    - System configuration
    - Email templates
    - WhatsApp templates
    - Commission rates
    - Service packages

## Shared Components
- Navigation header (role-based)
- Sidebar navigation
- Notification center
- User profile dropdown
- Loading states
- Error pages (404, 500)
- Success/confirmation modals

**Total Screens:** 20 main screens + shared components
