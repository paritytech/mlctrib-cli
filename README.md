# Malicious Contributors

A Node.js CLI tool to check contributions across repositories in a GitHub organization. The tool can search for contributions by GitHub usernames or emails (via the Humaans API) and supports saving the results to a downloadable file using GitHub Actions.

## Features

- Search for contributions in all repositories of a specified GitHub organization.
- Supports searching by:
  - GitHub usernames (directly checking contributions).
  - Email addresses (fetching GitHub usernames via the Humaans API).
- Outputs the list of repositories and contributions to the console and can be saved as a file when running as a GitHub Action.
- Works with paginated repositories to ensure all repositories are checked.

## Requirements

- **Node.js** (latest stable version recommended)
- **GitHub personal access token** with access to the target organization and
  all repositories (including private).
- **Humaans API key**

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/paritytech/malicious-contributors.git
   cd malicious-contributors
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory to store your GitHub token and Humaans API key:
   ```bash
   GITHUB_TOKEN=your_github_token
   HUMAANS_API_KEY=your_humaans_api_key
   ```

## Usage

### 1. Search by GitHub Usernames in an Organization

To search for contributions in a GitHub organization by GitHub usernames, use the following command:

```bash
node main.js --org your-org --file usernames.txt --github
```

- `--org`: The name of the GitHub organization where repositories are located.
- `--file`: The file containing a list of GitHub usernames (one username per line).
- `--github`: Indicates that the search values are GitHub usernames.

### 2. Search by Emails using Humaans API

To search by email in Humaans, get the GitHub username and check contributions in an organization, use the following command:

```bash
node main.js --org your-org --file emails.txt --humaans
```

- `--org`: The name of the GitHub organization where repositories are located.
- `--file`: The file containing a list of email addresses (one email per line).
- `--humaans`: Indicates that the search values are email addresses. The Humaans API will be used to look up corresponding GitHub usernames.

### Example Input Files

- `usernames.txt`:

  ```
  githubuser1
  githubuser2
  githubuser3
  ```

- `emails.txt`:
  ```
  email1@example.com
  email2@example.com
  email3@example.com
  ```

## Running the CLI with GitHub Actions

You can automate running the CLI and saving the output as a downloadable file using GitHub Actions.

### Steps to Set Up GitHub Action

1. Ensure the repository has a file located at `.github/workflows/run-cli-action.yml`. Here is an example of the workflow configuration:

2. To run the GitHub Action, go to the **Actions** tab in your repository and manually trigger the workflow:

   - Select the `Run Malicious Contributors Checker` workflow.
   - Click **Run workflow** and provide the following inputs:
     - `org`: The name of the GitHub organization.
     - `search_type`: Select `github` to provide GitHub usernames or `humaans` to provide emails.
     - `search_file_content`: Comma-separated usernames or emails.

3. Once the workflow is complete, download the output:
   - Navigate to the Actions tab and open the workflow run.
   - Scroll down to **Artifacts** and download the `malicious-checker-output` file.

## Example GitHub Action Run

1. **Input**:

   - Organization: `paritytech`
   - Search type: `github`
   - Search File Content: `gioyik,VinceCorsica,gavofyork`

2. **Output**: The file `output.txt` will contain the contributions results, which can be downloaded from the Actions page.

## Contributing

Feel free to open issues or submit pull requests if you encounter any problems or have suggestions for improvements.

## License

This project is licensed under the MIT License.
