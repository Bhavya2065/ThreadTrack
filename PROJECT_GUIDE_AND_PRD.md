# ThreadTrack — PRD & Interview Guide

---

# PART 1: Product Requirement Document (PRD)

## 1. Project Overview
**ThreadTrack** is a smart factory management and supply chain tracking system designed for garment and textile manufacturing units. It connects factory admins, floor workers, and B2B buyers onto a single digital platform.

---

## 2. Problem Statement
In traditional garment factories:
1. **Material Shortages:** Factories unexpectedly run out of raw materials (cloth, buttons, thread), halting entire production lines.
2. **Manual Paperwork:** Daily worker logs are kept on paper, leading to lost records, errors, and delayed reporting.
3. **Lack of Order Transparency:** B2B buyers must call or message factory managers repeatedly just to get status updates.
4. **No Predictive Insights:** Managers react to stockouts after they happen rather than preventing them.

---

## 3. Goals & Objectives
- **Digitize Production:** Allow workers to record output in under 10 seconds from their mobile phones.
- **Automate Inventory:** Auto-deduct raw materials whenever production logs are submitted.
- **Live Buyer Tracking:** Provide B2B buyers with real-time progress bars and estimated delivery dates.
- **Predictive Alerts:** Predict material exhaustion in advance based on current production rates.

---

## 4. User Personas & Core Features

### 👤 1. Factory Admin
- **Inventory Management:** View current stock levels (fabric, thread, accessories) with minimum threshold warnings.
- **Order Oversight:** View all active, completed, and canceled customer orders.
- **Smart Alerts:** Receive AI/predictive warnings (e.g., *"Cotton Fabric will run out in 2 days"*).
- **Analytics:** View production velocity and worker output statistics.

### 👷 2. Floor Worker
- **Quick Production Entry:** Select a product, enter units produced, and submit with one tap.
- **History View:** View recent personal production submissions.

### 🏢 3. B2B Buyer
- **Live Order Tracking:** See percentage completion (e.g., *130/200 units — 65% Completed*).
- **Delivery Estimates:** View live estimated completion dates.
- **Order History:** View past completed shipments.

---

## 5. Technical Architecture & Tech Stack

```
+-------------------------------------------------------------+
|                 Mobile App (React Native / Expo)            |
|         [Admin Portal]  [Worker Portal]  [Buyer Portal]     |
+------------------------------+------------------------------+
                               | REST API (JSON / JWT)
                               v
+-------------------------------------------------------------+
|                     Node.js API (Express)                   |
|       - Authentication & Role-Based Access Control          |
|       - Inventory Management & Order Processing             |
|       - Production Logging & Worker Records                 |
+--------------+-------------------------------+--------------+
               |                               |
               v                               v
+-----------------------------+ +-----------------------------+
|     PostgreSQL (Neon)       | |   Python Service (FastAPI)  |
|  - Users, Orders, Inventory | |  - Stockout Prediction      |
|  - Production Logs          | |  - Production Analytics     |
+-----------------------------+ +-----------------------------+
```

---
---

# PART 2: Complete Interview Questions & Answers


### Q1: Tell me about your project in 30 seconds.
> **Answer:**  
> *"ThreadTrack is a smart mobile management system for garment factories. It helps factory managers track raw material inventory, lets floor workers log daily output on mobile with two taps, and allows B2B buyers to track their live order progress."*

---

### Q2: Why did you choose this project?
> **Answer:**  
> *"I chose this project because most small and medium factories still manage inventory and orders using paper notes and phone calls. I wanted to solve a real-world manufacturing challenge by building an end-to-end full-stack mobile system."*

---

### Q3: What problem does it solve?
> **Answer:**  
> *"It solves 3 main problems:*  
> 1. **Material Shortage:** Factories run out of cloth or thread suddenly. ThreadTrack sends warnings before stock gets empty.  
> 2. **Paper Work:** Workers write everything on paper. ThreadTrack lets them log daily work in seconds on mobile.  
> 3. **Order Status:** Buyers keep calling to ask 'Where is my order?'. ThreadTrack gives them a live progress bar showing exact completion percentage."*

---

### Q4: What technology stack did you use?
> **Answer:**  
> *"I used a modern full-stack setup:*  
> - **Frontend (Mobile):** React Native with Expo  
> - **Backend API:** Node.js with Express  
> - **Predictive Analytics:** Python with FastAPI  
> - **Database:** PostgreSQL (Neon Cloud)*"

---

### Q5: You know React.js for web. How did you build a mobile app in React Native?
> **Answer:**  
> *"React.js and React Native share the exact same core logic — hooks like `useState` and `useEffect`, state management, and component architecture are identical.  
> The only transition was using mobile tags like `View`, `Text`, and `TextInput` instead of HTML `div`, `p`, and `input`. Expo made it very easy to develop and test directly on a mobile device."*

---

### Q6: Why did you choose React / React Native over Angular?
> **Answer:**  
> *"1. **Direct Mobile Transition:** React skills directly apply to mobile through React Native without needing complex wrappers.  
> 2. **Simpler & Lightweight:** React is flexible and uses standard JavaScript/JSX, whereas Angular is heavy with a steeper learning curve (RxJS, modules, decorators).  
> 3. **Huge Ecosystem:** React has a massive community and rich package ecosystem."*

---

### Q7: Why did you choose Node.js over PHP for the backend?
> **Answer:**  
> *"1. **Single Language Across the Stack:** Using JavaScript on both mobile (React Native) and backend (Node.js) allows faster development and cleaner code sharing.  
> 2. **Fast & Non-Blocking:** Node.js handles multiple API requests simultaneously without slowing down.  
> 3. **Native JSON Support:** REST APIs use JSON, and Node.js handles JSON natively without extra conversion steps."*

---

### Q8: Why did you include a separate Python service with Node.js?
> **Answer:**  
> *"Node.js handles fast, standard API tasks like user logins, orders, and inventory updates.  
> Python is used for data calculation and analytics — analyzing production speed and predicting stockout dates. Using microservices lets each language do what it is best at."*

---

### Q9: Why PostgreSQL instead of MongoDB?
> **Answer:**  
> *"Manufacturing systems require strict relationships and data consistency: orders are linked to products, products depend on raw materials, and production logs link to specific workers. A relational database like PostgreSQL guarantees data accuracy with foreign keys and transactions."*

---

### Q10: Can you explain the exact project flow from start to finish?
> **Answer:**  
> *"The project connects three main roles: Admin, Floor Worker, and Buyer. Here is how the end-to-end flow works:
>
> 1. **Login & Role Access:**  
>    When a user logs in, the backend checks their role and automatically opens their dedicated screen — Admin Dashboard, Worker Screen, or Buyer Screen.
>
> 2. **Order Placement:**  
>    A B2B buyer places a bulk order on the app (e.g., 200 shirts). The order shows up immediately on the Admin dashboard.
>
> 3. **Production Logging:**  
>    Floor workers make the products during their shift. At the end of the day, a worker selects the order, enters the quantity produced (e.g., 50 shirts), and taps submit.
>
> 4. **Automatic System Updates:**  
>    When the worker submits:
>    - The order progress increases from 0% to 25%.
>    - The required raw materials (like fabric and thread) are automatically deducted from inventory.
>    - The buyer can see the updated progress bar live on their phone.
>
> 5. **Smart Alerts & Completion:**  
>    In the background, our Python service tracks production speed and warns the admin if materials will run out soon. Once 200/200 units are reached, the order is marked completed and ready for delivery."*

---

### Q11: What are the main pages/screens in your system?
> **Answer:**  
> *"There are 8 core functional screens in the app:*  
> 1. **Login & Register:** User authentication and role-based redirect.  
> 2. **Orders Screen:** Admin order list, progress bars, and status updates.  
> 3. **Worker Log Screen:** Floor workers submit daily units and see recent submissions.  
> 4. **Dashboard (Prediction & Alerts):** Real-time factory stats, stock warnings, and Python AI insights.  
> 5. **Inventory Screen:** Live raw material stock levels and batch adjustments.  
> 6. **Access Control (User Management):** Admin assigns roles (Admin, Worker, Buyer).  
> 7. **History / Activity Screen:** Audit log of recent production entries and shipments.  
> 8. **Settings Screen:** App configuration and user profile.  
> *(Plus dedicated sub-screens: **Buyer Portal** and **Add Product / Bill of Materials**)."*

---

### Q12: What problems did you face while building this project and how did you solve them?
> **Answer:**  
> *"I faced 3 main technical challenges:
>
> 1. **Data Consistency (Inventory & Orders Out of Sync):**  
>    - *Problem:* When a worker submits 50 shirts, two updates happen together: order progress goes up, and raw fabric is deducted. If the network drops halfway, inventory numbers get corrupted.  
>    - *Action Taken:* I used **PostgreSQL Database Transactions (`BEGIN ... COMMIT`)**. It enforces the all-or-nothing rule: if anything fails, the database automatically cancels the whole update (`ROLLBACK`).
>
> 2. **Microservice Speed (Connecting Node.js & Python):**  
>    - *Problem:* Node.js handles regular API calls, while Python calculates prediction algorithms. Running Python calculations synchronously slowed down the mobile app.  
>    - *Action Taken:* I separated Python into an asynchronous **FastAPI microservice**. Node.js calls Python in the background, keeping the mobile app fast.
>
> 3. **Role Security (Screen Protection on Mobile):**  
>    - *Problem:* We have three user types (Admin, Worker, Buyer). Workers should never access Admin settings or inventory editing.  
>    - *Action Taken:* I used **JWT role verification** inside Expo Router layouts to automatically redirect unauthorized users to their permitted screens."*

---

### Q13: What happens if the network fails right after a worker taps the Submit button?
> **Answer:**  
> *"There are two possibilities, and both are handled safely:  
> 1. **If the request never reached the server:** Zero changes are made in the database. The app catches the network error and asks the worker to retry.  
> 2. **If the server committed the transaction but the internet dropped before the reply reached mobile:** The changes are already safely saved together in PostgreSQL. To prevent double submissions, the submit button is immediately disabled on tap (`isSubmitting = true`). When the user refreshes, the updated progress appears immediately."*

---

### Q14: What were the practical results and benefits of this project?
> **Answer:**  
> *"This project gave 4 main practical benefits:*  
> 1. **Saves Time:** Workers enter their daily work in **10 seconds on mobile** instead of writing on paper for 20 minutes.  
> 2. **No Work Stops:** The app alerts managers **2 days before fabric finishes**, preventing factory line shutdowns.  
> 3. **No Calling Needed:** Buyers see their **live order progress on phone**, so they don't need to call managers again and again.  
> 4. **No Counting Mistakes:** Cloth and thread counts update **automatically**, with zero calculation errors."*

---

### Q15: Do similar products exist in the market? How is ThreadTrack different?
> **Answer:**  
> *"Yes, big companies use large enterprise ERP software like SAP or Odoo.  
> But those tools are very expensive, complicated, and made for desktop computers.  
> 
> **ThreadTrack is different because:**  
> 1. **100% Mobile-First:** Built to run on simple smartphones for people on the factory floor.  
> 2. **Super Simple for Workers:** Designed with a 2-tap submission screen that requires zero training.  
> 3. **Dedicated Buyer App:** Buyers can track live order progress like food/package delivery tracking, which big ERPs do not offer."*



