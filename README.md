# QuickStock

### Inventory & Sales Management System

## Overview

**QuickStock** is a database-driven inventory and sales management system built for small businesses. It streamlines day-to-day operations such as product tracking, sales processing, supplier management, and reporting through a structured and efficient database design.

Developed as part of **CL2005 – Database Systems Lab (Spring 2026)**
**FAST National University (FAST-NU), Lahore, Pakistan**

---

##  Team Members

| Name           | Roll Number |
| -------------- | ----------- |
| Salman Ali     | 24L-2542    |
| Noyan Siddiqui | 24L-2593    |
| Haider Ali     | 24L-2522    |

---

##  Features

###  Product Management

* Add, update, and categorize products

### Inventory Tracking

* Real-time stock monitoring
* Low-stock alerts

### Sales Management

* Record transactions
* Generate invoices

###  Supplier Management

* Maintain supplier data
* Track purchases

### Customer Management

* Store customer profiles
* Maintain purchase history

###  Returns & Refunds

* Handle returned products
* Process refunds efficiently

### Staff Management

* Store employee records
* Manage roles and positions

### Reporting

* Generate sales reports
* Analyze inventory trends

---

## Database Design:

###  Core Tables

* `Products`
* `Categories`
* `Stock`
* `Suppliers`
* `Customers`
* `Orders`
* `Sales`
* `Returns`
* `Payments`
* `Staff`
*`Users`


---

##  Design Highlights

* Normalized relational schema
* Separation of authentication (`Users`) and employee data (`Staff`)
* Role-based access system
* Scalable and modular structure

---

## Tech Stack

* **Database:** MS SQL Server
* **Language:** SQL
* **Concepts:**

  * Relational Database Design
  * Normalization
  * Foreign Key Constraints
  * Transaction Management

---

## Project Structure

```
QuickStock/
│── database/
│   ├── schema.sql
│   ├── tables.sql
│   └── procedures.sql
│
│── docs/
│   ├── ERD.png
│   ├── UseCaseDiagram.png
│   └── Report.pdf
│
│── README.md
and so on
```

---

## Future Improvements

* Advanced analytics dashboard
* Role-based authentication system
* REST API integration
* Mobile/web interface

---

## License

This project is for academic purposes. You may modify and use it for learning.

## Contributing:

Contributions are welcome!
Feel free to fork the repo and submit a pull request.

---

## Support:

If you like this project, consider giving it a ⭐ on GitHub!

---
