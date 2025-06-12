# MTN MoMo Analytics Dashboard

A fullstack web application for analyzing MTN Mobile Money SMS transaction data. Built with Node.js, Express, SQLite, and vanilla JavaScript.

## 🚀 Features

- **Real-time Analytics Dashboard** with MTN branding
- **Interactive Data Visualization** using Chart.js
- **Advanced Filtering & Search** capabilities  
- **Transaction Categorization** across 10+ types
- **Responsive Design** for all devices
- **RESTful API** for data access

## 📊 Analytics Capabilities

- Total transaction volume and count tracking
- Monthly trend analysis
- Transaction type distribution
- Fee analysis and calculations
- Real-time dashboard updates

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Data Processing**: xml2js for XML parsing

## 📁 Project Structure

```
momo/
├── server.js              # Express.js backend server
├── public/                # Frontend assets
│   ├── index.html         # Dashboard UI
│   ├── styles.css         # MTN-themed styling
│   └── app.js             # Frontend JavaScript
├── scripts/               # Data processing scripts
│   ├── setupDatabase.js   # Database schema creation
│   └── parseXML.js        # XML parsing & data cleaning
├── database/              # SQLite database
└── modified_sms_v2.xml    # Source SMS data
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd momo
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
npm run setup
```

4. **Parse XML data**
```bash
npm run parse
```

5. **Start the server**
```bash
npm start
```

6. **Access the dashboard**
Open your browser and navigate to: `http://localhost:3000`

## 📈 Data Processing

The application processes SMS data through several stages:

1. **XML Parsing**: Extracts SMS messages from XML format
2. **Message Categorization**: Identifies transaction types using regex patterns
3. **Data Cleaning**: Normalizes amounts, dates, and contact information
4. **Database Storage**: Stores processed data in SQLite database

### Supported Transaction Types

- Incoming Money
- Transfer to Mobile
- Bank Deposit
- Payment to Code
- Airtime Payment
- Cash Power Payment
- Agent Withdrawal
- Bundle Purchase
- Third Party Transactions
- Bank Transfers

## 🎨 Design Features

- **MTN Corporate Branding** with official colors (#003366, #FFCB00)
- **Professional UI/UX** design
- **Responsive Layout** for mobile and desktop
- **Interactive Charts** for data visualization
- **Clean Typography** and intuitive navigation

## 🔌 API Endpoints

- `GET /api/stats` - Dashboard statistics
- `GET /api/transactions` - Paginated transactions with filtering
- `GET /api/transaction-types` - Available transaction types

## 📊 Dashboard Features

### Overview Cards
- Total Transactions Count
- Total Transaction Volume (RWF)
- Total Fees Collected (RWF)
- Average Transaction Amount (RWF)

### Interactive Charts
- **Pie Chart**: Transaction type distribution
- **Line Chart**: Monthly volume and count trends

### Data Management
- **Advanced Filtering**: By type, date range, amount, search terms
- **Pagination**: Efficient browsing of large datasets
- **Real-time Updates**: Automatic data refresh

## 🔍 Usage Examples

### Filtering Transactions
- Filter by transaction type (dropdown)
- Set date range (start/end date pickers)
- Search by recipient/sender names
- Apply multiple filters simultaneously

### Data Analysis
- View monthly transaction trends
- Analyze transaction type popularity
- Monitor fee collection patterns
- Track transaction volume growth

## 📝 Assignment Context

This project was developed as a summative assignment for enterprise-level fullstack application development. The task involved:

- Processing ~1,600 SMS messages from MTN MoMo
- Building a relational database schema
- Creating an interactive analytics dashboard
- Implementing full-stack integration with API endpoints

## 🎥 Demo Video

[Link to 5-minute video walkthrough will be added here]

## 👥 Authors

- **Student Developer** - *Full Stack Development*

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- MTN Rwanda for the SMS data format inspiration
- Chart.js community for excellent visualization library
- Node.js and Express.js communities

---

**Note**: This application is for educational purposes and demonstrates enterprise-level fullstack development skills including data processing, database management, API development, and modern web interface design. 