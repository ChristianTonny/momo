Assignment Overview:
In this summative assignment, you will demonstrate your ability to design and develop an enterprise-level fullstack application. Your task is to process SMS data in XML format, clean and categorize the data, store it in a relational database, and build a frontend interface to analyze and visualize the data. This assignment tests your skills in backend data processing, database management, and frontend development.

You will be provided with an XML file containing approximately 1600 SMS messages of various types from the famous Mobile Payment Service Provider in Rwanda, MTN MoMoLinks to an external site.. Your goal is to process the data, load it into a database, and create an interactive dashboard to analyze and display insights derived from the SMS data. Who knows, MTN might be interested in what you have to show.

Learning Objectives:
By completing this assignment, you will:

Apply data cleaning and categorization techniques to extract meaningful insights from raw data.
Design and implement relational database schemas to store structured data.
Develop a backend to handle database operations and integrate it with a frontend application.
Build an interactive and user-friendly dashboard using HTML, CSS, and JavaScript.
Demonstrate end-to-end problem-solving skills in fullstack application development.
Deliverables:
Python/JS Scripts: For data cleaning, processing, and populating the database.
Database Schema: Design and implement a relational database to store SMS data.
Frontend Interface: A dashboard built with HTML, CSS, and JavaScript to visualize and interact with the data.
Documentation: A brief report explaining your approach, design decisions, and the functionality of your application.
Assignment Tasks:
1. Data Cleaning and Processing (Backend)
Data Extraction:

Parse the provided XML file using JavaScript or Python  libraries (e.g., xml.etree.ElementTree, lxml, or BeautifulSoup).
Extract and categorize SMS messages into types such as:
Incoming Money
Payments to Code Holders
Transfers to Mobile Numbers
Bank Deposits
Airtime Bill Payments
Cash Power Bill Payments
Transactions Initiated by Third Parties
Withdrawals from Agents
Bank Transfers
Internet and Voice Bundle Purchases
Data Cleaning:

Handle missing fields or erroneous data.
Normalize text data (e.g., converting amounts to integers, formatting dates).
Logging:

Log unprocessed or ignored messages into a separate file.
2. Database Design and Implementation
Relational Database:

Design a schema that captures all relevant fields for each transaction type.
Use SQLite, MySQL, or PostgreSQL to implement the database.
Data Insertion:

Write a script to insert the cleaned and categorized data into the database.
Ensure data integrity and handle duplicates or conflicting entries.
3. Frontend Dashboard Development
Dashboard Requirements:

Build an interactive dashboard using HTML, CSS, and JavaScript.
Include the following features:
Search and Filter: Allow users to search and filter transactions by type, date, or amount.
Visualizations: Use charts (e.g., bar charts, pie charts) to display, such as:
Total transaction volume by type.
Monthly summaries of transactions.
Distribution of payments and deposits.
Any  visualization/report you deem relevant for deeper insights
Details View: Display detailed information for a selected transaction.
API Integration (Optional for Bonus Marks):

Develop a simple backend API using Python (e.g., Flask or FastAPI) or NodeJS to fetch data from the database for the frontend.
Assessment Criteria:
Assessment Criteria
Category	Criteria	Weight
Data Processing	Accuracy in parsing, categorizing, and cleaning the SMS data.	20%
Database Design	Well-structured and normalized schema, efficient queries, and data integrity.	20%
Frontend Design	Aesthetically pleasing and functional dashboard with clear visualizations and interactivity.	25%
Code Quality	Clean, readable, and modular code with proper comments and logging.	15%
Documentation	Clear explanation of the approach, challenges, and design decisions.	10%
Bonus (Optional)	API development for backend/frontend integration or advanced visualizations.	10%
Provided Resources:
XML File: Download Here Download Download Here 
Documentation Links:
Python XML ParsingLinks to an external site.
JS XMLParsingLinks to an external site.
SQLite DocumentationLinks to an external site.
PostgreSQL DocumentationLinks to an external site. 
Chart.js Documentation
Generated Mock XML File
Below is an example structure of the XML file. Each <sms> element contains details of a message.

<sms_data>
    <sms>
        <body>You have received 5000 RWF from John Doe. Transaction ID: 123456. Date: 2024-01-01 10:00:00.</body>
    </sms>
    <sms>
        <body>TxId: 789012. Your payment of 1500 RWF to Jane Smith has been completed. Date: 2024-01-02 14:30:00.</body>
    </sms>
    <sms>
        <body>*162*TxId:345678*S*Your payment of 3000 RWF to Airtime has been completed. Fee: 50 RWF. Date: 2024-01-03 16:00:00.</body>
    </sms>
    <sms>
        <body>You Wakuma Tekalign DEBELA have via agent: Jane Doe (250123456789), withdrawn 20000 RWF on 2024-01-04 12:00:00.</body>
    </sms>
    <sms>
        <body>Yello! You have purchased an internet bundle of 1GB for 2000 RWF valid for 30 days.</body>
    </sms>
</sms_data>
Submission Instructions:
Code:

Submit all code files in a .zip archive.
Submit a link to your GitHub repo (Your GitHub repo MUST have a well written README and AUTHORS files)
Include clear instructions on how to run your application.
Database:

Submit the database file (e.g., .db for SQLite or the).
Provide SQL schema files if using MySQL or PostgreSQL or the .sql dump of the whole DB.
Report:

Include a PDF report (2-3 pages) summarizing your approach, challenges, and key decisions.
Presentation:

Prepare a 5-minute video walkthrough of your application and put the link to the video in the README file of your repository.

Important Notice: 
Video Requirement:  Assignment submissions without a video will automatically receive a grade of zero. Submissions must include a 5-minute video walkthrough which includes, but is not limited to: System overview, system architecture diagram, Database designs, languages used.

Code Functionality: Ensure your code runs properly. Submitting code that does not execute will result in a zero.

README File: Include a clear and detailed README file with instructions on how to run your code. Submissions without clear documentation will not be graded.

AI Usage: The use of AI tools for this assignment is strictly prohibited and will result in serious academic consequences as outlined in the grading policy.

Rubric
MoMo Data Analysis Rubrics
MoMo Data Analysis Rubrics
Criteria	Ratings	Pts
This criterion is linked to a Learning OutcomeData Processing
Accuracy in parsing, categorizing, and cleaning the SMS data.
20 to >18.0 pts
Excellent
18 to >15.0 pts
Very Good
15 to >10.0 pts
Remarkable
10 to >5.0 pts
Could improve
5 to >0 pts
No Marks
20 pts
This criterion is linked to a Learning OutcomeDatabase Design
Well-structured and normalized schema, efficient queries, and data integrity.
20 to >18.0 pts
Excellent
18 to >15.0 pts
Very Good
15 to >10.0 pts
Remarkable
10 to >5.0 pts
Could improve
5 to >0 pts
No Marks
20 pts
This criterion is linked to a Learning OutcomeFrontend Design
Aesthetically pleasing and functional dashboard with clear visualizations and interactivity.
25 to >20.0 pts
Excellent
20 to >18.0 pts
Very Good
18 to >15.0 pts
Remarkable
15 to >10.0 pts
Good
10 to >5.0 pts
Could improve
5 to >0 pts
No Marks
25 pts
This criterion is linked to a Learning OutcomeCode Quality
Clean, readable, and modular code with proper comments and logging.
15 pts
Excellent
15 to >10.0 pts
Very Good
10 to >5.0 pts
Remarkable
5 to >0 pts
No Marks
15 pts
This criterion is linked to a Learning OutcomeDocumentation
Clear explanation of the approach, challenges, and design decisions.
10 pts
Excellent
10 to >8.0 pts
Very Good
8 to >5.0 pts
Remarkable
5 to >3.0 pts
Good
3 to >0 pts
No Marks
10 pts
This criterion is linked to a Learning OutcomeBonus (Optional)
API development for backend/frontend integration or advanced visualizations.
10 pts
Excellent
10 to >8.0 pts
Very Good
8 to >5.0 pts
Remarkable
5 to >3.0 pts
Good
3 to >0 pts
No Marks
10 pts
Total Points: 100