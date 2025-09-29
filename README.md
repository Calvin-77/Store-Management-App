# Store-Management-App

A **React Native Windows** application designed to help users efficiently manage stores and storage locations, track inventory, and handle financial accounts. The app features automated report generation with downloadable Excel files, providing an all-in-one solution for store management on Windows devices.

## Features

- **Store & Storage Management:**  
  Manage two main locations: stores and storage. Easily track and organize your inventory across both places.

- **Automated Report Generation:**  
  When viewing financial report pages (e.g., `ProfitLossReports.js`, `CashFlowReports.js`, `BalanceSheets.js`, and `Recaps.js`), the app automatically generates the latest reports and saves them as `.xlsx` (Excel) files on your device.

- **Stock & Account Overview:**  
  Instantly view the latest updates on item stocks, debts, receivables, and other account balances.

- **Downloadable Data Tables:**  
  Download current data tables for stocks, accounts, and more as Excel files, making it easy to share or analyze data outside the app.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14.x or higher recommended)
- [npm](https://www.npmjs.com/)
- [React Native CLI](https://reactnative.dev/docs/environment-setup)
- [Windows 10/11](https://reactnative.dev/docs/running-on-windows) (for running the app as a Windows application)
- [Visual Studio](https://visualstudio.microsoft.com/) with UWP development workload (required for React Native Windows)
- [MySQL](https://www.mysql.com/) or [MariaDB](https://mariadb.org/) (for backend database)

## Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/Calvin-77/Management-App.git
cd Management-App
```

### 2. Setup the Backend

1. **Install Backend Dependencies**

   Navigate to the backend directory (e.g., `backend/`) and install dependencies:

   ```sh
   cd backend
   npm install
   ```

2. **Configure Database Connection**

   - Set your database credentials (host, user, password, database name).

3. **Import the SQL Schema**

   - Find the provided SQL file in the repository.
   - Use your MySQL client or CLI to import it:

     ```sh
     mysql -u <username> -p <database_name> < path/to/schema.sql
     ```

   - This will create all necessary tables and seed initial data.

4. **Start the Backend Server**

   ```sh
   npm start
   ```

   By default, the backend runs on [http://localhost:5000](http://localhost:5000) (check your backend config).

### 3. Setup the Frontend

1. **Install Frontend Dependencies**

   Navigate back to the main project directory if needed:

   ```sh
   cd ../  # if you're still in backend/
   npm install
   ```

2. **Install React Native Windows (if not already installed)**

   ```sh
   npx react-native-windows-init --overwrite
   ```

3. **Configure API Endpoint**

   - If your frontend needs to know the backend URL, update the configuration (e.g., `src/config.js` or environment files) to point to your backend server (e.g., `http://localhost:5000`).

4. **Run the App on Windows**

   ```sh
   npx react-native run-windows
   ```

### 4. Connect Frontend to Backend

- Ensure the backend server is running before starting the frontend.
- The frontend will communicate with the backend via REST API endpoints for data operations (inventory, reports, accounts, etc.).
- If needed, update CORS and API URLs in backend or frontend config files.

## Usage

- On launching the app, navigate between the **store** and **storage** sections to manage inventory and data.
- View financial reports such as Profit & Loss or Cash Flow; the app will automatically generate and save the report as an Excel file on your device.
- Access the stocks and accounts sections to view real-time updates.
- Use the download button in tables to export the latest data as `.xlsx` files.

## Project Structure Highlights

- `src/` - Main source code directory.
- `src/pages/ProfitLoss.js` - Profit & Loss report generation.
- `src/pages/CashFlow.js` - Cash Flow report generation.
- `src/components/` - Reusable UI components.
- `backend/` - Backend server, API routes, and database logic.
- `database.sql` or `schema.sql` - SQL schema for database setup.

## Contributing

Contributions, bug reports, and suggestions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

---

**Note:**  
This app is specifically designed for the Windows platform via React Native Windows. For more details on running React Native Windows apps, refer to the [official documentation](https://microsoft.github.io/react-native-windows/).
