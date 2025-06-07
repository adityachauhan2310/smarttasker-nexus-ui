# Welcome to the project

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run start-dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind C

## Development Environment Setup

### Running the Application

To properly run the application in development mode:

```sh
# This will start MongoDB and Redis containers, the backend server, and the frontend development server
npm run start-dev
```

The `start-dev` script ensures that:
1. Docker is running
2. MongoDB and Redis containers are started
3. Backend server is started
4. Frontend development server is started

### Database Services

The application requires:
- MongoDB (database)
- Redis (caching)

These services are configured in the `docker-compose.yml` file and will be automatically started by the `start-dev` script.

### Troubleshooting

If you encounter login issues or API connection problems:
1. Make sure Docker is running
2. Verify the MongoDB and Redis containers are running with `docker ps`
3. If containers are not running, start them with `docker-compose up -d`
4. Restart the application with `npm run start-dev`

