# UI/UX Wireframes & Flow

This document outlines the screen flow and layout for the ThreadTrack mobile app.

## 1. Authentication Flow
- **Login Screen**: Fields for `Username` and `Password`. Role-based redirection after login.

## 2. Factory Admin Dashboard
- **Inventory Overview**: Cards showing current stock of key Raw Materials (e.g., Fabric: 450m).
- **Active Orders**: List of B2B orders with progress bars.
- **Alerts Section**: High-priority warnings from the Python service (e.g., "Cotton will run out in 2 days").

## 3. Floor Worker Screen
- **Daily Output Input**: 
    - Dropdown: Select Product (e.g., White T-Shirt).
    - Input: Quantity Produced today.
    - Button: "Submit Output".
- **Recent Logs**: View last 5 entries.

## 4. B2B Buyer Screen
- **Order List**: Overview of all placed orders.
- **Order Tracking**: Detailed view of a specific order.
    - Status: "In Progress".
    - Progress Bar: "65% Completed (130/200 units)".
    - Estimated Completion Date.

## Screen Mockups (Conceptual)
```text
+-----------------------+    +-----------------------+
|      Login            |    |     Admin Home        |
+-----------------------+    +-----------------------+
| [ Username ]          |    | Inventory:            |
| [ Password ]          |    | - Fabric: [====  ]    |
|                       |    | - Thread: [======]    |
|    [ LOGIN ]          |    |                       |
+-----------------------+    | Active Orders:        |
                             | #101: 60% [====  ]    |
                             +-----------------------+

+-----------------------+    +-----------------------+
|     Worker Input      |    |     Buyer Track       |
+-----------------------+    +-----------------------+
| Select Product: [ V ] |    | Order #101:           |
| Quantity: [ 50 ]      |    | [=============] 65%   |
|                       |    |                       |
|    [ SUBMIT ]         |    | Est. Date: Oct 25     |
+-----------------------+    +-----------------------+
```
