# HR Pro Toolkit

This is a React application built with Vite, designed to help HR professionals.

## Getting Started

Follow these steps to set up the project locally:

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd hr-helper
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## Building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist` directory.

## Deployment

This project is configured to deploy to **GitHub Pages** automatically using GitHub Actions.

### Setup for GitHub Pages

1.  Go to your repository **Settings** > **Pages**.
2.  Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3.  The GitHub Action created in `.github/workflows/deploy.yml` will automatically build and push to the `gh-pages` branch when you push to `main`.
4.  Once the action runs successfully, ensure the **Branch** in Pages settings is set to `gh-pages` / `root`.

## Project Structure

- `src/`: Source code
- `components/`: React components
- `vite.config.ts`: Vite configuration

## License

[License Name]
