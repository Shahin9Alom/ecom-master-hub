# E-Commerce Hub

Fully Functional E-Commerce Website Development Prompt

Build a fully functional, modern, responsive e-commerce website where customers can browse products, add products to cart, place orders, and manage their accounts. The website must include a complete Admin Panel, Order Management Dashboard, Product Management, Checkout System, Customer Management, and all essential e-commerce functionality.

1. Technology Requirements

HTML5, CSS3, and JavaScript must be used for the frontend.

You may use any additional technologies, libraries, frameworks, APIs, database, authentication system, backend services, or payment services that are required to make the website genuinely functional.

The website must be fully responsive on:

Desktop

Laptop

Tablet

Mobile

Use clean, modular, maintainable code.

Do not create a static/demo-only website.

All important functionality must actually work.

2. Customer-Facing Website

Create all necessary customer pages, including:

Home Page

Professional e-commerce homepage

Hero/banner slider

Featured products

New arrivals

Popular products

Discount/offer section

Product categories

Promotional banners

Flash sale section if applicable

Customer reviews

Newsletter section

Footer with all important links

Shop Page

Display all products

Product grid/list view

Search products

Filter by:

Category

Subcategory

Price

Brand

Availability

Rating

Sort by:

Latest

Price low to high

Price high to low

Popularity

Rating

Pagination or load-more functionality

Product Details Page

Every product should have:

Product images/gallery

Product name

Price

Discount price

Original price

Stock status

Product SKU

Brand

Category

Product description

Specifications

Available variations such as size/color where applicable

Quantity selector

Add to Cart

Buy Now

Add to Wishlist

Product reviews and ratings

Related products

3. Shopping Cart

Create a fully functional shopping cart.

Customers must be able to:

Add products

Remove products

Increase/decrease quantity

Update cart

See subtotal

See discount

See delivery charge

See total price

Apply coupon/discount code

Continue shopping

Proceed to checkout

Cart data should persist appropriately.

4. Wishlist

Create a complete wishlist system.

Customers can:

Add products to wishlist

Remove products

Move products from wishlist to cart

View wishlist from their account

5. Customer Authentication

Create customer registration/login functionality.

Include:

Sign Up

Login

Logout

Forgot Password

Password Reset

Customer Profile

Change Password

Saved Addresses

Order History

Wishlist

Account Dashboard

6. Checkout Page

Create a professional and fully functional checkout page.

Include:

Customer Information

Full Name

Phone Number

Email

Address

City

Area

Postal Code

Delivery instructions

Delivery

Delivery method

Delivery charge

Estimated delivery information

Order Summary

Products

Quantity

Subtotal

Discount

Delivery charge

Total

Payment Methods

Support the payment methods that are technically available for the project, such as:

Cash on Delivery

Online Payment

Card Payment

Mobile payment gateway where applicable

The payment system must be properly integrated rather than represented by a fake button.

7. Order System

Create a complete order management system.

When a customer places an order:

Generate a unique Order ID

Save the order to the database

Save customer information

Save ordered products

Save quantities

Save prices

Save discount

Save delivery charge

Save payment method

Save order date/time

Save order status

Order statuses should include:

Pending

Confirmed

Processing

Packed

Shipped

Out for Delivery

Delivered

Cancelled

Returned

Customers must be able to view their order status from their account.

8. Order Tracking

Create an order tracking page.

Customer can enter an Order ID and/or use their account to see:

Order Placed → Confirmed → Processing → Packed → Shipped → Out for Delivery → Delivered

Show the current status clearly.

9. Admin Panel

Create a complete professional Admin Dashboard.

Admin login credentials:

Username: shahin.admin
Password: 1234

The admin authentication must be implemented securely. Do not expose or hard-code sensitive credentials in publicly accessible frontend JavaScript in a real production implementation. Use proper backend authentication/database authentication.

10. Admin Dashboard

The dashboard should display:

Total Sales

Today's Sales

Total Orders

Pending Orders

Completed Orders

Cancelled Orders

Total Products

Out-of-stock Products

Total Customers

Recent Orders

Recent Customers

Sales statistics

Order statistics

Product performance

Use attractive charts and statistics.

11. Product Management

Admin must have complete control over products.

Admin can:

Add Product

Edit Product

Delete Product

Duplicate Product

Publish/Unpublish Product

Mark as Featured

Mark as New

Set Discount

Set Stock Quantity

Update Price

Update SKU

Update Brand

Assign Category

Assign Subcategory

Upload Multiple Product Images

Remove Product Images

Add Product Description

Add Specifications

Add Product Variations

Manage Product Reviews

Any product displayed on the website must be manageable from the admin panel.

12. Category Management

Admin can:

Add Category

Edit Category

Delete Category

Add Subcategory

Edit Subcategory

Delete Subcategory

Upload Category Image

Change Category Status

Set Category Order

Changes made from the admin panel must automatically reflect on the customer website.

13. Order Management Dashboard

Admin must be able to:

View all orders

Search orders

Filter orders

Sort orders

View order details

Change order status

Update payment status

Update delivery status

Update customer information

Add internal order notes

Cancel orders

Process returns

View order invoice

Print invoice

Download invoice

Admin should be able to change an order from:

Pending → Confirmed → Processing → Packed → Shipped → Out for Delivery → Delivered

and the customer's order tracking should update automatically.

14. Customer Management

Admin can:

View customers

Search customers

View customer profile

View customer orders

View customer spending/order history

Edit customer information

Disable/enable customer account

Delete customer account where appropriate

15. Coupon & Discount Management

Create a complete coupon system.

Admin can create:

Percentage discount

Fixed amount discount

Minimum order requirement

Maximum discount

Expiry date

Usage limit

Per-customer usage limit

Category-specific coupon

Product-specific coupon

Active/inactive coupon

Customers can apply valid coupons during checkout.

16. Banner Management

Admin should be able to manage all homepage banners.

Admin can:

Add banner

Upload banner image

Edit banner

Delete banner

Change banner title

Change subtitle

Change button text

Change button link

Enable/disable banner

Change banner display order

No banner content should need to be edited manually in HTML.

17. Website Content Management

Make the website as admin-editable as possible.

Admin should be able to manage:

Homepage content

Hero banners

Promotional sections

Categories

Products

Brands

Offers

Coupons

Testimonials

Reviews

Footer content

Contact information

Social media links

About section

FAQ

Policies

Shipping information

Return policy

Privacy policy

Terms & Conditions

The goal is that the administrator should not need to edit source code for normal website content changes.

18. Inventory Management

Create inventory management.

Admin can:

View stock

Increase stock

Decrease stock

Set stock quantity

Track low-stock products

Track out-of-stock products

Enable/disable product purchasing

Manage SKU

Manage product variations and their stock

Show low-stock alerts in the admin dashboard.

19. Review & Rating Management

Customers can submit:

Star rating

Review

Product feedback

Admin can:

View reviews

Approve/reject reviews

Delete inappropriate reviews

Manage ratings

Only verified purchases should preferably be allowed to submit verified-purchase reviews.

20. Shipping Management

Admin should be able to manage:

Delivery areas

Delivery charges

Free delivery threshold

Delivery methods

Estimated delivery time

Shipping status

Example:

Inside City — configurable delivery fee

Outside City — configurable delivery fee

All values must be editable from the admin panel.

21. Payment Management

Create a payment settings section inside the admin panel.

Admin should be able to enable/disable available payment methods.

For example:

Cash on Delivery

Online Payment

Card Payment

Mobile Payment Gateway

Payment gateway credentials/settings must be stored securely and never exposed in frontend source code.

22. Invoice System

Generate a professional invoice for every order.

Invoice should include:

Store name/logo

Order ID

Order date

Customer name

Phone

Address

Product name

Quantity

Unit price

Discount

Delivery charge

Total

Payment method

Order status

Allow admin/customer to print or download the invoice where appropriate.

23. Search System

Create a powerful product search system.

Search should work by:

Product name

SKU

Brand

Category

Keywords

Show useful search results and handle no-result searches professionally.

24. Responsive Admin Panel

The admin panel must also be completely responsive.

It should work properly on:

Desktop

Laptop

Tablet

Mobile

Create a responsive sidebar/navigation system.

25. Security

Implement proper security practices.

Include:

Secure authentication

Password hashing

Protected admin routes

Protected customer routes

Input validation

Server-side validation

Authorization checks

Secure database queries

Protection against unauthorized admin access

Secure file/image uploads

Environment variables for secrets/API keys

Never expose database credentials or payment secrets in frontend code

Do not rely only on frontend JavaScript for authentication or authorization.

26. Database

Use a proper database/backend system.

Create appropriate database structures for:

Users

Admins

Products

Product Images

Categories

Subcategories

Brands

Product Variations

Inventory

Orders

Order Items

Payments

Coupons

Wishlists

Reviews

Addresses

Banners

Site Settings

Shipping Settings

Notifications

Use proper relationships between tables/collections.

27. Notifications

Implement notifications where appropriate.

Admin should receive notifications for:

New order

New customer

Low stock

New review

Payment updates

Customers should receive appropriate notifications for:

Order confirmation

Order status changes

Delivery updates

Cancellation

Successful payment

28. Admin Settings

Create a Settings section where admin can manage:

Store name

Store logo

Favicon

Contact number

Email

Address

Social media links

Currency

Delivery settings

Payment settings

Tax settings

Order settings

Email/notification settings

Website SEO information

29. SEO

Implement basic e-commerce SEO:

Proper page titles

Meta descriptions

SEO-friendly URLs

Product structured data where appropriate

Open Graph metadata

Sitemap

Robots configuration

Proper heading structure

Product image alt text

30. UI/UX

Design should be:

Modern

Professional

Clean

Premium

Fast

User-friendly

Mobile responsive

Include:

Smooth hover effects

Loading states

Empty states

Error states

Success messages

Confirmation dialogs

Toast notifications

Skeleton loaders where useful

Do not sacrifice functionality for visual effects.

31. Important Requirement — Everything Must Be Functional

Do NOT create fake/demo functionality.

For example:

Add to Cart must actually add the product.

Cart quantity must actually update.

Checkout must actually create an order.

Orders must actually be stored.

Admin must actually be able to edit products.

Product deletion must actually remove/archive the product.

Product changes must appear on the customer website.

Coupon validation must actually work.

Inventory must actually update after orders.

Order status changes from admin must reflect in customer tracking.

Login/logout must actually work.

Search and filtering must actually work.

Wishlist must actually work.

Payment integration must actually process payments if configured.

Invoice generation must actually work.

32. Admin-Control Requirement

The most important requirement is that normal website content and e-commerce operations should be manageable from the Admin Panel.

Do not hard-code products, categories, banners, prices, stock, delivery charges, coupons, or other frequently changing business information into HTML/JavaScript.

If the admin changes something from the dashboard, the customer-facing website should automatically display the updated information.

33. Final Testing

Before considering the project complete, test the entire flow:

Customer Flow

Home → Shop → Product → Add to Cart → Cart → Checkout → Payment/COD → Order Created → Order Tracking → Customer Account

Admin Flow

Admin Login → Dashboard → Add Product → Edit Product → Update Stock → Manage Orders → Change Order Status → Manage Customers → Manage Coupons → Manage Categories → Manage Banners → Settings

Test:

Desktop

Tablet

Mobile

Different screen sizes

Empty cart

Out-of-stock products

Invalid coupon

Invalid login

Invalid checkout information

Cancelled order

Product deletion

Product editing

Order status updates

Fix all broken buttons, links, forms, responsive issues, console errors, and backend/database errors before delivery.

Final Goal

Build this as a real, production-ready e-commerce platform, not a template or visual prototype.

The final system must contain:

Customer Website + Product Catalog + Search + Filters + Product Details + Cart + Wishlist + Checkout + Authentication + Orders + Order Tracking + Payment System + Invoice + Customer Dashboard + Admin Dashboard + Product Management + Category Management + Inventory Management + Order Management + Customer Management + Coupon Management + Banner Management + Review Management + Shipping Management + Payment Settings + Website Settings + Security + Database + Responsive Design.

Use HTML, CSS, JavaScript, plus whatever backend/database/services are necessary to make all of these features genuinely functional.

Admin Login:
Username: shahin.admin
Password: 1234

Make the entire system interconnected so that the Admin Panel is the central control system for the e-commerce website.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ecom-master-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f252cbe7-2afe-4853-bb83-519f5128db5e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
