# Admin Portal Features

## 🎯 Overview
The Admin Portal provides comprehensive management capabilities for the Dharma Setu platform with full CRUD operations and approval workflows.

## 🔐 Access
- **URL**: `http://localhost:3333` (when dev:admin is running)
- **Login**: Admin credentials required
- **Backend API**: `http://localhost:3333/api/admin/*`

## ✨ Key Features Implemented

### 1. 👤 Pandit Management
Located in: **Admin Portal → Pandit Management**

#### Pending Pandit Verification
- **View Pending Applications**: See all pandits awaiting verification in a dedicated section
- **Approve Pandits**: One-click approval to move pandits to verified network
- **Reject Applications**: Reject unsuitable applications
- **Pending Count Badge**: Visual indicator showing number of pending verifications

#### Verified Pandit Network
- **View All Verified Pandits**: Grid view with complete pandit details
- **Add New Pandit**: Manually register pandits with full details
- **Edit Pandit Details**: Update any pandit information including:
  - Name, Location, Tradition
  - Title, Languages
  - Experience years
  - **Hourly Rate** (₹)
- **Toggle Verification**: Revoke or restore verification status
- **Pandit Stats Display**:
  - Experience and location
  - Languages spoken
  - Tradition/style
  - Completed pujas count
  - Rating and review count
  - Hourly rate

#### Pandit Form Fields
- Name *
- Location *
- Tradition * (Telugu, Tamil, Kannada, Marathi, North Indian)
- Title
- Languages (comma-separated)
- Experience (Years)
- **Hourly Rate (₹)** - Editable by admin

---

### 2. 🕉️ Puja Management
Located in: **Admin Portal → Puja Management**

#### View Puja Catalog
- **Complete Puja List**: Table view with all pujas
- **3-Tier Pricing Display**: 
  - 🟢 Essential Tier (Basic)
  - 🟡 Complete Tier (Popular)
  - 🔴 Sampoorna Tier (Premium)
- **Quick Price Reference**: See all tier prices at a glance

#### Edit Puja Pricing
- **Individual Puja Price Editor**: Click "Edit Price" on any puja
- **Update All Tier Prices**:
  - Essential Tier Price
  - Complete Tier Price  
  - Sampoorna Tier Price
- **Visual Tier Indicators**: Color-coded forms for each tier
- **Price Validation**: Minimum value enforcement
- **Instant Updates**: Changes reflected immediately after save

#### Puja Detail Inspector
- View complete puja information
- See tier inclusions
- Review significance and deity details
- Deity images and descriptions

---

### 3. 📊 Other Admin Capabilities

#### Dashboard
- User statistics
- Booking analytics
- Temple and event counts
- Activity monitoring

#### Booking Management
- View all bookings
- Track booking status
- Revenue tracking

#### Product Management
- DharmaMart product catalog
- Price and inventory control

#### Store Settings
- Platform configuration
- Feature toggles

---

## 🔧 Technical Implementation

### Frontend
- **Framework**: React + TypeScript
- **Location**: `/admin-portal/src/components/views/`
- **Key Files**:
  - `PanditManagement.tsx` - Pandit verification and management
  - `PujaManagement.tsx` - Puja pricing and catalog

### Backend API Endpoints
- `GET /api/admin/pending-pandits` - Fetch pending verifications
- `POST /api/admin/approve-pandit/:id` - Approve pandit
- `POST /api/admin/reject-pandit/:id` - Reject pandit
- `GET /api/admin/pandits` - Get all verified pandits
- `POST /api/admin/pandits` - Create new pandit
- `PUT /api/admin/pandits/:id` - Update pandit details
- `GET /api/admin/poojas` - Get all pujas
- `PUT /api/admin/poojas/:id` - Update puja pricing

---

## 🚀 How to Use

### Start Admin Portal
```bash
cd c:\Dharmashasta\dharma-setu-clean
npm run dev:admin
```

### Start Backend Server
```bash
cd c:\Dharmashasta\dharma-setu-clean
npm run server
```

### Full Stack Mode
```bash
cd c:\Dharmashasta\dharma-setu-clean
npm run dev:fullstack
```

---

## 📝 Admin Workflows

### Verify a Pandit
1. Navigate to **Pandit Management**
2. Check **Pending Verification** section (top)
3. Review pandit details
4. Click **✓ Approve** or **✗ Reject**
5. Approved pandits move to verified network

### Edit Pandit Hourly Rate
1. Go to **Pandit Management**
2. Find the pandit in verified network
3. Click **Edit Details**
4. Update **Hourly Rate (₹)** field
5. Click **Update Pandit**

### Change Puja Pricing
1. Navigate to **Puja Management**
2. Find the puja in table
3. Click **Edit Price** button
4. Update any/all tier prices:
   - Essential Tier
   - Complete Tier
   - Sampoorna Tier
5. Click **💾 Save Pricing**

---

## 🎨 UI Features
- **Responsive Design**: Works on desktop and mobile
- **Color-Coded Tiers**: Visual distinction for pricing levels
- **Modal Dialogs**: Clean editing interfaces
- **Real-time Updates**: Instant feedback on actions
- **Pending Badges**: Visual alerts for items needing attention
- **Status Indicators**: Verification badges and status labels

---

## 🔒 Security
- JWT token authentication required
- Admin role authorization
- Protected API routes
- Input validation on all forms

---

## 📦 Dependencies
- React 19
- TypeScript
- Tailwind CSS
- Express.js (Backend)
- JWT Authentication
