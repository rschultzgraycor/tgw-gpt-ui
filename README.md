# tgw-gpt-ui

A modern AI-powered marketing proposal assistant web application built with React, Vite, Tailwind CSS, and Microsoft authentication.

## Features
- Secure Microsoft login (MSAL)
- Chat UI for generating marketing proposals
- Query history and feedback
- Responsive, modern design with Tailwind CSS
- User avatar with Microsoft profile picture

## Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Microsoft Azure AD app registration (for authentication)

## Getting Started

### 1. Clone the repository
```sh
git clone <your-repo-url>
cd tgw-gpt-ui
```

### 2. Install dependencies
```sh
cd client
npm install
```

### 3. Configure environment variables
Create a `.env` file in the `client` directory with your Azure AD/MSAL settings:
```
AZURE_TENANT_ID=application-tenant-id
AZURE_BACKEND_CLIENT_ID=application-client-id
OPENAI_API_KEY=openai-key-id
PINECONE_API_KEY=pinecone-api-key
PINECONE_INDEX_NAME=pinecone-index-name
AZURE_SQL_HOST=sql-host-name
AZURE_SQL_DATABASE=sql-host-database
AZURE_SQL_USER=sql-username
AZURE_SQL_PASSWORD=sql-password
AZURE_SQL_AGENT_ID=sql-agent-id
```

### 4. Run the API Server
```sh
node src/index.js
```

The app will be available at [http://localhost:3000](http://localhost:3000) by default.

The published URL of this app is at [https://tgw-gpt-ms-ckhdfnh3avahg4f6.northcentralus-01.azurewebsites.net/](https://tgw-gpt-ms-ckhdfnh3avahg4f6.northcentralus-01.azurewebsites.net/)

## Project Structure
- `client/` - React frontend (Vite, Tailwind, MSAL)
- `src/` - Backend/server code (Node.js, API, GPT integration)

## Development
- Frontend: edit files in `client/src/`
- Backend: edit files in `src/`

## Refresh Client UI after coding change
I would suggest running the API and updating the UI in different terminal windows

```sh
cd client
npm run build
```

## License
MIT
